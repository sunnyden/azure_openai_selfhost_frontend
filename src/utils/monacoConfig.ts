// Monaco Editor configuration for proper worker loading with monaco-editor-webpack-plugin

(window as any).MonacoEnvironment = {
	getWorker: function (workerId: string, label: string) {
		// The monaco-editor-webpack-plugin handles worker creation automatically
		// We just need to return the worker based on the label
		// The plugin will generate the proper worker files and handle AMD/CommonJS issues

		const getWorkerUrl = (label: string) => {
			const baseUrl = process.env.PUBLIC_URL || "";

			switch (label) {
				case "json":
					return `${baseUrl}/json.worker.js`;
				case "css":
				case "scss":
				case "less":
					return `${baseUrl}/css.worker.js`;
				case "html":
				case "handlebars":
				case "razor":
					return `${baseUrl}/html.worker.js`;
				case "typescript":
				case "javascript":
					return `${baseUrl}/ts.worker.js`;
				default:
					return `${baseUrl}/editor.worker.js`;
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
