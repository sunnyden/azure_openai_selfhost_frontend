// Electron API declarations
declare global {
    interface MCPConfiguration {}
    interface StdioMCPConfiguration extends MCPConfiguration {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        cwd?: string;
    }
    interface MCPConnectionRequest {
        type: "stdio";
        config: MCPConfiguration;
    }
    interface Window {
        electronAPI?: {
            windowMinimize: () => Promise<void>;
            windowMaximize: () => Promise<void>;
            windowClose: () => Promise<void>;
            windowIsMaximized: () => Promise<boolean>;
            isElectron: boolean;
            openExternal: (url: string) => Promise<void>;
            getVersion: () => Promise<string>;
            mcpStart: (
                config: MCPConnectionRequest,
                sessionId: string
            ) => Promise<void>;
            mcpStop: (sessionId: string) => Promise<void>;
            mcpMessage: (
                message: ArrayBuffer,
                sessionId: string
            ) => Promise<void>;
            registerMCPMessageHandler: (
                sessionId: string,
                handler: (message: ArrayBuffer) => void
            ) => void;
            registerMCPStartSuccessHandler: (
                sessionId: string,
                handler: () => void
            ) => void;
            registerMCPStartErrorHandler: (
                sessionId: string,
                handler: (error: {
                    message: string;
                    config: MCPConnectionRequest;
                }) => void
            ) => void;
            registerMCPErrorHandler: (
                sessionId: string,
                handler: (error: { message: string; stack?: string }) => void
            ) => void;
            mcpMessageRemoveListener: (sessionId: string) => void;
        };
    }
}

export {};
