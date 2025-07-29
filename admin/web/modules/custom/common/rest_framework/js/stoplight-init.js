/**
 * @file
 * JavaScript for initializing Stoplight Elements with advanced fixes.
 */

(function (Drupal) {
  "use strict";

  /**
   * Advanced API Documentation initialization and fixes.
   */
  Drupal.behaviors.restFrameworkStoplight = {
    attach: function (context, settings) {
      if (context !== document) {
        return;
      }

      // Get the container element
      const container = document.getElementById("stoplight-container");
      if (!container) {
        return;
      }

      // Get the spec URL from the data attribute
      const specUrl = container.getAttribute("data-spec-url");
      if (!specUrl) {
        console.error("Missing data-spec-url attribute on stoplight-container");
        return;
      }

      // Get the existing loader element
      const loadingEl = document.querySelector(".rest-framework-api-loader");
      if (!loadingEl) {
        console.warn(
          "No loader element found. API documentation might load without a visual indicator."
        );
      }

      // Create the elements API component
      const apiComponent = document.createElement("elements-api");
      apiComponent.setAttribute("apiDescriptionUrl", specUrl);
      apiComponent.setAttribute("router", "hash");
      apiComponent.setAttribute("layout", "sidebar");
      apiComponent.setAttribute("tryItCredentialsPolicy", "include");

      // Define an interval to check and fix loading and styling issues
      let fixAttempts = 0;
      let fixInterval;

      // Function to apply all fixes to the content
      const applyFixes = () => {
        fixAttempts++;
        console.log(`Applying fixes, attempt ${fixAttempts}`);

        // Remove all loading indicators
        document
          .querySelectorAll(
            '.sl-spin, [aria-busy="true"], .sl-bg-blue-50, .sl-bg-primary-50, .sl-animate-pulse, .sl-bg-primary-100'
          )
          .forEach((el) => {
            el.classList.remove(
              "sl-spin",
              "sl-bg-blue-50",
              "sl-bg-primary-50",
              "sl-animate-pulse",
              "sl-bg-primary-100"
            );
            el.setAttribute("aria-busy", "false");
            el.style.opacity = "1";
            el.style.animation = "none";
            el.style.backgroundColor = "transparent";
          });

        // Ensure all code and JSON elements have proper colors
        document
          .querySelectorAll(
            ".sl-elements-api code, .sl-elements-api pre, .sl-json-viewer, .sl-code-viewer"
          )
          .forEach((el) => {
            el.style.color = "#1e293b";
            el.style.backgroundColor = "#f8fafc";

            // Make sure all child elements are also properly styled
            el.querySelectorAll("*").forEach((child) => {
              child.style.color = "#1e293b";
              if (
                child.classList.contains("sl-string") ||
                child.classList.contains("sl-text-green-500") ||
                child.classList.contains("sl-text-green-600")
              ) {
                child.style.color = "#166534"; // Green for strings
              } else if (
                child.classList.contains("sl-number") ||
                child.classList.contains("sl-text-blue-500") ||
                child.classList.contains("sl-text-blue-600")
              ) {
                child.style.color = "#1e40af"; // Blue for numbers
              } else if (child.classList.contains("sl-property")) {
                child.style.color = "#0c4a6e"; // Dark blue for properties
                child.style.fontWeight = "600";
              }
            });
          });

        // Force display example content
        document
          .querySelectorAll(
            '[data-tab="example"], [data-tab-id="example"], [role="tabpanel"]'
          )
          .forEach((el) => {
            el.style.display = "block";
            el.style.opacity = "1";
            el.style.visibility = "visible";
          });

        // Try to click on example tabs if available
        document.querySelectorAll('[role="tablist"]').forEach((tabList) => {
          const exampleTab = tabList.querySelector(
            '[aria-controls="example"], [data-tab="example"]'
          );
          if (exampleTab) {
            exampleTab.click();
          }
        });

        // Fix any white text on white background
        document
          .querySelectorAll(
            ".sl-token, .sl-text-black, .sl-text-body, .sl-prose *"
          )
          .forEach((el) => {
            // Only apply color if it appears to be white or transparent
            const currentColor = window.getComputedStyle(el).color;
            if (
              currentColor === "rgb(255, 255, 255)" ||
              currentColor === "rgba(0, 0, 0, 0)"
            ) {
              el.style.color = "#1e293b";
            }
          });

        // Stop fixing after 10 attempts to avoid performance issues
        if (fixAttempts >= 10) {
          clearInterval(fixInterval);
          console.log("Stopping automatic fixes after 10 attempts");
        }
      };

      // Add enhanced configuration options
      const config = {
        // Elements options
        hideExport: false,
        hideSchemas: false,
        hideTryIt: false,
        scrollIntoViewOnLinkClick: true,
        schemaEditorEnabled: false,
        tryItCredentialsPolicy: "include",
        tryItHeadersDefaultValue: JSON.stringify({
          Authorization: "Bearer YOUR_JWT_TOKEN",
          "Content-Type": "application/json",
          "X-CSRF-Token": "nocheck",
        }),

        // Layout options
        layout: {
          hideTryItPanel: false,
          hideTryItPanelForAllOperations: false,
          noAutoAuth: false,
        },

        // Style and appearance
        theme: {
          logo: {
            href: "/",
            altText: "REST API",
            maxWidth: "150px",
          },
          sidebar: {
            backgroundColor: "#f5f7fa",
            textColor: "#333344",
            activeTextColor: "#2c5cc5",
            separatorColor: "#e6e6ef",
            fontFamily:
              "'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', sans-serif",
            width: "320px",
          },
          codeBlocks: {
            backgroundColor: "#f8fafc",
            borderColor: "#e6e6ef",
          },
          typography: {
            fontFamily:
              "'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', sans-serif",
            fontSize: "14px",
            lineHeight: "1.5",
            links: {
              color: "#2c5cc5",
              visited: "#1e3f8c",
              hover: "#4c77d1",
            },
            headings: {
              fontFamily:
                "'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', sans-serif",
              fontWeight: "600",
              h1: {
                fontSize: "28px",
                lineHeight: "1.3",
              },
              h2: {
                fontSize: "22px",
                lineHeight: "1.4",
              },
              h3: {
                fontSize: "18px",
                lineHeight: "1.5",
              },
            },
          },
          colors: {
            primary: {
              main: "#2c5cc5",
              dark: "#1e3f8c",
              light: "#4c77d1",
              contrastText: "#ffffff",
            },
            success: {
              main: "#08a742",
              contrastText: "#ffffff",
            },
            warning: {
              main: "#e97f00",
              contrastText: "#ffffff",
            },
            error: {
              main: "#e53935",
              contrastText: "#ffffff",
            },
            text: {
              primary: "#1e293b",
              secondary: "#4a4a68",
            },
          },
          rightPanel: {
            backgroundColor: "#ffffff",
            textColor: "#1e1a2e",
            width: "60%",
          },
          schema: {
            backgroundColor: "#f5f7fa",
            separatorColor: "#e6e6ef",
            linesColor: "#e6e6ef",
            typeNameColor: "#0088cc",
            typeTitleColor: "#333344",
          },
        },
      };

      // Set configuration as JSON string
      apiComponent.setAttribute("elementOptions", JSON.stringify(config));

      // Create a MutationObserver to monitor and fix content after it loads
      const observer = new MutationObserver((mutations) => {
        // Apply fixes whenever content changes
        applyFixes();
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      // Add global timeout to remove ALL loading indicators after 5 seconds
      // This ensures nothing stays in a loading state indefinitely
      setTimeout(() => {
        // Apply a comprehensive fix
        applyFixes();

        // Start an interval to repeatedly apply fixes
        fixInterval = setInterval(applyFixes, 500);

        // Stop after 5 seconds to avoid performance impact
        setTimeout(() => {
          clearInterval(fixInterval);
          observer.disconnect();
          console.log("Stopped automatic fixes");

          // Apply one final fix
          applyFixes();

          // Fallback: make sure the loader is removed if still present after 5 seconds
          if (loadingEl && loadingEl.parentNode) {
            console.warn(
              "Loader still present after 5 seconds - removing forcefully"
            );
            loadingEl.style.opacity = "0";
            setTimeout(() => {
              if (loadingEl && loadingEl.parentNode) {
                loadingEl.parentNode.removeChild(loadingEl);
              }
            }, 100);
          }
        }, 100);
      }, 100);

      // Handle load events
      apiComponent.addEventListener("loadSuccess", function () {
        // Remove the loading indicator
        if (loadingEl && loadingEl.parentNode) {
          // Add a fade-out effect before removing
          loadingEl.style.opacity = "0";

          // Remove after transition completes
          setTimeout(() => {
            if (loadingEl && loadingEl.parentNode) {
              loadingEl.parentNode.removeChild(loadingEl);
            }
          }, 100);
        }

        console.log("Stoplight Elements loaded successfully");

        // Apply fixes immediately after successful load
        applyFixes();

        // Also expand all sections in the navigation
        setTimeout(() => {
          document
            .querySelectorAll(".sl-overflow-y-auto .sl-flex.sl-py-2")
            .forEach((item) => {
              item.click();
            });
        }, 500);
      });

      apiComponent.addEventListener("loadError", function (error) {
        // Show error message if loading element exists
        if (loadingEl) {
          loadingEl.innerHTML = `
            < div class = "api-docs-error" >
              < div class = "api-docs-error-icon" > ❌ < / div >
              < div class = "api-docs-error-text" > Error loading API documentation < / div >
              < div class = "api-docs-error-details" > ${
                error.detail || "Unable to load API spec"
              } < / div >
            < / div >
          `;
        }

        console.error("Stoplight Elements loading error:", error);
      });

      // Add to container
      container.appendChild(apiComponent);

      // Add click handler to the document to fix any remaining issues when users interact
      document.addEventListener("click", function (e) {
        // If user clicks on a tab, ensure content is visible
        if (
          e.target.getAttribute("role") === "tab" ||
          e.target.closest('[role="tab"]')
        ) {
          setTimeout(applyFixes, 100);
        }
      });
    },
  };
})(Drupal);
