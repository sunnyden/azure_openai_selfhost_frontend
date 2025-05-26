import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
	// Example API methods that could be used by the web app
	openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
	getVersion: () => ipcRenderer.invoke("get-version"),

	// Add more APIs as needed for communication between main and renderer processes
});
