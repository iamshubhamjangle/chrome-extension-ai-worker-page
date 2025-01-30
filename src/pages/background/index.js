console.log("background script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "check-active-tab-is-selected") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) {
        sendResponse({ error: "No active tab found" });
        return;
      }

      // Check if the URL is a chrome:// URL
      if (tab.url?.startsWith("chrome://")) {
        sendResponse({
          error:
            "Cannot capture screenshot of this page. Please try on a regular webpage.",
        });
        return;
      }

      // Check if the URL is a chrome extension URL
      if (tab.url?.startsWith("chrome-extension://")) {
        sendResponse({
          error:
            "Cannot capture screenshot of extension pages. Please try on a regular webpage.",
        });
        return;
      }

      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "capture-screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (
        !tab ||
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("chrome-extension://")
      ) {
        sendResponse({ error: "Cannot capture screenshot of this page" });
        return;
      }

      chrome.tabs.captureVisibleTab(null, {}, (screenshotUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ screenshot: screenshotUrl });
      });
    });
    return true;
  }
});
