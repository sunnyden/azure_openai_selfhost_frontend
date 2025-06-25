import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { v4 as uuidv4 } from "uuid";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types";

export class ElectronIPCTransport implements Transport {
    constructor(private readonly mcpConnectionRequest: MCPConnectionRequest) {
        if (!window.electronAPI) {
            throw new Error(
                "ElectronIPCTransport is only available in desktop environment!"
            );
        }
        this.sessionId = uuidv4();
    }

    public async start(): Promise<void> {
        await window.electronAPI?.mcpStart(
            this.mcpConnectionRequest,
            this.sessionId!
        );
        window.electronAPI?.registerMCPMessageHandler(
            this.sessionId!,
            this.handleIncomingMessage.bind(this)
        );
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
        await window.electronAPI?.mcpStop(this.sessionId!);
        window.electronAPI?.mcpMessageRemoveListener(this.sessionId!);
        this.onclose?.();
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
