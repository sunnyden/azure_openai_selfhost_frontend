import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
  Typography,
  Alert,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Computer as ServerIcon,
  Build as ToolIcon,
} from "@mui/icons-material";
import {
  MCPServerConfig,
  StdioMCPConfiguration,
} from "../../../api/interface/ApiClient.interface";

interface MCPConfigDialogProps {
  open: boolean;
  onClose: () => void;
  isHubRunning: boolean;
  servers: MCPServerConfig[];
  availableTools: Map<string, any[]>;
  onAddServer: (name: string, command: string, args: string[]) => Promise<void>;
  onRemoveServer: (name: string) => Promise<void>;
  onStartHub: () => Promise<void>;
  onStopHub: () => Promise<void>;
  onRefreshTools: () => Promise<void>;
}

export function MCPConfigDialog({
  open,
  onClose,
  isHubRunning,
  servers,
  availableTools,
  onAddServer,
  onRemoveServer,
  onStartHub,
  onStopHub,
  onRefreshTools,
}: MCPConfigDialogProps) {
  const [serverName, setServerName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [newArg, setNewArg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddArgument = () => {
    if (newArg.trim()) {
      setArgs([...args, newArg.trim()]);
      setNewArg("");
    }
  };

  const handleRemoveArgument = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const handleAddServer = async () => {
    if (!serverName.trim()) {
      setError("Server name is required");
      return;
    }

    if (!command.trim()) {
      setError("Command is required");
      return;
    }

    // Check if server name already exists
    if (servers.some(s => s.name === serverName.trim())) {
      setError("Server name already exists");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAddServer(serverName.trim(), command.trim(), args);

      // Reset form
      setServerName("");
      setCommand("");
      setArgs([]);
      setNewArg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add MCP server");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveServer = async (name: string) => {
    setLoading(true);
    setError(null);

    try {
      await onRemoveServer(name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove MCP server"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartHub = async () => {
    setLoading(true);
    setError(null);

    try {
      await onStartHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start MCP hub");
    } finally {
      setLoading(false);
    }
  };

  const handleStopHub = async () => {
    setLoading(true);
    setError(null);

    try {
      await onStopHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop MCP hub");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleAddArgument();
    }
  };

  const totalTools = Array.from(availableTools.values()).reduce(
    (total, tools) => total + tools.length,
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SettingsIcon />
          <Typography variant="h6">MCP Server Hub Configuration</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Hub Status */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <ServerIcon color={isHubRunning ? "success" : "disabled"} />
                <Typography variant="h6">
                  Hub Status: {isHubRunning ? "Running" : "Stopped"}
                </Typography>
                {isHubRunning && (
                  <Chip
                    icon={<ToolIcon />}
                    label={`${totalTools} tools available`}
                    color="success"
                    size="small"
                  />
                )}
              </Stack>
              {isHubRunning ? (
                <Button
                  onClick={handleStopHub}
                  disabled={loading}
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                >
                  Stop Hub
                </Button>
              ) : (
                <Button
                  onClick={handleStartHub}
                  disabled={loading || servers.length === 0}
                  variant="contained"
                  startIcon={<PlayIcon />}
                >
                  Start Hub
                </Button>
              )}
            </Stack>
          </Paper>

          {/* Server List */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Configured Servers ({servers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {servers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No MCP servers configured. Add a server below to get started.
                </Typography>
              ) : (
                <List>
                  {servers.map(server => {
                    const config = server.config
                      .config as StdioMCPConfiguration;
                    return (
                      <ListItem key={server.name} divider>
                        <ListItemText
                          primary={server.name}
                          secondary={`Command: ${config.command} ${(config.args || []).join(" ")}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveServer(server.name)}
                            disabled={loading}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Available Tools */}
          {isHubRunning && availableTools.size > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Available Tools ({totalTools})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {Array.from(availableTools.entries()).map(
                    ([serverName, tools]) => (
                      <Paper key={serverName} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {serverName} ({tools.length} tools)
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {tools.map((tool: any, index: number) => (
                            <Chip
                              key={index}
                              label={tool.name}
                              size="small"
                              variant="outlined"
                              title={tool.description || "No description"}
                            />
                          ))}
                        </Box>
                      </Paper>
                    )
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          <Divider />

          {/* Add New Server */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Add New MCP Server</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Server Name"
                  placeholder="e.g., filesystem-server"
                  value={serverName}
                  onChange={e => setServerName(e.target.value)}
                  disabled={loading}
                  helperText="Unique name to identify this MCP server"
                />

                <TextField
                  fullWidth
                  label="Executable Path"
                  placeholder="e.g., /path/to/mcp-server or node"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  disabled={loading}
                  helperText="Full path to the MCP server executable"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Arguments
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label="Add argument"
                      placeholder="e.g., --port 8080"
                      value={newArg}
                      onChange={e => setNewArg(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                    <IconButton
                      onClick={handleAddArgument}
                      disabled={!newArg.trim() || loading}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Stack>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {args.map((arg, index) => (
                      <Chip
                        key={index}
                        label={arg}
                        onDelete={() => handleRemoveArgument(index)}
                        deleteIcon={<DeleteIcon />}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Button
                  onClick={handleAddServer}
                  disabled={loading || !serverName.trim() || !command.trim()}
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Add Server
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        {isHubRunning && (
          <Button
            onClick={onRefreshTools}
            disabled={loading}
            variant="outlined"
          >
            Refresh Tools
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
