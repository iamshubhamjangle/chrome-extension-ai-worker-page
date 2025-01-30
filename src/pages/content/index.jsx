// import { createRoot } from "react-dom/client";
import "./style.css";

// // Use this to inject html content into the page
// const div = document.createElement("div");
// div.id = "__root";
// document.body.appendChild(div);

// const rootContainer = document.querySelector("#__root");
// if (!rootContainer) throw new Error("Can't find Content root element");
// const root = createRoot(rootContainer);
// root.render(
//   <div className="absolute bottom-0 left-0 text-lg text-black bg-amber-400 z-50">
//     content script <span className="your-class">loaded</span>
//   </div>
// );

try {
  // Run whenever a page is loaded
  console.log("<----------------------- Content.js ----------------------->");

  (() => {
    // Prevent multiple initializations
    if (window.screenshotToolInitialized) return;
    window.screenshotToolInitialized = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "start-screenshot") {
        console.log("Starting screenshot capture");
        initializeScreenshotCapture();
        sendResponse({ success: true });
        return true;
      }
    });

    // Function to initialize screenshot capture
    // 1. Create an overlay to select an area
    // 2. Get the selected area elements
    // 3. Capture a screenshot of the selected area
    // 4. & more...
    function initializeScreenshotCapture() {
      // Move the overlay creation and event handling logic here
      // Listen for messages from the popup script
      console.log("Received start-screenshot message");

      // Check if overlay already exists
      if (document.getElementById("selection-overlay")) {
        console.warn("Selection overlay already exists.");
        return;
      }

      // Create and style the selection overlay
      const overlay = document.createElement("div");
      overlay.id = "selection-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(0, 0, 0, 0.2)";
      overlay.style.zIndex = "9999";
      overlay.style.cursor = "crosshair";

      // Create and style the selection box
      const selectionBox = document.createElement("div");
      selectionBox.id = "selection-box";
      selectionBox.style.position = "absolute";
      selectionBox.style.border = "2px solid blue";
      selectionBox.style.background = "rgba(0, 0, 255, 0.1)";
      overlay.appendChild(selectionBox);
      document.body.appendChild(overlay);

      let isSelecting = false;
      let startX, startY;

      // Handle mouse down event to start selection
      overlay.addEventListener("mousedown", (e) => {
        console.log("Mouse down on overlay");
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;

        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
      });

      // Handle mouse move event to update selection box size
      overlay.addEventListener("mousemove", (e) => {
        if (!isSelecting) return;
        console.log("Mouse move on overlay");

        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = `${Math.min(startX, currentX)}px`;
        selectionBox.style.top = `${Math.min(startY, currentY)}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
      });

      // Returns HTML, CSS from document.documentElement.outerHTML and all stylesheets
      function extractHTMLAndCSS() {
        try {
          const html = document.documentElement.outerHTML;
          const cssRules = [];

          for (const sheet of document.styleSheets) {
            try {
              if (sheet.cssRules) {
                for (const rule of sheet.cssRules) {
                  cssRules.push(rule.cssText);
                }
              }
            } catch (e) {
              console.warn(
                `Could not access rules from stylesheet: ${sheet.href}`,
                e
              );
            }
          }

          const css = cssRules.join("\n");
          return { html, css };
        } catch (error) {
          console.error("Error in extractHTMLAndCSS function:", error);
          return { html: "", css: "" };
        }
      }

      // Function to get elements in the selected area
      function getElementsInSelectedArea(startX, startY, endX, endY) {
        console.log("Selection coordinates:", { startX, startY, endX, endY });

        // Temporarily hide the overlay to get the actual elements underneath
        const overlay = document.getElementById("selection-overlay");
        overlay.style.pointerEvents = "none";
        overlay.style.display = "none";

        // Get elements at start and end points
        const startElement = document.elementFromPoint(startX, startY);
        const endElement = document.elementFromPoint(endX, endY);

        // Restore overlay
        overlay.style.display = "block";
        overlay.style.pointerEvents = "auto";

        console.log(
          "Start element:",
          startElement?.tagName,
          startElement?.className
        );
        console.log("End element:", endElement?.tagName, endElement?.className);

        if (!startElement || !endElement) {
          console.warn("Could not find elements at selection points");
          return [];
        }

        // Find common parent
        const getParents = (element) => {
          const parents = [];
          let currentElement = element;
          while (currentElement && currentElement !== document.body) {
            // Ignore overlay-related elements
            if (!currentElement.id?.includes("selection-")) {
              parents.push(currentElement);
            }
            currentElement = currentElement.parentElement;
          }
          return parents;
        };

        const startParents = getParents(startElement);
        const endParents = getParents(endElement);

        console.log(
          "Start element parents:",
          startParents.map((el) => el.tagName)
        );
        console.log(
          "End element parents:",
          endParents.map((el) => el.tagName)
        );

        // Find the closest common parent
        const commonParent = startParents.find((parent) =>
          endParents.includes(parent)
        );

        if (commonParent) {
          console.log(
            "Found common parent:",
            commonParent.tagName,
            commonParent.className
          );

          // Get all elements within the selection area
          const rect = commonParent.getBoundingClientRect();
          const isWithinSelection =
            rect.left >= Math.min(startX, endX) - 5 &&
            rect.right <= Math.max(startX, endX) + 5 &&
            rect.top >= Math.min(startY, endY) - 5 &&
            rect.bottom <= Math.max(startY, endY) + 5;

          if (isWithinSelection) {
            console.log("Common parent is within selection area");
            return [commonParent];
          } else {
            // If common parent is too large, return the most specific elements
            const selectedElements = [startElement, endElement].filter(
              (el, index, self) =>
                self.indexOf(el) === index && !el.id?.includes("selection-")
            );
            console.log(
              "Returning specific elements:",
              selectedElements.map((el) => el.tagName)
            );
            return selectedElements;
          }
        }

        console.warn("No common parent found");
        return [];
      }

      // Handle mouse up event to finish selection and capture screenshot
      overlay.addEventListener("mouseup", async (e) => {
        console.log("Mouse up detected", {
          startPosition: { x: startX, y: startY },
          endPosition: { x: e.clientX, y: e.clientY },
        });

        isSelecting = false;

        try {
          // Get full page HTML and CSS
          // const pageContent = extractHTMLAndCSS();
          console.log("Extracted full page content");

          // Get selected area elements
          const selectedElements = getElementsInSelectedArea(
            startX,
            startY,
            e.clientX,
            e.clientY
          );

          // Remove overlay after getting elements
          document.body.removeChild(overlay);
          console.log("Removed selection overlay");

          const selectedHTML = selectedElements
            .map((el) => el.outerHTML)
            .join("\n");

          // Capture screenshot process
          const response = await chrome.runtime.sendMessage({
            action: "capture-screenshot",
          });

          console.log("Received screenshot response:", response);

          if (response && response.screenshot) {
            console.log("Screenshot data available");
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const img = new Image();

            img.onload = async () => {
              const dpr = window.devicePixelRatio || 1;
              console.log("Device pixel ratio:", dpr);

              const left = Math.min(startX, e.clientX);
              const top = Math.min(startY, e.clientY);
              const width = Math.abs(e.clientX - startX);
              const height = Math.abs(e.clientY - startY);

              console.log("Canvas dimensions:", {
                left,
                top,
                width,
                height,
                scaledWidth: width * dpr,
                scaledHeight: height * dpr,
              });

              canvas.width = width * dpr;
              canvas.height = height * dpr;

              context.drawImage(
                img,
                left * dpr,
                top * dpr,
                width * dpr,
                height * dpr,
                0,
                0,
                width * dpr,
                height * dpr
              );

              const dataUrl = canvas.toDataURL("image/png");

              // Get existing screenshots array
              const storageResponse = await chrome.storage.local.get(["data"]);
              const data = storageResponse.data || [];

              // Create new screenshot object
              const newScreenshotData = {
                id: Date.now(), // Unique identifier
                screenshot: dataUrl,
                selectedHTML: selectedHTML,
                timestamp: new Date().toLocaleString(),
              };

              // Add new screenshot to array
              data.push(newScreenshotData);

              // Store updated array
              await chrome.storage.local.set({
                data,
              });

              console.log("Generated screenshot data length:", dataUrl.length);
              console.log("Screenshot and page data stored successfully");
              console.log("Total data stored:", data.length);
            };

            img.src = response.screenshot;
          } else {
            console.warn("No screenshot captured: ", response);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      });

      // Return true to indicate that the response will be sent asynchronously
      return true;
    }
  })();
} catch (e) {
  console.error("Error in content script", e);
}
