/**
 * @file
 * Generate random keys for JWT authentication.
 */
(function ($, Drupal) {
  "use strict";

  // Store a reference to whether we've attached the event handler
  var keysHandlerAttached = false;

  Drupal.behaviors.apiAuthGenerateKeys = {
    attach: function (context, settings) {
      // Only attach the handler if we haven't already
      if (!keysHandlerAttached && context === document) {
        keysHandlerAttached = true;

        $(".button--generate-keys").on("click", function (e) {
          e.preventDefault();

          // Function to generate a random base64 key
          function generateRandomKey() {
            const array = new Uint8Array(32); // 256 bits
            window.crypto.getRandomValues(array);
            return btoa(String.fromCharCode.apply(null, array));
          }

          // Generate and set keys
          $('input[name="jwt_secret"]').val(generateRandomKey());
          $('input[name="jwt_refresh_secret"]').val(generateRandomKey());

          Drupal.announce(Drupal.t("New random keys have been generated."));
        });
      }
    },
  };
})(jQuery, Drupal);
