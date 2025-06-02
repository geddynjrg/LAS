<?php

namespace Drupal\api_auth\Form;

use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\api_auth\Service\TokenStorageService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for revoking JWT tokens.
 */
class TokenRevokeForm extends ConfirmFormBase {

  /**
   * The token data.
   *
   * @var array
   */
  protected $token;

  /**
   * The token ID.
   *
   * @var int
   */
  protected $tokenId;

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * Constructs a new TokenRevokeForm object.
   *
   * @param \Drupal\api_auth\Service\TokenStorageService $token_storage
   *   The token storage service.
   */
  public function __construct(TokenStorageService $token_storage) {
    $this->tokenStorage = $token_storage;
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, $token_id = NULL) {
    $this->tokenId = $token_id;

    // Load token data.
    $database = \Drupal::database();
    $query = $database->select('api_active_tokens', 't')
      ->fields('t')
      ->condition('id', $this->tokenId)
      ->range(0, 1);

    $this->token = $query->execute()->fetchAssoc();

    if (!$this->token) {
      $this->messenger()->addError($this->t('Token not found.'));

      return $this->redirect('api_auth.token_management');
    }

    // Check if the token is already revoked.
    if ($this->token['is_revoked']) {
      $this->messenger()->addWarning($this->t('This token is already revoked.'));

      return $this->redirect('api_auth.token_management');
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('api_auth.token_storage')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getCancelUrl() {
    return new Url('api_auth.token_management');
  }

  /**
   * {@inheritdoc}
   */
  public function getDescription() {
    return $this->t('This action cannot be undone. The token will be immediately invalidated and the user will need to log in again to get a new token.');
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_auth_token_revoke_form';
  }

  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    $username = 'User #' . $this->token['user_id'];

    // Try to load the user entity.
    try {
      $user_storage = \Drupal::entityTypeManager()->getStorage('user');
      $user = $user_storage->load($this->token['user_id']);

      if ($user) {
        $username = $user->getAccountName();
      }
    }
    catch (\Exception $e) {
      // Fall back to the user ID.
    }

    return $this->t('Are you sure you want to revoke this @type token for @username?', [
      '@type' => $this->token['type'],
      '@username' => $username,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Revoke the token.
    $result = $this->tokenStorage->revokeToken($this->token['jti']);

    if ($result) {
      $this->messenger()->addStatus($this->t('Token has been revoked successfully.'));
    }
    else {
      $this->messenger()->addError($this->t('Failed to revoke token.'));
    }

    $form_state->setRedirect('api_auth.token_management');
  }

}
