<?php

namespace Drupal\api_content\Plugin\ParagraphMapper;

use Drupal\paragraphs\ParagraphInterface;
use Drupal\rest_framework\Plugin\ParagraphMapperBase;
use Drupal\rest_framework\Plugin\ParagraphMapperInterface;

/**
 * Plugin implementation of the paragraph mapper for text block type.
 *
 * @ParagraphMapper(
 *     id="text_block",
 *     label=@Translation("Text Block Mapper"),
 *     paragraph_type="text_block"
 * )
 */
class TextBlockMapper extends ParagraphMapperBase implements ParagraphMapperInterface {

  /**
   * {@inheritdoc}
   */
  public function map(ParagraphInterface $paragraph): array {
    return array_merge(
      ['block_type' => 'text_block'],
      $this->mapFields($paragraph, [
        'field_text',
        'field_button',
      ])
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getOpenApiExample(): ?array {
    return [
      'block_type' => 'text_block',
      'text' => [
        'value' => '<p><strong>Personal Loans</strong></p><p>Flexible personal loans for any purpose with competitive interest rates.</p>',
        'format' => 'full_html',
        'processed' => '<p><strong>Personal Loans</strong></p><p>Flexible personal loans for any purpose with competitive interest rates.</p>',
      ],
      'button' => [
        [
          'title' => 'Learn More',
          'url' => 'https://example.com/personal-loans',
          'options' => [],
          'is_external' => FALSE,
        ],
      ],
    ];
  }

}
