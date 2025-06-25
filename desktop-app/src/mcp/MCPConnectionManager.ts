import { ipcMain } from "electron";
import { MCPConnector } from "./MCPConnector";
import {
    MCPConnectionRequest,
    MCPConnectionType,
    StdioMCPConfiguration,
} from "./type";
import { StdioMCPConnector } from "./StdioMCPConnector";

export class MCPConnectionManager {
    private activeConnectors: Map<string, MCPConnector>;

    constructor(private readonly window: Electron.BrowserWindow) {
        console.log("MCPConnectionManager initialized");
        this.activeConnectors = new Map<string, MCPConnector>();
    }

    public start() {
        console.log("MCPConnectionManager started");
        ipcMain.on(
            "mcp-start",
            (event, config: MCPConnectionRequest, sessionId: string) => {
                console.log(
                    "MCPConnectionManager received mcp-start request",
                    config
                );

                try {
                    const connector = this.createConnector(config, sessionId);
                    this.activeConnectors.set(sessionId, connector);
                    connector.start();

                    // Send success confirmation
                    event.sender.send(`mcp-start-success-${sessionId}`);
                } catch (error) {
                    console.error("Failed to start MCP connector:", error);

                    // Send error back to renderer process
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred while starting MCP server";

                    event.sender.send(`mcp-start-error-${sessionId}`, {
                        message: errorMessage,
                        config: config,
                    });
                }
            }
        );
        ipcMain.on("mcp-stop", (_, sessionId: string) => {
            const connector = this.activeConnectors.get(sessionId);
            if (connector) {
                connector.stop();
                this.activeConnectors.delete(sessionId);
            }
        });
    }

    public stop() {
        for (const connector of this.activeConnectors.values()) {
            connector.stop();
        }
        this.activeConnectors.clear();
        ipcMain.removeAllListeners("mcp-start");
        ipcMain.removeAllListeners("mcp-stop");
    }

    private createConnector(
        config: MCPConnectionRequest,
        sessionId: string
    ): MCPConnector {
        switch (config.type) {
            case MCPConnectionType.STDIO:
                return new StdioMCPConnector(
                    config.config as StdioMCPConfiguration,
                    this.window,
                    sessionId
                );
            default:
                throw new Error(`Unknown MCP connection type: ${config.type}`);
        }
    }
}

