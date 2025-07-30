<?php

namespace Drupal\api_application\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\api_application\Entity\ApplicationInterface;
use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Service for generating PDFs of loan applications.
 */
class PdfGeneratorService {

  use StringTranslationTrait;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The renderer service.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The date formatter service.
   *
   * @var \Drupal\Core\Datetime\DateFormatterInterface
   */
  protected $dateFormatter;

  /**
   * Constructs a new PdfGeneratorService.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer service.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    ConfigFactoryInterface $config_factory,
    RendererInterface $renderer,
    FileSystemInterface $file_system,
    LoggerChannelFactoryInterface $logger_factory,
    DateFormatterInterface $date_formatter,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->configFactory = $config_factory;
    $this->renderer = $renderer;
    $this->fileSystem = $file_system;
    $this->logger = $logger_factory->get('api_application');
    $this->dateFormatter = $date_formatter;
  }

  /**
   * Generates a PDF for a loan application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return string
   *   The path to the generated PDF file.
   *
   * @throws \Exception
   *   If there's an error generating the PDF.
   */
  public function generateApplicationPdf(ApplicationInterface $application) {
    // Ensure PDF directory exists.
    $pdf_directory = 'temporary://applications/pdfs/';
    $this->fileSystem->prepareDirectory($pdf_directory, FileSystemInterface::CREATE_DIRECTORY);

    // Generate the PDF file name.
    $file_name = 'application-' . $application->getApplicationId() . '.pdf';
    $file_path = $pdf_directory . $file_name;

    // Check if the file already exists and is recent (less than 1 hour old).
    if (file_exists($file_path) && (time() - filemtime($file_path) < 3600)) {
      return $file_path;
    }

    // Generate a HTML version of the application.
    $html = $this->generateApplicationHtml($application);

    // Generate PDF from HTML.
    $this->generatePdf($html, $file_path);

    return $file_path;
  }

  /**
   * Gets the PDF file URI for an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return string
   *   The file URI for the PDF.
   */
  public function getPdfUri(ApplicationInterface $application) {
    $pdf_directory = 'temporary://applications/pdfs/';
    $file_name = 'application-' . $application->getApplicationId() . '.pdf';
    return $pdf_directory . $file_name;
  }

  /**
   * Checks if a PDF exists for the given application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return bool
   *   TRUE if the PDF exists, FALSE otherwise.
   */
  public function pdfExists(ApplicationInterface $application) {
    $file_path = $this->getPdfUri($application);
    return file_exists($file_path);
  }

  /**
   * Generates HTML content for the application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return string
   *   The HTML representation of the application.
   */
  protected function generateApplicationHtml(ApplicationInterface $application) {
    // Normalize application data using the same preprocessing logic.
    $normalized_data = $this->normalizeApplicationData($application);

    // Prepare the render array for the PDF template.
    $build = [
      '#theme' => 'application_pdf',
      '#application' => $normalized_data,
      '#entity' => $application,
      '#site_name' => $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund',
    ];

    // Render the application to HTML.
    $html = $this->renderer->renderPlain($build);

    return $html;
  }

  /**
   * Normalizes application data for template rendering.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return array
   *   The normalized application data.
   */
  protected function normalizeApplicationData(ApplicationInterface $application) {
    // This mirrors the logic from template_preprocess_application()
    $variables = [];

    // Basic info.
    $variables['id'] = $application->id();
    $variables['application_id'] = $application->getApplicationId() ?: 'APP-' . $application->id();
    $variables['status'] = $application->get('status')->value ?: 'draft';
    $variables['created'] = $application->getCreatedTime();
    $variables['changed'] = $application->getChangedTime();

    // Group information.
    $variables['group_name'] = $application->get('group_name')->value ?: '';
    $variables['group_registration_number'] = $application->get('group_registration_number')->value ?: '';
    $variables['date_registered'] = $application->get('date_registered')->value ?: '';
    $variables['meeting_point'] = $application->get('meeting_point')->value ?: '';
    $variables['nearest_landmark'] = $application->get('nearest_landmark')->value ?: '';
    $variables['nature_of_group'] = $application->get('nature_of_group')->value ?: '';

    // Location.
    $variables['ward'] = $application->get('ward')->value ?: '';
    $variables['county'] = '';
    $variables['constituency'] = '';

    // Handle county.
    if (!$application->get('county')->isEmpty()) {
      $county = $application->get('county')->entity;
      if ($county) {
        $variables['county'] = $county->getName();
      }
    }

    // Handle constituency.
    if (!$application->get('constituency')->isEmpty()) {
      $constituency = $application->get('constituency')->entity;
      if ($constituency) {
        $variables['constituency'] = $constituency->getName();
      }
    }

    // Table banking fields.
    $variables['table_banking_duration'] = $application->get('table_banking_duration')->value ?: '';
    $variables['monthly_share_contribution'] = $application->get('monthly_share_contribution')->value ?: 0;
    $variables['total_amount_loaned'] = $application->get('total_amount_loaned')->value ?: 0;
    $variables['total_revolving_fund'] = $application->get('total_revolving_fund')->value ?: 0;

    // Loan details.
    $variables['loan_amount'] = $application->get('loan_amount')->value ?: 0;
    $variables['proposed_repayment_period'] = $application->get('proposed_repayment_period')->value ?: 0;

    // Bank details.
    $variables['bank_name'] = $application->get('bank_name')->entity ? $application->get('bank_name')->entity->getName() : '';
    $variables['bank_branch'] = $application->get('bank_branch')->value ?: '';
    $variables['bank_account_number'] = $application->get('bank_account_number')->value ?: '';

    // Business details.
    $variables['nature_of_business'] = $application->get('nature_of_business')->value ?: '';
    $variables['years_in_operation'] = $application->get('years_in_operation')->value ?: 0;
    $variables['average_income'] = $application->get('average_income')->value ?: 0;

    // Other activities.
    $variables['other_activities'] = $application->get('other_activities')->value ?: '';

    // Rejection details.
    $variables['rejection_reason'] = $application->get('rejection_reason')->value ?: '';
    $variables['rejection_message'] = $application->get('rejection_message')->value ?: '';

    // Handle arrays/collections.
    $variables['group_background'] = [];
    $variables['key_activities'] = [];
    $variables['value_chain'] = [];
    $variables['business_type'] = [];
    $variables['group_members'] = [];
    $variables['expenses'] = [];

    // Group background.
    if (!$application->get('group_background')->isEmpty()) {
      foreach ($application->get('group_background') as $item) {
        if ($item->entity) {
          $variables['group_background'][] = $item->entity->getName();
        }
      }
    }

    // Key activities.
    if (!$application->get('key_activities')->isEmpty()) {
      foreach ($application->get('key_activities') as $item) {
        $variables['key_activities'][] = $item->value;
      }
    }

    // Value chain.
    if (!$application->get('value_chain')->isEmpty()) {
      foreach ($application->get('value_chain') as $item) {
        if ($item->entity) {
          $variables['value_chain'][] = $item->entity->getName();
        }
      }
    }

    // Business type.
    if (!$application->get('business_type')->isEmpty()) {
      foreach ($application->get('business_type') as $item) {
        if ($item->entity) {
          $variables['business_type'][] = $item->entity->getName();
        }
      }
    }

    // Group members.
    $variables['group_members_count'] = 0;
    $group_members = $application->get('group_members');
    if ($group_members && !$group_members->isEmpty()) {
      $variables['group_members_count'] = count($group_members);

      foreach ($group_members as $member_item) {
        if ($member_item->entity) {
          $member = $member_item->entity;
          $position = $member->get('position')->entity;
          $variables['group_members'][] = [
            'id' => $member->id(),
            'name' => $member->getName(),
            'id_number' => $member->getIdNumber(),
            'gender' => $member->getGender(),
            'phone_number' => $member->getPhoneNumber(),
            'position' => $position ? $position->getName() : '',
            'is_pwd' => $member->isPersonWithDisability(),
            'pwd_number' => $member->getPwdNumber(),
            'confirmation_status' => $member->getConfirmationStatus(),
          ];
        }
      }
    }

    // Handle expenses.
    $variables['total_expenses'] = 0;
    if (!$application->get('expenses')->isEmpty()) {
      foreach ($application->get('expenses') as $item) {
        $itemValue = $item->getValue();
        if (is_array($itemValue['value']) && !empty($itemValue['value'])) {
          foreach ($itemValue['value'] as $key => $value) {
            $variables['expenses'][] = [
              'key' => $key,
              'value' => $value,
            ];
            $variables['total_expenses'] += $value;
          }
        }
      }
    }

    // Balance between income and expenses.
    $variables['balance'] = $variables['average_income'] - $variables['total_expenses'];

    // Purpose of loan.
    $variables['purpose_of_loan'] = '';
    if (!$application->get('purpose_of_loan')->isEmpty()) {
      $purpose = $application->get('purpose_of_loan')->entity;
      if ($purpose) {
        $variables['purpose_of_loan'] = $purpose->getName();
      }
    }

    // Loan type.
    $variables['loan_type'] = ['name' => '', 'description' => ''];
    if (!$application->get('loan_type')->isEmpty()) {
      $loan_type = $application->get('loan_type')->entity;
      if ($loan_type) {
        $variables['loan_type'] = [
          'name' => $loan_type->getName(),
          'description' => $loan_type->getDescription(),
        ];
      }
    }

    // Format dates.
    if ($variables['date_registered']) {
      $variables['date_registered_formatted'] = $this->dateFormatter->format(
        strtotime($variables['date_registered']),
        'custom',
        'Y-m-d'
      );
    }

    // Format created date.
    $variables['created_formatted'] = $this->dateFormatter->format(
      $variables['created'],
      'long'
    );

    // Get status label.
    $status_options = [
      'draft' => $this->t('Draft'),
      'submitted' => $this->t('Submitted'),
      'under_review' => $this->t('Under Review'),
      'approved' => $this->t('Approved'),
      'rejected' => $this->t('Rejected'),
      'disbursed' => $this->t('Disbursed'),
      'closed' => $this->t('Closed'),
    ];
    $variables['status_label'] = $status_options[$variables['status']] ?? $variables['status'];

    // Get rejection reason label if rejected.
    if ($variables['status'] === 'rejected' && $variables['rejection_reason']) {
      $rejection_reasons = [
        'incomplete_information' => $this->t('Incomplete or incorrect information'),
        'missing_documents' => $this->t('Required documents missing or invalid'),
        'eligibility_criteria' => $this->t('Does not meet eligibility criteria'),
        'duplicate_application' => $this->t('Duplicate application'),
        'insufficient_collateral' => $this->t('Insufficient collateral'),
        'poor_credit_history' => $this->t('Poor credit history'),
        'other' => $this->t('Other reason'),
      ];
      $variables['rejection_reason_label'] = $rejection_reasons[$variables['rejection_reason']] ?? $variables['rejection_reason'];
    }

    return $variables;
  }

  /**
   * Generates a PDF file from HTML content.
   *
   * @param string $html
   *   The HTML content.
   * @param string $file_path
   *   The path to save the PDF file.
   *
   * @throws \Exception
   *   If there's an error generating the PDF.
   */
  protected function generatePdf($html, $file_path) {
    try {
      // Log that we're starting PDF generation.
      $this->logger->info('Starting PDF generation to path: @path', [
        '@path' => $file_path,
      ]);

      // Configure Dompdf options.
      $options = new Options();
      $options->set('isHtml5ParserEnabled', TRUE);
      $options->set('isPhpEnabled', FALSE);
      $options->set('isRemoteEnabled', FALSE);
      $options->set('defaultFont', 'DejaVu Sans');
      $options->set('dpi', 96);

      // Initialize Dompdf.
      $dompdf = new Dompdf($options);
      $dompdf->setPaper('A4', 'portrait');

      // Load HTML content.
      $dompdf->loadHtml($html);

      // Render the PDF.
      $dompdf->render();

      // Get the PDF output.
      $output = $dompdf->output();

      // Check if the output is valid.
      if (empty($output) || strlen($output) < 100) {
        throw new \Exception('Generated PDF is empty or too small');
      }

      // Save the PDF to file.
      if (file_put_contents($file_path, $output) === FALSE) {
        throw new \Exception('Failed to save PDF to file: ' . $file_path);
      }

      $this->logger->info('PDF generated successfully: @path', [
        '@path' => $file_path,
      ]);

    }
    catch (\Exception $e) {
      $this->logger->error('PDF generation failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

}
