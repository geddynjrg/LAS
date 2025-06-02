/**
 * @file
 * JavaScript behaviors for the loan application form.
 */

(function ($, Drupal, drupalSettings) {
  "use strict";

  /**
   * Behavior for conditional field visibility.
   */
  Drupal.behaviors.apiApplicationForm = {
    attach: function (context, settings) {
      // Handle table banking fields visibility
      const $keyActivities = $(
        '[name="key_activities[]"], [name="key_activities[value][]"]',
        context
      );

      if ($keyActivities.length) {
        const toggleTableBankingFields = function () {
          const isTableBankingSelected =
            $keyActivities.filter(":checked").filter(function () {
              return $(this).val() === "table_banking";
            }).length > 0;

          const tableBankingFields = [
            ".field--name-table-banking-duration",
            ".field--name-monthly-share-contribution",
            ".field--name-total-amount-loaned",
            ".field--name-total-revolving-fund",
          ];

          tableBankingFields.forEach(function (field) {
            const $field = $(field, context);
            if (isTableBankingSelected) {
              $field.show();
              $field.find("input, select, textarea").prop("required", true);
            } else {
              $field.hide();
              $field.find("input, select, textarea").prop("required", false);
            }
          });
        };

        $keyActivities.on("change", toggleTableBankingFields);
        toggleTableBankingFields();
      }

      // Handle value chain field visibility
      const toggleValueChainField = function () {
        const isValueChainSelected =
          $keyActivities.filter(":checked").filter(function () {
            return $(this).val() === "value_chain";
          }).length > 0;

        const $valueChainField = $(".field--name-value-chain", context);
        if (isValueChainSelected) {
          $valueChainField.show();
          $valueChainField.find("input, select").prop("required", true);
        } else {
          $valueChainField.hide();
          $valueChainField.find("input, select").prop("required", false);
        }
      };

      if ($keyActivities.length) {
        $keyActivities.on("change", toggleValueChainField);
        toggleValueChainField();
      }

      // Handle other activities field visibility
      const toggleOtherField = function () {
        const isOtherSelected =
          $keyActivities.filter(":checked").filter(function () {
            return $(this).val() === "other";
          }).length > 0;

        const $otherField = $(".field--name-other-activities", context);
        if (isOtherSelected) {
          $otherField.show();
          $otherField.find("input").prop("required", true);
        } else {
          $otherField.hide();
          $otherField.find("input").prop("required", false);
        }
      };

      if ($keyActivities.length) {
        $keyActivities.on("change", toggleOtherField);
        toggleOtherField();
      }

      // Handle PWD fields visibility
      $('[name="person_with_disability"]', context)
        .once("pwd-toggle")
        .each(function () {
          const $checkbox = $(this);
          const togglePwdFields = function () {
            const isChecked = $checkbox.is(":checked");
            const pwdFields = [
              ".field--name-certificate-disability",
              ".field--name-pwd-number",
            ];

            pwdFields.forEach(function (field) {
              const $field = $(field).closest(".form-item");
              if (isChecked) {
                $field.show();
                $field.find("input, select").prop("required", true);
              } else {
                $field.hide();
                $field.find("input, select").prop("required", false);
              }
            });
          };

          $checkbox.on("change", togglePwdFields);
          togglePwdFields();
        });
    },
  };

  /**
   * Behavior for multi-step form navigation.
   */
  Drupal.behaviors.apiApplicationMultiStep = {
    attach: function (context, settings) {
      // Add progress indicator
      const $form = $(".application-form-multistep", context).once(
        "multistep-progress"
      );
      if ($form.length) {
        const currentStep = $form.data("step") || 1;
        const $progress = $('<ul class="application-form-progress"></ul>');

        const steps = [
          "Group Data",
          "Group Members",
          "Loan Conditions",
          "Proposed Business",
        ];

        steps.forEach(function (step, index) {
          const stepNumber = index + 1;
          const $li = $("<li></li>");

          if (stepNumber < currentStep) {
            $li.addClass("completed");
          } else if (stepNumber === currentStep) {
            $li.addClass("active");
          }

          $li.html(
            '<span class="step-number">' + stepNumber + "</span><br>" + step
          );
          $progress.append($li);
        });

        $form.prepend($progress);
      }
    },
  };
})(jQuery, Drupal, drupalSettings);
