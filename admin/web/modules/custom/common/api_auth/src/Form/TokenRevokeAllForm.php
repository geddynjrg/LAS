<?php

namespace Drupal\api_auth\Form;

use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\api_auth\Service\TokenStorageService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for revoking all JWT tokens.
 */
class TokenRevokeAllForm extends ConfirmFormBase {

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * Constructs a new TokenRevokeAllForm object.
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
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildForm($form, $form_state);

    // Add checkbox for revoking expired tokens too.
    $form['revoke_expired'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Also delete expired tokens from the database'),
      '#default_value' => FALSE,
      '#description' => $this->t('This will permanently delete all expired tokens from the database, not just mark them as revoked.'),
    ];

    return $form;
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
    return $this->t('This action will revoke all currently active JWT tokens for all users. All users will be forced to log in again to get new tokens. This action cannot be undone.');
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_auth_token_revoke_all_form';
  }

  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    return $this->t('Are you sure you want to revoke all active tokens?');
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Get the database connection.
    $database = \Drupal::database();
    $count = 0;

    // If user chose to delete expired tokens.
    if ($form_state->getValue('revoke_expired')) {
      $deleted = $this->tokenStorage->purgeExpiredTokens();
      $this->messenger()->addStatus($this->t('Deleted @count expired tokens from the database.', ['@count' => $deleted]));
    }

    // Revoke all active tokens.
    try {
      $query = $database->update('api_active_tokens')
        ->fields(['is_revoked' => 1])
        ->condition('is_revoked', 0)
        ->condition('expiration', time(), '>=');

      $count = $query->execute();

      $this->messenger()->addStatus($this->t('Successfully revoked @count active tokens.', ['@count' => $count]));
    }
    catch (\Exception $e) {
      $this->messenger()->addError($this->t('Failed to revoke tokens: @error', ['@error' => $e->getMessage()]));
    }

    $form_state->setRedirect('api_auth.token_management');
  }

}
