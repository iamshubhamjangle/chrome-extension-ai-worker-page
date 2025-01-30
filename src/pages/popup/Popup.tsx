import React from "react";

export default function Popup() {
  const [prompt, setPrompt] = React.useState("");
  const [framework, setFramework] = React.useState("cypress");
  const [screenshots, setScreenshots] = React.useState<string[]>([]);
  const [response, setResponse] = React.useState("");

  const handleClearScreenshots = () => {
    setScreenshots([]);
  };

  const handleCopyResponse = () => {
    // if (response) {
    //   navigator.clipboard.writeText(response);
    // }
  };

  // Event handler for capturing screenshot
  async function handleScreenshotButtonClick() {
    try {
      // Check if we can find an active tab first
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tabs || tabs.length === 0) {
        console.debug("Please click on the webpage first, then try again");
        return;
      }

      const tab = tabs[0];
      if (!tab || !tab.id) {
        console.debug(
          "Cannot access the current tab. Please refresh the page."
        );
        return;
      }

      // Show loading status
      console.debug("Preparing to capture...");

      // First inject the content script to capture the screenshot
      const response = await chrome.runtime.sendMessage({
        action: "check-active-tab-is-selected",
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Wait a moment for the content script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send message to start screenshot
      await chrome.tabs.sendMessage(tab.id, { action: "start-screenshot" });
      console.debug("Capturing screenshot...");
    } catch (err) {
      console.error("Screenshot capture error:", err);
      console.debug("Please select current tab and try again");
    }
  }

  const handleSubmit = async () => {
    console.log("Prompt:", prompt);
    console.log("Framework:", framework);
    console.log("Screenshots:", screenshots);

    try {
      //   const res = await fetch("YOUR_API_ENDPOINT", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       prompt,
      //       framework,
      //       screenshots,
      //     }),
      //   });
      //   const data = await res.json();
      //   console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="w-[35rem] p-5 rounded-[10px]">
      <h2 className="text-xl font-bold text-center">
        Screenshots to Automate Code
      </h2>
      <p id="status"></p>
      <div className="relative">
        <button
          id="clear-screenshot-button"
          className="absolute cursor-pointer bg-white font-semibold text-[black] z-[1] m-[5px] px-2.5 py-[5px] rounded-lg border-[none] right-0 top-0"
          onClick={handleClearScreenshots}
        >
          Clear
        </button>
        <div
          id="screenshot-container"
          onClick={handleScreenshotButtonClick}
        ></div>
      </div>
      <label htmlFor="prompt-textarea" className="text-orange-500">
        Write a prompt
      </label>
      <textarea
        id="prompt-textarea"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-[100px] border box-border mx-0 my-[5px] p-2.5 rounded-lg border-solid border-orange-500 focus:border-orange-600 focus:outline-none"
      ></textarea>
      <div>
        <label htmlFor="framework-select" className="text-orange-500">
          Choose framework:
        </label>
        <select
          id="framework-select"
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="w-full border bg-[white] text-sm mx-0 my-[5px] p-2.5 rounded-lg border-solid border-orange-500 focus:border-orange-600 focus:outline-none"
        >
          <option value="selenium">Selenium</option>
          <option value="cypress">Cypress</option>
        </select>
      </div>
      <button
        id="submit-button"
        className="bg-orange-500 rounded-full px-6 py-2 text-white text-xs font-bold mx-auto block cursor-pointer"
        onClick={handleSubmit}
      >
        Run it
      </button>
      <div className="relative">
        <button
          className="absolute cursor-pointer bg-orange-100 font-semibold text-[black] z-[1] m-[5px] px-2.5 py-[5px] rounded-lg border-[none] right-0 top-0"
          onClick={handleCopyResponse}
        >
          Copy
        </button>
        <div id="openai-response"></div>
      </div>
    </div>
  );
}
