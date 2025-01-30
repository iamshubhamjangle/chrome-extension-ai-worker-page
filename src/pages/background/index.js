console.log("background script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "check-active-tab-is-selected") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) {
        sendResponse({ error: "No active tab found" });
        return;
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "capture-screenshot") {
    chrome.tabs.captureVisibleTab(null, {}, (screenshotUrl) => {
      sendResponse({ screenshot: screenshotUrl });
    });
    return true;
  }
});
