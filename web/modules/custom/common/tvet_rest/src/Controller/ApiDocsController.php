<?php

namespace Drupal\tvet_rest\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\RendererInterface;
use Drupal\tvet_rest\Service\OpenApiSchemaService;
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
   * @var \Drupal\tvet_rest\Service\OpenApiSchemaService
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
   * @param \Drupal\tvet_rest\Service\OpenApiSchemaService $open_api_schema_service
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
      $container->get('tvet_rest.openapi_schema'),
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
    $build = [
      '#theme' => 'tvet_rest_api_docs',
      '#attached' => [
        'library' => [
          'tvet_rest/swagger_ui',
        ],
        'drupalSettings' => [
          'tvetRest' => [
            'apiDocsUrl' => $request->getSchemeAndHttpHost() . '/api/docs/json',
          ],
        ],
      ],
    ];

    return $build;
  }

}
