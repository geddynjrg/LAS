<?php

namespace Drupal\rest_framework\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\rest_framework\Service\OpenApiSchemaService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for OpenAPI documentation.
 */
class OpenApiController extends ControllerBase {

  /**
   * The OpenAPI schema service.
   *
   * @var \Drupal\rest_framework\Service\OpenApiSchemaService
   */
  protected $openApiSchemaService;

  /**
   * Constructs a new OpenApiController object.
   *
   * @param \Drupal\rest_framework\Service\OpenApiSchemaService $open_api_schema_service
   *   The OpenAPI schema service.
   */
  public function __construct(OpenApiSchemaService $open_api_schema_service) {
    $this->openApiSchemaService = $open_api_schema_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('rest_framework.openapi_schema')
    );
  }

  /**
   * Displays the OpenAPI documentation page.
   *
   * @return array
   *   A render array for the documentation page.
   */
  public function documentation() {
    $spec = $this->openApiSchemaService->generateOpenApiSpec();

    return [
      '#theme' => 'rest_framework_openapi_docs',
      '#spec' => $spec,
      '#attached' => [
        'library' => [
          'rest_framework/openapi_ui',
        ],
      ],
      '#cache' => [
        'contexts' => ['url.path'],
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Returns the OpenAPI specification as JSON.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The OpenAPI specification as JSON.
   */
  public function spec() {
    $spec = $this->openApiSchemaService->generateOpenApiSpec();
    $response = new JsonResponse($spec);
    $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
    $response->headers->set('Pragma', 'no-cache');
    $response->headers->set('Expires', '0');
    return $response;
  }

  /**
   * Displays the OpenAPI documentation using Stoplight Elements.
   *
   * @return array
   *   A render array for the documentation page.
   */
  public function stoplightDocs() {
    // Get the JSON spec URL.
    $spec_url = '/api/docs/json';

    return [
      '#theme' => 'rest_framework_stoplight',
      '#spec_url' => $spec_url,
      '#attached' => [
        'library' => [
          'rest_framework/stoplight_elements_ui',
        ],
        'drupalSettings' => [
          'restFramework' => [
            'apiDocsUrl' => $spec_url,
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.path'],
        'max-age' => 0,
      ],
    ];
  }

}
