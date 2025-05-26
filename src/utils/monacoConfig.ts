// Monaco Editor configuration for proper worker loading
// This prevents the "Could not create web worker(s). Falling back to loading web worker code in main thread" error

// For development, disable workers to avoid module loading issues
// For production, use the proper worker files
(window as any).MonacoEnvironment = {
	getWorker: function (workerId: string, label: string) {
		const isDevelopment = process.env.NODE_ENV === "development";

		if (isDevelopment) {
			// In development, return null to force main thread execution
			// This avoids all worker loading issues during development
			return null;
		}

		// In production, use the copied worker files
		const baseUrl = process.env.PUBLIC_URL || "";

		const getWorkerUrl = (label: string) => {
			switch (label) {
				case "json":
					return `${baseUrl}/static/js/vs/language/json/json.worker.js`;
				case "css":
				case "scss":
				case "less":
					return `${baseUrl}/static/js/vs/language/css/css.worker.js`;
				case "html":
				case "handlebars":
				case "razor":
					return `${baseUrl}/static/js/vs/language/html/html.worker.js`;
				case "typescript":
				case "javascript":
					return `${baseUrl}/static/js/vs/language/typescript/ts.worker.js`;
				default:
					return `${baseUrl}/static/js/vs/editor/editor.worker.js`;
			}
		};

		try {
			return new Worker(getWorkerUrl(label));
		} catch (error) {
			console.warn(
				"Failed to create worker, falling back to main thread:",
				error
			);
			return null;
		}
	},
};

// Export an empty object to make this a proper module
export {};
