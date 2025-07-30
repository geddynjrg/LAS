<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Drupal\api_application\Service\EmailService;

/**
 * Provides Application Email Resource for POST operations.
 *
 * @RestResource(
 *   id = "application_email",
 *   label = @Translation("API Application Email Resource"),
 *   uri_paths = {
 *     "create" = "/api/v1/application/{application}/email"
 *   }
 * )
 */
class ApplicationEmailResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The email service.
   *
   * @var \Drupal\api_application\Service\EmailService
   */
  protected $emailService;

  /**
   * Constructs a new ApplicationEmailResource object.
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
   * @param \Drupal\api_application\Service\EmailService $email_service
   *   The email service.
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
    EmailService $email_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $language_manager, $path_matcher, $alias_manager, $field_mapper);
    $this->entityTypeManager = $entity_type_manager;
    $this->emailService = $email_service;
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
      $container->get('api_application.email_service')
    );
  }

  /**
   * Responds to POST requests.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   * @param string $application
   *   The application ID or UUID.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function post(Request $request, $application = NULL): Response {
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

      // Get request data.
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return $this->createModifiedResponse([
          'error' => 'Invalid request',
          'message' => 'Request body cannot be empty',
        ], 400);
      }

      // Validate required fields.
      if (empty($data['email'])) {
        return $this->createModifiedResponse([
          'error' => 'Validation failed',
          'message' => 'Email address is required',
        ], 400);
      }

      // Prepare email options.
      $options = [];
      if (!empty($data['subject'])) {
        $options['subject'] = $data['subject'];
      }
      if (!empty($data['body'])) {
        $options['body'] = $data['body'];
      }
      if (!empty($data['from'])) {
        $options['from'] = $data['from'];
      }

      // Send the email.
      $result = $this->emailService->sendApplicationEmail(
        $applicationEntity,
        $data['email'],
        $options
      );

      if ($result['success']) {
        return $this->createModifiedResponse([
          'success' => TRUE,
          'message' => $result['message'],
          'data' => [
            'application_id' => $applicationEntity->getApplicationId(),
            'recipient_email' => $data['email'],
            'sent_at' => date('c'),
          ],
        ]);
      }
      else {
        return $this->createModifiedResponse([
          'error' => 'Email sending failed',
          'message' => $result['message'],
        ], 500);
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Email sending failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return $this->createModifiedResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while sending the email',
      ], 500);
    }
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
