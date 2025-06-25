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
            (_, config: MCPConnectionRequest, sessionId: string) => {
                console.log(
                    "MCPConnectionManager received mcp-start request",
                    config
                );

                const connector = this.createConnector(config, sessionId);
                this.activeConnectors.set(sessionId, connector);
                connector.start();
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
