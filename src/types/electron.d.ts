// Electron API declarations
declare interface MCPConfiguration{

}
declare interface StdioMCPConfiguration extends MCPConfiguration {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}

declare interface MCPConnectionRequest {
    type: "stdio";
    config: MCPConfiguration;
}

declare global {
	interface Window {
		electronAPI?: {
			windowMinimize: () => Promise<void>;
			windowMaximize: () => Promise<void>;
			windowClose: () => Promise<void>;
			windowIsMaximized: () => Promise<boolean>;
			isElectron: boolean;
			openExternal: (url: string) => Promise<void>;
			getVersion: () => Promise<string>;
			mcpStart: (config: MCPConnectionRequest) => Promise<void>;
			mcpStop: () => Promise<void>;
			mcpMessage: (message: ArrayBuffer) => Promise<void>;
			registerMCPMessageHandler: (name: string, handler: (message: ArrayBuffer) => void) => void;
			mcpMessageRemoveListener: (name: string) => void;
		};
	}
}

export {};
