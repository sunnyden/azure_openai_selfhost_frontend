import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { IHttpContext } from "../interface/HttpContext.interface";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { WebSocketTransport } from "./WebSocketTransport";
import { IHubService } from "../interface/ApiClient.interface";
import { ElectronIPCTransport } from "./ElectronIPCTransport";
import { Tool } from "@modelcontextprotocol/sdk/types";

/**
 * MCPHubServer provides a centralized hub for managing multiple MCP (Model Context Protocol) servers.
 *
 * Key features:
 * - Manages multiple MCP client connections
 * - Prefixes tool names with client names to avoid conflicts (e.g., "clientA.tool_name")
 * - Properly disposes resources when stopped
 * - Supports dynamic addition/removal of clients
 * - Provides robust error handling and logging
 */
export class MCPHubServer implements IHubService {
    private server?: McpServer;
    public transport?: Transport;
    public clients: Map<string, Client> = new Map();
    public toolsMap: Map<string, Tool[]> = new Map();
    private registeredTools: Set<string> = new Set(); // Track registered tool names to avoid duplicates

    constructor(private readonly httpContext: IHttpContext) {
        // Server will be initialized in start() method
    }

    public async start(): Promise<void> {
        // Initialize server fresh each time to avoid duplicate tool registrations
        this.server = new McpServer({
            name: "mcp-server-hub",
            version: "1.0.0",
        });

        this.transport = new WebSocketTransport(
            "wss://chat.hq.gd/api/mcp/transport",
            this.httpContext
        );

        // Clear registered tools set to start fresh
        this.registeredTools.clear();

        // Register tools from all connected clients
        await this.registerAllClientTools();

        await this.server.connect(this.transport);
    }

    public async stop(): Promise<void> {
        // Close all client connections first
        for (const [clientName, client] of this.clients.entries()) {
            try {
                await client.close();
                console.log(`Closed client: ${clientName}`);
            } catch (error) {
                console.error(`Failed to close client ${clientName}:`, error);
            }
        }
        this.clients.clear();
        this.toolsMap.clear();

        // Then close the server and transport
        if (this.server && this.transport) {
            await this.server.close();
            this.server = undefined;
            this.transport = undefined;
        }

        // Clear registered tools when stopping
        this.registeredTools.clear();
    }

    public async addClient(
        config: MCPConnectionRequest,
        name: string
    ): Promise<void> {
        // Check if client already exists
        if (this.clients.has(name)) {
            throw new Error(`Client with name ${name} already exists.`);
        }

        const client = new Client({
            name: name,
            version: "1.0.0",
        });

        try {
            await new Promise((resolve, reject) => {
                client.onerror = (error: Error) => {
                    reject(error);
                };
                client.connect(new ElectronIPCTransport(config)).then(() => {
                    client.ping().then(resolve);
                });
            });

            this.clients.set(name, client);

            // If server is running, register tools from the new client
            if (this.server) {
                await this.registerClientTools(name, client);
            }
        } catch (error) {
            console.error(`Failed to add client ${name}:`, error);
            throw error;
        }
    }

    /**
     * Register tools from a specific client
     */
    private async registerClientTools(
        clientName: string,
        client: Client
    ): Promise<void> {
        if (!this.server) {
            return;
        }

        try {
            const tools = await client.listTools();
            for (const tool of tools.tools) {
                const sanitizedClientName = this.sanitizeName(clientName);
                const sanitizedToolName = this.sanitizeName(tool.name);
                const prefixedToolName = `${sanitizedClientName}-${sanitizedToolName}`;

                if (!this.registeredTools.has(prefixedToolName)) {
                    this.server.registerTool(
                        prefixedToolName,
                        {
                            description: `[${clientName}] ${tool.description || ""}`,
                            title: tool.title
                                ? `[${clientName}] ${tool.title}`
                                : prefixedToolName,
                            remoteInputSchema: tool.inputSchema,
                            remoteOutputSchema: tool.outputSchema,
                            remote: true,
                        },
                        (param: any) =>
                            client.callTool({
                                name: tool.name,
                                arguments: param,
                            }) as any
                    );
                    this.registeredTools.add(prefixedToolName);
                }
            }
        } catch (error) {
            console.error(
                `Failed to register tools from client ${clientName}:`,
                error
            );
        }
    }

    public async removeClient(name: string): Promise<void> {
        const client = this.clients.get(name);
        if (!client) {
            throw new Error(`Client with name ${name} does not exist.`);
        }

        try {
            // Remove tools registered by this client
            await this.unregisterClientTools(name);

            // Close and remove the client
            await client.close();
            this.clients.delete(name);

            // Remove tools from tools map
            this.toolsMap.delete(name);

            console.log(`Successfully removed client: ${name}`);
        } catch (error) {
            console.error(`Failed to remove client ${name}:`, error);
            // Still remove the client from our maps even if closing failed
            this.clients.delete(name);
            this.toolsMap.delete(name);
            throw error;
        }
    }

    /**
     * Unregister tools from a specific client
     */
    private async unregisterClientTools(clientName: string): Promise<void> {
        const sanitizedClientName = this.sanitizeName(clientName);
        // Remove all tools that start with the sanitized client name prefix
        const toolsToRemove = Array.from(this.registeredTools).filter(
            toolName => toolName.startsWith(`${sanitizedClientName}.`)
        );

        for (const toolName of toolsToRemove) {
            this.registeredTools.delete(toolName);
            // Note: McpServer doesn't have an unregister method, so we track this for next restart
        }
    }

    /**
     * Register tools from all connected clients with name prefixes to avoid conflicts
     */
    private async registerAllClientTools(): Promise<void> {
        if (!this.server) {
            throw new Error("Server not initialized");
        }

        for (const [clientName, client] of this.clients.entries()) {
            try {
                const tools = await client.listTools();
                for (const tool of tools.tools) {
                    const sanitizedClientName = this.sanitizeName(clientName);
                    const sanitizedToolName = this.sanitizeName(tool.name);
                    const prefixedToolName = `${sanitizedClientName}-${sanitizedToolName}`;

                    // Avoid registering the same tool multiple times
                    if (!this.registeredTools.has(prefixedToolName)) {
                        this.server.registerTool(
                            prefixedToolName,
                            {
                                description: `[${clientName}] ${tool.description || ""}`,
                                title: tool.title
                                    ? `[${clientName}] ${tool.title}`
                                    : prefixedToolName,
                                remoteInputSchema: tool.inputSchema,
                                remoteOutputSchema: tool.outputSchema,
                                remote: true,
                            },
                            (param: any) =>
                                client.callTool({
                                    name: tool.name, // Use original tool name when calling the client
                                    arguments: param,
                                }) as any
                        );
                        this.registeredTools.add(prefixedToolName);
                    }
                }
            } catch (error) {
                console.error(
                    `Failed to register tools from client ${clientName}:`,
                    error
                );
            }
        }
    }

    public getSessionId(): string | undefined {
        return this.transport?.sessionId;
    }

    public async listAllTools(): Promise<Map<string, Tool[]>> {
        // Update tools map with latest tools from all clients
        for (const [clientName, client] of this.clients.entries()) {
            try {
                const tools = await client.listTools();
                this.toolsMap.set(clientName, tools.tools);
            } catch (error) {
                console.warn(
                    `Failed to list tools from client ${clientName}:`,
                    error
                );
                // Keep the existing tools in the map if the client is temporarily unavailable
            }
        }
        return this.toolsMap;
    }

    /**
     * Get the sanitized version of a client name (useful for debugging)
     */
    public getSanitizedClientName(clientName: string): string {
        return this.sanitizeName(clientName);
    }

    /**
     * Get all registered tool names with their client prefixes
     */
    public getRegisteredToolNames(): string[] {
        return Array.from(this.registeredTools);
    }

    /**
     * Check if a client exists
     */
    public hasClient(name: string): boolean {
        return this.clients.has(name);
    }

    /**
     * Get the list of connected client names
     */
    public getClientNames(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Check if the server is running
     */
    public isRunning(): boolean {
        return this.server !== undefined && this.transport !== undefined;
    }

    /**
     * Restart the server (useful when tool registrations need to be refreshed)
     */
    public async restart(): Promise<void> {
        console.log("Restarting MCP Hub Server...");
        try {
            if (this.isRunning()) {
                console.log("Stopping existing server...");
                await this.stop();
            }
            console.log("Starting server...");
            await this.start();
            console.log("MCP Hub Server restarted successfully");
        } catch (error) {
            console.error("Failed to restart MCP Hub Server:", error);
            throw error;
        }
    }

    /**
     * Sanitize a name to match the MCP tool name pattern: ^[a-zA-Z0-9_\.-]+$
     * This replaces invalid characters with underscores and ensures the name is valid
     */
    private sanitizeName(name: string): string {
        if (!name) return "unnamed";

        // Replace any character that's not alphanumeric, underscore, dot, or hyphen with underscore
        let sanitized = name.replace(/[^a-zA-Z0-9_.-]/g, "_");

        // Ensure it doesn't start with a dot or hyphen (though the pattern allows it, it's better practice)
        sanitized = sanitized.replace(/^[.-]/, "_");

        // Remove consecutive underscores
        sanitized = sanitized.replace(/_+/g, "_");

        // Remove trailing underscores
        sanitized = sanitized.replace(/_+$/, "");

        // Ensure it's not empty after sanitization
        if (!sanitized) return "client";

        return sanitized;
    }
}
