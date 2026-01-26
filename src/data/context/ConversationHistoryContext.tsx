import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    ChatMessage,
    ChatMessageContentType,
} from "../../api/interface/data/common/Chat";
import { useApiClient } from "./useApiClient";
import { useUserContext } from "./UserContext";

export interface ConversationItem {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    messageCount?: number; // Available for cloud conversations that haven't been fully loaded
}

interface ConversationHistoryData {
    conversations: ConversationItem[];
    currentConversationId: string | null;
    isLoading: boolean;
    error: string | null;
    migrationProgress: { current: number; total: number } | null;
    loadingConversationId: string | null;
    isSyncing: boolean;
    createNewConversation: () => Promise<string>;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;
    selectConversation: (id: string) => Promise<void>;
    updateCurrentConversation: (messages: ChatMessage[], syncToCloud?: boolean) => Promise<void>;
    getCurrentConversation: () => ConversationItem | null;
    deleteMessage: (messageIndex: number) => Promise<void>;
    updateMessage: (messageIndex: number, newContent: string) => Promise<void>;
    exportConversation: (conversationId: string) => void;
    exportAllConversations: () => void;
    loadConversationsFromFile: () => void;
}

const ConversationHistoryContext =
    createContext<ConversationHistoryData | null>(null);

const STORAGE_KEY = "chat_conversations";
const CURRENT_CONVERSATION_KEY = "current_conversation_id";

export function ConversationHistoryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const apiClient = useApiClient();
    const userContext = useUserContext();

    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<
        string | null
    >(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [migrationProgress, setMigrationProgress] = useState<{
        current: number;
        total: number;
    } | null>(null);
    const [loadedConversationIds, setLoadedConversationIds] = useState<
        Set<string>
    >(new Set());
    const [hasInitialized, setHasInitialized] = useState(false);
    const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Migration function
    const performMigration = useCallback(
        async (migrationKey: string) => {
            console.log("Starting migration from localStorage to cloud...");

            const savedConversations = localStorage.getItem(STORAGE_KEY);
            if (!savedConversations) {
                localStorage.setItem(migrationKey, "true");
                await loadFromCloud();
                return;
            }

            try {
                const parsed = JSON.parse(savedConversations);

                // Filter out conversations with empty messages
                const conversationsToMigrate = parsed.filter(
                    (conv: any) => conv.messages && conv.messages.length > 0
                );

                const total = conversationsToMigrate.length;
                const skippedCount = parsed.length - total;

                if (skippedCount > 0) {
                    console.log(`Skipping ${skippedCount} conversation(s) with no messages`);
                }

                // If no conversations to migrate (all were empty), just mark as complete
                if (total === 0) {
                    console.log("No conversations to migrate (all conversations were empty)");
                    localStorage.setItem(migrationKey, "true");
                    localStorage.setItem("chat_conversations_backup", savedConversations);
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
                    await loadFromCloud();
                    return;
                }

                let successCount = 0;
                let failureCount = 0;
                const failedConversations: string[] = [];

                setMigrationProgress({ current: 0, total });

                for (let i = 0; i < conversationsToMigrate.length; i++) {
                    const conv = conversationsToMigrate[i];

                    try {
                        await apiClient.chatHistoryClient.create({
                            title: conv.title,
                            messages: conv.messages,
                        });
                        successCount++;
                        console.log(`Migrated: ${conv.title}`);
                    } catch (error) {
                        failureCount++;
                        failedConversations.push(conv.title);
                        console.error(
                            `Failed to migrate "${conv.title}":`,
                            error
                        );
                    }

                    setMigrationProgress({ current: i + 1, total });
                }

                if (failureCount > 0) {
                    console.warn(
                        `Migration completed with ${failureCount} failures`
                    );
                    setError(
                        `Failed to migrate ${failureCount} of ${total} conversations: ${failedConversations.join(", ")}`
                    );
                } else {
                    const message = skippedCount > 0
                        ? `Migration completed successfully (${successCount} migrated, ${skippedCount} empty conversations skipped)`
                        : "Migration completed successfully";
                    console.log(message);
                }

                localStorage.setItem(migrationKey, "true");
                localStorage.setItem(
                    "chat_conversations_backup",
                    savedConversations
                );
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(CURRENT_CONVERSATION_KEY);

                await loadFromCloud();
            } catch (error) {
                console.error("Migration failed:", error);
                throw new Error(
                    "Migration failed: " +
                        (error instanceof Error ? error.message : "Unknown error")
                );
            } finally {
                setMigrationProgress(null);
            }
        },
        [apiClient]
    );

    // Load full conversation
    const loadFullConversation = useCallback(
        async (id: string) => {
            if (loadedConversationIds.has(id)) {
                return;
            }

            try {
                setLoadingConversationId(id);
                const fullConv = await apiClient.chatHistoryClient.get(id);

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === id
                            ? { ...conv, messages: fullConv.messages }
                            : conv
                    )
                );

                setLoadedConversationIds((prev) => new Set(prev).add(id));
            } catch (error) {
                console.error(`Failed to load conversation ${id}:`, error);
                throw error;
            } finally {
                setLoadingConversationId(null);
            }
        },
        [apiClient, loadedConversationIds]
    );

    // Create a local-only conversation (not synced to cloud until it has messages)
    const createLocalConversation = useCallback(() => {
        const now = new Date();
        const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const title = `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        const newConv: ConversationItem = {
            id: localId,
            title,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversationId(localId);
        setLoadedConversationIds((prev) => new Set(prev).add(localId));

        console.log("Created local conversation (will sync to cloud when first message is added)");
        return localId;
    }, []);

    // Load from cloud
    const loadFromCloud = useCallback(async () => {
        try {
            const summaries = await apiClient.chatHistoryClient.list();

            const conversations: ConversationItem[] = summaries.map(
                (summary) => ({
                    id: summary.id,
                    title: summary.title,
                    messages: [],
                    messageCount: summary.messageCount,
                    createdAt: new Date(summary.createdAt),
                    updatedAt: new Date(summary.updatedAt),
                })
            );

            setConversations(conversations);

            if (conversations.length > 0) {
                const firstId = conversations[0].id;
                await loadFullConversation(firstId);
                setCurrentConversationId(firstId);
            } else {
                // Create a local-only conversation (not synced to cloud until it has messages)
                createLocalConversation();
            }
        } catch (error) {
            console.error("Failed to load from cloud:", error);
            throw error;
        }
    }, [apiClient, loadFullConversation, createLocalConversation]);

    // Initialize conversations
    useEffect(() => {
        if (!userContext.initialized) return;
        if (hasInitialized) return; // Prevent re-initialization

        const initialize = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (!userContext.authenticatedUser) {
                    setError("Please log in to access chat history");
                    setIsLoading(false);
                    setHasInitialized(true);
                    return;
                }

                const migrationKey = `chat_migration_complete_${userContext.authenticatedUser.id}`;
                const migrationComplete = localStorage.getItem(migrationKey);

                if (!migrationComplete) {
                    await performMigration(migrationKey);
                } else {
                    await loadFromCloud();
                }

                setHasInitialized(true);
            } catch (err) {
                console.error("Failed to initialize:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load chat history"
                );
                setHasInitialized(true);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userContext.initialized, userContext.authenticatedUser?.id, hasInitialized]);

    const createNewConversation = useCallback(async (): Promise<string> => {
        // Just create a local conversation - it will be synced when messages are added
        return createLocalConversation();
    }, [createLocalConversation]);

    const deleteConversation = useCallback(
        async (id: string) => {
            try {
                // Only delete from cloud if it's not a local conversation
                const isLocalConversation = id.startsWith("local_");
                if (!isLocalConversation) {
                    await apiClient.chatHistoryClient.delete({ id });
                }

                const wasCurrentConversation = currentConversationId === id;

                setConversations((prev) => {
                    const filtered = prev.filter((conv) => conv.id !== id);

                    if (wasCurrentConversation && filtered.length > 0) {
                        const nextId = filtered[0].id;
                        setCurrentConversationId(nextId);
                        if (!loadedConversationIds.has(nextId)) {
                            loadFullConversation(nextId);
                        }
                    }

                    return filtered;
                });

                if (
                    wasCurrentConversation &&
                    conversations.length === 1
                ) {
                    await createNewConversation();
                }

                setLoadedConversationIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } catch (error) {
                console.error("Failed to delete conversation:", error);
                throw error;
            }
        },
        [
            apiClient,
            currentConversationId,
            conversations.length,
            loadedConversationIds,
            loadFullConversation,
            createNewConversation,
        ]
    );

    const updateConversationTitle = useCallback(
        async (id: string, title: string) => {
            try {
                // Only update in cloud if it's not a local conversation
                const isLocalConversation = id.startsWith("local_");
                if (!isLocalConversation) {
                    await apiClient.chatHistoryClient.updateTitle({ id, title });
                }

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === id
                            ? { ...conv, title, updatedAt: new Date() }
                            : conv
                    )
                );
            } catch (error) {
                console.error("Failed to update title:", error);
                throw error;
            }
        },
        [apiClient]
    );

    const selectConversation = useCallback(
        async (id: string) => {
            setCurrentConversationId(id);

            // Only load from cloud if it's not a local conversation
            const isLocalConversation = id.startsWith("local_");
            if (!isLocalConversation && !loadedConversationIds.has(id)) {
                try {
                    await loadFullConversation(id);
                } catch (error) {
                    console.error("Failed to load conversation:", error);
                    setError("Failed to load conversation");
                }
            }
        },
        [loadedConversationIds, loadFullConversation]
    );

    const updateCurrentConversation = useCallback(
        async (messages: ChatMessage[], syncToCloud: boolean = true) => {
            if (!currentConversationId) return;

            try {
                const currentConv = conversations.find(
                    (c) => c.id === currentConversationId
                );
                if (!currentConv) return;

                // If not syncing to cloud, just update local state
                if (!syncToCloud) {
                    setConversations((prev) =>
                        prev.map((conv) =>
                            conv.id === currentConversationId
                                ? { ...conv, messages, updatedAt: new Date() }
                                : conv
                        )
                    );
                    return;
                }

                // Set syncing state before API calls
                setIsSyncing(true);

                // Check if this is a local conversation that needs to be synced to cloud
                const isLocalConversation = currentConversationId.startsWith("local_");

                if (isLocalConversation) {
                    // Create in cloud for the first time (only if there are messages)
                    if (messages.length > 0) {
                        console.log("Syncing local conversation to cloud...");
                        const created = await apiClient.chatHistoryClient.create({
                            title: currentConv.title,
                            messages,
                        });

                        // Update the conversation with the cloud ID
                        setConversations((prev) =>
                            prev.map((conv) =>
                                conv.id === currentConversationId
                                    ? {
                                          ...conv,
                                          id: created.id,
                                          messages: created.messages,
                                          createdAt: new Date(created.createdAt),
                                          updatedAt: new Date(created.updatedAt),
                                      }
                                    : conv
                            )
                        );

                        // Update current conversation ID to the cloud ID
                        setCurrentConversationId(created.id);
                        setLoadedConversationIds((prev) => {
                            const next = new Set(prev);
                            next.delete(currentConversationId);
                            next.add(created.id);
                            return next;
                        });

                        console.log("Conversation synced to cloud with ID:", created.id);
                    } else {
                        // No messages yet, just update local state
                        setConversations((prev) =>
                            prev.map((conv) =>
                                conv.id === currentConversationId
                                    ? { ...conv, messages, updatedAt: new Date() }
                                    : conv
                            )
                        );
                    }
                } else {
                    // Cloud conversation - update normally
                    const isAppending = messages.length > currentConv.messages.length;

                    if (isAppending) {
                        const newMessages = messages.slice(
                            currentConv.messages.length
                        );
                        const updated =
                            await apiClient.chatHistoryClient.appendMessages({
                                id: currentConversationId,
                                messages: newMessages,
                            });

                        setConversations((prev) =>
                            prev.map((conv) =>
                                conv.id === currentConversationId
                                    ? {
                                          ...conv,
                                          messages: updated.messages,
                                          updatedAt: new Date(updated.updatedAt),
                                      }
                                    : conv
                            )
                        );
                    } else {
                        await apiClient.chatHistoryClient.update({
                            id: currentConversationId,
                            title: currentConv.title,
                            messages,
                        });

                        setConversations((prev) =>
                            prev.map((conv) =>
                                conv.id === currentConversationId
                                    ? { ...conv, messages, updatedAt: new Date() }
                                    : conv
                            )
                        );
                    }
                }
            } catch (error) {
                console.error("Failed to update conversation:", error);
                throw error;
            } finally {
                setIsSyncing(false);
            }
        },
        [currentConversationId, conversations, apiClient]
    );

    const getCurrentConversation = useCallback(() => {
        if (!currentConversationId) return null;
        return (
            conversations.find((conv) => conv.id === currentConversationId) ||
            null
        );
    }, [conversations, currentConversationId]);

    const deleteMessage = useCallback(
        async (messageIndex: number) => {
            if (!currentConversationId) return;

            const currentConv = conversations.find(
                (c) => c.id === currentConversationId
            );
            if (!currentConv) return;

            const newMessages = currentConv.messages.filter(
                (_, index) => index !== messageIndex
            );
            await updateCurrentConversation(newMessages);
        },
        [currentConversationId, conversations, updateCurrentConversation]
    );

    const updateMessage = useCallback(
        async (messageIndex: number, newContent: string) => {
            if (!currentConversationId) return;

            const currentConv = conversations.find(
                (c) => c.id === currentConversationId
            );
            if (!currentConv) return;

            const newMessages = currentConv.messages.map((msg, index) =>
                index === messageIndex
                    ? {
                          ...msg,
                          content: msg.content.map((item) =>
                              item.type === ChatMessageContentType.Text
                                  ? { ...item, text: newContent }
                                  : item
                          ),
                      }
                    : msg
            );

            await updateCurrentConversation(newMessages);
        },
        [currentConversationId, conversations, updateCurrentConversation]
    );

    const exportConversation = useCallback(
        (conversationId: string) => {
            try {
                const conversation = conversations.find(
                    (conv) => conv.id === conversationId
                );
                if (!conversation) {
                    console.error("Conversation not found:", conversationId);
                    alert("Conversation not found. Export failed.");
                    return;
                }

                const sanitizedConversation = {
                    ...conversation,
                    createdAt: conversation.createdAt.toISOString(),
                    updatedAt: conversation.updatedAt.toISOString(),
                };

                const exportData = {
                    version: "1.0",
                    exportDate: new Date().toISOString(),
                    conversation: sanitizedConversation,
                };

                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(dataBlob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `conversation_${conversation.title
                    .replace(/[^\w\s-]/g, "")
                    .replace(/\s+/g, "_")}_${
                    new Date().toISOString().split("T")[0]
                }.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log("Exported conversation:", conversation.title);
            } catch (error) {
                console.error("Failed to export conversation:", error);
                alert(
                    "Failed to export conversation: " +
                        (error instanceof Error
                            ? error.message
                            : "Unknown error")
                );
            }
        },
        [conversations]
    );

    const exportAllConversations = useCallback(() => {
        try {
            if (conversations.length === 0) {
                console.warn("No conversations to export");
                alert("No conversations available to export.");
                return;
            }

            const sanitizedConversations = conversations.map(
                (conversation) => ({
                    ...conversation,
                    createdAt: conversation.createdAt.toISOString(),
                    updatedAt: conversation.updatedAt.toISOString(),
                })
            );

            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                totalConversations: conversations.length,
                conversations: sanitizedConversations,
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {
                type: "application/json",
            });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `all_conversations_${
                new Date().toISOString().split("T")[0]
            }.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(
                "Exported all conversations:",
                conversations.length,
                "conversations"
            );
        } catch (error) {
            console.error("Failed to export all conversations:", error);
            alert(
                "Failed to export all conversations: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
        }
    }, [conversations]);

    const loadConversationsFromFile = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = e.target?.result as string;
                    const importData = JSON.parse(result);

                    if (!importData.version) {
                        throw new Error("Invalid file format: missing version");
                    }

                    let conversationsToImport: ConversationItem[] = [];

                    if (importData.conversation) {
                        conversationsToImport = [importData.conversation];
                    } else if (
                        importData.conversations &&
                        Array.isArray(importData.conversations)
                    ) {
                        conversationsToImport = importData.conversations;
                    } else {
                        throw new Error(
                            "Invalid file format: no conversations found"
                        );
                    }

                    const imported: ConversationItem[] = [];
                    let skippedEmpty = 0;

                    for (const conv of conversationsToImport) {
                        // Skip conversations with no messages
                        if (!conv.messages || conv.messages.length === 0) {
                            skippedEmpty++;
                            console.log(`Skipping empty conversation: ${conv.title}`);
                            continue;
                        }

                        try {
                            const created =
                                await apiClient.chatHistoryClient.create({
                                    title: conv.title + " (Imported)",
                                    messages: conv.messages,
                                });

                            imported.push({
                                id: created.id,
                                title: created.title,
                                messages: created.messages,
                                createdAt: new Date(created.createdAt),
                                updatedAt: new Date(created.updatedAt),
                            });
                        } catch (error) {
                            console.error(
                                "Failed to import conversation:",
                                error
                            );
                        }
                    }

                    if (skippedEmpty > 0) {
                        console.log(`Skipped ${skippedEmpty} empty conversation(s) during import`);
                    }

                    setConversations((prev) => [...imported, ...prev]);

                    if (imported.length > 0) {
                        setCurrentConversationId(imported[0].id);
                        setLoadedConversationIds(
                            (prev) =>
                                new Set([...prev, ...imported.map((c) => c.id)])
                        );
                    }

                    console.log(
                        "Successfully imported",
                        imported.length,
                        "conversation(s)"
                    );
                } catch (error) {
                    console.error("Failed to import conversations:", error);
                    alert(
                        `Failed to import conversations: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`
                    );
                }
            };
            reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }, [apiClient]);

    const value: ConversationHistoryData = {
        conversations,
        currentConversationId,
        isLoading,
        error,
        migrationProgress,
        loadingConversationId,
        isSyncing,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        selectConversation,
        updateCurrentConversation,
        getCurrentConversation,
        deleteMessage,
        updateMessage,
        exportConversation,
        exportAllConversations,
        loadConversationsFromFile,
    };

    return (
        <ConversationHistoryContext.Provider value={value}>
            {children}
        </ConversationHistoryContext.Provider>
    );
}

export function useConversationHistory() {
    const context = useContext(ConversationHistoryContext);
    if (!context) {
        throw new Error(
            "useConversationHistory must be used within a ConversationHistoryProvider"
        );
    }
    return context;
}
