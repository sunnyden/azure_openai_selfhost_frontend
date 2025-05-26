import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
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

	// Add more APIs as needed for communication between main and renderer processes
});
