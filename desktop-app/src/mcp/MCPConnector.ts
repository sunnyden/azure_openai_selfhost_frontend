import { ipcMain, ipcRenderer } from "electron";

export abstract class MCPConnector {
  constructor(
    private readonly window: Electron.BrowserWindow,
    private readonly sessionId: string
  ) {}

  public start() {
    console.log("MCPConnector started");
    ipcMain.on(`mcp-message-${this.sessionId}`, (_, message: ArrayBuffer) => {
      this.sendToServer(message);
    });
    this.connect();
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

  protected abstract connect(): void;

  protected abstract disconnect(): void;

  protected abstract sendToServer(data: ArrayBuffer): void;
}
