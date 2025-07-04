import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "https://chat.hq.gd",
                changeOrigin: true,
                secure: true,
            },
        },
    },
    build: {
        outDir: "build",
        assetsDir: "static",
        rollupOptions: {
            maxParallelFileOps: 50,
            output: {
                // Chunk splitting strategy
                manualChunks: {
                    // React and core libraries
                    "react-core": ["react", "react-dom"],

                    // Fluent UI components
                    "fluent-ui": [
                        "@fluentui/react-components",
                        "@fluentui/react-icons",
                    ],

                    // Monaco Editor and workers (will be dynamically loaded)
                    "monaco-editor": ["monaco-editor", "@monaco-editor/react"],
                },
                assetFileNames: assetInfo => {
                    const info = assetInfo.name.split(".");
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return `static/media/[name]-[hash][extname]`;
                    }
                    if (/woff2?|eot|ttf|otf/i.test(ext)) {
                        return `static/media/[name]-[hash][extname]`;
                    }
                    if (ext === "css") {
                        return `static/css/[name]-[hash][extname]`;
                    }
                    return `static/[ext]/[name]-[hash][extname]`;
                },
                chunkFileNames: "static/js/[name]-[hash].js",
                entryFileNames: "static/js/[name]-[hash].js",
            },
        },
    },
    define: {
        "process.env.PUBLIC_URL": JSON.stringify(""),
        "process.env.NODE_ENV": JSON.stringify(
            process.env.NODE_ENV || "development"
        ),
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "@fluentui/react-components",
            "@fluentui/react-icons",
        ],
        exclude: ["monaco-editor", "@monaco-editor/react"],
    },
    worker: {
        format: "es",
    },
    assetsInclude: ["**/*.woff", "**/*.woff2", "**/*.ttf", "**/*.eot"],
});
