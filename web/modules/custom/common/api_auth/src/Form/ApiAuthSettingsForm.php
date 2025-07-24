<?php

namespace Drupal\api_auth\Form;

use Drupal\Core\Database\Connection;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure API Auth settings for this site.
 */
class ApiAuthSettingsForm extends ConfigFormBase {

  /**
   * Config settings.
   *
   * @var string
   */
  public const SETTINGS = 'api_auth.settings';

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
   * Constructs a new ApiAuthSettingsForm.
   *
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   */
  public function __construct(Connection $database, LoggerChannelFactoryInterface $logger_factory) {
    $this->database = $database;
    $this->logger = $logger_factory->get('api_auth');
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
        'library' => ['api_auth/generate_keys'],
      ],
    ];

    // OTP Authentication Settings.
    $form['otp'] = [
      '#type' => 'details',
      '#title' => $this->t('OTP Authentication Settings'),
      '#open' => FALSE,
    ];

    $form['otp']['otp_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable OTP Authentication'),
      '#default_value' => $config->get('otp.enabled') ?? TRUE,
      '#description' => $this->t('Enable phone number + OTP code authentication.'),
    ];

    $form['otp']['otp_length'] = [
      '#type' => 'number',
      '#title' => $this->t('OTP Code Length'),
      '#default_value' => $config->get('otp.length') ?? 6,
      '#min' => 4,
      '#max' => 8,
      '#description' => $this->t('Length of the OTP code (4-8 digits).'),
    ];

    $form['otp']['otp_expiry'] = [
      '#type' => 'number',
      '#title' => $this->t('OTP Expiration Time (seconds)'),
      '#default_value' => $config->get('otp.expiry') ?? 300,
      '#min' => 60,
      '#max' => 1800,
      '#description' => $this->t('How long OTP codes remain valid (60-1800 seconds).'),
    ];

    $form['otp']['otp_max_attempts'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum Verification Attempts'),
      '#default_value' => $config->get('otp.max_attempts') ?? 3,
      '#min' => 1,
      '#max' => 10,
      '#description' => $this->t('Maximum number of verification attempts per OTP.'),
    ];

    $form['otp']['otp_rate_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('Phone Rate Limit (requests per hour)'),
      '#default_value' => $config->get('otp.rate_limit') ?? 5,
      '#min' => 1,
      '#max' => 60,
      '#description' => $this->t('Maximum OTP requests per phone number per hour.'),
    ];

    $form['otp']['otp_ip_rate_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('IP Rate Limit (requests per hour)'),
      '#default_value' => $config->get('otp.ip_rate_limit') ?? 20,
      '#min' => 1,
      '#max' => 200,
      '#description' => $this->t('Maximum OTP requests per IP address per hour.'),
    ];

    $form['otp']['otp_message_template'] = [
      '#type' => 'textfield',
      '#title' => $this->t('SMS Message Template'),
      '#default_value' => $config->get('otp.message_template') ?? 'Your login code is: [code]',
      '#description' => $this->t('SMS message template. Use [code] as placeholder for the OTP code.'),
      '#required' => TRUE,
    ];

    $form['otp']['otp_user_phone_field'] = [
      '#type' => 'textfield',
      '#title' => $this->t('User Phone Number Field'),
      '#default_value' => $config->get('otp.user_phone_field') ?? 'field_phone_number',
      '#description' => $this->t('Machine name of the phone number field on user entities.'),
      '#required' => TRUE,
    ];

    $form['otp']['otp_username_prefix'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Username Prefix for New Users'),
      '#default_value' => $config->get('otp.username_prefix') ?? 'user_',
      '#description' => $this->t('Prefix for auto-generated usernames (e.g., user_254712345678).'),
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
    return 'api_auth_admin_settings';
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
      ->set('otp.enabled', $form_state->getValue('otp_enabled'))
      ->set('otp.length', $form_state->getValue('otp_length'))
      ->set('otp.expiry', $form_state->getValue('otp_expiry'))
      ->set('otp.max_attempts', $form_state->getValue('otp_max_attempts'))
      ->set('otp.rate_limit', $form_state->getValue('otp_rate_limit'))
      ->set('otp.ip_rate_limit', $form_state->getValue('otp_ip_rate_limit'))
      ->set('otp.message_template', $form_state->getValue('otp_message_template'))
      ->set('otp.user_phone_field', $form_state->getValue('otp_user_phone_field'))
      ->set('otp.username_prefix', $form_state->getValue('otp_username_prefix'))
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
      $this->database->truncate('api_active_tokens')->execute();

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
