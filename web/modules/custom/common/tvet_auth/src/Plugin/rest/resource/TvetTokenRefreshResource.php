<?php

namespace Drupal\tvet_auth\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\tvet_auth\Service\TvetJwtService;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Provides a resource for refreshing JWT tokens.
 */
#[RestResource(
  id: 'tvet_token_refresh',
  label: new TranslatableMarkup('TVET Token Refresh'),
  uri_paths: [
    'create' => '/api/v1/user/token/refresh',
  ],
)]
class TvetTokenRefreshResource extends ResourceBase {

  /**
   * The JWT service.
   *
   * @var \Drupal\tvet_auth\Service\TvetJwtService
   */
  protected $jwtService;

  /**
   * Constructs a new TvetTokenRefreshResource object.
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
   * @param \Drupal\tvet_auth\Service\TvetJwtService $jwt_service
   *   The JWT service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    TvetJwtService $jwt_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->jwtService = $jwt_service;
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
      $container->get('logger.factory')->get('tvet_auth'),
      $container->get('tvet_auth.jwt_service')
    );
  }

  /**
   * Responds to POST requests for token refresh.
   *
   * @param array $data
   *   The request data containing the refresh token.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function post(?array $data = NULL) {
    if (empty($data['refresh_token'])) {
      throw new BadRequestHttpException('Refresh token is required.');
    }

    $refresh_token = $data['refresh_token'];

    // Try to refresh the token.
    $new_tokens = $this->jwtService->refreshTokens($refresh_token);

    if (!$new_tokens) {
      throw new UnauthorizedHttpException('Bearer', 'Invalid or expired refresh token.');
    }

    // Prepare response data.
    $response_data = [
      'data' => [
        'access_token' => $new_tokens['access_token'],
        'refresh_token' => $new_tokens['refresh_token'],
        'expires_in' => $new_tokens['expires_in'],
        'token_type' => 'Bearer',
      ],
      'meta' => [
        'timestamp' => time(),
        'version' => 'v1',
      ],
    ];

    return new ModifiedResourceResponse($response_data, 200);
  }

}
