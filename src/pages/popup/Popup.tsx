import { Camera, Copy, CopyIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StorageDataType {
  id: number;
  screenshot: string;
  selectedHTML: string;
  timestamp: string;
}

export default function Popup() {
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState("cypress");
  const [storageData, setStorageData] = useState<StorageDataType[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    interface StorageChange {
      [key: string]: chrome.storage.StorageChange;
    }

    // Initial Load
    chrome.storage.local.get(["data"], (result) => {
      if (result.data) {
        setStorageData(result.data);
      }
    });

    // Subsequences changes (May be not needed)
    const handleStorageChange = (changes: StorageChange, namespace: string) => {
      console.log("changes", changes);

      if (namespace === "local" && changes.data) {
        setStorageData(changes.data.newValue);
        setIsCapturing(false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleClearScreenshots = () => {
    setStorageData([]);
    chrome.storage.local.remove("data");
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
    }
  };

  // Event handler for capturing screenshot
  const handleScreenshotButtonClick = async () => {
    setError(null);
    setIsCapturing(true);

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tabs || tabs.length === 0) {
        throw new Error("Please click on the webpage first, then try again");
      }

      const tab = tabs[0];
      if (!tab || !tab.id) {
        throw new Error(
          "Cannot access the current tab. Please refresh the page."
        );
      }

      const response = await chrome.runtime.sendMessage({
        action: "check-active-tab-is-selected",
      });

      if (response.error) {
        console.log("check-active-tab-is-selected:", response);
        throw new Error(response.error);
      }

      // Wait a moment for the content script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      await chrome.tabs.sendMessage(tab.id, { action: "start-screenshot" });
    } catch (err: any) {
      setError(err.message);
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setResponse(""); // Reset response before starting new stream

      const response = await fetch("http://localhost:4000/generate-test-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          framework,
          data: storageData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setResponse((prevResponse) => prevResponse + chunk);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[35rem] p-5 rounded-[10px]">
      <h2 className="text-xl font-bold text-center">
        Screenshots to Automate Code
      </h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="relative">
        <button
          id="clear-screenshot-button"
          className="absolute cursor-pointer bg-white font-semibold text-[black] z-[1] m-[5px] px-2.5 py-[5px] rounded-lg border-[none] right-0 top-0"
          onClick={handleClearScreenshots}
        >
          Clear
        </button>
        <div
          className="relative flex overflow-x-auto items-center min-h-[100px] border bg-[rgb(255,228,219)] my-2.5 p-3 rounded-lg border-dashed border-[coral] cursor-pointer"
          onClick={handleScreenshotButtonClick}
        >
          {storageData && storageData.length > 0 && (
            <div className="flex gap-2 mr-3">
              {storageData.map((data, index) => (
                <div key={index} className="w-[100px] h-[100px] relative">
                  <img
                    src={data.screenshot}
                    alt="Captured screenshot"
                    className="absolute w-full h-full object-contain rounded border border-solid border-orange-500"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center h-full mx-2">
            <Camera size={20} className="mr-2" />
            {isCapturing ? "Capturing..." : "Click here to take a screenshot"}
          </div>
        </div>
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
        className={`rounded-full px-6 py-2 text-white text-xs font-bold mx-auto block cursor-pointer ${
          loading ? "bg-neutral-400" : "bg-orange-500"
        }`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "Run it"}
      </button>
      {response && (
        <div className="relative">
          <button
            className="absolute cursor-pointer bg-orange-100 font-semibold text-[black] z-[1] m-[5px] p-2.5 rounded-lg border-[none] right-0 top-0"
            onClick={handleCopyResponse}
          >
            <CopyIcon size={14} />
          </button>
          <div className="border bg-[#f9f9f9] mx-0 my-2.5 pt-[35px] pb-2.5 px-2.5 rounded-lg border-solid border-[#a1a1a1]">
            <Markdown remarkPlugins={[remarkGfm]}>{response}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
