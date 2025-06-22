import { contextBridge, ipcRenderer } from "electron";
import { MCPConnectionRequest } from "./mcp/type";
import { register } from "module";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const handlers: Record<string, (buffer: ArrayBuffer) => void> = {};
ipcRenderer.on("mcp-message-reply", (event, message: ArrayBuffer) => {
	for (const key in handlers) {
		if (handlers.hasOwnProperty(key)) {
			handlers[key](message);
		}
	}
});

contextBridge.exposeInMainWorld("electronAPI", {
	// Window control APIs
	windowMinimize: () => ipcRenderer.invoke("window-minimize"),
	windowMaximize: () => ipcRenderer.invoke("window-maximize"),
	windowClose: () => ipcRenderer.invoke("window-close"),
	windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),

	// Check if running in electron
	isElectron: true,

	// Example API methods that could be used by the web app
	openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
	getVersion: () => ipcRenderer.invoke("get-version"),

	// MCP
	mcpStart: (config: MCPConnectionRequest) => ipcRenderer.send("mcp-start", config),
	mcpStop: () => ipcRenderer.send("mcp-stop"),
	mcpMessage: (message: ArrayBuffer) => ipcRenderer.send("mcp-message", message),
	registerMCPMessageHandler: (name: string, handler: (message: ArrayBuffer) => void) => {
		if (handlers[name]) {
			throw new Error(`Handler for ${name} already exists`);
		}
		handlers[name] = handler;
	},
	mcpMessageRemoveListener: (name: string) => {
		if (!handlers[name]) {
			throw new Error(`Handler for ${name} does not exist`);
		}
		delete handlers[name];
	}
});
