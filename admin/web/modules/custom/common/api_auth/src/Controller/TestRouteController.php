<?php
// test_route.php
namespace Drupal\api_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

class TestRouteController extends ControllerBase {
  public function test() {
    \Drupal::logger('api_auth')->info('Test route accessed');
    return new JsonResponse(['status' => 'okAY', 'time' => time()]);
  }
}
