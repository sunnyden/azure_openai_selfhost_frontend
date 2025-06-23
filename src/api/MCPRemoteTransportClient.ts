import { IMCPRemoteTransportClient } from "./interface/ApiClient.interface";
import { IHttpContext } from "./interface/HttpContext.interface";

export class MCPRemoteTransportClient implements IMCPRemoteTransportClient {
    private socket?: WebSocket;
    private correlationId?: string;
    constructor(private readonly httpContext: IHttpContext) {}
    public async startMcpServer(command: string, args: string[]): Promise<void> {
        await window.electronAPI?.mcpStart({
            type: "stdio",
            config: {
                command: command,
                args: args,
            }
        });
        
        this.socket = new WebSocket(`wss://chat.hq.gd/api/mcp/connect`);
        return new Promise((resolve, reject) => {
            this.socket!.onerror = (error) => {
                reject(error);
            };
            this.socket!.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    this.onMcpClientData(event.data);
                } else if (typeof event.data === "string") {
                    this.onControlMessage(event.data);
                }
                if (!!this.correlationId){
                    resolve();
                }
            };
        });
    }
    public getMcpTransportCorrelationId(): string {
        return this.correlationId || "";
    }
    public stopMcpServer(): Promise<void> {
        this.socket?.close();
        return window.electronAPI?.mcpStop() || Promise.resolve();
    }

    private onControlMessage(data: string): void {
        const parsedData = JSON.parse(data);
        this.correlationId = parsedData.correlationId;
        if (!this.correlationId) {
            console.error("No correlation ID found in control message.");
            return;
        }
        window.electronAPI?.registerMCPMessageHandler(this.correlationId, this.onMcpServiceData.bind(this));
    }

    private onMcpServiceData(data: ArrayBuffer): void {
        if (!this.correlationId) {
            console.error("No correlation ID set for MCP response.");
            return;
        }
        console.log("MCP Service Data Received:", new TextDecoder().decode(data));
        this.socket?.send(data);
    }

    private onMcpClientData(data: ArrayBuffer): void {
        if (!this.correlationId){
            this.correlationId = JSON.parse(new TextDecoder().decode(data)).correlationId;
            return;
        }
        console.log("MCP Client Data Received:", new TextDecoder().decode(data));
        window.electronAPI?.mcpMessage(data);
    }
}