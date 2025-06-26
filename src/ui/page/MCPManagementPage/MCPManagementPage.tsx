import React, { useState, useCallback } from "react";
import {
    Button,
    Input,
    Field,
    Text,
    Spinner,
    Badge,
    MessageBar,
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    ToggleButton,
    Tooltip,
    makeStyles,
} from "@fluentui/react-components";
import {
    ArrowLeft20Regular,
    Add20Regular,
    Delete20Regular,
    Play20Regular,
    Stop20Regular,
    ChevronDown20Regular,
    Server20Regular,
    Wrench20Regular,
    ArrowClockwise20Regular,
    Flash20Regular,
    Dismiss20Regular,
} from "@fluentui/react-icons";
import { useMCPContext } from "../../../data/context/MCPContext";
import { isElectron } from "../../../utils/electronUtils";

interface StdioMCPConfiguration {
    command: string;
    args?: string[];
}

const useStyles = makeStyles({
    container: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #e1e1e1",
        background: "#f8f9fa",
        WebkitAppRegion: "drag",
        gap: "12px",
    },
    backButton: {
        WebkitAppRegion: "no-drag",
    },
    headerTitle: {
        flexGrow: 1,
        fontSize: "18px",
        fontWeight: "600",
    },
    headerActions: {
        WebkitAppRegion: "no-drag",
    },
    content: {
        flex: 1,
        padding: "16px",
        overflowY: "auto",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
    },
    notAvailableContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        textAlign: "center",
        background: "#f8f9fa",
        borderRadius: "8px",
        maxWidth: "500px",
        margin: "32px auto",
    },
    statusCard: {
        padding: "16px",
        border: "1px solid #e1e1e1",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        marginBottom: "16px",
    },
    statusHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
    },
    statusInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    serverList: {
        marginBottom: "16px",
    },
    serverItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
        border: "1px solid #e1e1e1",
        borderRadius: "6px",
        marginBottom: "8px",
        backgroundColor: "#ffffff",
    },
    serverActions: {
        display: "flex",
        gap: "8px",
    },
    toolsGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "8px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    argsContainer: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
    },
    argsList: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "8px",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        alignItems: "center",
    },
});

interface MCPManagementPageProps {
    onBack: () => void;
}

export function MCPManagementPage({ onBack }: MCPManagementPageProps) {
    const styles = useStyles();

    // Only show MCP management in desktop environment
    if (!isElectron()) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Button
                        appearance="subtle"
                        icon={<ArrowLeft20Regular />}
                        onClick={onBack}
                        className={styles.backButton}
                    />
                    <Text className={styles.headerTitle}>
                        MCP Server Management
                    </Text>
                </div>
                <div className={styles.content}>
                    <div className={styles.notAvailableContainer}>
                        <div>
                            <Text
                                size={500}
                                weight="semibold"
                                block
                                style={{ marginBottom: "12px" }}
                            >
                                Desktop Mode Required
                            </Text>
                            <Text size={300} block>
                                MCP (Model Context Protocol) features are only
                                available when running the application in
                                desktop mode. Please use the desktop version of
                                the application to manage MCP servers.
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
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
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Button
                    appearance="subtle"
                    icon={<ArrowLeft20Regular />}
                    onClick={onBack}
                    className={styles.backButton}
                />
                <Text className={styles.headerTitle}>
                    MCP Server Management
                </Text>
                {isHubRunning && (
                    <Tooltip content="Refresh Tools" relationship="label">
                        <Button
                            appearance="subtle"
                            icon={<ArrowClockwise20Regular />}
                            onClick={handleRefreshTools}
                            disabled={loading}
                            className={styles.headerActions}
                        />
                    </Tooltip>
                )}
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {error && (
                        <MessageBar intent="error">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>{error}</span>
                                <Button
                                    appearance="transparent"
                                    icon={<Dismiss20Regular />}
                                    onClick={() => setError(null)}
                                    size="small"
                                />
                            </div>
                        </MessageBar>
                    )}

                    {testSuccess && (
                        <MessageBar intent="success">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>{testSuccess}</span>
                                <Button
                                    appearance="transparent"
                                    icon={<Dismiss20Regular />}
                                    onClick={() => setTestSuccess(null)}
                                    size="small"
                                />
                            </div>
                        </MessageBar>
                    )}

                    {/* Hub Status */}
                    <div className={styles.statusCard}>
                        <div className={styles.statusHeader}>
                            <div className={styles.statusInfo}>
                                <Server20Regular
                                    style={{
                                        color: isHubRunning
                                            ? "#107c10"
                                            : "#737373",
                                        fontSize: "20px",
                                    }}
                                />
                                <Text size={400} weight="semibold">
                                    Hub Status:{" "}
                                    {isHubRunning ? "Running" : "Stopped"}
                                </Text>
                                {isHubRunning && (
                                    <Badge
                                        icon={<Wrench20Regular />}
                                        color="success"
                                        size="small"
                                    >
                                        {totalTools} tools available
                                    </Badge>
                                )}
                            </div>
                            {isHubRunning ? (
                                <Button
                                    onClick={handleStopHub}
                                    disabled={loading}
                                    appearance="outline"
                                    icon={<Stop20Regular />}
                                    style={{
                                        color: "#d13438",
                                        borderColor: "#d13438",
                                    }}
                                >
                                    Stop Hub
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStartHub}
                                    disabled={loading || servers.length === 0}
                                    appearance="primary"
                                    icon={<Play20Regular />}
                                >
                                    Start Hub
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Server List */}
                    <Accordion collapsible>
                        <AccordionItem value="servers">
                            <AccordionHeader
                                expandIcon={<ChevronDown20Regular />}
                            >
                                <Text size={400} weight="semibold">
                                    Configured Servers ({servers.length})
                                </Text>
                            </AccordionHeader>
                            <AccordionPanel>
                                {servers.length === 0 ? (
                                    <Text
                                        size={300}
                                        style={{ color: "#737373" }}
                                    >
                                        No MCP servers configured. Add a server
                                        below to get started.
                                    </Text>
                                ) : (
                                    <div className={styles.serverList}>
                                        {servers.map(server => {
                                            const config = server.config
                                                .config as StdioMCPConfiguration;
                                            const isTestingThisServer =
                                                testingServer === server.name;

                                            return (
                                                <div
                                                    key={server.name}
                                                    className={
                                                        styles.serverItem
                                                    }
                                                >
                                                    <div>
                                                        <Text
                                                            size={300}
                                                            weight="semibold"
                                                            block
                                                        >
                                                            {server.name}
                                                        </Text>
                                                        <Text
                                                            size={200}
                                                            style={{
                                                                color: "#737373",
                                                            }}
                                                        >
                                                            Command:{" "}
                                                            {config.command}{" "}
                                                            {(
                                                                config.args ||
                                                                []
                                                            ).join(" ")}
                                                        </Text>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.serverActions
                                                        }
                                                    >
                                                        <Tooltip
                                                            content="Test Server Connection"
                                                            relationship="label"
                                                        >
                                                            <Button
                                                                appearance="subtle"
                                                                icon={
                                                                    isTestingThisServer ? (
                                                                        <Spinner size="tiny" />
                                                                    ) : (
                                                                        <Flash20Regular />
                                                                    )
                                                                }
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
                                                            />
                                                        </Tooltip>
                                                        <Tooltip
                                                            content="Remove Server"
                                                            relationship="label"
                                                        >
                                                            <Button
                                                                appearance="subtle"
                                                                icon={
                                                                    <Delete20Regular />
                                                                }
                                                                onClick={() =>
                                                                    handleRemoveServer(
                                                                        server.name
                                                                    )
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                                style={{
                                                                    color: "#d13438",
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>

                    {/* Available Tools */}
                    {isHubRunning && availableTools.size > 0 && (
                        <Accordion collapsible>
                            <AccordionItem value="tools">
                                <AccordionHeader
                                    expandIcon={<ChevronDown20Regular />}
                                >
                                    <Text size={400} weight="semibold">
                                        Available Tools ({totalTools})
                                    </Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "12px",
                                        }}
                                    >
                                        {Array.from(
                                            availableTools.entries()
                                        ).map(([serverName, tools]) => (
                                            <div
                                                key={serverName}
                                                style={{
                                                    padding: "12px",
                                                    border: "1px solid #e1e1e1",
                                                    borderRadius: "6px",
                                                    backgroundColor: "#ffffff",
                                                }}
                                            >
                                                <Text
                                                    size={300}
                                                    weight="semibold"
                                                    block
                                                    style={{
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    {serverName} ({tools.length}{" "}
                                                    tools)
                                                </Text>
                                                <div
                                                    className={styles.toolsGrid}
                                                >
                                                    {tools.map(
                                                        (
                                                            tool: any,
                                                            index: number
                                                        ) => (
                                                            <Tooltip
                                                                key={index}
                                                                content={
                                                                    tool.description ||
                                                                    "No description"
                                                                }
                                                                relationship="label"
                                                            >
                                                                <Badge
                                                                    size="small"
                                                                    appearance="outline"
                                                                >
                                                                    {tool.name}
                                                                </Badge>
                                                            </Tooltip>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    )}

                    <div
                        style={{
                            height: "1px",
                            backgroundColor: "#e1e1e1",
                            margin: "8px 0",
                        }}
                    />

                    {/* Add New Server */}
                    <Accordion collapsible>
                        <AccordionItem value="add-server">
                            <AccordionHeader
                                expandIcon={<ChevronDown20Regular />}
                            >
                                <Text size={400} weight="semibold">
                                    Add New MCP Server
                                </Text>
                            </AccordionHeader>
                            <AccordionPanel>
                                <div className={styles.form}>
                                    <Field
                                        label="Server Name"
                                        hint="Unique name to identify this MCP server (letters, numbers, underscores, dots, and hyphens only)"
                                        validationState={
                                            nameValidationError
                                                ? "error"
                                                : "none"
                                        }
                                        validationMessage={nameValidationError}
                                    >
                                        <Input
                                            placeholder="e.g., filesystem-server"
                                            value={serverName}
                                            onChange={e =>
                                                handleServerNameChange(
                                                    e.target.value
                                                )
                                            }
                                            disabled={loading}
                                        />
                                    </Field>

                                    <Field
                                        label="Executable Path"
                                        hint="Full path to the MCP server executable"
                                    >
                                        <Input
                                            placeholder="e.g., /path/to/mcp-server or node"
                                            value={command}
                                            onChange={e =>
                                                setCommand(e.target.value)
                                            }
                                            disabled={loading}
                                        />
                                    </Field>

                                    <div>
                                        <Text
                                            size={300}
                                            weight="semibold"
                                            block
                                            style={{ marginBottom: "8px" }}
                                        >
                                            Arguments
                                        </Text>
                                        <div className={styles.argsContainer}>
                                            <Field
                                                hint="Press Enter or blur to auto-add arguments"
                                                style={{ flex: 1 }}
                                            >
                                                <Input
                                                    placeholder="e.g., --port 8080"
                                                    value={newArg}
                                                    onChange={e =>
                                                        setNewArg(
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyDown={handleKeyPress}
                                                    onBlur={handleArgBlur}
                                                    disabled={loading}
                                                />
                                            </Field>
                                            <Button
                                                appearance="subtle"
                                                icon={<Add20Regular />}
                                                onClick={handleAddArgument}
                                                disabled={
                                                    !newArg.trim() || loading
                                                }
                                            />
                                        </div>

                                        <div className={styles.argsList}>
                                            {args.map((arg, index) => (
                                                <Badge
                                                    key={index}
                                                    appearance="outline"
                                                    icon={
                                                        <Button
                                                            appearance="transparent"
                                                            icon={
                                                                <Dismiss20Regular />
                                                            }
                                                            onClick={() =>
                                                                handleRemoveArgument(
                                                                    index
                                                                )
                                                            }
                                                            size="small"
                                                            style={{
                                                                minWidth:
                                                                    "auto",
                                                                padding: "0",
                                                            }}
                                                        />
                                                    }
                                                >
                                                    {arg}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.actionButtons}>
                                        <Button
                                            onClick={handleAddServer}
                                            disabled={
                                                loading ||
                                                !serverName.trim() ||
                                                !command.trim()
                                            }
                                            appearance="primary"
                                            icon={
                                                loading ? (
                                                    <Spinner size="tiny" />
                                                ) : (
                                                    <Add20Regular />
                                                )
                                            }
                                        >
                                            {loading
                                                ? "Adding..."
                                                : "Add Server"}
                                        </Button>

                                        {testingServer && (
                                            <Badge
                                                icon={<Spinner size="tiny" />}
                                                color="brand"
                                                size="small"
                                            >
                                                Testing {testingServer}...
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
