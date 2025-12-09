<?php

namespace Drupal\rest_framework\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\RendererInterface;
use Drupal\rest_framework\Service\OpenApiSchemaService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for API documentation.
 */
class ApiDocsController extends ControllerBase {

  /**
   * The openapi schema service.
   *
   * @var \Drupal\rest_framework\Service\OpenApiSchemaService
   */
  protected $openApiSchemaService;

  /**
   * The renderer service.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * Constructs a new ApiDocsController.
   *
   * @param \Drupal\rest_framework\Service\OpenApiSchemaService $open_api_schema_service
   *   The openapi schema service.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer service.
   */
  public function __construct(
    OpenApiSchemaService $open_api_schema_service,
    RendererInterface $renderer,
  ) {
    $this->openApiSchemaService = $open_api_schema_service;
    $this->renderer = $renderer;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('rest_framework.openapi_schema'),
      $container->get('renderer')
    );
  }

  /**
   * Returns the OpenAPI spec as JSON.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response.
   */
  public function openApiJson(Request $request) {
    $schema = $this->openApiSchemaService->generateOpenApiSpec();
    return new JsonResponse($schema);
  }

  /**
   * Displays the API documentation UI.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return array
   *   The render array.
   */
  public function openApiUi(Request $request) {
    // Attach Swagger UI library.
    $spec_url = $request->getSchemeAndHttpHost() . '/api/docs/json';
    $build = [
      '#theme' => 'rest_framework_api_docs',
      '#spec_url' => $spec_url,
      '#attached' => [
        'library' => [
          'rest_framework/swagger_ui',
        ],
        'drupalSettings' => [
          'restFramework' => [
            'apiDocsUrl' => $spec_url,
          ],
        ],
      ],
    ];

    return $build;
  }

}
