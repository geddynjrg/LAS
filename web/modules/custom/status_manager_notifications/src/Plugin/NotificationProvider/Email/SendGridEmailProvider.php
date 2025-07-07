<?php

namespace Drupal\status_manager_notifications\Plugin\NotificationProvider\Email;

use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Plugin\EmailProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a SendGrid email notification provider.
 *
 * @NotificationProvider(
 *   id = "sendgrid_email",
 *   label = @Translation("SendGrid Email Provider"),
 *   description = @Translation("Send email notifications using SendGrid API."),
 *   type = "email",
 *   weight = 10
 * )
 */
class SendGridEmailProvider extends EmailProviderBase {

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
      'api_key' => '',
      'sandbox_mode' => FALSE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return !empty($this->configuration['enabled']) && !empty($this->configuration['api_key']);
  }

  /**
   * {@inheritdoc}
   */
  protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []) {
    $recipient = $this->getRecipient($status_change, $options);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient email address found.'),
      ];
    }

    // Get template service.
    $template_service = \Drupal::service('status_manager_notifications.template_manager');
    $template = $template_service->getTemplate('email', $status_change, $options['template_id'] ?? NULL);

    if (!$template) {
      return [
        'success' => FALSE,
        'message' => $this->t('No email template found for this status change.'),
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
    $subject = $token_service->replace($template['subject'], $token_data);
    $body = $token_service->replace($template['body'], $token_data);

    return $this->sendViaSendGrid($recipient, $subject, $body);
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    $subject = $options['subject'] ?? $this->t('Notification from @site', [
      '@site' => $this->configFactory->get('system.site')->get('name'),
    ]);

    return $this->sendViaSendGrid($recipient, $subject, $message);
  }

  /**
   * Sends an email via SendGrid API.
   *
   * @param string $recipient
   *   The recipient email address.
   * @param string $subject
   *   The email subject.
   * @param string $body
   *   The email body.
   *
   * @return array
   *   Result array with 'success' and 'message' keys.
   */
  protected function sendViaSendGrid($recipient, $subject, $body) {
    $api_key = $this->configuration['api_key'];
    $from_email = $this->getFromEmail();
    $from_name = $this->getFromName();

    $data = [
      'personalizations' => [
        [
          'to' => [
            ['email' => $recipient],
          ],
        ],
      ],
      'from' => [
        'email' => $from_email,
        'name' => $from_name,
      ],
      'subject' => $subject,
      'content' => [
        [
          'type' => $this->configuration['use_html'] ? 'text/html' : 'text/plain',
          'value' => $body,
        ],
      ],
    ];

    // Add reply-to if configured.
    if (!empty($this->configuration['reply_to'])) {
      $data['reply_to'] = ['email' => $this->configuration['reply_to']];
    }

    // Enable sandbox mode if configured.
    if (!empty($this->configuration['sandbox_mode'])) {
      $data['mail_settings'] = ['sandbox_mode' => ['enable' => TRUE]];
    }

    try {
      $response = $this->httpClient->request('POST', 'https://api.sendgrid.com/v3/mail/send', [
        'headers' => [
          'Authorization' => 'Bearer ' . $api_key,
          'Content-Type' => 'application/json',
        ],
        'json' => $data,
      ]);

      if ($response->getStatusCode() === 202) {
        $this->log('info', 'SendGrid email sent successfully to @recipient', ['@recipient' => $recipient]);
        return [
          'success' => TRUE,
          'message' => $this->t('Email sent successfully to @recipient', ['@recipient' => $recipient]),
        ];
      }
      else {
        $this->log('error', 'SendGrid returned unexpected status code: @code', ['@code' => $response->getStatusCode()]);
        return [
          'success' => FALSE,
          'message' => $this->t('Failed to send email. SendGrid returned status code: @code', ['@code' => $response->getStatusCode()]),
        ];
      }
    }
    catch (\Exception $e) {
      $this->log('error', 'SendGrid API error: @error', ['@error' => $e->getMessage()]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email: @error', ['@error' => $e->getMessage()]),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('SendGrid API Key'),
      '#description' => $this->t('Your SendGrid API key. You can find this in your SendGrid account settings.'),
      '#default_value' => $this->configuration['api_key'],
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

    $form['sandbox_mode'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable sandbox mode'),
      '#description' => $this->t('When enabled, SendGrid will validate the request but not send the email.'),
      '#default_value' => $this->configuration['sandbox_mode'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['api_key'] = $form_state->getValue('api_key');
    $this->configuration['sandbox_mode'] = $form_state->getValue('sandbox_mode');
  }

  /**
   * {@inheritdoc}
   */
  public function getHelpText() {
    return $this->t('To use SendGrid, you need to sign up for an account at <a href="@url" target="_blank">sendgrid.com</a> and generate an API key with Mail Send permissions.', [
      '@url' => 'https://sendgrid.com',
    ]);
  }

}
