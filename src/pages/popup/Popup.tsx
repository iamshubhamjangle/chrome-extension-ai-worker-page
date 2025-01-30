import React from "react";
import logo from "@assets/img/logo.svg";

export default function Popup() {
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
        >
          Clear
        </button>
        <div id="screenshot-container"></div>
      </div>
      <label htmlFor="prompt-textarea" className="text-orange-500">
        Write a prompt
      </label>
      <textarea
        id="prompt-textarea"
        className="w-full h-[100px] border box-border mx-0 my-[5px] p-2.5 rounded-lg border-solid border-orange-500 focus:border-orange-600 focus:outline-none"
        placeholder=""
      ></textarea>
      <div>
        <label htmlFor="framework-select" className="text-orange-500">
          Choose framework:
        </label>
        <select
          id="framework-select"
          className="w-full border bg-[white] text-sm mx-0 my-[5px] p-2.5 rounded-lg border-solid border-orange-500 focus:border-orange-600 focus:outline-none"
        >
          <option value="selenium">Selenium</option>
          <option value="cypress">Cypress</option>
        </select>
      </div>
      <button
        id="submit-button"
        className="bg-orange-500 rounded-full px-6 py-2 text-white text-xs font-bold mx-auto block cursor-pointer"
      >
        Run it
      </button>
      <div className="relative">
        <button className="absolute cursor-pointer bg-orange-100 font-semibold text-[black] z-[1] m-[5px] px-2.5 py-[5px] rounded-lg border-[none] right-0 top-0">
          Copy
        </button>
        <div id="openai-response"></div>
      </div>
    </div>
  );
}
