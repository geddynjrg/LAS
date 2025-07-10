<?php

namespace Drupal\api_content\Plugin\ParagraphMapper;

use Drupal\paragraphs\ParagraphInterface;
use Drupal\rest_framework\Plugin\ParagraphMapperBase;
use Drupal\rest_framework\Plugin\ParagraphMapperInterface;

/**
 * Plugin implementation of the paragraph mapper for text blocks type.
 *
 * @ParagraphMapper(
 *     id="text_blocks",
 *     label=@Translation("Text Blocks Mapper"),
 *     paragraph_type="text_blocks"
 * )
 */
class TextBlocksMapper extends ParagraphMapperBase implements ParagraphMapperInterface {

  /**
   * {@inheritdoc}
   */
  public function map(ParagraphInterface $paragraph): array {
    $data = array_merge(
      ['block_type' => 'text_blocks'],
      $this->mapFields($paragraph, [
        'field_button',
      ])
    );

    // Handle multiple blocks.
    if ($paragraph->hasField('field_blocks')) {
      $blocks = [];

      foreach ($paragraph->get('field_blocks') as $block) {
        if ($block->entity) {
          $blocks[] = $this->mapParagraph($block->entity);
        }
      }
      $data['blocks'] = $blocks;
    }

    return $data;
  }

  /**
   * {@inheritdoc}
   */
  public function getOpenApiExample(): ?array {
    return [
      'block_type' => 'text_blocks',
      'blocks' => [
        [
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
        ],
        [
          'block_type' => 'text_block',
          'text' => [
            'value' => '<p><strong>Business Loans</strong></p><p>Grow your business with our tailored business loan solutions.</p>',
            'format' => 'full_html',
            'processed' => '<p><strong>Business Loans</strong></p><p>Grow your business with our tailored business loan solutions.</p>',
          ],
          'button' => [
            [
              'title' => 'Apply for Business Loan',
              'url' => 'https://example.com/business-loans',
              'options' => [],
              'is_external' => FALSE,
            ],
          ],
        ],
      ],
    ];
  }

}
