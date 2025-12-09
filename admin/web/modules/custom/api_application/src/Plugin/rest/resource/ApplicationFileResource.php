<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\file\FileInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;

/**
 * Provides Application File Resource for GET operations.
 *
 * @RestResource(
 *   id = "application_file",
 *   label = @Translation("API Application File Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/files/{applicationId}/{filename}"
 *   }
 * )
 */
class ApplicationFileResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new ApplicationFileResource object.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    PathMatcherInterface $path_matcher,
    RestFrameworkFieldMapper $field_mapper,
    LanguageManagerInterface $language_manager,
    AliasManagerInterface $alias_manager,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('rest_framework'),
      $container->get('path.matcher'),
      $container->get('rest_framework.field_mapper'),
      $container->get('language_manager'),
      $container->get('path_alias.manager'),
      $container->get('entity_type.manager'),
    );
  }

  /**
   * Responds to GET requests.
   *
   * @param string $applicationId
   *   The application ID.
   * @param string $filename
   *   The filename to retrieve.
   *
   * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
   *   The file response.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException
   *   Thrown when the file is not found.
   * @throws \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException
   *   Thrown when access is denied.
   */
  public function get(string $applicationId, string $filename) {
    // Load application by application_id.
    $applicationStorage = $this->entityTypeManager->getStorage('application');
    $applications = $applicationStorage->loadByProperties([
      'application_id' => $applicationId,
    ]);

    if (empty($applications)) {
      throw new NotFoundHttpException('Application not found');
    }

    /** @var \Drupal\api_application\Entity\ApplicationInterface $application */
    $application = reset($applications);

    // Check access to the application.
    if (!$application->access('view')) {
      throw new AccessDeniedHttpException('Access denied to application');
    }

    // Find the file in the application's file fields.
    $file = $this->findFileByFilename($application, $filename);

    if (!$file) {
      throw new NotFoundHttpException('File not found');
    }

    // Return the file as a binary response.
    $uri = $file->getFileUri();
    $response = new BinaryFileResponse($uri);

    // Set content type based on file mime type.
    $response->headers->set('Content-Type', $file->getMimeType());

    // Set content disposition to inline so files are displayed in browser.
    $response->setContentDisposition('inline', $file->getFilename());

    // Set cache headers.
    $response->setPrivate();
    $response->setMaxAge(3600);

    return $response;
  }

  /**
   * Find a file by filename in an application entity.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param string $filename
   *   The filename to search for.
   *
   * @return \Drupal\file\FileInterface|null
   *   The file entity if found, NULL otherwise.
   */
  protected function findFileByFilename($application, string $filename): ?FileInterface {
    // Get all field definitions for the application entity.
    $fieldDefinitions = $application->getFieldDefinitions();

    // Iterate through all fields to find file references.
    foreach ($fieldDefinitions as $fieldName => $fieldDefinition) {
      $fieldType = $fieldDefinition->getType();

      // Check if field is a file field.
      if ($fieldType === 'file' || $fieldType === 'image') {
        $fieldValue = $application->get($fieldName);

        if (!$fieldValue->isEmpty()) {
          foreach ($fieldValue as $item) {
            /** @var \Drupal\file\FileInterface $file */
            $file = $item->entity;

            if ($file && $file->getFilename() === $filename) {
              return $file;
            }
          }
        }
      }
    }

    // Also check group members for file fields.
    if ($application->hasField('field_group_members')) {
      $members = $application->get('field_group_members')->referencedEntities();

      foreach ($members as $member) {
        $memberFieldDefinitions = $member->getFieldDefinitions();

        foreach ($memberFieldDefinitions as $fieldName => $fieldDefinition) {
          $fieldType = $fieldDefinition->getType();

          if ($fieldType === 'file' || $fieldType === 'image') {
            $fieldValue = $member->get($fieldName);

            if (!$fieldValue->isEmpty()) {
              foreach ($fieldValue as $item) {
                /** @var \Drupal\file\FileInterface $file */
                $file = $item->entity;

                if ($file && $file->getFilename() === $filename) {
                  return $file;
                }
              }
            }
          }
        }
      }
    }

    return NULL;
  }

}
