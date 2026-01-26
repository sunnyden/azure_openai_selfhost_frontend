import { ChatMessage } from "../../common/Chat";

export interface CreateChatHistoryRequest {
    title: string;
    messages: ChatMessage[];
}

export interface UpdateChatHistoryTitleRequest {
    id: string;
    title: string;
}

export interface UpdateChatHistoryRequest {
    id: string;
    title: string;
    messages: ChatMessage[];
}

export interface AppendMessagesRequest {
    id: string;
    messages: ChatMessage[];
}

export interface DeleteChatHistoryRequest {
    id: string;
}
