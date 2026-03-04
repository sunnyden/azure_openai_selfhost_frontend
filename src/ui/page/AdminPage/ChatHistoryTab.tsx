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
} from "@fluentui/react-components";
import {
    Chat20Regular,
    ArrowClockwise20Regular,
    Delete20Regular,
    DeleteDismiss20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { ChatHistorySummary } from "../../../api/interface/data/common/ChatHistory";
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
    const [allHistories, setAllHistories] = useState<ChatHistorySummary[]>([]);
    const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
    const [deleteHistoryUserId, setDeleteHistoryUserId] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const loadAllHistories = useCallback(async () => {
        setChatHistoryLoading(true);
        try {
            const data = await apiClient.chatHistoryClient.allHistories();
            setAllHistories(data);
        } catch (e: any) {
            onError(e.message || "Failed to load chat histories");
        } finally {
            setChatHistoryLoading(false);
        }
    }, [apiClient, onError]);

    useEffect(() => {
        loadAllHistories();
    }, [loadAllHistories]);

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
            await loadAllHistories();
        } catch (e: any) {
            onError(e.message || "Failed to delete chat histories");
        } finally {
            setLoading(false);
        }
    };

    const selectedUserName = userList.find(
        u => String(u.id) === deleteHistoryUserId
    )?.userName;

    return (
        <>
            {/* All histories table */}
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
                                            <Text
                                                size={200}
                                                style={{ fontFamily: "monospace" }}
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
                                    </TableRow>
                                ))}
                                {allHistories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
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
        </>
    );
}
