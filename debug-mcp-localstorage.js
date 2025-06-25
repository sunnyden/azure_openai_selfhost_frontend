// MCP LocalStorage Debug Script
// Run this in the browser console to debug localStorage persistence issues

function debugMCPLocalStorage() {
  console.log("=== MCP LocalStorage Debug ===");

  // Check if localStorage is available
  if (typeof Storage === "undefined") {
    console.error("LocalStorage is not supported in this browser");
    return;
  }

  // Check current localStorage content
  const mcpServers = localStorage.getItem("mcp-servers");
  console.log("Raw mcp-servers value:", mcpServers);

  if (mcpServers) {
    try {
      const parsed = JSON.parse(mcpServers);
      console.log("Parsed mcp-servers:", parsed);
      console.log(
        "Number of servers:",
        Array.isArray(parsed) ? parsed.length : "Not an array"
      );
    } catch (e) {
      console.error("Failed to parse mcp-servers JSON:", e);
    }
  } else {
    console.log("No mcp-servers found in localStorage");
  }

  // List all localStorage keys
  console.log("All localStorage keys:", Object.keys(localStorage));

  // Check localStorage quota usage
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  console.log("Total localStorage size (chars):", totalSize);

  console.log("=== End Debug ===");
}

function testMCPPersistence() {
  console.log("=== Testing MCP Persistence ===");

  // Create a test server configuration
  const testServer = {
    name: "debug-test-server",
    config: {
      type: "stdio",
      config: {
        command: "echo",
        args: ["test"],
      },
    },
  };

  // Get existing servers
  let servers = [];
  const existing = localStorage.getItem("mcp-servers");
  if (existing) {
    try {
      servers = JSON.parse(existing);
    } catch (e) {
      console.error("Failed to parse existing servers:", e);
      servers = [];
    }
  }

  // Add test server if it doesn't exist
  const existingTestServer = servers.find(s => s.name === "debug-test-server");
  if (!existingTestServer) {
    servers.push(testServer);
    localStorage.setItem("mcp-servers", JSON.stringify(servers));
    console.log("Added test server to localStorage");
  } else {
    console.log("Test server already exists");
  }

  // Verify it was saved
  debugMCPLocalStorage();

  console.log(
    "Test complete. Reload the page and run debugMCPLocalStorage() again to verify persistence."
  );
  console.log("=== End Test ===");
}

function clearMCPLocalStorage() {
  localStorage.removeItem("mcp-servers");
  console.log("Cleared mcp-servers from localStorage");
  debugMCPLocalStorage();
}

// Export functions to global scope for console use
window.debugMCPLocalStorage = debugMCPLocalStorage;
window.testMCPPersistence = testMCPPersistence;
window.clearMCPLocalStorage = clearMCPLocalStorage;

console.log("MCP Debug functions loaded:");
console.log("- debugMCPLocalStorage() - Check current localStorage state");
console.log("- testMCPPersistence() - Add a test server and verify");
console.log("- clearMCPLocalStorage() - Clear all MCP configurations");
