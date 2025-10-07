/**
 * @file
 * Application filters JavaScript behaviors.
 */

(function ($, Drupal) {
  "use strict";

  /**
   * Behavior for application filters.
   */
  Drupal.behaviors.applicationFilters = {
    attach: function (context, settings) {
      const elements = once(
        "application-filters",
        "form.application-filters-form",
        context
      );

      elements.forEach(function (element) {
        var $form = $(element);
        var $searchField = $form.find('input[name="search"]');
        var $statusField = $form.find('select[name="status"]');
        var $dateFrom = $form.find('input[name="date_from"]');
        var $dateTo = $form.find('input[name="date_to"]');
        var $clearButton = $form.find(".filter-clear");

        // Check if filters are active on page load
        checkActiveFilters();

        // Function to submit form with clean URL
        function submitFormClean() {
          var params = {};

          // Get only filter values
          if ($searchField.val()) {
            params.search = $searchField.val();
          }
          if ($statusField.val()) {
            params.status = $statusField.val();
          }
          if ($dateFrom.val()) {
            params.date_from = $dateFrom.val();
          }
          if ($dateTo.val()) {
            params.date_to = $dateTo.val();
          }

          // Build clean URL
          var currentPath = window.location.pathname;
          var queryString =
            Object.keys(params).length > 0
              ? "?" +
                Object.keys(params)
                  .map((key) => key + "=" + encodeURIComponent(params[key]))
                  .join("&")
              : "";

          // Navigate to clean URL
          window.location.href = currentPath + queryString;
        }

        // Auto-submit on status change
        $statusField.on("change", function () {
          submitFormClean();
        });

        // Auto-submit on date change
        $dateFrom.add($dateTo).on("change", function () {
          // Validate date range
          var fromDate = $dateFrom.val();
          var toDate = $dateTo.val();

          if (fromDate && toDate && fromDate > toDate) {
            // Reset the field that was just changed
            $(this).val("");

            // Show validation message using Drupal's message system
            var $messageArea = $form.find(".filter-messages");
            if (!$messageArea.length) {
              $messageArea = $('<div class="filter-messages messages messages--error"></div>');
              $form.prepend($messageArea);
            }

            $messageArea
              .html(Drupal.t('The "From" date cannot be later than the "To" date.'))
              .show();

            // Auto-hide message after 5 seconds
            setTimeout(function () {
              $messageArea.fadeOut();
            }, 5000);

            return false;
          }

          // Clear any error messages
          $form.find(".filter-messages").hide();

          submitFormClean();
        });

        // Check if any filters are active
        function checkActiveFilters() {
          var hasActiveFilters = false;

          if (
            $searchField.val() ||
            $statusField.val() ||
            $dateFrom.val() ||
            $dateTo.val()
          ) {
            hasActiveFilters = true;
          }

          if (hasActiveFilters) {
            $form.addClass("has-active-filters");
          } else {
            $form.removeClass("has-active-filters");
          }
        }

        // Update active filters indicator on change
        $form.find("input, select").on("change keyup", function () {
          checkActiveFilters();
        });

        // Clear button enhancement
        $clearButton.on("click", function (e) {
          // Always prevent default for clear link
          e.preventDefault();

          // Clear all form fields
          $searchField.val("");
          $statusField.val("");
          $dateFrom.val("");
          $dateTo.val("");

          // Navigate to page without filters
          window.location.href = window.location.pathname;
        });

        // Search on Enter key or when leaving field
        $searchField.on("keypress", function (e) {
          if (e.which === 13) {
            // Enter key
            submitFormClean();
          }
        });

        $searchField.on("blur", function () {
          // Only submit if there's a change from the initial value
          var currentValue = $(this).val();
          var initialValue = $(this).data("initial-value") || "";
          if (currentValue !== initialValue) {
            submitFormClean();
            $(this).data("initial-value", currentValue);
          }
        });

        // Store initial value
        $searchField.data("initial-value", $searchField.val());

        // Override form submission to use clean URL
        $form.on("submit", function (e) {
          e.preventDefault();
          submitFormClean();
        });
      });
    },
  };

  /**
   * Add loading state when navigating.
   */
  Drupal.behaviors.applicationFiltersLoading = {
    attach: function (context) {
      const elements = once(
        "application-filters-loading",
        "form.application-filters-form",
        context
      );

      elements.forEach(function (element) {
        var $form = $(element);

        // Add loading state when any field changes (except search input typing)
        $form.find("select").on("change", function () {
          $form.addClass("is-loading");
          var $submitButton = $form.find('input[type="submit"]');
          $submitButton.prop("disabled", true);
          $submitButton.val(Drupal.t("Applying..."));
        });

        // Loading state for date fields only on change
        $form.find('input[type="date"]').on("change", function () {
          $form.addClass("is-loading");
          var $submitButton = $form.find('input[type="submit"]');
          $submitButton.prop("disabled", true);
          $submitButton.val(Drupal.t("Applying..."));
        });

        // Loading state for search field only on Enter or blur (when it actually submits)
        $form.find('input[type="text"]').on("keypress blur", function (e) {
          if (e.type === "keypress" && e.which !== 13) {
            return;
          }
          if (e.type === "blur") {
            var currentValue = $(this).val();
            var initialValue = $(this).data("initial-value") || "";
            if (currentValue === initialValue) {
              return;
            }
          }
          $form.addClass("is-loading");
          var $submitButton = $form.find('input[type="submit"]');
          $submitButton.prop("disabled", true);
          $submitButton.val(Drupal.t("Applying..."));
        });
      });
    },
  };
})(jQuery, Drupal);
