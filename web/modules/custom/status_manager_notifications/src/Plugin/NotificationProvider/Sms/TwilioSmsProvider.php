<?php

namespace Drupal\status_manager_notifications\Plugin\NotificationProvider\Sms;

use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Plugin\SmsProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a Twilio SMS notification provider.
 *
 * @NotificationProvider(
 *   id = "twilio_sms",
 *   label = @Translation("Twilio SMS Provider"),
 *   description = @Translation("Send SMS notifications using Twilio API."),
 *   type = "sms",
 *   weight = 0
 * )
 */
class TwilioSmsProvider extends SmsProviderBase {

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
      'account_sid' => '',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return parent::isConfigured() && !empty($this->configuration['account_sid']);
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

    return $this->sendViaTwilio($recipient, $message);
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    // Normalize recipient phone number.
    $recipient = $this->normalizePhoneNumber($recipient);

    // Truncate message if needed.
    $message = $this->truncateMessage($message);

    return $this->sendViaTwilio($recipient, $message);
  }

  /**
   * Sends an SMS via Twilio API.
   *
   * @param string $recipient
   *   The recipient phone number.
   * @param string $message
   *   The message to send.
   *
   * @return array
   *   Result array with 'success' and 'message' keys.
   */
  protected function sendViaTwilio($recipient, $message) {
    $account_sid = $this->configuration['account_sid'];
    $auth_token = $this->configuration['api_secret'];
    $from_number = $this->configuration['from_number'];

    if (empty($from_number)) {
      return [
        'success' => FALSE,
        'message' => $this->t('From phone number is not configured.'),
      ];
    }

    $url = sprintf('https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json', $account_sid);

    try {
      $response = $this->httpClient->request('POST', $url, [
        'auth' => [$account_sid, $auth_token],
        'form_params' => [
          'To' => $recipient,
          'From' => $from_number,
          'Body' => $message,
        ],
      ]);

      $data = json_decode($response->getBody()->getContents(), TRUE);

      if ($response->getStatusCode() === 201 && !empty($data['sid'])) {
        $this->log('info', 'Twilio SMS sent successfully to @recipient (SID: @sid)', [
          '@recipient' => $recipient,
          '@sid' => $data['sid'],
        ]);
        return [
          'success' => TRUE,
          'message' => $this->t('SMS sent successfully to @recipient', ['@recipient' => $recipient]),
        ];
      }
      else {
        $this->log('error', 'Twilio returned unexpected response: @response', ['@response' => json_encode($data)]);
        return [
          'success' => FALSE,
          'message' => $this->t('Failed to send SMS. Unexpected response from Twilio.'),
        ];
      }
    }
    catch (\Exception $e) {
      $this->log('error', 'Twilio API error: @error', ['@error' => $e->getMessage()]);

      // Try to parse Twilio error response.
      $error_message = $e->getMessage();
      if ($e->hasResponse()) {
        try {
          $error_data = json_decode($e->getResponse()->getBody()->getContents(), TRUE);
          if (!empty($error_data['message'])) {
            $error_message = $error_data['message'];
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

    $form['account_sid'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Account SID'),
      '#description' => $this->t('Your Twilio Account SID. You can find this in your Twilio console.'),
      '#default_value' => $this->configuration['account_sid'],
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

    // Override the API secret field to be Auth Token.
    $form['api_secret']['#title'] = $this->t('Auth Token');
    $form['api_secret']['#description'] = $this->t('Your Twilio Auth Token. Leave empty to keep existing value.');

    // Override from_number to be required.
    $form['from_number']['#required'] = TRUE;
    $form['from_number']['#description'] = $this->t('Your Twilio phone number (must be verified in Twilio).');
    $form['from_number']['#states']['required'] = [
      ':input[name="enabled"]' => ['checked' => TRUE],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['account_sid'] = $form_state->getValue('account_sid');
  }

  /**
   * {@inheritdoc}
   */
  public function getHelpText() {
    return $this->t('To use Twilio, you need to sign up for an account at <a href="@url" target="_blank">twilio.com</a>. You will need your Account SID, Auth Token, and a verified phone number to send SMS messages.', [
      '@url' => 'https://www.twilio.com',
    ]);
  }

}
