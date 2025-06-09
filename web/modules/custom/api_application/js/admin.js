/**
 * @file
 * Admin interface enhancements for API Application module.
 */

(function ($, Drupal, once) {
  "use strict";

  /**
   * Behavior for admin interface enhancements.
   */
  Drupal.behaviors.apiApplicationAdmin = {
    attach: function (context, settings) {
      // Handle different versions of Drupal
      var tableSelectors =
        ".application-listing-table tbody tr, .group-member-listing-table tbody tr";

      if (typeof once !== "undefined") {
        // Drupal 9.2+ with once library
        const elements = once("hover-effect", tableSelectors, context);
        $(elements).hover(
          function () {
            $(this).addClass("hover");
          },
          function () {
            $(this).removeClass("hover");
          }
        );
      } else if ($.fn.once) {
        // Older Drupal with jQuery once
        $(tableSelectors, context)
          .once("hover-effect")
          .hover(
            function () {
              $(this).addClass("hover");
            },
            function () {
              $(this).removeClass("hover");
            }
          );
      } else {
        // Fallback without once
        $(tableSelectors, context)
          .not(".hover-processed")
          .addClass("hover-processed")
          .hover(
            function () {
              $(this).addClass("hover");
            },
            function () {
              $(this).removeClass("hover");
            }
          );
      }
    },
  };
})(jQuery, Drupal, window.once);
