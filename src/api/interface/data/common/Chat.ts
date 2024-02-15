export enum ChatRole {
    User = "user",
    Assistant = "assistant",
    System = "system"
}
export enum ChatMessageContentType {
    Text = "text",
    Image = "image_url"
}
export type ChatMessageContentItem = {
    type: ChatMessageContentType,
    text?: string,
    imageUrl?: string
}
export type ChatMessage = {
    role: ChatRole,
    content: ChatMessageContentItem[]
}

export type ChatResponse = {
    id: string,
    stopReason: string,
    message: string,
    promptTokens: number,
    responseTokens: number,
    totalTokens: number
}