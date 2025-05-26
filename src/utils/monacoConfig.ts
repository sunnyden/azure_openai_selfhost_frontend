import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Configure Monaco Editor worker paths
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './static/js/json.worker.bundle.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './static/js/css.worker.bundle.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './static/js/html.worker.bundle.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './static/js/ts.worker.bundle.js';
    }
    return './static/js/editor.worker.bundle.js';
  }
};

// Configure the loader to use the local monaco-editor package
loader.config({ monaco });

export { monaco };
