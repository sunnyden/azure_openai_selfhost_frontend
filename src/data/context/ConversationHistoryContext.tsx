import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { ChatMessage, ChatMessageContentType } from "../../api/interface/data/common/Chat";

export interface ConversationItem {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

interface ConversationHistoryData {
    conversations: ConversationItem[];
    currentConversationId: string | null;
    createNewConversation: () => string;
    deleteConversation: (id: string) => void;
    updateConversationTitle: (id: string, title: string) => void;
    selectConversation: (id: string) => void;
    updateCurrentConversation: (messages: ChatMessage[]) => void;
    getCurrentConversation: () => ConversationItem | null;
    deleteMessage: (messageIndex: number) => void;
    updateMessage: (messageIndex: number, newContent: string) => void;
    // Export and load functionality
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
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<
        string | null
    >(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load conversations from localStorage on mount
    useEffect(() => {
        console.log("Loading conversations from localStorage...");
        const savedConversations = localStorage.getItem(STORAGE_KEY);
        const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
        console.log(
            "Found saved conversations:",
            !!savedConversations,
            "Found saved current ID:",
            !!savedCurrentId
        );

        if (savedConversations) {
            try {
                const parsed = JSON.parse(savedConversations);
                console.log(
                    "Parsed conversations:",
                    parsed.length,
                    "conversations"
                );
                // Convert date strings back to Date objects
                const conversationsWithDates = parsed.map((conv: any) => ({
                    ...conv,
                    createdAt: new Date(conv.createdAt),
                    updatedAt: new Date(conv.updatedAt),
                }));
                setConversations(conversationsWithDates);

                if (savedCurrentId) {
                    setCurrentConversationId(savedCurrentId);
                    console.log(
                        "Set current conversation ID from storage:",
                        savedCurrentId
                    );
                } else if (conversationsWithDates.length > 0) {
                    // If we have conversations but no saved current ID, select the first one
                    setCurrentConversationId(conversationsWithDates[0].id);
                    console.log(
                        "Set current conversation ID to first conversation:",
                        conversationsWithDates[0].id
                    );
                }
            } catch (error) {
                console.error("Failed to parse saved conversations:", error);
                // If parsing fails, create a new conversation
                const now = new Date();
                const id = `conv_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                const title = `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

                const newConversation: ConversationItem = {
                    id,
                    title,
                    messages: [],
                    createdAt: now,
                    updatedAt: now,
                };

                setConversations([newConversation]);
                setCurrentConversationId(id);
                console.log("Created new conversation due to parse error:", id);
            }
        } else {
            // No saved conversations, create a new one
            console.log("No saved conversations found, creating new one...");
            const now = new Date();
            const id = `conv_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            const title = `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

            const newConversation: ConversationItem = {
                id,
                title,
                messages: [],
                createdAt: now,
                updatedAt: now,
            };

            setConversations([newConversation]);
            setCurrentConversationId(id);
            console.log("Created new conversation:", id);
        }
        setIsLoaded(true);
        console.log("Conversation loading complete");
    }, []);

    // Save conversations to localStorage whenever they change (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return; // Don't save during initial load

        if (conversations.length > 0) {
            console.log(
                "Saving conversations to localStorage:",
                conversations.length,
                "conversations"
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        } else {
            console.log(
                "Removing conversations from localStorage (empty array)"
            );
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [conversations, isLoaded]);

    // Save current conversation ID whenever it changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return; // Don't save during initial load

        if (currentConversationId) {
            localStorage.setItem(
                CURRENT_CONVERSATION_KEY,
                currentConversationId
            );
        } else {
            localStorage.removeItem(CURRENT_CONVERSATION_KEY);
        }
    }, [currentConversationId, isLoaded]);

    const createNewConversation = useCallback(() => {
        const now = new Date();
        const id = `conv_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const title = `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        const newConversation: ConversationItem = {
            id,
            title,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(id);
        return id;
    }, []);

    const deleteConversation = useCallback(
        (id: string) => {
            const wasCurrentConversation = currentConversationId === id;

            setConversations(prev => {
                const filtered = prev.filter(conv => conv.id !== id);

                if (wasCurrentConversation) {
                    if (filtered.length > 0) {
                        // Select the most recent remaining conversation
                        setCurrentConversationId(filtered[0].id);
                    } else {
                        // No conversations left, create a new one
                        const now = new Date();
                        const newId = `conv_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`;
                        const title = `Conversation ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

                        const newConversation: ConversationItem = {
                            id: newId,
                            title,
                            messages: [],
                            createdAt: now,
                            updatedAt: now,
                        };

                        setCurrentConversationId(newId);
                        return [newConversation];
                    }
                }

                return filtered;
            });
        },
        [currentConversationId]
    );

    const updateConversationTitle = useCallback((id: string, title: string) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === id
                    ? { ...conv, title, updatedAt: new Date() }
                    : conv
            )
        );
    }, []);

    const selectConversation = useCallback((id: string) => {
        setCurrentConversationId(id);
    }, []);

    const updateCurrentConversation = useCallback(
        (messages: ChatMessage[]) => {
            if (!currentConversationId) return;

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === currentConversationId
                        ? { ...conv, messages, updatedAt: new Date() }
                        : conv
                )
            );
        },
        [currentConversationId]
    );

    const getCurrentConversation = useCallback(() => {
        if (!currentConversationId) return null;
        return (
            conversations.find(conv => conv.id === currentConversationId) ||
            null
        );
    }, [conversations, currentConversationId]);

    const deleteMessage = useCallback(
        (messageIndex: number) => {
            if (currentConversationId === null) return;

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === currentConversationId
                        ? {
                              ...conv,
                              messages: conv.messages.filter(
                                  (_, index) => index !== messageIndex
                              ),
                              updatedAt: new Date(),
                          }
                        : conv
                )
            );
        },
        [currentConversationId]
    );

    const updateMessage = useCallback(
        (messageIndex: number, newContent: string) => {
            if (currentConversationId === null) return;

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === currentConversationId
                        ? {
                              ...conv,
                              messages: conv.messages.map((msg, index) =>
                                  index === messageIndex
                                      ? {
                                            ...msg,
                                            content: msg.content.map(item =>
                                                item.type === ChatMessageContentType.Text
                                                    ? { ...item, text: newContent }
                                                    : item
                                            ),
                                        }
                                      : msg
                              ),
                              updatedAt: new Date(),
                          }
                        : conv
                )
            );
        },
        [currentConversationId]
    );

    // Export single conversation to JSON file
    const exportConversation = useCallback(
        (conversationId: string) => {
            try {
                const conversation = conversations.find(
                    conv => conv.id === conversationId
                );
                if (!conversation) {
                    console.error("Conversation not found:", conversationId);
                    alert("Conversation not found. Export failed.");
                    return;
                } // Create a sanitized copy of the conversation to ensure proper JSON serialization
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

    // Export all conversations to JSON file
    const exportAllConversations = useCallback(() => {
        try {
            if (conversations.length === 0) {
                console.warn("No conversations to export");
                alert("No conversations available to export.");
                return;
            } // Create sanitized copies of conversations to ensure proper JSON serialization
            const sanitizedConversations = conversations.map(conversation => ({
                ...conversation,
                createdAt: conversation.createdAt.toISOString(),
                updatedAt: conversation.updatedAt.toISOString(),
            }));

            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                totalConversations: conversations.length,
                conversations: sanitizedConversations,
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
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

    // Load conversations from JSON file
    const loadConversationsFromFile = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = event => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const result = e.target?.result as string;
                    const importData = JSON.parse(result);

                    // Validate the import data structure
                    if (!importData.version) {
                        throw new Error("Invalid file format: missing version");
                    }

                    let conversationsToImport: ConversationItem[] = [];

                    // Handle both single conversation and all conversations export formats
                    if (importData.conversation) {
                        // Single conversation export
                        conversationsToImport = [importData.conversation];
                    } else if (
                        importData.conversations &&
                        Array.isArray(importData.conversations)
                    ) {
                        // All conversations export
                        conversationsToImport = importData.conversations;
                    } else {
                        throw new Error(
                            "Invalid file format: no conversations found"
                        );
                    }

                    // Convert date strings back to Date objects and generate new IDs to avoid conflicts
                    const processedConversations = conversationsToImport.map(
                        (conv: any) => {
                            const now = new Date();
                            const newId = `conv_${Date.now()}_${Math.random()
                                .toString(36)
                                .substr(2, 9)}`;

                            return {
                                ...conv,
                                id: newId, // Generate new ID to avoid conflicts
                                title: conv.title + " (Imported)", // Mark as imported
                                createdAt: new Date(conv.createdAt),
                                updatedAt: now, // Update the timestamp
                                messages: conv.messages || [], // Ensure messages array exists
                            };
                        }
                    );

                    // Add imported conversations to the existing ones
                    setConversations(prev => [
                        ...processedConversations,
                        ...prev,
                    ]);

                    // Select the first imported conversation if there are any
                    if (processedConversations.length > 0) {
                        setCurrentConversationId(processedConversations[0].id);
                    }

                    console.log(
                        "Successfully imported",
                        processedConversations.length,
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
    }, []);

    const value: ConversationHistoryData = {
        conversations,
        currentConversationId,
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
