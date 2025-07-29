/**
 * @file
 * JavaScript for Status Manager status history functionality.
 */

(function ($, Drupal, once) {
  "use strict";

  /**
   * Behavior for status history enhancements.
   */
  Drupal.behaviors.statusManagerHistory = {
    attach: function (context, settings) {
      // Initialize status history table enhancements
      once("status-history-table", ".status-history-table", context).forEach(
        function (table) {
          StatusManager.initializeTable(table);
        }
      );

      // Initialize entity type filter
      once("entity-type-filter", ".entity-type-filter select", context).forEach(
        function (select) {
          StatusManager.initializeEntityTypeFilter(select);
        }
      );

      // Initialize status change form enhancements
      once("status-change-form", ".status-change-form", context).forEach(
        function (form) {
          StatusManager.initializeForm(form);
        }
      );

      // Initialize tracking mode explanations
      once(
        "tracking-mode-radios",
        'input[name="general[tracking_mode]"]',
        context
      ).forEach(function (radio) {
        StatusManager.initializeTrackingModeHelp(radio);
      });

      // Initialize auto tracking checkbox
      once(
        "auto-tracking-checkbox",
        'input[name="general[auto_tracking_enabled]"]',
        context
      ).forEach(function (checkbox) {
        StatusManager.initializeAutoTrackingCheckbox(checkbox);
      });
    },
  };

  /**
   * Status Manager utility object.
   */
  window.StatusManager = {
    /**
     * Initialize tracking mode help text.
     */
    initializeTrackingModeHelp: function (radio) {
      var $radios = $('input[name="general[tracking_mode]"]');
      var $helpContainers = $(".tracking-mode-help");
      var $entityMappings = $("#edit-entity-mappings");
      var $automaticDetection = $("#edit-automatic-detection");

      // Show help for initially selected option
      StatusManager.showTrackingModeHelp($radios.filter(":checked").val());
      StatusManager.updateSectionVisibility($radios.filter(":checked").val());

      // Handle radio button changes
      $radios.change(function () {
        var selectedMode = $(this).val();
        StatusManager.showTrackingModeHelp(selectedMode);
        StatusManager.updateSectionVisibility(selectedMode);
      });
    },

    /**
     * Show the appropriate tracking mode help text.
     */
    showTrackingModeHelp: function (mode) {
      var $helpContainers = $(".tracking-mode-help");

      // Hide all help containers
      $helpContainers.hide();

      // Show the relevant help container
      if (mode) {
        $(".tracking-mode-" + mode).show();
      }
    },

    /**
     * Update section visibility based on tracking mode.
     */
    updateSectionVisibility: function (mode) {
      var $entityMappings = $("#edit-entity-mappings");
      var $automaticDetection = $("#edit-automatic-detection");
      var $autoTrackingEnabled = $(
        'input[name="general[auto_tracking_enabled]"]'
      );

      // Only show sections if auto tracking is enabled
      if (!$autoTrackingEnabled.is(":checked")) {
        $entityMappings.hide();
        $automaticDetection.hide();
        return;
      }

      // Show/hide sections based on mode
      switch (mode) {
        case "configured":
          $entityMappings.show();
          $automaticDetection.hide();
          break;

        case "fallback":
          $entityMappings.hide();
          $automaticDetection.show();
          break;

        case "both":
          $entityMappings.show();
          $automaticDetection.show();
          break;

        default:
          $entityMappings.hide();
          $automaticDetection.hide();
      }
    },

    /**
     * Initialize status history table.
     */
    initializeTable: function (table) {
      var $table = $(table);

      // Add hover effects to rows
      $table.find("tbody tr").hover(
        function () {
          $(this).addClass("highlight-row");
        },
        function () {
          $(this).removeClass("highlight-row");
        }
      );

      // Add click handlers for expandable notes
      $table.find(".toggle-note").click(function (e) {
        e.preventDefault();
        var $link = $(this);
        var $notesCell = $link.closest(".notes-cell");
        var $fullNotes = $notesCell.find(".full-notes");

        if ($fullNotes.is(":visible")) {
          $fullNotes.hide();
          $link.text("Show more");
        } else {
          $fullNotes.show();
          $link.text("Show less");
        }
      });

      // Add sorting functionality if not already present
      if (!$table.hasClass("tablesorter-enabled")) {
        StatusManager.addTableSorting($table);
      }
    },

    /**
     * Add basic table sorting functionality.
     */
    addTableSorting: function ($table) {
      $table.find("th").each(function (index) {
        var $th = $(this);
        if (!$th.hasClass("no-sort")) {
          $th.addClass("sortable").click(function () {
            StatusManager.sortTable($table, index, $th);
          });
        }
      });
    },

    /**
     * Sort table by column.
     */
    sortTable: function ($table, columnIndex, $header) {
      var $tbody = $table.find("tbody");
      var rows = $tbody.find("tr").toArray();
      var isAscending = !$header.hasClass("sort-desc");

      // Remove existing sort classes
      $table.find("th").removeClass("sort-asc sort-desc");

      // Add new sort class
      $header.addClass(isAscending ? "sort-asc" : "sort-desc");

      rows.sort(function (a, b) {
        var aText = $(a).find("td").eq(columnIndex).text().trim();
        var bText = $(b).find("td").eq(columnIndex).text().trim();

        // Try to parse as numbers for numeric sorting
        var aNum = parseFloat(aText);
        var bNum = parseFloat(bText);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return isAscending ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        if (isAscending) {
          return aText.localeCompare(bText);
        } else {
          return bText.localeCompare(aText);
        }
      });

      // Reorder rows
      $tbody.empty().append(rows);
    },

    /**
     * Initialize entity type filter.
     */
    initializeEntityTypeFilter: function (select) {
      $(select).change(function () {
        var selectedType = $(this).val();
        var $table = $(".status-history-table");

        if (selectedType === "") {
          // Show all rows
          $table.find("tbody tr").show();
        } else {
          // Filter rows by entity type
          $table.find("tbody tr").each(function () {
            var $row = $(this);
            var entityType =
              $row.data("entity-type") || $row.find(".entity-type").text();

            if (entityType === selectedType) {
              $row.show();
            } else {
              $row.hide();
            }
          });
        }

        StatusManager.updateTableStats($table);
      });
    },

    /**
     * Update table statistics.
     */
    updateTableStats: function ($table) {
      var totalRows = $table.find("tbody tr").length;
      var visibleRows = $table.find("tbody tr:visible").length;

      var $stats = $(".table-stats");
      if ($stats.length === 0) {
        $stats = $('<div class="table-stats"></div>').insertBefore($table);
      }

      if (totalRows === visibleRows) {
        $stats.text("Showing " + totalRows + " status changes");
      } else {
        $stats.text(
          "Showing " + visibleRows + " of " + totalRows + " status changes"
        );
      }
    },

    /**
     * Initialize status change form.
     */
    initializeForm: function (form) {
      var $form = $(form);

      // Add real-time validation
      $form.find("input, select, textarea").on("blur change", function () {
        StatusManager.validateField($(this));
      });

      // Add form submission handling
      $form.on("submit", function (e) {
        if (!StatusManager.validateForm($form)) {
          e.preventDefault();
          return FALSE;
        }
      });

      // Auto-populate target entity if URL parameters are present
      StatusManager.autoPopulateTargetEntity($form);
    },

    /**
     * Validate individual form field.
     */
    validateField: function ($field) {
      var value = $field.val();
      var fieldName = $field.attr("name");
      var isValid = TRUE;
      var errorMessage = "";

      // Remove existing error styling
      $field.removeClass("error");
      $field.siblings(".field-error").remove();

      // Required field validation
      if ($field.prop("required") && !value) {
        isValid = FALSE;
        errorMessage = "This field is required.";
      }

      // Field-specific validation
      switch (fieldName) {
        case "target_entity_id[0][value]":
          if (value && !/^\d+$/.test(value)) {
            isValid = FALSE;
            errorMessage = "Entity ID must be a number.";
          }
          break;
      }

      if (!isValid) {
        $field.addClass("error");
        $field.after('<div class="field-error">' + errorMessage + "</div>");
      }

      return isValid;
    },

    /**
     * Validate entire form.
     */
    validateForm: function ($form) {
      var isValid = TRUE;

      $form
        .find("input[required], select[required], textarea[required]")
        .each(function () {
          if (!StatusManager.validateField($(this))) {
            isValid = FALSE;
          }
        });

      return isValid;
    },

    /**
     * Auto-populate target entity from URL parameters.
     */
    autoPopulateTargetEntity: function ($form) {
      var urlParams = new URLSearchParams(window.location.search);
      var entityType = urlParams.get("entity_type");
      var entityId = urlParams.get("entity_id");

      if (entityType) {
        $form
          .find('select[name="target_entity_type[0][value]"]')
          .val(entityType);
      }

      if (entityId) {
        $form.find('input[name="target_entity_id[0][value]"]').val(entityId);
      }
    },

    /**
     * Utility function to format status values for display.
     */
    formatStatus: function (status) {
      return status.replace(/_/g, " ").replace(/\b\w/g, function (l) {
        return l.toUpperCase();
      });
    },

    /**
     * Add status badge styling to elements.
     */
    addStatusBadges: function (context) {
      $(context)
        .find(".status-value, .new-status, .old-status")
        .each(function () {
          var $element = $(this);
          var status = $element.text().toLowerCase().replace(/\s+/g, "-");

          if (!$element.hasClass("status-badge")) {
            $element.addClass("status-badge status-" + status);
          }
        });
    },

    /**
     * Initialize auto tracking checkbox.
     */
    initializeAutoTrackingCheckbox: function (checkbox) {
      var $checkbox = $(checkbox);
      var $radios = $('input[name="general[tracking_mode]"]');

      // Handle checkbox changes
      $checkbox.change(function () {
        var selectedMode = $radios.filter(":checked").val();
        StatusManager.updateSectionVisibility(selectedMode);
      });
    },
  };

  // Initialize status badges on page load
  $(document).ready(function () {
    StatusManager.addStatusBadges(document);
  });
})(jQuery, Drupal, once);
