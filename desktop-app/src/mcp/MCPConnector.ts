import { ipcMain, ipcRenderer } from "electron";

export abstract class MCPConnector {
    constructor(
        private readonly window: Electron.BrowserWindow,
        private readonly sessionId: string
    ) {}

    public start() {
        console.log("MCPConnector started");
        ipcMain.on(
            `mcp-message-${this.sessionId}`,
            (_, message: ArrayBuffer) => {
                this.sendToServer(message);
            }
        );

        try {
            this.connect();
        } catch (error) {
            // If connection fails, send error to renderer process
            this.onError(
                error instanceof Error
                    ? error
                    : new Error("Unknown connection error")
            );
            throw error; // Re-throw to be caught by MCPConnectionManager
        }
    }

    public stop() {
        this.disconnect();
        ipcMain.removeAllListeners(`mcp-message-${this.sessionId}`);
    }

    protected onMessageReceived(message: ArrayBuffer): void {
        this.window.webContents.send(
            `mcp-message-reply-${this.sessionId}`,
            message
        );
    }

    protected onError(error: Error): void {
        console.error("MCPConnector error:", error);
        this.window.webContents.send(`mcp-error-${this.sessionId}`, {
            message: error.message,
            stack: error.stack,
        });
    }

    protected abstract connect(): void;

    protected abstract disconnect(): void;

    protected abstract sendToServer(data: ArrayBuffer): void;
}
