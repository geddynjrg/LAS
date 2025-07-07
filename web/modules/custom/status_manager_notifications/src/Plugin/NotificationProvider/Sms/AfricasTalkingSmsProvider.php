<?php

namespace Drupal\status_manager_notifications\Plugin\NotificationProvider\Sms;

use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Plugin\SmsProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides an Africa's Talking SMS notification provider.
 *
 * @NotificationProvider(
 *   id = "africastalking_sms",
 *   label = @Translation("Africa's Talking SMS Provider"),
 *   description = @Translation("Send SMS notifications using Africa's Talking API."),
 *   type = "sms",
 *   weight = 10
 * )
 */
class AfricasTalkingSmsProvider extends SmsProviderBase {

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);
    $instance->httpClient = $container->get('http_client');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return parent::defaultConfiguration() + [
      'username' => '',
      'sender_id' => '',
      'environment' => 'production',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return parent::isConfigured() &&
           !empty($this->configuration['username']) &&
           !empty($this->configuration['api_key']);
  }

  /**
   * {@inheritdoc}
   */
  protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []) {
    $recipient = $this->getRecipient($status_change, $options);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient phone number found.'),
      ];
    }

    // Get template service.
    $template_service = \Drupal::service('status_manager_notifications.template_manager');
    $template = $template_service->getTemplate('sms', $status_change, $options['template_id'] ?? NULL);

    if (!$template) {
      return [
        'success' => FALSE,
        'message' => $this->t('No SMS template found for this status change.'),
      ];
    }

    // Get token service.
    $token_service = \Drupal::service('status_manager_notifications.token_service');

    // Prepare token data.
    $token_data = [
      'status_change' => $status_change,
      'target_entity' => $status_change->getTargetEntity(),
      'user' => $status_change->getOwner(),
    ];

    if (!empty($options['additional_data'])) {
      $token_data = array_merge($token_data, $options['additional_data']);
    }

    // Replace tokens in template.
    $message = $token_service->replace($template['message'], $token_data);

    // Truncate message if needed.
    $message = $this->truncateMessage($message);

    return $this->sendViaAfricasTalking($recipient, $message);
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    // Normalize recipient phone number.
    $recipient = $this->normalizePhoneNumber($recipient);

    // Truncate message if needed.
    $message = $this->truncateMessage($message);

    return $this->sendViaAfricasTalking($recipient, $message);
  }

  /**
   * Sends an SMS via Africa's Talking API.
   *
   * @param string $recipient
   *   The recipient phone number.
   * @param string $message
   *   The message to send.
   *
   * @return array
   *   Result array with 'success' and 'message' keys.
   */
  protected function sendViaAfricasTalking($recipient, $message) {
    $username = $this->configuration['username'];
    $api_key = $this->configuration['api_key'];
    $sender_id = $this->configuration['sender_id'];
    $environment = $this->configuration['environment'];

    // Determine API endpoint based on environment.
    if ($environment === 'sandbox') {
      $url = 'https://api.sandbox.africastalking.com/version1/messaging';
    }
    else {
      $url = 'https://api.africastalking.com/version1/messaging';
    }

    $data = [
      'username' => $username,
      'to' => $recipient,
      'message' => $message,
    ];

    // Add sender ID if configured.
    if (!empty($sender_id)) {
      $data['from'] = $sender_id;
    }

    try {
      $response = $this->httpClient->request('POST', $url, [
        'headers' => [
          'apiKey' => $api_key,
          'Content-Type' => 'application/x-www-form-urlencoded',
          'Accept' => 'application/json',
        ],
        'form_params' => $data,
      ]);

      $result = json_decode($response->getBody()->getContents(), TRUE);

      if ($response->getStatusCode() === 201 && !empty($result['SMSMessageData']['Recipients'])) {
        $recipient_data = $result['SMSMessageData']['Recipients'][0];

        if ($recipient_data['status'] === 'Success') {
          $this->log('info', "Africa's Talking SMS sent successfully to @recipient (MessageId: @id)", [
            '@recipient' => $recipient,
            '@id' => $recipient_data['messageId'],
          ]);
          return [
            'success' => TRUE,
            'message' => $this->t('SMS sent successfully to @recipient', ['@recipient' => $recipient]),
          ];
        }
        else {
          $this->log('error', "Africa's Talking failed to send SMS: @status", ['@status' => $recipient_data['status']]);
          return [
            'success' => FALSE,
            'message' => $this->t('Failed to send SMS: @status', ['@status' => $recipient_data['status']]),
          ];
        }
      }
      else {
        $this->log('error', "Africa's Talking returned unexpected response: @response", ['@response' => json_encode($result)]);
        return [
          'success' => FALSE,
          'message' => $this->t("Failed to send SMS. Unexpected response from Africa's Talking."),
        ];
      }
    }
    catch (\Exception $e) {
      $this->log('error', "Africa's Talking API error: @error", ['@error' => $e->getMessage()]);

      // Try to parse error response.
      $error_message = $e->getMessage();
      if ($e->hasResponse()) {
        try {
          $error_data = json_decode($e->getResponse()->getBody()->getContents(), TRUE);
          if (!empty($error_data['SMSMessageData']['Message'])) {
            $error_message = $error_data['SMSMessageData']['Message'];
          }
        }
        catch (\Exception $parse_exception) {
          // Ignore parsing errors.
        }
      }

      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send SMS: @error', ['@error' => $error_message]),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);

    $form['username'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Username'),
      '#description' => $this->t("Your Africa's Talking username."),
      '#default_value' => $this->configuration['username'],
      '#required' => TRUE,
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
        'required' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['sender_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Sender ID'),
      '#description' => $this->t('Optional sender ID (shortcode or alphanumeric). Leave empty to use default.'),
      '#default_value' => $this->configuration['sender_id'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['environment'] = [
      '#type' => 'select',
      '#title' => $this->t('Environment'),
      '#description' => $this->t('Choose the API environment to use.'),
      '#options' => [
        'production' => $this->t('Production'),
        'sandbox' => $this->t('Sandbox (for testing)'),
      ],
      '#default_value' => $this->configuration['environment'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Remove from_number field as it's not used by Africa's Talking.
    unset($form['from_number']);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['username'] = $form_state->getValue('username');
    $this->configuration['sender_id'] = $form_state->getValue('sender_id');
    $this->configuration['environment'] = $form_state->getValue('environment');
    // Clear from_number as it's not used.
    $this->configuration['from_number'] = '';
  }

  /**
   * {@inheritdoc}
   */
  public function getHelpText() {
    return $this->t("To use Africa's Talking, you need to sign up for an account at <a href=\"@url\" target=\"_blank\">africastalking.com</a>. You will need your username and API key. For testing, you can use the sandbox environment.", [
      '@url' => 'https://www.africastalking.com',
    ]);
  }

  /**
   * {@inheritdoc}
   */
  protected function getDefaultCountryCode() {
    // Africa's Talking primarily serves African countries.
    // Default to Kenya, but this should be made configurable.
    return '+254';
  }

}
