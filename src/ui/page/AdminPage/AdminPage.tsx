import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    Input,
    Field,
    Text,
    Spinner,
    MessageBar,
    Tab,
    TabList,
    makeStyles,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogBody,
    DialogTrigger,
    Switch,
    Badge,
    Tooltip,
    Select,
} from "@fluentui/react-components";
import {
    ArrowLeft20Regular,
    Add20Regular,
    Delete20Regular,
    Edit20Regular,
    People20Regular,
    Server20Regular,
    DataTrending20Regular,
    Chat20Regular,
    ArrowClockwise20Regular,
    LinkAdd20Regular,
    LinkDismiss20Regular,
    DeleteDismiss20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { AppBar } from "../../component/window/AppBar";
import { User } from "../../../api/interface/data/common/User";
import { Model } from "../../../api/interface/data/common/Model";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { ChatHistorySummary } from "../../../api/interface/data/common/ChatHistory";

const useStyles = makeStyles({
    container: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
    },
    content: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    tabContent: {
        flex: 1,
        overflowY: "auto",
        padding: "16px",
    },
    section: {
        border: "1px solid var(--colorNeutralStroke2)",
        borderRadius: "8px",
        backgroundColor: "var(--colorNeutralBackground1)",
        marginBottom: "16px",
        overflow: "hidden",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--colorNeutralStroke2)",
        backgroundColor: "var(--colorNeutralBackground2)",
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "16px",
        fontWeight: "600",
    },
    tableContainer: {
        overflowX: "auto",
    },
    actionButtons: {
        display: "flex",
        gap: "4px",
    },
    formRow: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
    },
    formField: {
        flex: "1 1 200px",
        minWidth: "200px",
    },
    assignSection: {
        padding: "16px",
        borderTop: "1px solid var(--colorNeutralStroke2)",
    },
});

type TabValue = "users" | "models" | "transactions" | "chathistory";

const emptyUser: User = {
    userName: "",
    isAdmin: false,
    remainingCredit: 0,
    creditQuota: 10,
    password: "",
};

const emptyModel: Model = {
    identifier: "",
    friendlyName: "",
    endpoint: "",
    deployment: "",
    key: "",
    costPromptToken: 0,
    costResponseToken: 0,
    isVision: false,
    maxTokens: 128000,
    supportTool: true,
    apiVersionOverride: null,
    reasoningModel: false,
};

interface AdminPageProps {
    onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
    const styles = useStyles();
    const apiClient = useApiClient();
    const { userList, fetchUserList } = useUserContext();

    const [selectedTab, setSelectedTab] = useState<TabValue>("users");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // User management state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<User>(emptyUser);
    const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Model management state
    const [models, setModels] = useState<Model[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelDialogOpen, setModelDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [modelForm, setModelForm] = useState<Model>(emptyModel);
    const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
    const [assignUserId, setAssignUserId] = useState<string>("");
    const [assignModelIdentifier, setAssignModelIdentifier] =
        useState<string>("");
    const [unassignUserId, setUnassignUserId] = useState<string>("");
    const [unassignModelIdentifier, setUnassignModelIdentifier] =
        useState<string>("");

    // Transactions state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    // Chat history state
    const [allHistories, setAllHistories] = useState<ChatHistorySummary[]>([]);
    const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
    const [deleteHistoryUserId, setDeleteHistoryUserId] = useState<string>("");
    const [deleteHistoryDialogOpen, setDeleteHistoryDialogOpen] =
        useState(false);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 5000);
    };

    const loadModels = useCallback(async () => {
        setModelsLoading(true);
        try {
            const data = await apiClient.modelClient.allModels();
            setModels(data);
        } catch (e: any) {
            showError(e.message || "Failed to load models");
        } finally {
            setModelsLoading(false);
        }
    }, [apiClient]);

    const loadTransactions = useCallback(async () => {
        setTransactionsLoading(true);
        try {
            const data = await apiClient.transactionClient.all();
            setTransactions(data);
        } catch (e: any) {
            showError(e.message || "Failed to load transactions");
        } finally {
            setTransactionsLoading(false);
        }
    }, [apiClient]);

    const loadAllHistories = useCallback(async () => {
        setChatHistoryLoading(true);
        try {
            const data = await apiClient.chatHistoryClient.allHistories();
            setAllHistories(data);
        } catch (e: any) {
            showError(e.message || "Failed to load chat histories");
        } finally {
            setChatHistoryLoading(false);
        }
    }, [apiClient]);

    // Load users on mount
    useEffect(() => {
        fetchUserList().catch(e =>
            showError(e.message || "Failed to load users")
        );
    }, [fetchUserList]);

    // Load data when tab changes
    useEffect(() => {
        if (selectedTab === "models") {
            loadModels();
        } else if (selectedTab === "transactions") {
            loadTransactions();
        } else if (selectedTab === "chathistory") {
            loadAllHistories();
        }
    }, [selectedTab, loadModels, loadTransactions, loadAllHistories]);

    // --- User Management ---
    const openCreateUserDialog = () => {
        setEditingUser(null);
        setUserForm({ ...emptyUser });
        setUserDialogOpen(true);
    };

    const openEditUserDialog = (user: User) => {
        setEditingUser(user);
        setUserForm({ ...user, password: "" });
        setUserDialogOpen(true);
    };

    const handleSaveUser = async () => {
        setLoading(true);
        try {
            if (editingUser) {
                await apiClient.userClient.modify(userForm);
                showSuccess("User updated successfully");
            } else {
                await apiClient.userClient.create(userForm);
                showSuccess("User created successfully");
            }
            setUserDialogOpen(false);
            await fetchUserList();
        } catch (e: any) {
            showError(e.message || "Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete?.id) return;
        setLoading(true);
        try {
            await apiClient.userClient.remove(userToDelete.id);
            showSuccess("User deleted successfully");
            setDeleteUserDialogOpen(false);
            setUserToDelete(null);
            await fetchUserList();
        } catch (e: any) {
            showError(e.message || "Failed to delete user");
        } finally {
            setLoading(false);
        }
    };

    // --- Model Management ---
    const openCreateModelDialog = () => {
        setEditingModel(null);
        setModelForm({ ...emptyModel });
        setModelDialogOpen(true);
    };

    const openEditModelDialog = (model: Model) => {
        setEditingModel(model);
        setModelForm({ ...model, key: "" });
        setModelDialogOpen(true);
    };

    const handleSaveModel = async () => {
        setLoading(true);
        try {
            if (editingModel) {
                await apiClient.modelClient.update(modelForm);
                showSuccess("Model updated successfully");
            } else {
                await apiClient.modelClient.add(modelForm);
                showSuccess("Model added successfully");
            }
            setModelDialogOpen(false);
            await loadModels();
        } catch (e: any) {
            showError(e.message || "Failed to save model");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteModel = async () => {
        if (!modelToDelete) return;
        setLoading(true);
        try {
            await apiClient.modelClient.remove(modelToDelete.identifier);
            showSuccess("Model deleted successfully");
            setDeleteModelDialogOpen(false);
            setModelToDelete(null);
            await loadModels();
        } catch (e: any) {
            showError(e.message || "Failed to delete model");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignModel = async () => {
        if (!assignUserId || !assignModelIdentifier) return;
        setLoading(true);
        try {
            await apiClient.modelClient.assign({
                userId: Number(assignUserId),
                modelIdentifier: assignModelIdentifier,
            });
            showSuccess("Model assigned successfully");
            setAssignUserId("");
            setAssignModelIdentifier("");
        } catch (e: any) {
            showError(e.message || "Failed to assign model");
        } finally {
            setLoading(false);
        }
    };

    const handleUnassignModel = async () => {
        if (!unassignUserId || !unassignModelIdentifier) return;
        setLoading(true);
        try {
            await apiClient.modelClient.unassign({
                userId: Number(unassignUserId),
                modelIdentifier: unassignModelIdentifier,
            });
            showSuccess("Model unassigned successfully");
            setUnassignUserId("");
            setUnassignModelIdentifier("");
        } catch (e: any) {
            showError(e.message || "Failed to unassign model");
        } finally {
            setLoading(false);
        }
    };

    // --- Chat History ---
    const handleDeleteAllByUser = async () => {
        if (!deleteHistoryUserId) return;
        setLoading(true);
        try {
            await apiClient.chatHistoryClient.deleteAllByUser(
                Number(deleteHistoryUserId)
            );
            showSuccess("Chat histories deleted successfully");
            setDeleteHistoryDialogOpen(false);
            setDeleteHistoryUserId("");
            await loadAllHistories();
        } catch (e: any) {
            showError(e.message || "Failed to delete chat histories");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className={styles.container}>
            <AppBar
                title="Admin Portal"
                leftActions={
                    <Button
                        appearance="subtle"
                        icon={<ArrowLeft20Regular />}
                        onClick={onBack}
                    />
                }
            />

            {/* Status Messages */}
            {successMessage && (
                <MessageBar intent="success" style={{ margin: "8px 16px 0" }}>
                    {successMessage}
                </MessageBar>
            )}
            {error && (
                <MessageBar intent="error" style={{ margin: "8px 16px 0" }}>
                    {error}
                </MessageBar>
            )}

            <div className={styles.content}>
                <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(_, data) =>
                        setSelectedTab(data.value as TabValue)
                    }
                    style={{ padding: "0 16px", borderBottom: "1px solid var(--colorNeutralStroke2)" }}
                >
                    <Tab value="users" icon={<People20Regular />}>
                        Users
                    </Tab>
                    <Tab value="models" icon={<Server20Regular />}>
                        Models
                    </Tab>
                    <Tab value="transactions" icon={<DataTrending20Regular />}>
                        Transactions
                    </Tab>
                    <Tab value="chathistory" icon={<Chat20Regular />}>
                        Chat History
                    </Tab>
                </TabList>

                <div className={styles.tabContent}>
                    {/* ===== USERS TAB ===== */}
                    {selectedTab === "users" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionTitle}>
                                    <People20Regular />
                                    <Text>User Management</Text>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Button
                                        size="small"
                                        icon={<ArrowClockwise20Regular />}
                                        onClick={() =>
                                            fetchUserList().catch(e =>
                                                showError(e.message)
                                            )
                                        }
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        size="small"
                                        appearance="primary"
                                        icon={<Add20Regular />}
                                        onClick={openCreateUserDialog}
                                    >
                                        Add User
                                    </Button>
                                </div>
                            </div>
                            <div className={styles.tableContainer}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHeaderCell>ID</TableHeaderCell>
                                            <TableHeaderCell>Username</TableHeaderCell>
                                            <TableHeaderCell>Role</TableHeaderCell>
                                            <TableHeaderCell>Remaining Credit</TableHeaderCell>
                                            <TableHeaderCell>Credit Quota</TableHeaderCell>
                                            <TableHeaderCell>Last Reset</TableHeaderCell>
                                            <TableHeaderCell>Actions</TableHeaderCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {userList.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.id}</TableCell>
                                                <TableCell>{user.userName}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        color={user.isAdmin ? "danger" : "informative"}
                                                        size="small"
                                                    >
                                                        {user.isAdmin ? "Admin" : "User"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{user.remainingCredit.toFixed(2)}</TableCell>
                                                <TableCell>{user.creditQuota.toFixed(2)}</TableCell>
                                                <TableCell>{formatDate(user.lastCreditReset)}</TableCell>
                                                <TableCell>
                                                    <div className={styles.actionButtons}>
                                                        <Tooltip content="Edit" relationship="label">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<Edit20Regular />}
                                                                onClick={() => openEditUserDialog(user)}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip content="Delete" relationship="label">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<Delete20Regular />}
                                                                onClick={() => {
                                                                    setUserToDelete(user);
                                                                    setDeleteUserDialogOpen(true);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* ===== MODELS TAB ===== */}
                    {selectedTab === "models" && (
                        <>
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionTitle}>
                                        <Server20Regular />
                                        <Text>Model Management</Text>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Button
                                            size="small"
                                            icon={<ArrowClockwise20Regular />}
                                            onClick={loadModels}
                                        >
                                            Refresh
                                        </Button>
                                        <Button
                                            size="small"
                                            appearance="primary"
                                            icon={<Add20Regular />}
                                            onClick={openCreateModelDialog}
                                        >
                                            Add Model
                                        </Button>
                                    </div>
                                </div>
                                {modelsLoading ? (
                                    <div style={{ padding: "32px", textAlign: "center" }}>
                                        <Spinner label="Loading models..." />
                                    </div>
                                ) : (
                                    <div className={styles.tableContainer}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHeaderCell>Identifier</TableHeaderCell>
                                                    <TableHeaderCell>Friendly Name</TableHeaderCell>
                                                    <TableHeaderCell>Deployment</TableHeaderCell>
                                                    <TableHeaderCell>Max Tokens</TableHeaderCell>
                                                    <TableHeaderCell>Features</TableHeaderCell>
                                                    <TableHeaderCell>Prompt Cost</TableHeaderCell>
                                                    <TableHeaderCell>Response Cost</TableHeaderCell>
                                                    <TableHeaderCell>Actions</TableHeaderCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {models.map(model => (
                                                    <TableRow key={model.identifier}>
                                                        <TableCell>{model.identifier}</TableCell>
                                                        <TableCell>{model.friendlyName}</TableCell>
                                                        <TableCell>{model.deployment}</TableCell>
                                                        <TableCell>{model.maxTokens.toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                                {model.isVision && <Badge size="small" color="success">Vision</Badge>}
                                                                {model.supportTool && <Badge size="small" color="informative">Tools</Badge>}
                                                                {model.reasoningModel && <Badge size="small" color="warning">Reasoning</Badge>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{model.costPromptToken}</TableCell>
                                                        <TableCell>{model.costResponseToken}</TableCell>
                                                        <TableCell>
                                                            <div className={styles.actionButtons}>
                                                                <Tooltip content="Edit" relationship="label">
                                                                    <Button
                                                                        size="small"
                                                                        appearance="subtle"
                                                                        icon={<Edit20Regular />}
                                                                        onClick={() => openEditModelDialog(model)}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip content="Delete" relationship="label">
                                                                    <Button
                                                                        size="small"
                                                                        appearance="subtle"
                                                                        icon={<Delete20Regular />}
                                                                        onClick={() => {
                                                                            setModelToDelete(model);
                                                                            setDeleteModelDialogOpen(true);
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Assign / Unassign Model */}
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionTitle}>
                                        <LinkAdd20Regular />
                                        <Text>Assign / Unassign Model</Text>
                                    </div>
                                </div>
                                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {/* Assign */}
                                    <Text weight="semibold" size={300}>Assign Model to User</Text>
                                    <div className={styles.formRow}>
                                        <Field label="User" className={styles.formField}>
                                            <Select
                                                value={assignUserId}
                                                onChange={(_, data) => setAssignUserId(data.value)}
                                            >
                                                <option value="">Select user...</option>
                                                {userList.map(u => (
                                                    <option key={u.id} value={String(u.id)}>
                                                        {u.userName} (ID: {u.id})
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <Field label="Model" className={styles.formField}>
                                            <Select
                                                value={assignModelIdentifier}
                                                onChange={(_, data) => setAssignModelIdentifier(data.value)}
                                            >
                                                <option value="">Select model...</option>
                                                {models.map(m => (
                                                    <option key={m.identifier} value={m.identifier}>
                                                        {m.friendlyName}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                                            <Button
                                                appearance="primary"
                                                icon={<LinkAdd20Regular />}
                                                onClick={handleAssignModel}
                                                disabled={!assignUserId || !assignModelIdentifier || loading}
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Unassign */}
                                    <Text weight="semibold" size={300}>Unassign Model from User</Text>
                                    <div className={styles.formRow}>
                                        <Field label="User" className={styles.formField}>
                                            <Select
                                                value={unassignUserId}
                                                onChange={(_, data) => setUnassignUserId(data.value)}
                                            >
                                                <option value="">Select user...</option>
                                                {userList.map(u => (
                                                    <option key={u.id} value={String(u.id)}>
                                                        {u.userName} (ID: {u.id})
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <Field label="Model" className={styles.formField}>
                                            <Select
                                                value={unassignModelIdentifier}
                                                onChange={(_, data) => setUnassignModelIdentifier(data.value)}
                                            >
                                                <option value="">Select model...</option>
                                                {models.map(m => (
                                                    <option key={m.identifier} value={m.identifier}>
                                                        {m.friendlyName}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                                            <Button
                                                appearance="outline"
                                                icon={<LinkDismiss20Regular />}
                                                onClick={handleUnassignModel}
                                                disabled={!unassignUserId || !unassignModelIdentifier || loading}
                                            >
                                                Unassign
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ===== TRANSACTIONS TAB ===== */}
                    {selectedTab === "transactions" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionTitle}>
                                    <DataTrending20Regular />
                                    <Text>All Transactions</Text>
                                </div>
                                <Button
                                    size="small"
                                    icon={<ArrowClockwise20Regular />}
                                    onClick={loadTransactions}
                                >
                                    Refresh
                                </Button>
                            </div>
                            {transactionsLoading ? (
                                <div style={{ padding: "32px", textAlign: "center" }}>
                                    <Spinner label="Loading transactions..." />
                                </div>
                            ) : (
                                <div className={styles.tableContainer}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHeaderCell>ID</TableHeaderCell>
                                                <TableHeaderCell>Time</TableHeaderCell>
                                                <TableHeaderCell>User ID</TableHeaderCell>
                                                <TableHeaderCell>Model</TableHeaderCell>
                                                <TableHeaderCell>Prompt Tokens</TableHeaderCell>
                                                <TableHeaderCell>Response Tokens</TableHeaderCell>
                                                <TableHeaderCell>Total Tokens</TableHeaderCell>
                                                <TableHeaderCell>Cost</TableHeaderCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map(tx => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>{tx.id}</TableCell>
                                                    <TableCell>{formatDate(tx.time)}</TableCell>
                                                    <TableCell>{tx.userId}</TableCell>
                                                    <TableCell>{tx.requestedService}</TableCell>
                                                    <TableCell>{tx.promptTokens}</TableCell>
                                                    <TableCell>{tx.responseTokens}</TableCell>
                                                    <TableCell>{tx.totalTokens}</TableCell>
                                                    <TableCell>{tx.cost.toFixed(6)}</TableCell>
                                                </TableRow>
                                            ))}
                                            {transactions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8}>
                                                        <Text style={{ color: "var(--colorNeutralForeground3)" }}>
                                                            No transactions found.
                                                        </Text>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== CHAT HISTORY TAB ===== */}
                    {selectedTab === "chathistory" && (
                        <>
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionTitle}>
                                        <Chat20Regular />
                                        <Text>All Chat Histories</Text>
                                    </div>
                                    <Button
                                        size="small"
                                        icon={<ArrowClockwise20Regular />}
                                        onClick={loadAllHistories}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                                {chatHistoryLoading ? (
                                    <div style={{ padding: "32px", textAlign: "center" }}>
                                        <Spinner label="Loading chat histories..." />
                                    </div>
                                ) : (
                                    <div className={styles.tableContainer}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHeaderCell>ID</TableHeaderCell>
                                                    <TableHeaderCell>Title</TableHeaderCell>
                                                    <TableHeaderCell>Messages</TableHeaderCell>
                                                    <TableHeaderCell>Created</TableHeaderCell>
                                                    <TableHeaderCell>Updated</TableHeaderCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allHistories.map(h => (
                                                    <TableRow key={h.id}>
                                                        <TableCell>
                                                            <Text size={200} style={{ fontFamily: "monospace" }}>
                                                                {h.id.slice(0, 8)}…
                                                            </Text>
                                                        </TableCell>
                                                        <TableCell>{h.title || <Text style={{ color: "var(--colorNeutralForeground3)" }}>(untitled)</Text>}</TableCell>
                                                        <TableCell>{h.messageCount}</TableCell>
                                                        <TableCell>{formatDate(h.createdAt)}</TableCell>
                                                        <TableCell>{formatDate(h.updatedAt)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {allHistories.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5}>
                                                            <Text style={{ color: "var(--colorNeutralForeground3)" }}>
                                                                No chat histories found.
                                                            </Text>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Delete all histories for a user */}
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionTitle}>
                                        <DeleteDismiss20Regular />
                                        <Text>Delete User Chat Histories</Text>
                                    </div>
                                </div>
                                <div style={{ padding: "16px" }}>
                                    <div className={styles.formRow}>
                                        <Field label="User" className={styles.formField}>
                                            <Select
                                                value={deleteHistoryUserId}
                                                onChange={(_, data) => setDeleteHistoryUserId(data.value)}
                                            >
                                                <option value="">Select user...</option>
                                                {userList.map(u => (
                                                    <option key={u.id} value={String(u.id)}>
                                                        {u.userName} (ID: {u.id})
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                                            <Button
                                                appearance="outline"
                                                icon={<Delete20Regular />}
                                                onClick={() => setDeleteHistoryDialogOpen(true)}
                                                disabled={!deleteHistoryUserId}
                                            >
                                                Delete All Histories
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ===== DIALOGS ===== */}

            {/* User Create/Edit Dialog */}
            <Dialog
                open={userDialogOpen}
                onOpenChange={(_, data) => !data.open && setUserDialogOpen(false)}
            >
                <DialogSurface style={{ minWidth: "500px" }}>
                    <DialogBody>
                        <DialogTitle>
                            {editingUser ? "Edit User" : "Create User"}
                        </DialogTitle>
                        <DialogContent>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                                <Field label="Username" required>
                                    <Input
                                        value={userForm.userName}
                                        onChange={(_, d) => setUserForm(f => ({ ...f, userName: d.value }))}
                                        placeholder="Enter username"
                                    />
                                </Field>
                                <Field label={editingUser ? "Password (leave blank to keep current)" : "Password"} required={!editingUser}>
                                    <Input
                                        type="password"
                                        value={userForm.password || ""}
                                        onChange={(_, d) => setUserForm(f => ({ ...f, password: d.value }))}
                                        placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                                    />
                                </Field>
                                <Field label="Remaining Credit" required>
                                    <Input
                                        type="number"
                                        value={String(userForm.remainingCredit)}
                                        onChange={(_, d) => setUserForm(f => ({ ...f, remainingCredit: Number(d.value) }))}
                                    />
                                </Field>
                                <Field label="Credit Quota" required>
                                    <Input
                                        type="number"
                                        value={String(userForm.creditQuota)}
                                        onChange={(_, d) => setUserForm(f => ({ ...f, creditQuota: Number(d.value) }))}
                                    />
                                </Field>
                                <Switch
                                    label="Admin Role"
                                    checked={userForm.isAdmin}
                                    onChange={(_, d) => setUserForm(f => ({ ...f, isAdmin: d.checked }))}
                                />
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleSaveUser}
                                disabled={loading || !userForm.userName}
                                icon={loading ? <Spinner size="tiny" /> : undefined}
                            >
                                {editingUser ? "Save Changes" : "Create User"}
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* User Delete Confirmation Dialog */}
            <Dialog
                open={deleteUserDialogOpen}
                onOpenChange={(_, data) => !data.open && setDeleteUserDialogOpen(false)}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete user{" "}
                                <strong>{userToDelete?.userName}</strong>? This action cannot be undone.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary" disabled={loading}>Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleDeleteUser}
                                disabled={loading}
                                icon={loading ? <Spinner size="tiny" /> : undefined}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Model Create/Edit Dialog */}
            <Dialog
                open={modelDialogOpen}
                onOpenChange={(_, data) => !data.open && setModelDialogOpen(false)}
            >
                <DialogSurface style={{ minWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
                    <DialogBody>
                        <DialogTitle>
                            {editingModel ? "Edit Model" : "Add Model"}
                        </DialogTitle>
                        <DialogContent>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                                <div className={styles.formRow}>
                                    <Field label="Identifier" required className={styles.formField}>
                                        <Input
                                            value={modelForm.identifier}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, identifier: d.value }))}
                                            placeholder="e.g. gpt-4o"
                                            disabled={!!editingModel}
                                        />
                                    </Field>
                                    <Field label="Friendly Name" required className={styles.formField}>
                                        <Input
                                            value={modelForm.friendlyName}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, friendlyName: d.value }))}
                                            placeholder="e.g. GPT-4o"
                                        />
                                    </Field>
                                </div>
                                <Field label="Endpoint" required>
                                    <Input
                                        value={modelForm.endpoint}
                                        onChange={(_, d) => setModelForm(f => ({ ...f, endpoint: d.value }))}
                                        placeholder="https://my-resource.openai.azure.com/"
                                    />
                                </Field>
                                <div className={styles.formRow}>
                                    <Field label="Deployment" required className={styles.formField}>
                                        <Input
                                            value={modelForm.deployment}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, deployment: d.value }))}
                                            placeholder="e.g. gpt-4o"
                                        />
                                    </Field>
                                    <Field label={editingModel ? "API Key (leave blank to keep)" : "API Key"} required={!editingModel} className={styles.formField}>
                                        <Input
                                            type="password"
                                            value={modelForm.key || ""}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, key: d.value }))}
                                            placeholder={editingModel ? "Leave blank to keep current" : "Azure OpenAI key"}
                                        />
                                    </Field>
                                </div>
                                <div className={styles.formRow}>
                                    <Field label="Cost per Prompt Token" required className={styles.formField}>
                                        <Input
                                            type="number"
                                            value={String(modelForm.costPromptToken)}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, costPromptToken: Number(d.value) }))}
                                        />
                                    </Field>
                                    <Field label="Cost per Response Token" required className={styles.formField}>
                                        <Input
                                            type="number"
                                            value={String(modelForm.costResponseToken)}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, costResponseToken: Number(d.value) }))}
                                        />
                                    </Field>
                                </div>
                                <div className={styles.formRow}>
                                    <Field label="Max Tokens" required className={styles.formField}>
                                        <Input
                                            type="number"
                                            value={String(modelForm.maxTokens)}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, maxTokens: Number(d.value) }))}
                                        />
                                    </Field>
                                    <Field label="API Version Override" className={styles.formField}>
                                        <Input
                                            value={modelForm.apiVersionOverride || ""}
                                            onChange={(_, d) => setModelForm(f => ({ ...f, apiVersionOverride: d.value || null }))}
                                            placeholder="e.g. 2024-02-01 (optional)"
                                        />
                                    </Field>
                                </div>
                                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                    <Switch
                                        label="Vision Support"
                                        checked={modelForm.isVision}
                                        onChange={(_, d) => setModelForm(f => ({ ...f, isVision: d.checked }))}
                                    />
                                    <Switch
                                        label="Tool/Function Calling"
                                        checked={modelForm.supportTool}
                                        onChange={(_, d) => setModelForm(f => ({ ...f, supportTool: d.checked }))}
                                    />
                                    <Switch
                                        label="Reasoning Model"
                                        checked={modelForm.reasoningModel}
                                        onChange={(_, d) => setModelForm(f => ({ ...f, reasoningModel: d.checked }))}
                                    />
                                </div>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleSaveModel}
                                disabled={loading || !modelForm.identifier || !modelForm.friendlyName || !modelForm.endpoint || !modelForm.deployment}
                                icon={loading ? <Spinner size="tiny" /> : undefined}
                            >
                                {editingModel ? "Save Changes" : "Add Model"}
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Model Delete Confirmation Dialog */}
            <Dialog
                open={deleteModelDialogOpen}
                onOpenChange={(_, data) => !data.open && setDeleteModelDialogOpen(false)}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete Model</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete model{" "}
                                <strong>{modelToDelete?.friendlyName}</strong>? All user assignments will also be removed.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary" disabled={loading}>Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleDeleteModel}
                                disabled={loading}
                                icon={loading ? <Spinner size="tiny" /> : undefined}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Delete All User Histories Confirmation Dialog */}
            <Dialog
                open={deleteHistoryDialogOpen}
                onOpenChange={(_, data) => !data.open && setDeleteHistoryDialogOpen(false)}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete Chat Histories</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete all chat histories for user{" "}
                                <strong>{userList.find(u => String(u.id) === deleteHistoryUserId)?.userName}</strong>?
                                This action cannot be undone.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary" disabled={loading}>Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleDeleteAllByUser}
                                disabled={loading}
                                icon={loading ? <Spinner size="tiny" /> : undefined}
                            >
                                Delete All
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    );
}
