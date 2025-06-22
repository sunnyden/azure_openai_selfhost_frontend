import { ipcMain } from "electron";
import { MCPConnector } from "./MCPConnector";
import { MCPConnectionRequest, MCPConnectionType, StdioMCPConfiguration } from "./type";
import { StdioMCPConnector } from "./StdioMCPConnector";

export class MCPConnectionManager {
    private activeConnector?: MCPConnector;

    constructor(private readonly window: Electron.BrowserWindow) {
        console.log("MCPConnectionManager initialized");
    }

    public start(){
        console.log("MCPConnectionManager started");
        ipcMain.on("mcp-start", (_, config: MCPConnectionRequest) => {
            console.log("MCPConnectionManager received mcp-start request", config);
            if (this.activeConnector) {
                this.activeConnector.stop();
            }
            
            this.activeConnector = this.createConnector(config);
            this.activeConnector.start();
        });
        ipcMain.on("mcp-stop", () => {
            if (this.activeConnector) {
                this.activeConnector.stop();
                this.activeConnector = undefined;
            }
        });
    }

    public stop() {
        if (this.activeConnector) {
            this.activeConnector.stop();
            this.activeConnector = undefined;
        }
        ipcMain.removeAllListeners("mcp-start");
        ipcMain.removeAllListeners("mcp-stop");
    }

    private createConnector(config: MCPConnectionRequest): MCPConnector {
        switch (config.type) {
            case MCPConnectionType.STDIO:
                return new StdioMCPConnector(config.config as StdioMCPConfiguration, this.window);
            default:
                throw new Error(`Unknown MCP connection type: ${config.type}`);
        }
    }
}