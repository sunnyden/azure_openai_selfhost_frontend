import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useApiClient } from "./useApiClient";
import {
  MCPServerConfig,
  MCPConnectionRequest,
  StdioMCPConfiguration,
} from "../../api/interface/ApiClient.interface";

interface MCPContextValue {
  isHubRunning: boolean;
  servers: MCPServerConfig[];
  availableTools: Map<string, any[]>;
  addServer: (name: string, config: MCPConnectionRequest) => Promise<void>;
  removeServer: (name: string) => Promise<void>;
  startHub: () => Promise<void>;
  stopHub: () => Promise<void>;
  refreshTools: () => Promise<void>;
  isConfigDialogOpen: boolean;
  openConfigDialog: () => void;
  closeConfigDialog: () => void;
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
        if (isHubRunning) {
          await apiClient.mcpHubService.removeClient(name);
          await refreshTools();
        }

        // Update local state
        setServers(prevServers => prevServers.filter(s => s.name !== name));
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
          await apiClient.mcpHubService.addClient(server.config, server.name);
        } catch (error) {
          console.error(`Failed to add server ${server.name} to hub:`, error);
        }
      }

      // Start the hub service
      await apiClient.mcpHubService.start();

      setIsHubRunning(true);

      await refreshTools();
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

  // Load persisted servers from localStorage on mount
  useEffect(() => {
    const savedServers = localStorage.getItem("mcp-servers");
    if (savedServers) {
      try {
        const parsed = JSON.parse(savedServers) as MCPServerConfig[];
        setServers(parsed);
      } catch (error) {
        console.error("Failed to parse saved MCP servers:", error);
      }
    }
  }, []);

  // Persist servers to localStorage when they change
  useEffect(() => {
    localStorage.setItem("mcp-servers", JSON.stringify(servers));
  }, [servers]);

  const value: MCPContextValue = {
    isHubRunning,
    servers,
    availableTools,
    addServer,
    removeServer,
    startHub,
    stopHub,
    refreshTools,
    isConfigDialogOpen,
    openConfigDialog,
    closeConfigDialog,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCPContext() {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error("useMCPContext must be used within an MCPProvider");
  }
  return context;
}
