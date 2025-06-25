import React, { useState, useCallback } from "react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    TextField,
    Chip,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    AppBar,
    Toolbar,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    ExpandMore as ExpandMoreIcon,
    Computer as ServerIcon,
    Build as ToolIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useMCPContext } from "../../../data/context/MCPContext";
import { isElectron } from "../../../utils/electronUtils";

interface MCPManagementPageProps {
    onBack: () => void;
}

export function MCPManagementPage({ onBack }: MCPManagementPageProps) {
    // Only show MCP management in desktop environment
    if (!isElectron()) {
        return (
            <Box
                sx={{
                    height: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <AppBar position="static" elevation={1}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={onBack}
                            sx={{ mr: 2 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            MCP Server Management
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Container
                    maxWidth="lg"
                    sx={{
                        flex: 1,
                        py: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Paper
                        elevation={1}
                        sx={{ p: 4, textAlign: "center", maxWidth: 500 }}
                    >
                        <Typography variant="h5" gutterBottom>
                            Desktop Mode Required
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            MCP (Model Context Protocol) features are only
                            available when running the application in desktop
                            mode. Please use the desktop version of the
                            application to manage MCP servers.
                        </Typography>
                    </Paper>
                </Container>
            </Box>
        );
    }

    const {
        isHubRunning,
        servers,
        availableTools,
        addServer,
        removeServer,
        startHub,
        stopHub,
        refreshTools,
        validateServer,
    } = useMCPContext();

    const [serverName, setServerName] = useState("");
    const [command, setCommand] = useState("");
    const [args, setArgs] = useState<string[]>([]);
    const [newArg, setNewArg] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testingServer, setTestingServer] = useState<string | null>(null);
    const [testSuccess, setTestSuccess] = useState<string | null>(null);
    const [nameValidationError, setNameValidationError] = useState<
        string | null
    >(null);

    // Auto-add server when user types Enter or blurs from argument field
    const handleAutoAddServer = useCallback(() => {
        if (serverName.trim() && command.trim() && newArg.trim()) {
            setArgs(prev => [...prev, newArg.trim()]);
            setNewArg("");
        }
    }, [serverName, command, newArg]);

    const handleAddArgument = useCallback(() => {
        if (newArg.trim()) {
            setArgs(prev => [...prev, newArg.trim()]);
            setNewArg("");
        }
    }, [newArg]);

    const handleRemoveArgument = useCallback((index: number) => {
        setArgs(prev => prev.filter((_, i) => i !== index));
    }, []);

    const validateServerName = useCallback(
        (name: string) => {
            if (!name.trim()) {
                return "Server name cannot be empty";
            }

            const nameRegex = /^[a-zA-Z0-9_\.-]+$/;
            if (!nameRegex.test(name.trim())) {
                return "Server name can only contain letters, numbers, underscores, dots, and hyphens";
            }

            if (servers.some(s => s.name === name.trim())) {
                return "Server name already exists";
            }

            return null;
        },
        [servers]
    );

    const handleServerNameChange = useCallback(
        (name: string) => {
            setServerName(name);
            const validationError = validateServerName(name);
            setNameValidationError(validationError);
        },
        [validateServerName]
    );

    const testServerConnection = useCallback(
        async (name: string, cmd: string, serverArgs: string[]) => {
            setTestingServer(name);
            setError(null);
            setTestSuccess(null);
            try {
                await validateServer(name, cmd, serverArgs);
                setTestSuccess(`Server "${name}" is responding correctly`);
                return true;
            } catch (error) {
                throw error;
            } finally {
                setTestingServer(null);
            }
        },
        [validateServer]
    );

    const handleAddServer = useCallback(async () => {
        const nameError = validateServerName(serverName);
        if (nameError) {
            setError(nameError);
            return;
        }

        if (!command.trim()) {
            setError("Command is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Test server connection first
            await testServerConnection(serverName, command, args);

            const config = {
                type: "stdio" as const,
                config: {
                    command: command.trim(),
                    args,
                },
            };

            await addServer(serverName.trim(), config);

            // Reset form
            setServerName("");
            setCommand("");
            setArgs([]);
            setNewArg("");
            setNameValidationError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to add MCP server"
            );
        } finally {
            setLoading(false);
        }
    }, [
        serverName,
        command,
        args,
        addServer,
        testServerConnection,
        validateServerName,
    ]);

    const handleRemoveServer = useCallback(
        async (name: string) => {
            setLoading(true);
            setError(null);

            try {
                await removeServer(name);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to remove MCP server"
                );
            } finally {
                setLoading(false);
            }
        },
        [removeServer]
    );

    const handleStartHub = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await startHub();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to start MCP hub"
            );
        } finally {
            setLoading(false);
        }
    }, [startHub]);

    const handleStopHub = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await stopHub();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to stop MCP hub"
            );
        } finally {
            setLoading(false);
        }
    }, [stopHub]);

    const handleRefreshTools = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await refreshTools();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to refresh tools"
            );
        } finally {
            setLoading(false);
        }
    }, [refreshTools]);

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleAutoAddServer();
            }
        },
        [handleAutoAddServer]
    );

    const handleArgBlur = useCallback(() => {
        handleAutoAddServer();
    }, [handleAutoAddServer]);

    const totalTools = Array.from(availableTools.values()).reduce(
        (total, tools) => total + tools.length,
        0
    );

    return (
        <Box
            sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}
        >
            {/* App Bar */}
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={onBack}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        MCP Server Management
                    </Typography>
                    {isHubRunning && (
                        <Tooltip title="Refresh Tools">
                            <IconButton
                                color="inherit"
                                onClick={handleRefreshTools}
                                disabled={loading}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ flex: 1, py: 3, overflow: "auto" }}>
                <Stack spacing={3}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {testSuccess && (
                        <Alert
                            severity="success"
                            onClose={() => setTestSuccess(null)}
                        >
                            {testSuccess}
                        </Alert>
                    )}

                    {/* Hub Status */}
                    <Paper elevation={1} sx={{ p: 3 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={2}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                            >
                                <ServerIcon
                                    color={
                                        isHubRunning ? "success" : "disabled"
                                    }
                                />
                                <Typography variant="h6">
                                    Hub Status:{" "}
                                    {isHubRunning ? "Running" : "Stopped"}
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
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No MCP servers configured. Add a server
                                    below to get started.
                                </Typography>
                            ) : (
                                <List>
                                    {servers.map(server => {
                                        const config = server.config
                                            .config as StdioMCPConfiguration;
                                        const isTestingThisServer =
                                            testingServer === server.name;

                                        return (
                                            <ListItem key={server.name} divider>
                                                <ListItemText
                                                    primary={server.name}
                                                    secondary={`Command: ${config.command} ${(config.args || []).join(" ")}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        onClick={async () => {
                                                            try {
                                                                await testServerConnection(
                                                                    server.name,
                                                                    config.command,
                                                                    config.args ||
                                                                        []
                                                                );
                                                            } catch (err) {
                                                                setError(
                                                                    err instanceof
                                                                        Error
                                                                        ? err.message
                                                                        : "Server test failed"
                                                                );
                                                            }
                                                        }}
                                                        disabled={
                                                            loading ||
                                                            isTestingThisServer
                                                        }
                                                        sx={{ mr: 1 }}
                                                        title="Test Server Connection"
                                                    >
                                                        {isTestingThisServer ? (
                                                            <CircularProgress
                                                                size={20}
                                                            />
                                                        ) : (
                                                            <PlayIcon />
                                                        )}
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() =>
                                                            handleRemoveServer(
                                                                server.name
                                                            )
                                                        }
                                                        disabled={loading}
                                                        color="error"
                                                        title="Remove Server"
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
                                            <Paper
                                                key={serverName}
                                                variant="outlined"
                                                sx={{ p: 2 }}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    gutterBottom
                                                >
                                                    {serverName} ({tools.length}{" "}
                                                    tools)
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 1,
                                                    }}
                                                >
                                                    {tools.map(
                                                        (
                                                            tool: any,
                                                            index: number
                                                        ) => (
                                                            <Chip
                                                                key={index}
                                                                label={
                                                                    tool.name
                                                                }
                                                                size="small"
                                                                variant="outlined"
                                                                title={
                                                                    tool.description ||
                                                                    "No description"
                                                                }
                                                            />
                                                        )
                                                    )}
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
                            <Typography variant="h6">
                                Add New MCP Server
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Server Name"
                                    placeholder="e.g., filesystem-server"
                                    value={serverName}
                                    onChange={e =>
                                        handleServerNameChange(e.target.value)
                                    }
                                    disabled={loading}
                                    error={!!nameValidationError}
                                    helperText={
                                        nameValidationError ||
                                        "Unique name to identify this MCP server (letters, numbers, underscores, dots, and hyphens only)"
                                    }
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
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Arguments
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ mb: 1 }}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Add argument"
                                            placeholder="e.g., --port 8080"
                                            value={newArg}
                                            onChange={e =>
                                                setNewArg(e.target.value)
                                            }
                                            onKeyPress={handleKeyPress}
                                            onBlur={handleArgBlur}
                                            disabled={loading}
                                            helperText="Press Enter or blur to auto-add arguments"
                                        />
                                        <IconButton
                                            onClick={handleAddArgument}
                                            disabled={!newArg.trim() || loading}
                                            color="primary"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Stack>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1,
                                        }}
                                    >
                                        {args.map((arg, index) => (
                                            <Chip
                                                key={index}
                                                label={arg}
                                                onDelete={() =>
                                                    handleRemoveArgument(index)
                                                }
                                                deleteIcon={<DeleteIcon />}
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        onClick={handleAddServer}
                                        disabled={
                                            loading ||
                                            !serverName.trim() ||
                                            !command.trim()
                                        }
                                        variant="contained"
                                        startIcon={
                                            loading ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                <AddIcon />
                                            )
                                        }
                                        sx={{ minWidth: 120 }}
                                    >
                                        {loading ? "Adding..." : "Add Server"}
                                    </Button>

                                    {testingServer && (
                                        <Chip
                                            label={`Testing ${testingServer}...`}
                                            color="primary"
                                            size="small"
                                            icon={
                                                <CircularProgress size={16} />
                                            }
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </Container>
        </Box>
    );
}
