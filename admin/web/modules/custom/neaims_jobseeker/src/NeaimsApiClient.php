<?php

namespace Drupal\neaims_jobseeker;

use Drupal\Core\Site\Settings;
use GuzzleHttp\Exception\RequestException;

/**
 * Shared HTTP client for NEAIMS / Kazi254 integration APIs.
 */
final class NeaimsApiClient {

  /**
   * @return array{0: string, 1: string}
   */
  public static function credentials(): array {
    $key = (string) (getenv('NEAMIS_CONSUMER_KEY') ?: Settings::get('neaims_consumer_key', ''));
    $secret = (string) (getenv('NEAMIS_CONSUMER_SECRET') ?: Settings::get('neaims_consumer_secret', ''));

    $abs = '/var/www/private/neaims_credentials.json';
    if (($key === '' || $secret === '') && is_readable($abs)) {
      $file = json_decode((string) file_get_contents($abs), TRUE);
      if (is_array($file)) {
        $key = trim((string) ($file['consumer_key'] ?? $file['consumerKey'] ?? $file['NEAMIS_CONSUMER_KEY'] ?? $key));
        $secret = trim((string) ($file['consumer_secret'] ?? $file['consumerSecret'] ?? $file['NEAMIS_CONSUMER_SECRET'] ?? $secret));
      }
    }

    return [trim($key), trim($secret)];
  }

  /**
   * POST JSON to a Kazi254/NEAIMS URL and return [status, decoded array].
   *
   * @param array<string, mixed> $payload
   *
   * @return array{0: int, 1: array}
   */
  public static function postJson(string $url, array $payload): array {
    [$key, $secret] = self::credentials();
    if ($key === '' || $secret === '') {
      throw new \RuntimeException('NEAIMS credentials are not configured on this server.', 503);
    }

    try {
      $response = \Drupal::httpClient()->request('POST', $url, [
        'headers' => [
          'Content-Type' => 'application/json',
          'Accept' => 'application/json',
          'X-Consumer-Key' => $key,
          'X-Consumer-Secret' => $secret,
        ],
        'json' => $payload,
        'http_errors' => FALSE,
        'timeout' => 25,
        'connect_timeout' => 10,
      ]);
    }
    catch (RequestException $e) {
      throw new \RuntimeException('Unable to connect to NEAIMS: ' . $e->getMessage(), 500, $e);
    }

    $body = (string) $response->getBody();
    $decoded = json_decode($body, TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      $decoded = [
        'success' => FALSE,
        'message' => 'Invalid JSON from NEAIMS',
        'raw' => $body,
      ];
    }

    return [$response->getStatusCode(), is_array($decoded) ? $decoded : ['data' => $decoded]];
  }

}
