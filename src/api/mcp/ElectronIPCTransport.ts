import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { v4 as uuidv4 } from "uuid";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types";

export class ElectronIPCTransport implements Transport {
    private startPromise?: Promise<void>;
    private startResolve?: () => void;
    private startReject?: (error: Error) => void;

    constructor(private readonly mcpConnectionRequest: MCPConnectionRequest) {
        if (!window.electronAPI) {
            throw new Error(
                "ElectronIPCTransport is only available in desktop environment!"
            );
        }
        this.sessionId = uuidv4();
    }

    public async start(): Promise<void> {
        if (this.startPromise) {
            return this.startPromise;
        }

        this.startPromise = new Promise<void>((resolve, reject) => {
            this.startResolve = resolve;
            this.startReject = reject;
        });

        // Register handlers before starting
        window.electronAPI?.registerMCPMessageHandler(
            this.sessionId!,
            this.handleIncomingMessage.bind(this)
        );

        window.electronAPI?.registerMCPStartSuccessHandler(
            this.sessionId!,
            () => {
                console.log("MCP connection started successfully");
                this.startResolve?.();
            }
        );

        window.electronAPI?.registerMCPStartErrorHandler(
            this.sessionId!,
            error => {
                console.error("MCP connection failed to start:", error);
                this.startReject?.(
                    new Error(
                        `Failed to start MCP server: ${error.message}. Please check your configuration and try again.`
                    )
                );
            }
        );

        window.electronAPI?.registerMCPErrorHandler(this.sessionId!, error => {
            console.error("MCP runtime error:", error);
            this.onerror?.(
                new Error(
                    `MCP server error: ${error.message}. The server may have crashed or become unresponsive.`
                )
            );
        });

        // Start the MCP connection
        await window.electronAPI?.mcpStart(
            this.mcpConnectionRequest,
            this.sessionId!
        );

        return this.startPromise;
    }

    public async send(message: JSONRPCMessage): Promise<void> {
        const strMsg = JSON.stringify(message) + "\n";
        const utf8Buffer = new TextEncoder().encode(strMsg);
        await window.electronAPI?.mcpMessage(
            utf8Buffer.buffer,
            this.sessionId!
        );
    }

    public async close(): Promise<void> {
        try {
            await window.electronAPI?.mcpStop(this.sessionId!);
        } catch (error) {
            console.error("Error stopping MCP server:", error);
        } finally {
            window.electronAPI?.mcpMessageRemoveListener(this.sessionId!);
            this.onclose?.();

            // Reset start promise state
            this.startPromise = undefined;
            this.startResolve = undefined;
            this.startReject = undefined;
        }
    }

    onclose?: (() => void) | undefined;
    onerror?: ((error: Error) => void) | undefined;
    onmessage?:
        | ((message: JSONRPCMessage, extra?: { authInfo?: AuthInfo }) => void)
        | undefined;
    sessionId?: string | undefined;

    private handleIncomingMessage(buffer: ArrayBuffer) {
        const utf8Decoder = new TextDecoder("utf-8");
        const jsonString = utf8Decoder.decode(buffer);
        let message: JSONRPCMessage;
        try {
            message = JSON.parse(jsonString);
            this.onmessage?.(message);
        } catch (error) {
            this.onerror?.(new Error("Failed to parse JSON message"));
            console.error("Failed to parse JSON message:", error);
            return;
        }
    }
}

