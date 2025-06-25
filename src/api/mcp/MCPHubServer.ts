import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { IHttpContext } from "../interface/HttpContext.interface";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { WebSocketTransport } from "./WebSocketTransport";
import {
  IHubService,
  MCPConnectionRequest,
} from "../interface/ApiClient.interface";
import { ElectronIPCTransport } from "./ElectronIPCTransport";
import { Tool } from "@modelcontextprotocol/sdk/types";

export class MCPHubServer implements IHubService {
  public readonly server: McpServer;
  public transport?: Transport;
  public clients: Map<string, Client> = new Map();
  public toolsMap: Map<string, Tool[]> = new Map();
  constructor(private readonly httpContext: IHttpContext) {
    this.server = new McpServer({
      name: "mcp-server-hub",
      version: "1.0.0",
    });
  }

  public async start(): Promise<void> {
    this.transport = new WebSocketTransport(
      "wss://chat.hq.gd/api/mcp/transport",
      this.httpContext
    );
    for (const client of this.clients.values()) {
      const tools = await client.listTools();
      for (const tool of tools.tools) {
        this.server.registerTool(
          tool.name,
          {
            description: tool.description,
            title: tool.title,
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
      }
    }
    await this.server.connect(this.transport);
  }

  public async stop(): Promise<void> {
    if (this.transport) {
      await this.server.close();
      this.transport = undefined;
    }
  }

  public async addClient(config: MCPConnectionRequest, name: string) {
    const client = new Client({
      name: name,
      version: "1.0.0",
    });
    await client.connect(new ElectronIPCTransport(config));
    this.clients.set(name, client);
  }

  public async removeClient(name: string) {
    const client = this.clients.get(name);
    if (client) {
      await client.close();
      this.clients.delete(name);
    } else {
      throw new Error(`Client with name ${name} does not exist.`);
    }
  }

  public getSessionId(): string | undefined {
    return this.transport?.sessionId;
  }

  public async listAllTools() {
    for (const key of this.clients.keys()) {
      const client = this.clients.get(key);
      if (client) {
        const tools = await client.listTools();
        this.toolsMap.set(key, tools.tools);
      } else {
        console.warn(`Client with name ${key} does not exist.`);
      }
    }
    return this.toolsMap;
  }
}
