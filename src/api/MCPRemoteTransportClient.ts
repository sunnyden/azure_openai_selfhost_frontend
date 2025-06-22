import { IMCPRemoteTransportClient } from "./interface/ApiClient.interface";
import { IHttpContext } from "./interface/HttpContext.interface";

export class MCPRemoteTransportClient implements IMCPRemoteTransportClient {
    private socket?: WebSocket;
    private correlationId?: string;
    constructor(private readonly httpContext: IHttpContext) {}
    public startMcpServer(): Promise<void> {
        this.socket = new WebSocket(`wss://chat.hq.gd/api/mcp/connect`);
        return new Promise((resolve, reject) => {
            this.socket!.onopen = () => {
                console.log("WebSocket connection established");
                this.socket?.send(JSON.stringify({
                    type: "mcp-transport",
                    payload: {
                        correlationId: this.getMcpTransportCorrelationId(),
                        transportType: "websocket",
                    }
                }));
                resolve();
            };
            this.socket!.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };
            this.socket!.onclose = () => {
                console.log("WebSocket connection closed");
            };
            this.socket!.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    this.onData(event.data);
                } else {
                    console.warn("Received non-ArrayBuffer data:", event.data);
                }
            };
        });
    }
    public getMcpTransportCorrelationId(): string {
        throw new Error("Method not implemented.");
    }
    public stopMcpServer(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private onData(data: ArrayBuffer): void {
        if (!this.correlationId){
            this.correlationId = JSON.parse(new TextDecoder().decode(data)).correlationId;
            return;
        }
        window.electronAPI?.mcpMessage(data);
    }
}