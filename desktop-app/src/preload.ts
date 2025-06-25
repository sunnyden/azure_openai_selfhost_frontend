import { contextBridge, ipcRenderer } from "electron";
import { MCPConnectionRequest } from "./mcp/type";

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
    mcpStart: (config: MCPConnectionRequest, sessionId: string) =>
        ipcRenderer.send("mcp-start", config, sessionId),
    mcpStop: (sessionId: string) => ipcRenderer.send("mcp-stop", sessionId),
    mcpMessage: (message: ArrayBuffer, sessionId: string) =>
        ipcRenderer.send(`mcp-message-${sessionId}`, message),
    registerMCPMessageHandler: (
        sessionId: string,
        handler: (message: ArrayBuffer) => void
    ) => {
        ipcRenderer.on(`mcp-message-reply-${sessionId}`, (event, message) => {
            handler(message);
        });
    },
    registerMCPStartSuccessHandler: (
        sessionId: string,
        handler: () => void
    ) => {
        ipcRenderer.on(`mcp-start-success-${sessionId}`, event => {
            handler();
        });
    },
    registerMCPStartErrorHandler: (
        sessionId: string,
        handler: (error: {
            message: string;
            config: MCPConnectionRequest;
        }) => void
    ) => {
        ipcRenderer.on(`mcp-start-error-${sessionId}`, (event, error) => {
            handler(error);
        });
    },
    registerMCPErrorHandler: (
        sessionId: string,
        handler: (error: { message: string; stack?: string }) => void
    ) => {
        ipcRenderer.on(`mcp-error-${sessionId}`, (event, error) => {
            handler(error);
        });
    },
    mcpMessageRemoveListener: (sessionId: string) => {
        ipcRenderer.removeAllListeners(`mcp-message-reply-${sessionId}`);
        ipcRenderer.removeAllListeners(`mcp-start-success-${sessionId}`);
        ipcRenderer.removeAllListeners(`mcp-start-error-${sessionId}`);
        ipcRenderer.removeAllListeners(`mcp-error-${sessionId}`);
    },
});

