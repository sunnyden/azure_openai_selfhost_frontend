import React from "react";
import {
	ChatMessage,
	ChatMessageContentType,
	ChatRole,
} from "../../api/interface/data/common/Chat";
import { useApiClient } from "./useApiClient";
import { useModelContext } from "./ModelContext";

type ConversationData = {
	currentConversation: ChatMessage[];
	addMessage: (role: ChatRole, message: string) => void;
	requestCompletion: (role?: ChatRole, message?: string) => Promise<void>;
	lastStopReason: string;
};

const defaultData: ConversationData = {
	currentConversation: [],
	addMessage: (role: ChatRole, message: string) => {},
	requestCompletion: async () => {},
	lastStopReason: "",
};

const ConversationContext = React.createContext<ConversationData>(defaultData);

export function ConversationProvider(props: { children: React.ReactNode }) {
	const { chatClient } = useApiClient();
	const [conversationHistory, setConversationHistory] = React.useState<
		ChatMessage[]
	>([]);
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
		const response = await chatClient.requestCompletion({
			model: currentModel.identifier,
			request: {
				messages: newConversationHistory,
			},
		});
		setLastStopReason(response.stopReason);
		setConversationHistory([
			...newConversationHistory,
			{
				role: ChatRole.Assistant,
				content: [
					{
						type: ChatMessageContentType.Text,
						text: response.message,
					},
				],
			},
		]);
	};
	return (
		<ConversationContext.Provider
			value={{
				currentConversation: conversationHistory,
				addMessage,
				requestCompletion,
				lastStopReason,
			}}
		>
			{props.children}
		</ConversationContext.Provider>
	);
}

export function useConversationContext() {
	return React.useContext(ConversationContext);
}
