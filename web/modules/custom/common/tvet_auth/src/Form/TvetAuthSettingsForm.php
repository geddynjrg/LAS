<?php

namespace Drupal\tvet_auth\Form;

use Drupal\Core\Database\Connection;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure TVET Auth settings for this site.
 */
class TvetAuthSettingsForm extends ConfigFormBase {

  /**
   * Config settings.
   *
   * @var string
   */
  public const SETTINGS = 'tvet_auth.settings';

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Constructs a new TvetAuthSettingsForm.
   *
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   */
  public function __construct(Connection $database, LoggerChannelFactoryInterface $logger_factory) {
    $this->database = $database;
    $this->logger = $logger_factory->get('tvet_auth');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(static::SETTINGS);

    $form['jwt'] = [
      '#type' => 'details',
      '#title' => $this->t('JWT Authentication Settings'),
      '#open' => TRUE,
    ];

    $form['jwt']['jwt_auth_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable JWT Authentication'),
      '#default_value' => $config->get('jwt_auth_enabled') ?? TRUE,
      '#description' => $this->t('Enable or disable JWT authentication for API endpoints.'),
    ];

    $form['jwt']['jwt_expiration'] = [
      '#type' => 'number',
      '#title' => $this->t('Access Token Expiration Time'),
      '#default_value' => $config->get('jwt_expiration') ?? 3600,
      '#min' => 60,
      '#step' => 1,
      '#description' => $this->t('The number of seconds that an access token will remain valid (minimum 60 seconds).'),
    ];

    $form['jwt']['jwt_refresh_expiration'] = [
      '#type' => 'number',
      '#title' => $this->t('Refresh Token Expiration Time'),
      '#default_value' => $config->get('jwt_refresh_expiration') ?? 2592000,
      '#min' => 300,
      '#step' => 1,
      '#description' => $this->t('The number of seconds that a refresh token will remain valid (minimum 300 seconds).'),
    ];

    $form['jwt']['security'] = [
      '#type' => 'details',
      '#title' => $this->t('Security Settings'),
      '#open' => TRUE,
    ];

    $form['jwt']['security']['jwt_strict_validation'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Strict Token Validation'),
      '#default_value' => $config->get('jwt_strict_validation') ?? TRUE,
      '#description' => $this->t('Enforce strict validation of tokens including checks for all required claims.'),
    ];

    $form['jwt']['security']['jwt_revoke_tokens_on_password_change'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Remove Tokens on Password Change'),
      '#default_value' => $config->get('jwt_revoke_tokens_on_password_change') ?? TRUE,
      '#description' => $this->t('Automatically remove all existing tokens when a user changes their password.'),
    ];

    $form['jwt']['security']['jwt_store_tokens'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Store All Tokens in Database'),
      '#default_value' => $config->get('jwt_store_tokens') ?? TRUE,
      '#description' => $this->t('Store all issued tokens in the database for tracking and management. Highly recommended for security.'),
    ];

    $form['jwt']['security']['jwt_token_limit_per_user'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum Refresh Tokens Per User'),
      '#default_value' => $config->get('jwt_token_limit_per_user') ?? 10,
      '#min' => 0,
      '#step' => 1,
      '#description' => $this->t('Maximum number of active refresh tokens allowed per user. When this limit is reached, the oldest tokens will be automatically revoked. Set to 0 for unlimited.'),
      '#states' => [
        'visible' => [
          ':input[name="jwt_store_tokens"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['jwt']['secret_keys'] = [
      '#type' => 'details',
      '#title' => $this->t('Secret Keys'),
      '#description' => $this->t('Secret keys used for signing tokens. Leave empty to auto-generate secure keys.'),
      '#open' => FALSE,
    ];

    $form['jwt']['secret_keys']['jwt_secret'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Access Token Secret Key'),
      '#default_value' => $config->get('jwt_secret') ?? '',
      '#description' => $this->t('Secret key for signing access tokens. If left empty, a secure random key will be generated.'),
      '#attributes' => ['autocomplete' => 'off'],
    ];

    $form['jwt']['secret_keys']['jwt_refresh_secret'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Refresh Token Secret Key'),
      '#default_value' => $config->get('jwt_refresh_secret') ?? '',
      '#description' => $this->t('Secret key for signing refresh tokens. If left empty, a secure random key will be generated.'),
      '#attributes' => ['autocomplete' => 'off'],
    ];

    $form['jwt']['secret_keys']['generate_keys'] = [
      '#type' => 'button',
      '#value' => $this->t('Generate New Random Keys'),
      '#attributes' => [
        'onclick' => 'return false;',
        'class' => ['button--generate-keys'],
      ],
      '#attached' => [
        'library' => ['tvet_auth/generate_keys'],
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('database'),
      $container->get('logger.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'tvet_auth_admin_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config(static::SETTINGS);
    $old_access_secret = $config->get('jwt_secret');
    $old_refresh_secret = $config->get('jwt_refresh_secret');
    $new_access_secret = $form_state->getValue('jwt_secret');
    $new_refresh_secret = $form_state->getValue('jwt_refresh_secret');

    // Check if either secret has changed.
    $secrets_changed = ($old_access_secret !== $new_access_secret && !empty($new_access_secret))
                       || ($old_refresh_secret !== $new_refresh_secret && !empty($new_refresh_secret));

    // Save all settings.
    $config
      ->set('jwt_auth_enabled', $form_state->getValue('jwt_auth_enabled'))
      ->set('jwt_expiration', $form_state->getValue('jwt_expiration'))
      ->set('jwt_refresh_expiration', $form_state->getValue('jwt_refresh_expiration'))
      ->set('jwt_secret', $new_access_secret)
      ->set('jwt_refresh_secret', $new_refresh_secret)
      ->set('jwt_strict_validation', $form_state->getValue('jwt_strict_validation'))
      ->set('jwt_revoke_tokens_on_password_change', $form_state->getValue('jwt_revoke_tokens_on_password_change'))
      ->set('jwt_store_tokens', $form_state->getValue('jwt_store_tokens'))
      ->set('jwt_token_limit_per_user', $form_state->getValue('jwt_token_limit_per_user'))
      ->save();

    // If secrets changed, remove all tokens.
    if ($secrets_changed) {
      $this->removeAllTokens();
      $this->messenger()->addWarning($this->t('JWT secret keys were changed. All existing tokens have been removed for security reasons.'));
    }

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      static::SETTINGS,
    ];
  }

  /**
   * Remove all tokens from the database when secrets change.
   */
  protected function removeAllTokens() {
    try {
      // Delete all tokens directly from the database.
      $this->database->truncate('tvet_active_tokens')->execute();

      $this->logger->notice('All tokens removed due to JWT secret key changes.');

      return TRUE;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to remove tokens after secret change: @error', [
        '@error' => $e->getMessage(),
      ]);

      return FALSE;
    }
  }

}
