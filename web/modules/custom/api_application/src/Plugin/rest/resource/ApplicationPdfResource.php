<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Drupal\api_application\Service\PdfGeneratorService;

/**
 * Provides Application PDF Resource for GET operations.
 *
 * @RestResource(
 *   id = "application_pdf",
 *   label = @Translation("API Application PDF Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/application/{application}/pdf"
 *   }
 * )
 */
class ApplicationPdfResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The PDF generator service.
   *
   * @var \Drupal\api_application\Service\PdfGeneratorService
   */
  protected $pdfGenerator;

  /**
   * Constructs a new ApplicationPdfResource object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \Psr\Log\LoggerInterface $logger
   *   A logger instance.
   * @param \Drupal\Core\Language\LanguageManagerInterface $language_manager
   *   The language manager.
   * @param \Drupal\Core\Path\PathMatcherInterface $path_matcher
   *   The path matcher service.
   * @param \Drupal\path_alias\AliasManagerInterface $alias_manager
   *   The alias manager service.
   * @param \Drupal\rest_framework\Service\RestFrameworkFieldMapper $field_mapper
   *   The REST framework field mapper.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\api_application\Service\PdfGeneratorService $pdf_generator
   *   The PDF generator service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    LanguageManagerInterface $language_manager,
    PathMatcherInterface $path_matcher,
    AliasManagerInterface $alias_manager,
    RestFrameworkFieldMapper $field_mapper,
    EntityTypeManagerInterface $entity_type_manager,
    PdfGeneratorService $pdf_generator,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $language_manager, $path_matcher, $alias_manager, $field_mapper);
    $this->entityTypeManager = $entity_type_manager;
    $this->pdfGenerator = $pdf_generator;
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
      $container->get('logger.factory')->get('api_application'),
      $container->get('language_manager'),
      $container->get('path.matcher'),
      $container->get('path_alias.manager'),
      $container->get('rest_framework.field_mapper'),
      $container->get('entity_type.manager'),
      $container->get('api_application.pdf_generator')
    );
  }

  /**
   * Responds to GET requests.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   * @param string $application
   *   The application ID or UUID.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function get(Request $request, $application = NULL): Response {
    try {
      // Check authentication via API key header.
      $apiKey = $request->headers->get('X-API-Key');
      if (!$this->validateApiKey($apiKey)) {
        return $this->createModifiedResponse([
          'error' => 'Authentication failed',
          'message' => 'Invalid or missing API key',
        ], 401);
      }

      if (empty($application)) {
        return $this->createModifiedResponse([
          'error' => 'Invalid request',
          'message' => 'Application ID is required',
        ], 400);
      }

      // Load the application.
      $applicationEntity = $this->loadApplication($application);

      if (!$applicationEntity) {
        return $this->createModifiedResponse([
          'error' => 'Not found',
          'message' => 'Application not found',
        ], 404);
      }

      // Check if PDF download is requested.
      $download = $request->query->get('download', 'false') === 'true';

      if ($download) {
        // Generate and serve the PDF file.
        return $this->servePdfFile($applicationEntity);
      }
      else {
        // Return PDF metadata.
        return $this->getPdfMetadata($applicationEntity);
      }

    }
    catch (\Exception $e) {
      $this->logger->error('PDF generation failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return $this->createModifiedResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while generating the PDF',
      ], 500);
    }
  }

  /**
   * Serves the PDF file for download.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
   *   The binary file response.
   */
  protected function servePdfFile($application) {
    // Generate PDF.
    $pdf_path = $this->pdfGenerator->generateApplicationPdf($application);

    if (!file_exists($pdf_path)) {
      return $this->createModifiedResponse([
        'error' => 'File not found',
        'message' => 'PDF file could not be generated',
      ], 404);
    }

    // Create binary file response.
    $response = new BinaryFileResponse($pdf_path);
    $response->setContentDisposition(
      'attachment',
      'application-' . $application->getApplicationId() . '.pdf'
    );

    return $response;
  }

  /**
   * Gets PDF metadata without downloading.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  protected function getPdfMetadata($application) {
    $pdf_exists = $this->pdfGenerator->pdfExists($application);

    if (!$pdf_exists) {
      // Generate PDF if it doesn't exist.
      try {
        $this->pdfGenerator->generateApplicationPdf($application);
        $pdf_exists = TRUE;
      }
      catch (\Exception $e) {
        return $this->createModifiedResponse([
          'error' => 'PDF generation failed',
          'message' => $e->getMessage(),
        ], 500);
      }
    }

    $download_url = \Drupal::request()->getSchemeAndHttpHost() .
                   \Drupal::request()->getRequestUri() . '?download=true';

    return $this->createModifiedResponse([
      'success' => TRUE,
      'data' => [
        'application_id' => $application->getApplicationId(),
        'pdf_available' => $pdf_exists,
        'download_url' => $download_url,
        'filename' => 'application-' . $application->getApplicationId() . '.pdf',
      ],
    ]);
  }

  /**
   * Validates the API key.
   *
   * @param string|null $apiKey
   *   The API key to validate.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
   */
  protected function validateApiKey($apiKey) {
    // For now, we'll use a simple validation.
    // In production, you should implement proper API key validation.
    return !empty($apiKey);
  }

  /**
   * Loads an application by ID or UUID.
   *
   * @param string $application
   *   The application ID or UUID.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface|null
   *   The application entity or NULL if not found.
   */
  protected function loadApplication($application) {
    $storage = $this->entityTypeManager->getStorage('application');

    // Try to load by ID first.
    if (is_numeric($application)) {
      $entity = $storage->load($application);
      if ($entity) {
        return $entity;
      }
    }

    // Try to load by UUID.
    $entities = $storage->loadByProperties(['uuid' => $application]);
    if (!empty($entities)) {
      return reset($entities);
    }

    // Try to load by application_id field.
    $entities = $storage->loadByProperties(['application_id' => $application]);
    if (!empty($entities)) {
      return reset($entities);
    }

    return NULL;
  }

}
