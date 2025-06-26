// Dynamic Monaco Editor loader
let monacoConfigured = false;

export async function loadMonacoEditor() {
    if (monacoConfigured) {
        const { Editor } = await import("@monaco-editor/react");
        return { Editor };
    }

    // Dynamic import of Monaco configuration and workers
    const [
        { loader },
        monaco,
        editorWorker,
        jsonWorker,
        cssWorker,
        htmlWorker,
        tsWorker,
        { Editor },
    ] = await Promise.all([
        import("@monaco-editor/react"),
        import("monaco-editor"),
        import("monaco-editor/esm/vs/editor/editor.worker?worker"),
        import("monaco-editor/esm/vs/language/json/json.worker?worker"),
        import("monaco-editor/esm/vs/language/css/css.worker?worker"),
        import("monaco-editor/esm/vs/language/html/html.worker?worker"),
        import("monaco-editor/esm/vs/language/typescript/ts.worker?worker"),
        import("@monaco-editor/react"),
    ]);

    // Configure Monaco environment
    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === "json") {
                return new jsonWorker.default();
            }
            if (label === "css" || label === "scss" || label === "less") {
                return new cssWorker.default();
            }
            if (
                label === "html" ||
                label === "handlebars" ||
                label === "razor"
            ) {
                return new htmlWorker.default();
            }
            if (label === "typescript" || label === "javascript") {
                return new tsWorker.default();
            }
            return new editorWorker.default();
        },
    };

    // Configure the loader
    loader.config({ monaco: monaco.default });

    monacoConfigured = true;

    return { Editor };
}

