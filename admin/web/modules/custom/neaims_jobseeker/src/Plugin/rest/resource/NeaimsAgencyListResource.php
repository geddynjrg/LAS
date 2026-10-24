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
 * Proxies NEAIMS agency list search (search = agency number / name).
 */
#[RestResource(
  id: 'neaims_agency_list',
  label: new TranslatableMarkup('NEAIMS Agency List'),
  uri_paths: [
    'create' => '/api/v1/integrations/agency/list',
  ],
)]
class NeaimsAgencyListResource extends ResourceBase {

  private const URL = 'https://api.kazi254.ke/api/v1/integrations/agency/list';

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
   * POST body: { "search": "<agency number>", "start": 0, "limit": 100 }
   */
  public function post(?array $data = NULL): ModifiedResourceResponse {
    $search = trim((string) ($data['search'] ?? $data['agencyNumber'] ?? $data['agency_number'] ?? ''));
    if ($search === '') {
      throw new BadRequestHttpException('Agency search term (agency number) is required');
    }
    $start = isset($data['start']) ? (int) $data['start'] : 0;
    $limit = isset($data['limit']) ? (int) $data['limit'] : 100;
    if ($limit < 1) {
      $limit = 100;
    }
    if ($limit > 500) {
      $limit = 500;
    }
    if ($start < 0) {
      $start = 0;
    }

    try {
      [$status, $decoded] = NeaimsApiClient::postJson(self::URL, [
        'search' => $search,
        'start' => $start,
        'limit' => $limit,
      ]);
      return new ModifiedResourceResponse($decoded, $status);
    }
    catch (\RuntimeException $e) {
      $this->logger->error('NEAIMS agency list failed: @m', ['@m' => $e->getMessage()]);
      throw new HttpException($e->getCode() ?: 500, $e->getMessage());
    }
  }

}
