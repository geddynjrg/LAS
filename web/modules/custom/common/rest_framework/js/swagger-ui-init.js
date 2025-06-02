/**
 * @file
 * JavaScript to initialize Swagger UI.
 */

(function (Drupal, drupalSettings) {
  "use strict";

  Drupal.behaviors.restFrameworkSwaggerUI = {
    attach: function (context, settings) {
      if (context !== document) {
        return;
      }

      // Initialize Swagger UI
      const ui = SwaggerUIBundle({
        url: drupalSettings.restFramework.apiDocsUrl,
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        syntaxHighlight: {
          activated: true,
          theme: "agate",
        },
      });
    },
  };
})(Drupal, drupalSettings);
