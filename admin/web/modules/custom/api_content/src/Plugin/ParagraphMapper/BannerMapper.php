<?php

namespace Drupal\api_content\Plugin\ParagraphMapper;

use Drupal\paragraphs\ParagraphInterface;
use Drupal\rest_framework\Plugin\ParagraphMapperBase;
use Drupal\rest_framework\Plugin\ParagraphMapperInterface;

/**
 * Plugin implementation of the paragraph mapper for banner type.
 *
 * @ParagraphMapper(
 *     id="banner",
 *     label=@Translation("Banner Mapper"),
 *     paragraph_type="banner"
 * )
 */
class BannerMapper extends ParagraphMapperBase implements ParagraphMapperInterface {

  /**
   * {@inheritdoc}
   */
  public function map(ParagraphInterface $paragraph): array {
    return array_merge(
      ['block_type' => 'banner'],
      $this->mapFields($paragraph, [
        'field_title',
        'field_text',
        'field_help_text',
        'field_button',
      ])
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getOpenApiExample(): ?array {
    return [
      'block_type' => 'banner',
      'title' => 'Quick Loan Approval',
      'text' => [
        'value' => '<p>Apply for a loan in minutes and get approved within 24 hours</p>',
        'format' => 'full_html',
        'processed' => '<p>Apply for a loan in minutes and get approved within 24 hours</p>',
      ],
      'button' => [
        [
          'title' => 'Apply Now',
          'url' => 'https://example.com/apply',
          'options' => [],
          'is_external' => FALSE,
        ],
      ],
    ];
  }

}
