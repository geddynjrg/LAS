/**
 * @file
 * Application view JavaScript behaviors.
 */

(function ($, Drupal) {
  "use strict";

  // Global flag to track active requests
  let activeStatusUpdateRequest = null;

  /**
   * Smooth scrolling navigation for application sections.
   */
  Drupal.behaviors.applicationViewNavigation = {
    attach: function (context, settings) {
      // Use Drupal 11's once() function
      const navElements = once("application-nav", ".application-nav", context);

      navElements.forEach(function (navElement) {
        const $nav = $(navElement);
        const $links = $nav.find(".nav-link");
        const $sections = $(".content-section");
        const navHeight = $nav.outerHeight();

        // Smooth scrolling
        $links.on("click", function (e) {
          e.preventDefault();
          const target = $(this).attr("href");
          const $target = $(target);

          if ($target.length) {
            const scrollTop = $target.offset().top - navHeight - 20;
            $("html, body").animate(
              {
                scrollTop: scrollTop,
              },
              500
            );
          }
        });

        // Active section highlighting
        function updateActiveSection() {
          const scrollPosition = $(window).scrollTop() + navHeight + 50;

          $sections.each(function () {
            const $section = $(this);
            const sectionTop = $section.offset().top;
            const sectionBottom = sectionTop + $section.outerHeight();
            const sectionId = $section.attr("id");

            if (
              scrollPosition >= sectionTop &&
              scrollPosition < sectionBottom
            ) {
              $links.removeClass("active");
              $links.filter('[href="#' + sectionId + '"]').addClass("active");
            }
          });
        }

        // Update on scroll
        $(window).on("scroll", updateActiveSection);
        updateActiveSection();
      });
    },
  };

  /**
   * Confirm dangerous actions.
   */
  Drupal.behaviors.applicationConfirmActions = {
    attach: function (context, settings) {
      const dangerButtons = once("confirm-action", ".button--danger", context);

      dangerButtons.forEach(function (button) {
        $(button).on("click", function (e) {
          const message = Drupal.t(
            "Are you sure you want to reject this application? This action cannot be undone."
          );
          if (!confirm(message)) {
            e.preventDefault();
          }
        });
      });
    },
  };

  /**
   * Inline status update form.
   */
  Drupal.behaviors.applicationInlineStatusUpdate = {
    attach: function (context, settings) {
      const elements = once(
        "inline-status-update",
        ".status-update-form",
        context
      );

      $(elements).each(function () {
        const $form = $(this);
        // Additional check to prevent re-initialization
        if (!$form.data("initialized")) {
          $form.data("initialized", true);
          initializeStatusForm($form);
        }
      });

      function initializeStatusForm($form) {
        const $statusSelect = $form.find(".status-select");
        const $submitButton = $form.find('button[type="submit"]');
        const $rejectionFields = $form.find(".rejection-fields");

        // Flag to prevent multiple submissions
        let isSubmitting = false;

        // Enable/disable submit button based on selection
        $statusSelect.on("change", function () {
          const newStatus = $(this).val();

          // Enable button if a status is selected
          if (newStatus && newStatus !== "") {
            $submitButton.prop("disabled", false);
            $submitButton.removeAttr("disabled");
          } else {
            $submitButton.prop("disabled", true);
            $submitButton.attr("disabled", "disabled");
          }

          // Show/hide rejection fields
          if (newStatus === "rejected") {
            $rejectionFields.slideDown();
          } else {
            $rejectionFields.slideUp();
          }
        });

        // Handle form submission
        $form.off("submit").on("submit", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Prevent multiple submissions
          if (isSubmitting) {
            return false;
          }

          // Immediately set flag and disable button
          isSubmitting = true;
          $submitButton.prop("disabled", true);

          const newStatus = $statusSelect.val();
          const rejectionReason = $form.find(".rejection-reason-select").val();
          const rejectionMessage = $form.find(".rejection-message").val();

          // Validate rejection fields if status is rejected
          if (newStatus === "rejected") {
            if (!rejectionReason) {
              showAlertModal(
                Drupal.t("Please select a rejection reason."),
                "warning"
              );
              isSubmitting = false;
              $submitButton.prop("disabled", false);
              return false;
            }
            if (!rejectionMessage || rejectionMessage.length < 20) {
              showAlertModal(
                Drupal.t(
                  "Please provide a detailed rejection message (at least 20 characters)."
                ),
                "warning"
              );
              isSubmitting = false;
              $submitButton.prop("disabled", false);
              return false;
            }
          }

          // Show custom confirmation modal
          const confirmMessage =
            newStatus === "rejected"
              ? Drupal.t("Are you sure you want to reject this application?")
              : Drupal.t(
                  "Are you sure you want to change the status to @status?",
                  { "@status": $statusSelect.find("option:selected").text() }
                );

          // Prevent any further form processing
          e.stopImmediatePropagation();

          showConfirmModal(
            confirmMessage,
            function () {
              // User confirmed, proceed with submission
              $submitButton.text(Drupal.t("Updating..."));

              // Abort any existing request
              if (
                activeStatusUpdateRequest &&
                activeStatusUpdateRequest.readyState !== 4
              ) {
                activeStatusUpdateRequest.abort();
              }

              // Submit via AJAX
              activeStatusUpdateRequest = $.ajax({
                url: $form.attr("action"),
                method: "POST",
                headers: {
                  "X-CSRF-Token": drupalSettings.csrf_token || "",
                },
                data: {
                  status: newStatus,
                  rejection_reason: rejectionReason,
                  rejection_message: rejectionMessage,
                },
                success: function (response) {
                  if (response.success) {
                    // Show success modal
                    showAlertModal(response.message, "success", function () {
                      window.location.reload();
                    });
                  } else {
                    showAlertModal(
                      response.message ||
                        Drupal.t(
                          "An error occurred while updating the status."
                        ),
                      "error"
                    );
                    $submitButton
                      .prop("disabled", false)
                      .text(Drupal.t("Update Status"));
                    isSubmitting = false;
                  }
                },
                error: function () {
                  showAlertModal(
                    Drupal.t("An error occurred while updating the status."),
                    "error"
                  );
                  $submitButton
                    .prop("disabled", false)
                    .text(Drupal.t("Update Status"));
                  isSubmitting = false;
                },
                complete: function () {
                  // Clean up request reference
                  activeStatusUpdateRequest = null;
                  // Ensure flag is reset even if something unexpected happens
                  setTimeout(function () {
                    isSubmitting = false;
                  }, 1000);
                },
              });
            },
            function () {
              // User cancelled
              isSubmitting = false;
            }
          );

          return false;
        });
      }
    },
  };

  /**
   * Show a confirmation modal dialog.
   */
  function showConfirmModal(message, onConfirm, onCancel) {
    // Remove any existing modals
    $(".api-application-modal").remove();

    const modalHtml = `
      <div class="api-application-modal modal-backdrop">
        <div class="modal-dialog modal-confirm">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">${Drupal.t("Confirm Action")}</h3>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="button button--secondary modal-cancel" onclick="return false;">
                ${Drupal.t("Cancel")}
              </button>
              <button type="button" class="button button--primary modal-confirm" onclick="return false;">
                ${Drupal.t("Confirm")}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const $modal = $(modalHtml);
    $("body").append($modal);

    // Add animation class after a small delay
    setTimeout(() => {
      $modal.addClass("modal-show");
    }, 10);

    // Handle confirm
    $modal.find(".modal-confirm").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      $modal.removeClass("modal-show");
      setTimeout(() => {
        $modal.remove();
        if (typeof onConfirm === "function") {
          onConfirm();
        }
      }, 300);
      return false;
    });

    // Handle cancel
    $modal.find(".modal-cancel").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      $modal.removeClass("modal-show");
      setTimeout(() => {
        $modal.remove();
        if (typeof onCancel === "function") {
          onCancel();
        }
      }, 300);
      return false;
    });

    // Close on backdrop click
    $modal.on("click", function (e) {
      if ($(e.target).hasClass("modal-backdrop")) {
        $modal.find(".modal-cancel").click();
      }
    });

    // Close on ESC key
    $(document).on("keyup.modal", function (e) {
      if (e.key === "Escape") {
        $modal.find(".modal-cancel").click();
        $(document).off("keyup.modal");
      }
    });
  }

  /**
   * Show an alert modal dialog.
   */
  function showAlertModal(message, type = "info", onClose) {
    // Remove any existing modals
    $(".api-application-modal").remove();

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    const titles = {
      success: Drupal.t("Success"),
      error: Drupal.t("Error"),
      warning: Drupal.t("Warning"),
      info: Drupal.t("Information"),
    };

    const modalHtml = `
      <div class="api-application-modal modal-backdrop">
        <div class="modal-dialog modal-alert modal-${type}">
          <div class="modal-content">
            <div class="modal-header">
              <span class="modal-icon">${icons[type] || icons.info}</span>
              <h3 class="modal-title">${titles[type] || titles.info}</h3>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="button button--primary modal-close" onclick="return false;">
                ${Drupal.t("OK")}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const $modal = $(modalHtml);
    $("body").append($modal);

    // Add animation class after a small delay
    setTimeout(() => {
      $modal.addClass("modal-show");
    }, 10);

    // Handle close
    const closeModal = function () {
      $modal.removeClass("modal-show");
      setTimeout(() => {
        $modal.remove();
        if (typeof onClose === "function") {
          onClose();
        }
      }, 300);
    };

    $modal.find(".modal-close").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    });

    // Close on backdrop click
    $modal.on("click", function (e) {
      if ($(e.target).hasClass("modal-backdrop")) {
        closeModal();
      }
    });

    // Close on ESC key
    $(document).on("keyup.modal", function (e) {
      if (e.key === "Escape") {
        closeModal();
        $(document).off("keyup.modal");
      }
    });

    // Auto close success messages after 3 seconds
    if (type === "success") {
      setTimeout(closeModal, 3000);
    }
  }
})(jQuery, Drupal);
