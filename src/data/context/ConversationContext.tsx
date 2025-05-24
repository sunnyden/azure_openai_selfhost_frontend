import React from "react";
import {
	ChatMessage,
	ChatMessageContentType,
	ChatRole,
	ToolInfo,
} from "../../api/interface/data/common/Chat";
import { useApiClient } from "./useApiClient";
import { useModelContext } from "./ModelContext";

type ConversationData = {
	currentConversation: ChatMessage[];
	addMessage: (role: ChatRole, message: string) => void;
	requestCompletion: (role?: ChatRole, message?: string) => Promise<void>;
	lastStopReason: string;
	toolUsed: ToolInfo[];
	usingTool: boolean;
};

const defaultData: ConversationData = {
	currentConversation: [],
	addMessage: (role: ChatRole, message: string) => {},
	requestCompletion: async () => {},
	lastStopReason: "",
	toolUsed: [],
	usingTool: false,
};

const ConversationContext = React.createContext<ConversationData>(defaultData);

export function ConversationProvider(props: { children: React.ReactNode }) {
	const { chatClient } = useApiClient();
	const [conversationHistory, setConversationHistory] = React.useState<
		ChatMessage[]
	>([]);
	const [toolUsed, setToolUsed] = React.useState<ToolInfo[]>([]);
	const [usingTool, setUsingTool] = React.useState<boolean>(false);
	const [lastStopReason, setLastStopReason] = React.useState<string>("init");
	const { currentModel } = useModelContext();
	const addMessage = (role: ChatRole, message: string) => {
		setConversationHistory([
			...conversationHistory,
			{
				role,
				content: [{ type: ChatMessageContentType.Text, text: message }],
			},
		]);
	};
	const requestCompletion = async (role?: ChatRole, message?: string) => {
		if (!currentModel) throw new Error("No model selected");
		setToolUsed([]);
		setUsingTool(false);
		let newConversationHistory = conversationHistory;
		if (role && message) {
			newConversationHistory = [
				...conversationHistory,
				{
					role,
					content: [
						{ type: ChatMessageContentType.Text, text: message },
					],
				},
			];
			setConversationHistory(newConversationHistory);
		}
		const response = chatClient.requestCompletionStream({
			model: currentModel.identifier,
			request: {
				messages: newConversationHistory,
			},
		});

		const newMessage = {
			role: ChatRole.Assistant,
			content: [
				{
					type: ChatMessageContentType.Text,
					text: "",
				},
			],
		};

		// Add the empty message right away so the user sees a response is coming
		setConversationHistory([...newConversationHistory, newMessage]);

		let stopReason = "";
		try {
			for await (const chunk of response) {
				if (chunk.finishReason === "function_call") {
					setToolUsed((current) => [
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

				// Force React to re-render with the updated message
				setConversationHistory((current) => {
					// Create a new array reference to trigger re-render
					const updated = [...current];
					// Replace the last message with our updated one
					updated[updated.length - 1] = { ...newMessage };
					return updated;
				});

				if (!!chunk.finishReason) {
					stopReason = chunk.finishReason;
				}
			}
		} catch (error) {
			// Handle any errors in streaming
			setConversationHistory((current) => {
				const updated = [...current];
				// Add error info to the message if needed
				updated[updated.length - 1].content[0].text +=
					"\n\n[Error receiving complete response]";
				return updated;
			});
		}

		setLastStopReason(stopReason);
	};
	return (
		<ConversationContext.Provider
			value={{
				currentConversation: conversationHistory,
				addMessage,
				requestCompletion,
				lastStopReason,
				toolUsed,
				usingTool,
			}}
		>
			{props.children}
		</ConversationContext.Provider>
	);
}

export function useConversationContext() {
	return React.useContext(ConversationContext);
}
