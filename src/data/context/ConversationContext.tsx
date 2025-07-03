import React from "react";
import {
    ChatMessage,
    ChatMessageContentItem,
    ChatMessageContentType,
    ChatRole,
    ToolInfo,
} from "../../api/interface/data/common/Chat";
import { useApiClient } from "./useApiClient";
import { useModelContext } from "./ModelContext";
import { useConversationHistory } from "./ConversationHistoryContext";
import { useMCPContext } from "./MCPContext";

type ConversationData = {
    currentConversation: ChatMessage[];
    addMessage: (
        role: ChatRole,
        message: string,
        images?: string[],
        audios?: string[]
    ) => void;
    requestCompletion: (
        role?: ChatRole,
        message?: string,
        images?: string[],
        audios?: string[]
    ) => Promise<void>;
    clearConversation: () => void;
    lastStopReason: string;
    toolUsed: ToolInfo[];
    usingTool: boolean;
    deleteMessage: (messageIndex: number) => void;
    updateMessage: (messageIndex: number, newContent: string) => void;
};

const defaultData: ConversationData = {
    currentConversation: [],
    addMessage: (
        role: ChatRole,
        message: string,
        images?: string[],
        audios?: string[]
    ) => {},
    requestCompletion: async () => {},
    clearConversation: () => {},
    lastStopReason: "",
    toolUsed: [],
    usingTool: false,
    deleteMessage: (messageIndex: number) => {},
    updateMessage: (messageIndex: number, newContent: string) => {},
};

const ConversationContext = React.createContext<ConversationData>(defaultData);

export function ConversationProvider(props: { children: React.ReactNode }) {
    const { chatClient } = useApiClient();
    const apiClient = useApiClient();
    const { isHubRunning } = useMCPContext();
    const {
        getCurrentConversation,
        updateCurrentConversation,
        currentConversationId,
        deleteMessage,
        updateMessage,
    } = useConversationHistory();
    const [toolUsed, setToolUsed] = React.useState<ToolInfo[]>([]);
    const [usingTool, setUsingTool] = React.useState<boolean>(false);
    const [lastStopReason, setLastStopReason] = React.useState<string>("init");
    const { currentModel } = useModelContext();

    // Get current conversation messages from conversation history
    const currentConversation = getCurrentConversation()?.messages || [];

    const addMessage = (
        role: ChatRole,
        message: string,
        images?: string[],
        audios?: string[]
    ) => {
        const content: ChatMessageContentItem[] = [];

        // Add text content if provided
        if (message.trim()) {
            content.push({ type: ChatMessageContentType.Text, text: message });
        }

        // Add image content if provided
        if (images && images.length > 0) {
            images.forEach(imageBase64 => {
                content.push({
                    type: ChatMessageContentType.Image,
                    base64Data: imageBase64,
                });
            });
        }

        // Add audio content if provided
        if (audios && audios.length > 0) {
            audios.forEach(audioBase64 => {
                content.push({
                    type: ChatMessageContentType.Audio,
                    base64Data: audioBase64,
                });
            });
        }

        const newMessage: ChatMessage = {
            role,
            content,
        };
        const updatedMessages = [...currentConversation, newMessage];
        updateCurrentConversation(updatedMessages);
    };

    const clearConversation = () => {
        if (currentConversationId) {
            updateCurrentConversation([]);
        }
    };

    const requestCompletion = async (
        role?: ChatRole,
        message?: string,
        images?: string[],
        audios?: string[]
    ) => {
        if (!currentModel) throw new Error("No model selected");

        // Create a new conversation if none exists
        if (!currentConversationId) {
            throw new Error("No current conversation ID found");
        }

        setToolUsed([]);
        setUsingTool(false);
        let newConversationHistory = currentConversation;
        if (
            role &&
            (message ||
                (images && images.length > 0) ||
                (audios && audios.length > 0))
        ) {
            const content: ChatMessageContentItem[] = [];

            // Add text content if provided
            if (message && message.trim()) {
                content.push({
                    type: ChatMessageContentType.Text,
                    text: message,
                });
            }

            // Add image content if provided
            if (images && images.length > 0) {
                images.forEach(imageBase64 => {
                    content.push({
                        type: ChatMessageContentType.Image,
                        base64Data: imageBase64,
                    });
                });
            }

            // Add audio content if provided
            if (audios && audios.length > 0) {
                audios.forEach(audioBase64 => {
                    content.push({
                        type: ChatMessageContentType.Audio,
                        base64Data: audioBase64,
                    });
                });
            }

            const userMessage: ChatMessage = {
                role,
                content,
            };
            newConversationHistory = [...currentConversation, userMessage];
            updateCurrentConversation(newConversationHistory);
        }
        const response = chatClient.requestCompletionStream({
            model: currentModel.identifier,
            request: {
                messages: newConversationHistory,
                // Pass the session ID as correlation ID for backend to correlate MCP connection
                // Fetch the current session ID dynamically from the hub at request time
                MCPCorrelationId: isHubRunning
                    ? apiClient.mcpHubService.getSessionId() || undefined
                    : undefined,
            },
        });

        const newMessage: ChatMessage = {
            role: ChatRole.Assistant,
            content: [
                {
                    type: ChatMessageContentType.Text,
                    text: "",
                },
            ],
        };

        // Add the empty message right away so the user sees a response is coming
        const messagesWithResponse = [...newConversationHistory, newMessage];
        updateCurrentConversation(messagesWithResponse);

        let stopReason = "";
        try {
            for await (const chunk of response) {
                if (chunk.finishReason === "function_call") {
                    setToolUsed(current => [
                        ...current,
                        {
                            name: chunk.toolName || "",
                            parameters: chunk.toolParameters || "",
                        },
                    ]);
                    setUsingTool(true);
                } else if (chunk.data.length > 0) {
                    setUsingTool(false);
                }

                // Update the message with the new data
                newMessage.content[0].text += chunk.data;

                // Update the conversation in history
                const updatedMessages = [
                    ...newConversationHistory,
                    { ...newMessage },
                ];
                updateCurrentConversation(updatedMessages);

                if (!!chunk.finishReason) {
                    stopReason = chunk.finishReason;
                }
            }
        } catch (error) {
            // Handle any errors in streaming
            newMessage.content[0].text +=
                "\n\n[Error receiving complete response]";
            const updatedMessages = [
                ...newConversationHistory,
                { ...newMessage },
            ];
            updateCurrentConversation(updatedMessages);
        }

        setLastStopReason(stopReason);
    };
    return (
        <ConversationContext.Provider
            value={{
                currentConversation,
                addMessage,
                requestCompletion,
                clearConversation,
                lastStopReason,
                toolUsed,
                usingTool,
                deleteMessage,
                updateMessage,
            }}
        >
            {props.children}
        </ConversationContext.Provider>
    );
}

export function useConversationContext() {
    return React.useContext(ConversationContext);
}
