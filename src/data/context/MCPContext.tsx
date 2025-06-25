import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { useApiClient } from "./useApiClient";
import { MCPServerConfig } from "../../api/interface/ApiClient.interface";
import { isElectron } from "../../utils/electronUtils";

interface MCPContextValue {
    isHubRunning: boolean;
    servers: MCPServerConfig[];
    availableTools: Map<string, any[]>;
    addServer: (name: string, config: MCPConnectionRequest) => Promise<void>;
    removeServer: (name: string) => Promise<void>;
    startHub: () => Promise<void>;
    stopHub: () => Promise<void>;
    refreshTools: () => Promise<void>;
    validateServer: (
        name: string,
        command: string,
        args: string[]
    ) => Promise<boolean>;
    isConfigDialogOpen: boolean;
    openConfigDialog: () => void;
    closeConfigDialog: () => void;
    exportConfigurations: () => string;
    importConfigurations: (jsonString: string) => Promise<void>;
    clearAllConfigurations: () => void;
    debugLocalStorage: () => void;
}

const MCPContext = createContext<MCPContextValue | null>(null);

export function MCPProvider({ children }: { children: React.ReactNode }) {
    const apiClient = useApiClient();
    const [isHubRunning, setIsHubRunning] = useState(false);
    const [servers, setServers] = useState<MCPServerConfig[]>([]);
    const [availableTools, setAvailableTools] = useState<Map<string, any[]>>(
        new Map()
    );
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false); // Track if localStorage has been loaded

    const refreshTools = useCallback(async () => {
        if (isHubRunning) {
            try {
                const tools = await apiClient.mcpHubService.listAllTools();
                setAvailableTools(tools);
            } catch (error) {
                console.error("Failed to refresh tools:", error);
            }
        }
    }, [apiClient, isHubRunning]);

    const addServer = useCallback(
        async (name: string, config: MCPConnectionRequest) => {
            try {
                // Check if hub is running and add the client
                if (isHubRunning) {
                    await apiClient.mcpHubService.addClient(config, name);
                    await refreshTools();
                }

                // Update local state
                const newServer: MCPServerConfig = { name, config };
                setServers(prevServers => {
                    const filtered = prevServers.filter(s => s.name !== name);
                    return [...filtered, newServer];
                });
            } catch (error) {
                console.error("Failed to add MCP server:", error);
                throw error;
            }
        },
        [apiClient, isHubRunning, refreshTools]
    );

    const removeServer = useCallback(
        async (name: string) => {
            try {
                // Remove from hub if it's running
                await apiClient.mcpHubService.removeClient(name);
                if (isHubRunning) {
                    await refreshTools();
                }

                // Update local state
                setServers(prevServers =>
                    prevServers.filter(s => s.name !== name)
                );
            } catch (error) {
                console.error("Failed to remove MCP server:", error);
                throw error;
            }
        },
        [apiClient, isHubRunning, refreshTools]
    );

    const startHub = useCallback(async () => {
        try {
            // Add all configured servers to the hub
            for (const server of servers) {
                try {
                    await apiClient.mcpHubService.addClient(
                        server.config,
                        server.name
                    );
                } catch (error) {
                    console.error(
                        `Failed to add server ${server.name} to hub:`,
                        error
                    );
                }
            }

            // Start the hub service
            await apiClient.mcpHubService.start();
            setIsHubRunning(true);
        } catch (error) {
            console.error("Failed to start MCP hub:", error);
            throw error;
        }
    }, [apiClient, servers, refreshTools]);

    const stopHub = useCallback(async () => {
        try {
            await apiClient.mcpHubService.stop();
            setIsHubRunning(false);
            setAvailableTools(new Map());
        } catch (error) {
            console.error("Failed to stop MCP hub:", error);
            throw error;
        }
    }, [apiClient]);

    const openConfigDialog = useCallback(() => {
        setIsConfigDialogOpen(true);
    }, []);

    const closeConfigDialog = useCallback(() => {
        setIsConfigDialogOpen(false);
    }, []);

    const validateServer = useCallback(
        async (name: string, command: string, args: string[]) => {
            try {
                // Basic validation
                if (!name.trim()) {
                    throw new Error("Server name cannot be empty");
                }

                // Validate server name format
                const nameRegex = /^[a-zA-Z0-9_\.-]+$/;
                if (!nameRegex.test(name.trim())) {
                    throw new Error(
                        "Server name can only contain letters, numbers, underscores, dots, and hyphens"
                    );
                }

                if (!command.trim()) {
                    throw new Error("Command cannot be empty");
                }

                // Check if server name already exists
                if (servers.some(s => s.name === name.trim())) {
                    throw new Error("Server name already exists");
                }

                // Test actual server connection
                const testConfig: MCPConnectionRequest = {
                    type: "stdio",
                    config: {
                        command: command.trim(),
                        args: args,
                    },
                };

                // Generate a unique test client name
                const testClientName = `__validation_test__${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                try {
                    // Create a temporary client to test the connection
                    await apiClient.mcpHubService.addClient(
                        testConfig,
                        testClientName
                    );

                    // Give the server a moment to start up
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Try to list tools to verify the server is responding correctly
                    const tools = await apiClient.mcpHubService.listAllTools();

                    // Check if our test client appears in the tools map (indicating successful connection)
                    if (!tools.has(testClientName)) {
                        throw new Error(
                            "Server did not register properly with the hub"
                        );
                    }

                    // Optionally check if the server returned any tools
                    const serverTools = tools.get(testClientName) || [];
                    console.log(
                        `Server validation successful: ${serverTools.length} tools available`
                    );

                    return true;
                } catch (connectionError) {
                    const errorMessage =
                        connectionError instanceof Error
                            ? connectionError.message
                            : String(connectionError);

                    // Provide more specific error messages based on common failure patterns
                    if (
                        errorMessage.includes("ENOENT") ||
                        errorMessage.includes("not found")
                    ) {
                        throw new Error(
                            "Command not found. Please check the executable path."
                        );
                    } else if (
                        errorMessage.includes("EACCES") ||
                        errorMessage.includes("permission denied")
                    ) {
                        throw new Error(
                            "Permission denied. Please check file permissions."
                        );
                    } else if (
                        errorMessage.includes("timeout") ||
                        errorMessage.includes("ETIMEDOUT")
                    ) {
                        throw new Error(
                            "Connection timeout. The server may be taking too long to start."
                        );
                    } else {
                        throw new Error(
                            `Server connection failed: ${errorMessage}`
                        );
                    }
                } finally {
                    // Always clean up the test client, even if there was an error
                    try {
                        await apiClient.mcpHubService.removeClient(
                            testClientName
                        );
                    } catch (cleanupError) {
                        console.warn(
                            "Failed to clean up test client:",
                            cleanupError
                        );
                        // Don't throw here as this is just cleanup
                    }
                }
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.startsWith("Server connection failed:")
                ) {
                    // Re-throw connection errors as-is
                    throw error;
                }
                throw new Error(
                    `Server validation failed: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        },
        [servers, apiClient]
    );

    // Load persisted servers from localStorage on mount
    useEffect(() => {
        console.log("MCPContext: Loading from localStorage...");
        console.log("MCPContext: isElectron =", isElectron());

        // Try to get saved servers
        let savedServers: string | null = null;

        try {
            savedServers = localStorage.getItem("mcp-servers");
            console.log("MCPContext: Raw localStorage value:", savedServers);
        } catch (error) {
            console.error("MCPContext: Failed to access localStorage:", error);
        }

        if (savedServers) {
            try {
                const parsed = JSON.parse(savedServers) as MCPServerConfig[];
                console.log("MCPContext: Parsed servers:", parsed);

                // Validate the parsed data
                if (Array.isArray(parsed)) {
                    setServers(parsed);
                    console.log(
                        `Loaded ${parsed.length} MCP server configurations from localStorage`
                    );
                } else {
                    console.warn(
                        "MCPContext: Invalid saved data format, expected array"
                    );
                }
            } catch (error) {
                console.error("Failed to parse saved MCP servers:", error);
            }
        } else {
            console.log("MCPContext: No saved servers found in localStorage");
        }

        setIsInitialized(true); // Mark as initialized after loading
        console.log("MCPContext: Initialization complete");
    }, []);

    // Persist servers to localStorage when they change (but only after initial load)
    useEffect(() => {
        if (isInitialized) {
            console.log(
                "MCPContext: Saving to localStorage, servers:",
                servers
            );
            try {
                const jsonData = JSON.stringify(servers);
                localStorage.setItem("mcp-servers", jsonData);
                console.log("MCPContext: Successfully saved to localStorage");

                // Verify the save worked
                const verification = localStorage.getItem("mcp-servers");
                if (verification === jsonData) {
                    console.log("MCPContext: Save verification successful");
                } else {
                    console.warn("MCPContext: Save verification failed!");
                }

                if (servers.length > 0) {
                    console.log(
                        `Saved ${servers.length} MCP server configurations to localStorage`
                    );
                } else {
                    console.log("Saved empty server list to localStorage");
                }
            } catch (error) {
                console.error(
                    "MCPContext: Failed to save to localStorage:",
                    error
                );
            }
        } else {
            console.log("MCPContext: Skipping save - not yet initialized");
        }
    }, [servers, isInitialized]);

    useEffect(() => {
        if (isHubRunning) {
            refreshTools();
        }
    }, [isHubRunning]);

    // Utility functions for configuration management
    const exportConfigurations = useCallback(() => {
        return JSON.stringify(servers, null, 2);
    }, [servers]);

    const importConfigurations = useCallback(
        async (jsonString: string) => {
            try {
                const importedServers = JSON.parse(
                    jsonString
                ) as MCPServerConfig[];

                // Validate the imported data structure
                if (!Array.isArray(importedServers)) {
                    throw new Error(
                        "Invalid configuration format: expected an array"
                    );
                }

                for (const server of importedServers) {
                    if (!server.name || !server.config) {
                        throw new Error(
                            "Invalid server configuration: missing name or config"
                        );
                    }
                }

                // Merge with existing servers, avoiding duplicates
                const existingNames = new Set(servers.map(s => s.name));
                const newServers = importedServers.filter(
                    s => !existingNames.has(s.name)
                );

                if (newServers.length > 0) {
                    setServers(prevServers => [...prevServers, ...newServers]);
                    console.log(
                        `Imported ${newServers.length} new MCP server configurations`
                    );
                } else {
                    console.log("No new configurations to import");
                }
            } catch (error) {
                console.error("Failed to import configurations:", error);
                throw new Error(
                    `Failed to import configurations: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        },
        [servers]
    );

    const clearAllConfigurations = useCallback(() => {
        setServers([]);
        localStorage.removeItem("mcp-servers");
        console.log("Cleared all MCP server configurations");
    }, []);

    // Debug function to check localStorage status
    const debugLocalStorage = useCallback(() => {
        console.log("=== MCP LocalStorage Debug ===");
        console.log("Current servers state:", servers);
        console.log("IsInitialized:", isInitialized);

        const stored = localStorage.getItem("mcp-servers");
        console.log("Raw localStorage value:", stored);

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log("Parsed localStorage value:", parsed);
            } catch (e) {
                console.log("Failed to parse localStorage value:", e);
            }
        }

        console.log("LocalStorage keys:", Object.keys(localStorage));
        console.log("=== End Debug ===");
    }, [servers, isInitialized]);

    const value: MCPContextValue = {
        isHubRunning,
        servers,
        availableTools,
        addServer,
        removeServer,
        startHub,
        stopHub,
        refreshTools,
        validateServer,
        isConfigDialogOpen,
        openConfigDialog,
        closeConfigDialog,
        exportConfigurations,
        importConfigurations,
        clearAllConfigurations,
        debugLocalStorage,
    };

    return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCPContext() {
    const context = useContext(MCPContext);
    if (!context) {
        throw new Error("useMCPContext must be used within an MCPProvider");
    }

    // Only provide MCP functionality in desktop environment
    if (!isElectron()) {
        // Return disabled state for browser environment
        return {
            ...context,
            isHubRunning: false,
            servers: [],
            availableTools: new Map(),
            addServer: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            removeServer: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            startHub: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            stopHub: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            refreshTools: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            validateServer: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            exportConfigurations: () => {
                throw new Error("MCP is only available in desktop mode");
            },
            importConfigurations: async () => {
                throw new Error("MCP is only available in desktop mode");
            },
            clearAllConfigurations: () => {
                throw new Error("MCP is only available in desktop mode");
            },
            debugLocalStorage: () => {
                throw new Error("MCP is only available in desktop mode");
            },
        };
    }

    return context;
}

