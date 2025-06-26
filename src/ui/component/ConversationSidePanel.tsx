import React, { useState } from "react";
import {
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    Button,
    Input,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogBody,
    Tooltip,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    Text,
    Title3,
} from "@fluentui/react-components";
import {
    Add24Regular,
    Delete24Regular,
    Edit24Regular,
    Dismiss24Regular,
    Chat24Regular,
    DataUsage24Regular,
    ArrowDownload24Regular,
    ArrowUpload24Regular,
    MoreVertical24Regular,
} from "@fluentui/react-icons";
import { useConversationHistory } from "../../data/context/ConversationHistoryContext";
import { isElectron } from "../../utils/electronUtils";

interface ConversationSidePanelProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
    onNavigateToUsage: () => void;
}

export function ConversationSidePanel({
    open,
    onClose,
    onOpen,
    onNavigateToUsage,
}: ConversationSidePanelProps) {
    const {
        conversations,
        currentConversationId,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        selectConversation,
        exportConversation,
        exportAllConversations,
        loadConversationsFromFile,
    } = useConversationHistory();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<
        string | null
    >(null);
    const [exportMenuAnchor, setExportMenuAnchor] =
        useState<null | HTMLElement>(null);
    const [exportConversationId, setExportConversationId] = useState<
        string | null
    >(null);

    const handleNewConversation = () => {
        createNewConversation();
        onClose();
    };

    const handleSelectConversation = (id: string) => {
        selectConversation(id);
        onClose();
    };

    const handleStartEdit = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const handleSaveEdit = () => {
        if (editingId && editTitle.trim()) {
            updateConversationTitle(editingId, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditTitle("");
    };

    const handleDeleteClick = (id: string) => {
        setConversationToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (conversationToDelete) {
            deleteConversation(conversationToDelete);
        }
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    const handleExportMenuOpen = (
        event: React.MouseEvent<HTMLButtonElement>,
        conversationId?: string
    ) => {
        setExportMenuAnchor(event.currentTarget);
        setExportConversationId(conversationId || null);
    };

    const handleExportMenuClose = () => {
        setExportMenuAnchor(null);
        setExportConversationId(null);
    };

    const handleExportSingleConversation = (exportConversationId: string) => {
        if (exportConversationId) {
            exportConversation(exportConversationId);
        }
    };

    const handleExportAllConversations = () => {
        exportAllConversations();
        handleExportMenuClose();
    };

    const handleImportConversations = () => {
        loadConversationsFromFile();
        handleExportMenuClose();
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: "short" });
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        }
    };
    return (
        <>
            <Drawer
                open={open}
                onOpenChange={(_, { open }) => !open && onClose()}
                position="start"
                style={{
                    maxWidth: "320px",
                    width: "320px",
                    ...(isElectron() && {
                        WebkitAppRegion: "no-drag",
                    }),
                }}
            >
                <DrawerHeader>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <DrawerHeaderTitle>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <Chat24Regular />
                                <Text>Chat History</Text>
                            </div>
                        </DrawerHeaderTitle>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <Tooltip
                                content="Export/Import"
                                relationship="label"
                            >
                                <Button
                                    icon={<MoreVertical24Regular />}
                                    appearance="subtle"
                                    size="small"
                                    onClick={e => handleExportMenuOpen(e)}
                                />
                            </Tooltip>
                            <Button
                                icon={<Dismiss24Regular />}
                                appearance="subtle"
                                size="small"
                                onClick={onClose}
                            />
                        </div>
                    </div>
                </DrawerHeader>
                <DrawerBody
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: "16px" }}>
                        <Button
                            appearance="primary"
                            icon={<Add24Regular />}
                            onClick={handleNewConversation}
                            size="small"
                            style={{ width: "100%" }}
                        >
                            New Conversation
                        </Button>
                    </div>
                    <div
                        style={{
                            height: "1px",
                            backgroundColor: "var(--colorNeutralStroke1)",
                            margin: 0,
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
                        {conversations.length === 0 ? (
                            <div
                                style={{ padding: "24px", textAlign: "center" }}
                            >
                                <Text
                                    align="center"
                                    style={{
                                        color: "var(--colorNeutralForeground3)",
                                    }}
                                >
                                    No conversations yet. Start a new
                                    conversation to begin chatting!
                                </Text>
                            </div>
                        ) : (
                            conversations.map(conversation => (
                                <div
                                    key={conversation.id}
                                    style={{
                                        marginBottom: "4px",
                                        backgroundColor:
                                            currentConversationId ===
                                            conversation.id
                                                ? "var(--colorNeutralBackground1Selected)"
                                                : "transparent",
                                        borderRadius: "4px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start", // Changed from center to flex-start for proper alignment
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            borderRadius: "4px",
                                            gap: "8px", // Add gap between content and actions
                                        }}
                                        onClick={() =>
                                            handleSelectConversation(
                                                conversation.id
                                            )
                                        }
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {editingId === conversation.id ? (
                                                <Input
                                                    value={editTitle}
                                                    onChange={(_, data) =>
                                                        setEditTitle(data.value)
                                                    }
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") {
                                                            handleSaveEdit();
                                                        } else if (
                                                            e.key === "Escape"
                                                        ) {
                                                            handleCancelEdit();
                                                        }
                                                    }}
                                                    onBlur={handleSaveEdit}
                                                    size="small"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div>
                                                    <Text
                                                        size={300}
                                                        weight={
                                                            currentConversationId ===
                                                            conversation.id
                                                                ? "medium"
                                                                : "regular"
                                                        }
                                                        style={{
                                                            display: "block",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        {conversation.title}
                                                    </Text>
                                                    <Text
                                                        size={200}
                                                        style={{
                                                            color: "var(--colorNeutralForeground3)",
                                                            display: "block",
                                                            lineHeight: "1.2",
                                                            marginTop: "2px",
                                                        }}
                                                    >
                                                        {formatDate(
                                                            conversation.updatedAt
                                                        )}{" "}
                                                        •{" "}
                                                        {
                                                            conversation
                                                                .messages.length
                                                        }{" "}
                                                        messages
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                        {editingId !== conversation.id && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "2px",
                                                    opacity: 0.7,
                                                    transition: "opacity 0.2s",
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.opacity =
                                                        "1";
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.opacity =
                                                        "0.7";
                                                }}
                                            >
                                                <Tooltip
                                                    content="Export"
                                                    relationship="label"
                                                >
                                                    <Button
                                                        icon={
                                                            <ArrowDownload24Regular />
                                                        }
                                                        appearance="subtle"
                                                        size="small"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleExportSingleConversation(
                                                                conversation.id
                                                            );
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    content="Rename"
                                                    relationship="label"
                                                >
                                                    <Button
                                                        icon={<Edit24Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleStartEdit(
                                                                conversation.id,
                                                                conversation.title
                                                            );
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    content="Delete"
                                                    relationship="label"
                                                >
                                                    <Button
                                                        icon={
                                                            <Delete24Regular />
                                                        }
                                                        appearance="subtle"
                                                        size="small"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(
                                                                conversation.id
                                                            );
                                                        }}
                                                    />
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Usage Analytics Button */}
                    <div style={{ padding: "16px", paddingTop: 0 }}>
                        <div
                            style={{
                                height: "1px",
                                backgroundColor: "var(--colorNeutralStroke1)",
                                marginBottom: "16px",
                                flexShrink: 0,
                            }}
                        />
                        <Button
                            appearance="outline"
                            icon={<DataUsage24Regular />}
                            onClick={onNavigateToUsage}
                            size="small"
                            style={{ width: "100%" }}
                        >
                            View Usage Analytics
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            {/* Export/Import Menu */}
            <Menu
                open={Boolean(exportMenuAnchor)}
                onOpenChange={(_, data) =>
                    !data.open && setExportMenuAnchor(null)
                }
                positioning={{
                    target: exportMenuAnchor,
                    position: "below",
                    align: "start",
                }}
            >
                <MenuTrigger>
                    <div style={{ display: "none" }} />
                </MenuTrigger>
                <MenuPopover>
                    <MenuList>
                        <MenuItem
                            onClick={handleExportAllConversations}
                            icon={<ArrowDownload24Regular />}
                        >
                            Export All Conversations
                        </MenuItem>
                        <MenuItem
                            onClick={handleImportConversations}
                            icon={<ArrowUpload24Regular />}
                        >
                            Import Conversations
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onOpenChange={(_, data) => !data.open && handleCancelDelete()}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete Conversation</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to delete this
                                conversation? This action cannot be undone.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button
                                    appearance="secondary"
                                    onClick={handleCancelDelete}
                                >
                                    Cancel
                                </Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
}
