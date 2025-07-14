<?php

namespace Drupal\api_application\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\file\FileInterface;
use Drupal\file\FileUsage\FileUsageInterface;

/**
 * Service for handling file references in configuration.
 *
 * This service provides methods to store and retrieve file references
 * in configuration using UUIDs instead of FIDs, making them portable
 * across different environments.
 */
class ConfigFileService {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The file usage service.
   *
   * @var \Drupal\file\FileUsage\FileUsageInterface
   */
  protected $fileUsage;

  /**
   * Constructs a ConfigFileService object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Drupal\file\FileUsage\FileUsageInterface $file_usage
   *   The file usage service.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, FileSystemInterface $file_system, LoggerChannelFactoryInterface $logger_factory, FileUsageInterface $file_usage) {
    $this->entityTypeManager = $entity_type_manager;
    $this->fileSystem = $file_system;
    $this->loggerFactory = $logger_factory;
    $this->fileUsage = $file_usage;
  }

  /**
   * Converts file IDs to portable configuration format.
   *
   * @param array $file_ids
   *   Array of file IDs.
   * @param bool $include_data
   *   Whether to include base64 encoded file data for portability.
   *
   * @return array
   *   Array of file references with UUID, filename, and metadata.
   */
  public function convertFidsToConfigFormat(array $file_ids, bool $include_data = TRUE): array {
    $config_files = [];
    $file_storage = $this->entityTypeManager->getStorage('file');

    foreach ($file_ids as $fid) {
      if ($file = $file_storage->load($fid)) {
        $config_files[] = $this->convertFileToConfigFormat($file, $include_data);
      }
    }

    return $config_files;
  }

  /**
   * Converts a single file entity to configuration format.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file entity.
   * @param bool $include_data
   *   Whether to include base64 encoded file data for portability.
   *
   * @return array
   *   File reference with UUID, filename, and metadata.
   */
  public function convertFileToConfigFormat(FileInterface $file, bool $include_data = TRUE): array {
    $config = [
      'uuid' => $file->uuid(),
      'filename' => $file->getFilename(),
      'uri' => $file->getFileUri(),
      'mime_type' => $file->getMimeType(),
      'size' => $file->getSize(),
      'created' => $file->getCreatedTime(),
    ];

    // Include base64 encoded data for portability across environments.
    if ($include_data) {
      $file_uri = $file->getFileUri();
      $realpath = $this->fileSystem->realpath($file_uri);

      if ($realpath && file_exists($realpath)) {
        // Only include data for reasonably sized files (< 1MB).
        if ($file->getSize() < 1024 * 1024) {
          $file_data = file_get_contents($realpath);
          if ($file_data !== FALSE) {
            $config['data'] = base64_encode($file_data);
          }
        }
        else {
          $this->loggerFactory->get('api_application')
            ->warning('File @filename is too large (@size bytes) to include data in configuration', [
              '@filename' => $file->getFilename(),
              '@size' => $file->getSize(),
            ]);
        }
      }
    }

    return $config;
  }

  /**
   * Resolves configuration file references to current environment FIDs.
   *
   * @param array $config_files
   *   Array of file references from configuration.
   * @param string $target_directory
   *   Target directory for missing files.
   *
   * @return array
   *   Array of file IDs in current environment.
   */
  public function resolveConfigFilesToFids(array $config_files, string $target_directory = 'public://application_instructions/examples/'): array {
    $file_ids = [];
    $file_storage = $this->entityTypeManager->getStorage('file');

    foreach ($config_files as $config_file) {
      if (empty($config_file['uuid'])) {
        continue;
      }

      // Try to load file by UUID first.
      $files = $file_storage->loadByProperties(['uuid' => $config_file['uuid']]);

      if (!empty($files)) {
        $file = reset($files);
        $file_ids[] = $file->id();

        // Ensure file is permanent.
        if (!$file->isPermanent()) {
          $file->setPermanent();
          $file->save();
        }
      }
      else {
        // File doesn't exist in current environment.
        // Try to recreate it if we have the original URI and it exists.
        $recreated_file = $this->recreateFileFromConfig($config_file, $target_directory);
        if ($recreated_file) {
          $file_ids[] = $recreated_file->id();
        }
        else {
          $this->loggerFactory->get('api_application')
            ->warning('Could not resolve file with UUID @uuid (filename: @filename)', [
              '@uuid' => $config_file['uuid'],
              '@filename' => $config_file['filename'] ?? 'unknown',
            ]);
        }
      }
    }

    return $file_ids;
  }

  /**
   * Attempts to recreate a file from configuration data.
   *
   * @param array $config_file
   *   File configuration data.
   * @param string $target_directory
   *   Target directory for the recreated file.
   *
   * @return \Drupal\file\FileInterface|null
   *   The recreated file entity, or NULL if recreation failed.
   */
  protected function recreateFileFromConfig(array $config_file, string $target_directory): ?FileInterface {
    $filename = $config_file['filename'] ?? '';
    $uuid = $config_file['uuid'] ?? '';

    if (empty($filename) || empty($uuid)) {
      return NULL;
    }

    try {
      // Ensure target directory exists.
      if (!$this->fileSystem->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
        $this->loggerFactory->get('api_application')
          ->error('Could not create target directory @dir', ['@dir' => $target_directory]);
        return NULL;
      }

      $file_data = NULL;

      // Strategy 1: Use base64 encoded data if available.
      if (!empty($config_file['data'])) {
        $file_data = base64_decode($config_file['data']);
        if ($file_data === FALSE) {
          $this->loggerFactory->get('api_application')
            ->error('Failed to decode base64 data for file @filename', ['@filename' => $filename]);
          $file_data = NULL;
        }
        else {
          $this->loggerFactory->get('api_application')
            ->info('Using embedded data to recreate file @filename', ['@filename' => $filename]);
        }
      }

      // Strategy 2: Try to copy from original URI if data not available.
      if ($file_data === NULL && !empty($config_file['uri'])) {
        $original_uri = $config_file['uri'];

        // Try various possible locations for the file.
        $possible_paths = [
          $original_uri,
          // Try current environment's file directory structure.
          str_replace('public://', 'public://application_instructions/examples/', $this->fileSystem->basename($original_uri)),
          // Try common backup locations.
          'public://application_instructions/examples/' . $this->fileSystem->basename($original_uri),
          'private://application_instructions/examples/' . $this->fileSystem->basename($original_uri),
        ];

        foreach ($possible_paths as $path) {
          $realpath = $this->fileSystem->realpath($path);
          if ($realpath && file_exists($realpath)) {
            $file_data = file_get_contents($realpath);
            if ($file_data !== FALSE) {
              $this->loggerFactory->get('api_application')
                ->info('Found file @filename at @path', ['@filename' => $filename, '@path' => $path]);
              break;
            }
          }
        }
      }

      // Strategy 3: Create a placeholder file if we can't find the original.
      if ($file_data === NULL) {
        $file_data = $this->createPlaceholderFileData($config_file);
        if ($file_data !== NULL) {
          $this->loggerFactory->get('api_application')
            ->warning('Created placeholder for missing file @filename', ['@filename' => $filename]);
        }
      }

      // If we still don't have file data, we can't recreate the file.
      if ($file_data === NULL) {
        $this->loggerFactory->get('api_application')
          ->error('Could not recreate file @filename - no data source available', ['@filename' => $filename]);
        return NULL;
      }

      // Save the file data.
      $destination = $target_directory . '/' . $filename;
      $new_uri = $this->fileSystem->saveData($file_data, $destination, FileSystemInterface::EXISTS_RENAME);

      if (!$new_uri) {
        return NULL;
      }

      // Create new file entity with original UUID.
      $file_storage = $this->entityTypeManager->getStorage('file');
      $file = $file_storage->create([
        'uuid' => $uuid,
        'uri' => $new_uri,
        'filename' => $this->fileSystem->basename($new_uri),
        'status' => FileInterface::STATUS_PERMANENT,
        'uid' => 1,
      ]);

      // Set mime type if available.
      if (!empty($config_file['mime_type'])) {
        $file->setMimeType($config_file['mime_type']);
      }

      $file->save();

      $this->loggerFactory->get('api_application')
        ->info('Recreated file @filename with UUID @uuid at @uri', [
          '@filename' => $filename,
          '@uuid' => $uuid,
          '@uri' => $new_uri,
        ]);

      return $file;
    }
    catch (\Exception $e) {
      $this->loggerFactory->get('api_application')
        ->error('Failed to recreate file @filename: @error', [
          '@filename' => $filename,
          '@error' => $e->getMessage(),
        ]);
      return NULL;
    }
  }

  /**
   * Ensures files are marked as permanent and properly managed.
   *
   * @param array $file_ids
   *   Array of file IDs to manage.
   */
  public function ensureFilesPermanent(array $file_ids): void {
    $file_storage = $this->entityTypeManager->getStorage('file');

    foreach ($file_ids as $fid) {
      if ($file = $file_storage->load($fid)) {
        if (!$file->isPermanent()) {
          $file->setPermanent();
          $file->save();
        }
      }
    }
  }

  /**
   * Creates placeholder file data when original file cannot be found.
   *
   * @param array $config_file
   *   File configuration data.
   *
   * @return string|null
   *   Placeholder file data, or NULL if no placeholder can be created.
   */
  protected function createPlaceholderFileData(array $config_file): ?string {
    $mime_type = $config_file['mime_type'] ?? '';
    $filename = $config_file['filename'] ?? 'missing_file';

    // Only create placeholders for image files.
    if (strpos($mime_type, 'image/') === 0) {
      // Create a simple placeholder image.
      return $this->createPlaceholderImage($filename);
    }

    // For non-image files, create a text placeholder.
    if (strpos($mime_type, 'text/') === 0 || $mime_type === 'application/pdf') {
      return $this->createPlaceholderText($filename);
    }

    return NULL;
  }

  /**
   * Creates a placeholder image.
   *
   * @param string $filename
   *   The original filename.
   *
   * @return string
   *   Placeholder image data.
   */
  protected function createPlaceholderImage(string $filename): string {
    // Create a simple 300x200 placeholder image.
    $width = 300;
    $height = 200;

    $image = imagecreate($width, $height);

    // Colors.
    $background = imagecolorallocate($image, 240, 240, 240);
    $text_color = imagecolorallocate($image, 100, 100, 100);
    $border_color = imagecolorallocate($image, 200, 200, 200);

    // Fill background.
    imagefill($image, 0, 0, $background);

    // Draw border.
    imagerectangle($image, 0, 0, $width - 1, $height - 1, $border_color);

    // Add text.
    $font_size = 3;
    $text_width = imagefontwidth($font_size) * strlen($filename);
    $text_height = imagefontheight($font_size);

    $x = ($width - $text_width) / 2;
    $y = ($height - $text_height) / 2 - 10;

    imagestring($image, $font_size, $x, $y, "Missing File:", $text_color);
    imagestring($image, $font_size, $x, $y + 20, $filename, $text_color);

    // Output as PNG.
    ob_start();
    imagepng($image);
    $image_data = ob_get_contents();
    ob_end_clean();

    imagedestroy($image);

    return $image_data;
  }

  /**
   * Creates placeholder text content.
   *
   * @param string $filename
   *   The original filename.
   *
   * @return string
   *   Placeholder text data.
   */
  protected function createPlaceholderText(string $filename): string {
    return "PLACEHOLDER FILE\n\n" .
           "Original filename: {$filename}\n" .
           "Status: File not found in current environment\n" .
           "Created: " . date('Y-m-d H:i:s') . "\n\n" .
           "This is a placeholder file created because the original file could not be found.\n" .
           "Please replace this file with the actual content.";
  }

  /**
   * Synchronizes files from a source environment.
   *
   * @param string $source_files_path
   *   Path to source files directory (e.g., from rsync or file sync).
   * @param array $config_files
   *   Array of file references from configuration.
   * @param string $target_directory
   *   Target directory for synchronized files.
   *
   * @return array
   *   Array of successfully synchronized file IDs.
   */
  public function synchronizeFilesFromSource(string $source_files_path, array $config_files, string $target_directory = 'public://application_instructions/examples/'): array {
    $synchronized_files = [];

    foreach ($config_files as $config_file) {
      $filename = $config_file['filename'] ?? '';
      $uuid = $config_file['uuid'] ?? '';

      if (empty($filename) || empty($uuid)) {
        continue;
      }

      // Check if file already exists by UUID.
      $file_storage = $this->entityTypeManager->getStorage('file');
      $existing_files = $file_storage->loadByProperties(['uuid' => $uuid]);

      if (!empty($existing_files)) {
        $synchronized_files[] = reset($existing_files)->id();
        continue;
      }

      // Try to find the file in the source directory.
      $source_file_path = $source_files_path . '/' . $filename;
      if (file_exists($source_file_path)) {
        try {
          // Ensure target directory exists.
          if (!$this->fileSystem->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
            continue;
          }

          // Copy file from source.
          $file_data = file_get_contents($source_file_path);
          if ($file_data === FALSE) {
            continue;
          }

          $destination = $target_directory . '/' . $filename;
          $new_uri = $this->fileSystem->saveData($file_data, $destination, FileSystemInterface::EXISTS_RENAME);

          if (!$new_uri) {
            continue;
          }

          // Create file entity with original UUID.
          $file = $file_storage->create([
            'uuid' => $uuid,
            'uri' => $new_uri,
            'filename' => $this->fileSystem->basename($new_uri),
            'status' => FileInterface::STATUS_PERMANENT,
            'uid' => 1,
          ]);

          if (!empty($config_file['mime_type'])) {
            $file->setMimeType($config_file['mime_type']);
          }

          $file->save();
          $synchronized_files[] = $file->id();

          $this->loggerFactory->get('api_application')
            ->info('Synchronized file @filename from source', ['@filename' => $filename]);
        }
        catch (\Exception $e) {
          $this->loggerFactory->get('api_application')
            ->error('Failed to synchronize file @filename: @error', [
              '@filename' => $filename,
              '@error' => $e->getMessage(),
            ]);
        }
      }
    }

    return $synchronized_files;
  }

  /**
   * Cleans up orphaned files that are no longer referenced in configuration.
   *
   * @param array $current_file_uuids
   *   Array of UUIDs that should be preserved.
   * @param string $directory_pattern
   *   Directory pattern to limit cleanup scope.
   */
  public function cleanupOrphanedFiles(array $current_file_uuids, string $directory_pattern = 'public://application_instructions/'): void {
    $file_storage = $this->entityTypeManager->getStorage('file');

    // Find files in the target directory that are not in the current list.
    $query = $file_storage->getQuery()
      ->condition('uri', $directory_pattern, 'STARTS_WITH')
      ->accessCheck(FALSE);

    if (!empty($current_file_uuids)) {
      $query->condition('uuid', $current_file_uuids, 'NOT IN');
    }

    $orphaned_fids = $query->execute();

    foreach ($orphaned_fids as $fid) {
      if ($file = $file_storage->load($fid)) {
        // Check if file is used elsewhere before deleting.
        $usage = $this->fileUsage->listUsage($file);
        if (empty($usage)) {
          $file->delete();
          $this->loggerFactory->get('api_application')
            ->info('Deleted orphaned file @filename (UUID: @uuid)', [
              '@filename' => $file->getFilename(),
              '@uuid' => $file->uuid(),
            ]);
        }
      }
    }
  }

}
