import { useCallback, useRef } from "react";
import { ChatMessage, ChatMessageContentType, ChatRole } from "../../api/interface/data/common/Chat";
import { useApiClient } from "./useApiClient";
import { useConversationHistory } from "./ConversationHistoryContext";

const TITLE_GENERATION_SYSTEM_PROMPT = "You are a helpful assistant that generates concise, descriptive titles for conversations. Always respond with valid JSON.";

const TITLE_GENERATION_USER_PROMPT = `Based on the following conversation, generate a concise, descriptive title (maximum 50 characters). Respond with JSON format: {"title": "your title here"}

Conversation:
{CONVERSATION}

Generate the JSON now.`;

const MAX_CONVERSATION_LENGTH = 2000; // Limit chars to avoid token limits

interface TitleGenerationOptions {
    conversationId: string;
    messages: ChatMessage[];
    modelIdentifier: string;
}

export function useTitleGenerator() {
    const apiClient = useApiClient();
    const {
        updateConversationTitle,
        markTitleAsGenerated,
        getCurrentConversation,
    } = useConversationHistory();

    // Track in-flight requests to prevent duplicates
    const generatingRef = useRef<Set<string>>(new Set());

    const formatConversationForPrompt = useCallback((messages: ChatMessage[]): string => {
        // Take first 2-3 exchanges (user + assistant pairs), max 6 messages
        const relevantMessages = messages.slice(0, 6);

        const formatted = relevantMessages
            .map((msg) => {
                // Extract only text content
                const textContent = msg.content
                    .filter(item => item.type === ChatMessageContentType.Text)
                    .map(item => item.text || "")
                    .join(" ");

                const role = msg.role === ChatRole.User ? "User" : "Assistant";
                return `${role}: ${textContent}`;
            })
            .join("\n\n");

        // Truncate if too long
        return formatted.length > MAX_CONVERSATION_LENGTH
            ? formatted.substring(0, MAX_CONVERSATION_LENGTH) + "..."
            : formatted;
    }, []);

    const generateTitleWithStream = useCallback(
        async (conversationId: string, messages: ChatMessage[], modelIdentifier: string): Promise<string> => {
            const conversationText = formatConversationForPrompt(messages);
            const prompt = TITLE_GENERATION_USER_PROMPT.replace("{CONVERSATION}", conversationText);

            // Call streaming API and accumulate chunks
            let accumulatedJson = "";

            const streamIterator = apiClient.chatClient.requestCompletionStream({
                model: modelIdentifier,
                request: {
                    messages: [
                        {
                            role: ChatRole.System,
                            content: [{
                                type: ChatMessageContentType.Text,
                                text: TITLE_GENERATION_SYSTEM_PROMPT
                            }],
                        },
                        {
                            role: ChatRole.User,
                            content: [{ type: ChatMessageContentType.Text, text: prompt }],
                        },
                    ],
                },
            });

            for await (const chunk of streamIterator) {
                accumulatedJson += chunk.data;
            }

            // Parse JSON response
            const parsed = JSON.parse(accumulatedJson);
            let generatedTitle = parsed.title;

            if (!generatedTitle || typeof generatedTitle !== 'string') {
                throw new Error("Invalid title in JSON response");
            }

            // Clean up the title
            generatedTitle = generatedTitle
                .trim()
                .replace(/^["']|["']$/g, ""); // Remove surrounding quotes if any

            // Limit length
            if (generatedTitle.length > 50) {
                generatedTitle = generatedTitle.substring(0, 47) + "...";
            }

            if (!generatedTitle) {
                throw new Error("Generated title is empty after cleanup");
            }

            return generatedTitle;
        },
        [apiClient, formatConversationForPrompt]
    );

    const generateTitle = useCallback(
        async ({ conversationId, messages, modelIdentifier }: TitleGenerationOptions) => {
            // Prevent duplicate generation
            if (generatingRef.current.has(conversationId)) {
                console.log("Title generation already in progress for:", conversationId);
                return;
            }

            // Check if conversation needs title generation
            const conv = getCurrentConversation();
            if (!conv || conv.id !== conversationId) {
                console.log("Conversation not found or mismatch");
                return;
            }

            // Skip if already generated
            if (conv.titleGenerated) {
                console.log("Title already generated for:", conversationId);
                return;
            }

            // Skip if less than 2 messages (need at least user + assistant)
            if (messages.length < 2) {
                console.log("Not enough messages for title generation");
                return;
            }

            // Skip if conversation ID is still local (not synced to cloud yet)
            if (conversationId.startsWith("local_")) {
                console.log("Cannot generate title for local conversation");
                return;
            }

            try {
                generatingRef.current.add(conversationId);
                console.log("Starting title generation for:", conversationId);

                const generatedTitle = await generateTitleWithStream(conversationId, messages, modelIdentifier);

                // Update the title
                await updateConversationTitle(conversationId, generatedTitle);
                markTitleAsGenerated(conversationId);

                console.log("Title generated successfully:", generatedTitle);
            } catch (error) {
                console.error("Failed to generate title:", error);

                // Retry once after 2 seconds
                try {
                    console.log("Retrying title generation after 2 seconds...");
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const generatedTitle = await generateTitleWithStream(conversationId, messages, modelIdentifier);

                    await updateConversationTitle(conversationId, generatedTitle);
                    markTitleAsGenerated(conversationId);
                    console.log("Title generated successfully on retry:", generatedTitle);
                } catch (retryError) {
                    console.error("Failed to generate title on retry, keeping default:", retryError);
                    // Mark as generated to prevent future attempts with failed default title
                    markTitleAsGenerated(conversationId);
                }
            } finally {
                generatingRef.current.delete(conversationId);
            }
        },
        [
            generateTitleWithStream,
            updateConversationTitle,
            markTitleAsGenerated,
            getCurrentConversation,
        ]
    );

    return { generateTitle };
}
