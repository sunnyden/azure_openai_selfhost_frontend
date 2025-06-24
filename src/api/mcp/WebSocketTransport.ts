import {
  Transport,
  TransportSendOptions,
} from "@modelcontextprotocol/sdk/shared/transport";
import { IHttpContext } from "../interface/HttpContext.interface";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types";

export class WebSocketTransport implements Transport {
  public onclose?: (() => void) | undefined;
  public onerror?: ((error: Error) => void) | undefined;
  public onmessage?:
    | ((message: JSONRPCMessage, extra?: { authInfo?: AuthInfo }) => void)
    | undefined;
  public sessionId?: string | undefined;

  private socket?: WebSocket;
  private stopRequested = false;
  private intervalHandler?: number;

  constructor(
    private readonly endpoint: string,
    private readonly httpContext: IHttpContext
  ) {
    this.intervalHandler = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            Token: this.httpContext.authToken,
          })
        ); // Send a ping message to keep the connection alive
      }
    }, 20000); // Check every 20 seconds
  }

  public async start(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn("WebSocket is already connected.");
      return;
    }

    try {
      await this.initializeSocket();
      this.socket!.onmessage = event => {
        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const utf8Decoder = new TextDecoder("utf-8");
            const jsonString = utf8Decoder.decode(arrayBuffer);
            let message: JSONRPCMessage;
            try {
              message = JSON.parse(jsonString);
              this.onmessage?.(message);
            } catch (error) {
              this.onerror?.(new Error("Failed to parse JSON message"));
              console.error("Failed to parse JSON message:", error);
              return;
            }
          };
          reader.readAsArrayBuffer(event.data);
        } else if (typeof event.data === "string") {
          this.handleControlMessage(event.data);
        }
      };
      this.socket!.onclose = () => {
        console.log("WebSocket connection closed.");
        if (!this.stopRequested) {
          // Optionally implement auto-reconnect logic here
          console.warn(
            "WebSocket connection closed unexpectedly. Attempting to reconnect..."
          );
          this.socket = undefined; // Reset socket
          this.start();
          return;
        }
        this.onclose?.();
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      throw error;
    }
  }

  public send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(message) + "\n";
      const data = new TextEncoder().encode(dataStr);
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected.");
        reject(new Error("WebSocket is not connected."));
        return;
      }

      this.socket.send(data);
      resolve();
    });
  }
  close(): Promise<void> {
    return new Promise(resolve => {
      this.stopRequested = true;
      this.socket?.close();
      if (this.intervalHandler) {
        window.clearInterval(this.intervalHandler);
        this.intervalHandler = undefined;
      }
      resolve();
    });
  }

  private initializeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.endpoint);
      this.socket.onopen = () => {
        console.log("WebSocket connection established.");
        this.socket!.send(
          JSON.stringify({
            Token: this.httpContext.authToken,
          })
        );
        resolve();
      };
      this.socket.onerror = error => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }

  private handleControlMessage(data: string): void {
    const correlationId = JSON.parse(data).CorrelationId;
    if (!correlationId) {
      console.error("No correlation ID found in control message.");
      return;
    }
    this.sessionId = correlationId;
  }
}
