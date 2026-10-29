<?php

namespace Drupal\neaims_jobseeker\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\neaims_jobseeker\NeaimsApiClient;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Proxies NEAIMS jobseeker placements lookup by national ID.
 */
#[RestResource(
  id: 'neaims_jobseeker_placements',
  label: new TranslatableMarkup('NEAIMS Jobseeker Placements'),
  uri_paths: [
    'create' => '/api/v1/integrations/jobseeker/placements',
  ],
)]
class NeaimsJobseekerPlacementsResource extends ResourceBase {

  private const URL = 'https://api.kazi254.ke/api/v1/integrations/jobseeker/placements';

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    protected Request $currentRequest,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('neaims_jobseeker'),
      $container->get('request_stack')->getCurrentRequest(),
    );
  }

  /**
   * POST body: { "nationalId": "29930337" }
   */
  public function post(?array $data = NULL): ModifiedResourceResponse {
    $nationalId = trim((string) ($data['nationalId'] ?? $data['id'] ?? ''));
    if ($nationalId === '') {
      throw new BadRequestHttpException('National ID is required');
    }
    try {
      [$status, $decoded] = NeaimsApiClient::postJson(self::URL, ['nationalId' => $nationalId]);
      return new ModifiedResourceResponse($decoded, $status);
    }
    catch (\RuntimeException $e) {
      $this->logger->error('NEAIMS placements failed: @m', ['@m' => $e->getMessage()]);
      throw new HttpException($e->getCode() ?: 500, $e->getMessage());
    }
  }

}
