export interface MCPConfiguration {}
export interface StdioMCPConfiguration extends MCPConfiguration {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}

export interface MCPConnectionRequest {
    type: MCPConnectionType;
    config: MCPConfiguration;
}

export enum MCPConnectionType {
    STDIO = "stdio",
}
