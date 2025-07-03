export enum ChatRole {
    User = "user",
    Assistant = "assistant",
    System = "system",
}
export enum ChatMessageContentType {
    Text = "text",
    Image = "image",
    Audio = "audio",
}
export type ChatMessageContentItem = {
    type: ChatMessageContentType;
    text?: string;
    base64Data?: string;
};
export type ChatMessage = {
    role: ChatRole;
    content: ChatMessageContentItem[];
};

export type ChatResponse = {
    id: string;
    stopReason: string;
    message: string;
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
};

export type PartialChatResponse = {
    data: string;
    finishReason: string;
    isEnd: boolean;
    toolName?: string;
    toolParameters?: string;
};

export type ToolInfo = {
    name: string;
    parameters: string;
};
