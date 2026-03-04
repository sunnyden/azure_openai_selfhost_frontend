import { IHttpContext } from "./interface/HttpContext.interface";
import {
    ChatHistoryItem,
    ChatHistorySummary,
} from "./interface/data/common/ChatHistory";
import {
    CreateChatHistoryRequest,
    UpdateChatHistoryTitleRequest,
    UpdateChatHistoryRequest,
    AppendMessagesRequest,
    DeleteChatHistoryRequest,
} from "./interface/data/requests/chat-history/ChatHistoryRequests";
import { IChatHistoryClient } from "./interface/ApiClient.interface";

export class ChatHistoryClient implements IChatHistoryClient {
    constructor(private readonly context: IHttpContext) {}

    public async create(
        request: CreateChatHistoryRequest
    ): Promise<ChatHistoryItem> {
        try {
            const response = await this.context.post<
                CreateChatHistoryRequest,
                ChatHistoryItem
            >("/chat-history/create", request);

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to create chat history"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async get(id: string): Promise<ChatHistoryItem> {
        try {
            const response = await this.context.get<ChatHistoryItem>(
                `/chat-history/get/${id}`
            );

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to fetch chat history"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async list(): Promise<ChatHistorySummary[]> {
        try {
            const response = await this.context.get<ChatHistorySummary[]>(
                "/chat-history/list"
            );

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to fetch chat history list"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async updateTitle(
        request: UpdateChatHistoryTitleRequest
    ): Promise<void> {
        try {
            const response = await this.context.post<
                UpdateChatHistoryTitleRequest,
                void
            >("/chat-history/update-title", request);

            if (!response.isSuccess) {
                throw new Error(
                    response.error || "Failed to update chat history title"
                );
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async update(
        request: UpdateChatHistoryRequest
    ): Promise<ChatHistoryItem> {
        try {
            const response = await this.context.post<
                UpdateChatHistoryRequest,
                ChatHistoryItem
            >("/chat-history/update", request);

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to update chat history"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async appendMessages(
        request: AppendMessagesRequest
    ): Promise<ChatHistoryItem> {
        try {
            const response = await this.context.post<
                AppendMessagesRequest,
                ChatHistoryItem
            >("/chat-history/append-messages", request);

            if (!response.isSuccess || !response.data) {
                throw new Error(response.error || "Failed to append messages");
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async delete(request: DeleteChatHistoryRequest): Promise<void> {
        try {
            const response = await this.context.post<
                DeleteChatHistoryRequest,
                void
            >("/chat-history/delete", request);

            if (!response.isSuccess) {
                throw new Error(
                    response.error || "Failed to delete chat history"
                );
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async allHistories(): Promise<ChatHistorySummary[]> {
        try {
            const response = await this.context.get<ChatHistorySummary[]>(
                "/chat-history/all"
            );

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to fetch all chat histories"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async listByUser(userId: number): Promise<ChatHistorySummary[]> {
        try {
            const response = await this.context.get<ChatHistorySummary[]>(
                `/chat-history/list?userId=${userId}`
            );

            if (!response.isSuccess || !response.data) {
                throw new Error(
                    response.error || "Failed to fetch user chat histories"
                );
            }

            return response.data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }

    public async deleteAllByUser(userId: number): Promise<void> {
        try {
            const response = await this.context.post<{ userId: number }, void>(
                "/chat-history/delete-all",
                { userId }
            );

            if (!response.isSuccess) {
                throw new Error(
                    response.error || "Failed to delete user chat histories"
                );
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Network error: Unable to connect to server");
            }
            throw error;
        }
    }
}
