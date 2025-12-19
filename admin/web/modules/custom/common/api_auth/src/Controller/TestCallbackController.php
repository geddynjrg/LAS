<?php

namespace Drupal\api_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Test callback to capture eCitizen response.
 */
class TestCallbackController extends ControllerBase {

  /**
   * Capture all parameters from eCitizen.
   */
  public function capture(Request $request) {
    // Get all query parameters
    $params = $request->query->all();

    // Get all POST parameters
    $postData = $request->request->all();

    // Get headers
    $headers = $request->headers->all();

    // Log everything

    // Return captured data as JSON
    return new JsonResponse([
      'status' => 'captured',
      'data' => [
        'query' => $params,
        'post' => $postData,
        'method' => $request->getMethod(),
        'timestamp' => time(),
      ],
      'message' => 'Callback data captured. Check Drupal logs for details.',
    ]);
  }

}
