import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    Text,
    Spinner,
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
    Field,
    Select,
    Badge,
} from "@fluentui/react-components";
import {
    Chat20Regular,
    ArrowClockwise20Regular,
    Delete20Regular,
    DeleteDismiss20Regular,
    Eye20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { ChatHistorySummary } from "../../../api/interface/data/common/ChatHistory";
import {
    ChatMessage,
    ChatRole,
} from "../../../api/interface/data/common/Chat";
import { useAdminStyles } from "./adminStyles";
import { formatDate } from "./formatDate";

interface ChatHistoryTabProps {
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export function ChatHistoryTab({ onSuccess, onError }: ChatHistoryTabProps) {
    const styles = useAdminStyles();
    const apiClient = useApiClient();
    const { userList } = useUserContext();

    const [loading, setLoading] = useState(false);
    const [histories, setHistories] = useState<ChatHistorySummary[]>([]);
    const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
    const [filterUserId, setFilterUserId] = useState<string>("");
    const [deleteHistoryUserId, setDeleteHistoryUserId] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Detail view state
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailMessages, setDetailMessages] = useState<ChatMessage[]>([]);
    const [detailTitle, setDetailTitle] = useState<string>("");

    const loadHistories = useCallback(
        async (userId?: string) => {
            setChatHistoryLoading(true);
            try {
                let data: ChatHistorySummary[];
                if (userId) {
                    data = await apiClient.chatHistoryClient.listByUser(
                        Number(userId)
                    );
                } else {
                    data = await apiClient.chatHistoryClient.allHistories();
                }
                setHistories(data);
            } catch (e: any) {
                onError(e.message || "Failed to load chat histories");
            } finally {
                setChatHistoryLoading(false);
            }
        },
        [apiClient, onError]
    );

    useEffect(() => {
        loadHistories(filterUserId || undefined);
    }, [loadHistories, filterUserId]);

    const handleFilterChange = (userId: string) => {
        setFilterUserId(userId);
    };

    const handleDeleteAllByUser = async () => {
        if (!deleteHistoryUserId) return;
        setLoading(true);
        try {
            await apiClient.chatHistoryClient.deleteAllByUser(
                Number(deleteHistoryUserId)
            );
            onSuccess("Chat histories deleted successfully");
            setDeleteDialogOpen(false);
            setDeleteHistoryUserId("");
            await loadHistories(filterUserId || undefined);
        } catch (e: any) {
            onError(e.message || "Failed to delete chat histories");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (historyId: string, title: string) => {
        setDetailTitle(title || "(untitled)");
        setDetailDialogOpen(true);
        setDetailLoading(true);
        setDetailMessages([]);
        try {
            const item = await apiClient.chatHistoryClient.get(historyId);
            setDetailMessages(item.messages);
        } catch (e: any) {
            onError(e.message || "Failed to load chat history detail");
            setDetailDialogOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const selectedUserName = userList.find(
        u => String(u.id) === deleteHistoryUserId
    )?.userName;

    const roleBadgeColor = (role: ChatRole) => {
        switch (role) {
            case ChatRole.User:
                return "informative";
            case ChatRole.Assistant:
                return "success";
            case ChatRole.System:
                return "warning";
            default:
                return "subtle";
        }
    };

    return (
        <>
            {/* Filter + histories table */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Chat20Regular />
                        <Text>Chat Histories</Text>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <Field label="Filter by user" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                            <Select
                                value={filterUserId}
                                onChange={(_, data) =>
                                    handleFilterChange(data.value)
                                }
                                style={{ minWidth: "160px" }}
                            >
                                <option value="">All users</option>
                                {userList.map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.userName} (ID: {u.id})
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Button
                            size="small"
                            icon={<ArrowClockwise20Regular />}
                            onClick={() =>
                                loadHistories(filterUserId || undefined)
                            }
                        >
                            Refresh
                        </Button>
                    </div>
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
                                    <TableHeaderCell>Actions</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {histories.map(h => (
                                    <TableRow key={h.id}>
                                        <TableCell>
                                            <Text
                                                size={200}
                                                style={{
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {h.id.slice(0, 8)}…
                                            </Text>
                                        </TableCell>
                                        <TableCell>
                                            {h.title || (
                                                <Text
                                                    style={{
                                                        color: "var(--colorNeutralForeground3)",
                                                    }}
                                                >
                                                    (untitled)
                                                </Text>
                                            )}
                                        </TableCell>
                                        <TableCell>{h.messageCount}</TableCell>
                                        <TableCell>
                                            {formatDate(h.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(h.updatedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                appearance="subtle"
                                                icon={<Eye20Regular />}
                                                onClick={() =>
                                                    handleViewDetail(
                                                        h.id,
                                                        h.title
                                                    )
                                                }
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {histories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <Text
                                                style={{
                                                    color: "var(--colorNeutralForeground3)",
                                                }}
                                            >
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

            {/* Delete by user panel */}
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
                                onChange={(_, data) =>
                                    setDeleteHistoryUserId(data.value)
                                }
                            >
                                <option value="">Select user...</option>
                                {userList.map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.userName} (ID: {u.id})
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <div
                            style={{ display: "flex", alignItems: "flex-end" }}
                        >
                            <Button
                                appearance="outline"
                                icon={<Delete20Regular />}
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={!deleteHistoryUserId}
                            >
                                Delete All Histories
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onOpenChange={(_, data) =>
                    !data.open && setDeleteDialogOpen(false)
                }
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete Chat Histories</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete all
                                chat histories for user{" "}
                                <strong>{selectedUserName}</strong>? This action
                                cannot be undone.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button
                                    appearance="secondary"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleDeleteAllByUser}
                                disabled={loading}
                                icon={
                                    loading ? <Spinner size="tiny" /> : undefined
                                }
                            >
                                Delete All
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Detail view dialog */}
            <Dialog
                open={detailDialogOpen}
                onOpenChange={(_, data) =>
                    !data.open && setDetailDialogOpen(false)
                }
            >
                <DialogSurface
                    style={{
                        minWidth: "600px",
                        maxWidth: "800px",
                        maxHeight: "85vh",
                    }}
                >
                    <DialogBody>
                        <DialogTitle>{detailTitle}</DialogTitle>
                        <DialogContent>
                            {detailLoading ? (
                                <div
                                    style={{
                                        padding: "32px",
                                        textAlign: "center",
                                    }}
                                >
                                    <Spinner label="Loading messages..." />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                        paddingTop: "8px",
                                        overflowY: "auto",
                                        maxHeight: "60vh",
                                    }}
                                >
                                    {detailMessages.length === 0 && (
                                        <Text
                                            style={{
                                                color: "var(--colorNeutralForeground3)",
                                            }}
                                        >
                                            No messages.
                                        </Text>
                                    )}
                                    {detailMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "4px",
                                                padding: "10px 12px",
                                                border: "1px solid var(--colorNeutralStroke2)",
                                                borderRadius: "6px",
                                                backgroundColor:
                                                    msg.role === ChatRole.User
                                                        ? "var(--colorNeutralBackground2)"
                                                        : msg.role ===
                                                            ChatRole.System
                                                          ? "var(--colorPaletteYellowBackground1)"
                                                          : "var(--colorNeutralBackground1)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <Badge
                                                    size="small"
                                                    color={roleBadgeColor(
                                                        msg.role
                                                    )}
                                                >
                                                    {msg.role}
                                                </Badge>
                                            </div>
                                            <div>
                                                {msg.content.map(
                                                    (item, ci) => (
                                                        <Text
                                                            key={ci}
                                                            style={{
                                                                whiteSpace:
                                                                    "pre-wrap",
                                                                wordBreak:
                                                                    "break-word",
                                                            }}
                                                        >
                                                            {item.text ?? ""}
                                                        </Text>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                appearance="secondary"
                                onClick={() => setDetailDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
}
