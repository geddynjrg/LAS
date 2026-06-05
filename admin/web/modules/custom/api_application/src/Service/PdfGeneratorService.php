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

    // Reuse cached PDF only when it is newer than the latest application save.
    if (file_exists($file_path) && filemtime($file_path) >= $application->getChangedTime()) {
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
    // Reuse the same preprocessing logic as the admin application view.
    $variables = [
      'elements' => [
        '#application' => $application,
      ],
    ];
    template_preprocess_application($variables);

    $build = [
      '#theme' => 'application_pdf',
      '#application' => $variables['application'],
      '#entity' => $application,
      '#confirmation_status_labels' => $variables['confirmation_status_labels'] ?? [],
      '#site_name' => $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund',
    ];

    return (string) $this->renderer->renderPlain($build);
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
