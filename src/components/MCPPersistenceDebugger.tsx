// Test component to debug MCP localStorage persistence
// Add this to any component to test localStorage functionality

import React from "react";
import { useMCPContext } from "../data/context/MCPContext";

export function MCPPersistenceDebugger() {
  const {
    servers,
    debugLocalStorage,
    exportConfigurations,
    clearAllConfigurations,
  } = useMCPContext();

  const handleTestPersistence = () => {
    console.log("=== Testing MCP Persistence ===");
    debugLocalStorage();

    // Test localStorage directly
    const stored = localStorage.getItem("mcp-servers");
    console.log("Direct localStorage check:", stored);

    // Test export function
    const exported = exportConfigurations();
    console.log("Exported configurations:", exported);

    console.log("=== Test Complete ===");
  };

  const handleAddTestServer = () => {
    // Manually add a test server to localStorage
    const testServer = {
      name: "test-server",
      config: {
        type: "stdio",
        config: {
          command: "echo",
          args: ["hello"],
        },
      },
    };

    const existing = localStorage.getItem("mcp-servers");
    let servers = [];

    if (existing) {
      try {
        servers = JSON.parse(existing);
      } catch (e) {
        console.error("Failed to parse existing servers:", e);
      }
    }

    servers.push(testServer);
    localStorage.setItem("mcp-servers", JSON.stringify(servers));
    console.log("Added test server to localStorage");

    // Force page reload to test persistence
    window.location.reload();
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "10px" }}>
      <h3>MCP Persistence Debugger</h3>
      <p>Current servers in state: {servers.length}</p>

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleTestPersistence} style={{ marginRight: "10px" }}>
          Debug LocalStorage
        </button>

        <button onClick={handleAddTestServer} style={{ marginRight: "10px" }}>
          Add Test Server & Reload
        </button>

        <button
          onClick={clearAllConfigurations}
          style={{ marginRight: "10px" }}
        >
          Clear All Configurations
        </button>
      </div>

      <div style={{ marginTop: "10px", fontSize: "12px" }}>
        <strong>Instructions:</strong>
        <ol>
          <li>Click "Debug LocalStorage" to see current state</li>
          <li>
            Click "Add Test Server & Reload" to add a test server and reload
            page
          </li>
          <li>After reload, check if the test server persists</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}
