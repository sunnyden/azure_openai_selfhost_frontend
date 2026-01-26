import { ChatMessage } from "./Chat";

export interface ChatHistoryItem {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string; // ISO 8601 from API
    updatedAt: string; // ISO 8601 from API
}

export interface ChatHistorySummary {
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}
