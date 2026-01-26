import { LoginRequest } from "./data/requests/login/UserRequests";
import { User } from "./data/common/User";
import { Model } from "./data/common/Model";
import { ModelAssignRequest } from "./data/requests/model/ModelRequests";
import { Transaction } from "./data/common/Transaction";
import { ChatCompletionRequest } from "./data/requests/chat/ChatRequests";
import { ChatResponse, PartialChatResponse } from "./data/common/Chat";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { ChatHistoryItem, ChatHistorySummary } from "./data/common/ChatHistory";
import {
    CreateChatHistoryRequest,
    UpdateChatHistoryTitleRequest,
    UpdateChatHistoryRequest,
    AppendMessagesRequest,
    DeleteChatHistoryRequest,
} from "./data/requests/chat-history/ChatHistoryRequests";

export interface IApiClient {
    get userClient(): IUserClient;
    get modelClient(): IModelClient;
    get transactionClient(): ITransactionClient;
    get chatClient(): IChatClient;
    get chatHistoryClient(): IChatHistoryClient;
    get mcpHubService(): IHubService;
}

export interface IUserClient {
    auth(credentials: LoginRequest): Promise<void>;
    create(newUser: User): Promise<User>;
    modify(modifiedUser: User): Promise<void>;
    remove(userId: number): Promise<void>;
    list(): Promise<User[]>;
    getMyInfo(): Promise<User>;
    get userName(): string;
    get isAdmin(): boolean;
    logout(): void;
}

export interface IModelClient {
    allModels(): Promise<Model[]>;
    myModels(): Promise<Model[]>;
    add(newModel: Model): Promise<Model>;
    update(newModel: Model): Promise<Model>;
    remove(modelId: string): Promise<void>;
    assign(request: ModelAssignRequest): Promise<void>;
    unassign(request: ModelAssignRequest): Promise<void>;
}

export interface ITransactionClient {
    my(): Promise<Transaction[]>;
    all(): Promise<Transaction[]>;
}

export interface IChatClient {
    requestCompletion(request: ChatCompletionRequest): Promise<ChatResponse>;
    requestCompletionStream(
        request: ChatCompletionRequest
    ): AsyncGenerator<PartialChatResponse>;
}

export interface IMCPRemoteTransportClient {
    startMcpServer(command: string, args: string[]): Promise<void>;
    getMcpTransportCorrelationId(): string;
    stopMcpServer(): Promise<void>;
    onCorrelationIdChange(callback: (correlationId: string) => void): void;
    removeCorrelationIdChangeListener(): void;
}

export interface MCPServerConfig {
    name: string;
    config: MCPConnectionRequest;
}

export interface IHubService {
    start(): Promise<void>;
    stop(): Promise<void>;
    addClient(config: MCPConnectionRequest, name: string): Promise<void>;
    removeClient(name: string): Promise<void>;
    listAllTools(): Promise<Map<string, Tool[]>>;
    getSessionId(): string | undefined;
    // Additional utility methods
    getRegisteredToolNames(): string[];
    hasClient(name: string): boolean;
    getClientNames(): string[];
    isRunning(): boolean;
    restart(): Promise<void>;
}

export interface IChatHistoryClient {
    create(request: CreateChatHistoryRequest): Promise<ChatHistoryItem>;
    get(id: string): Promise<ChatHistoryItem>;
    list(): Promise<ChatHistorySummary[]>;
    updateTitle(request: UpdateChatHistoryTitleRequest): Promise<void>;
    update(request: UpdateChatHistoryRequest): Promise<ChatHistoryItem>;
    appendMessages(request: AppendMessagesRequest): Promise<ChatHistoryItem>;
    delete(request: DeleteChatHistoryRequest): Promise<void>;
}
