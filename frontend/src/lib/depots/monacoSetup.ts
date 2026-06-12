"use client";

import { loader } from "@monaco-editor/react";

export const MONACO_VS = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";
const MONACO_ESM = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm";

function esmWorker(path: string): Worker {
  return new Worker(`${MONACO_ESM}/${path}`, { type: "module" });
}

if (typeof globalThis !== "undefined") {
  globalThis.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === "json") {
        return esmWorker("vs/language/json/json.worker.js");
      }
      if (label === "css" || label === "scss" || label === "less") {
        return esmWorker("vs/language/css/css.worker.js");
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        return esmWorker("vs/language/html/html.worker.js");
      }
      if (label === "typescript" || label === "javascript") {
        return esmWorker("vs/language/typescript/ts.worker.js");
      }
      return esmWorker("vs/editor/editor.worker.js");
    },
  };
}

loader.config({
  paths: { vs: MONACO_VS },
});
