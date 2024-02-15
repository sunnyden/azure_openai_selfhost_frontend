import { IChatClient } from "./interface/ApiClient.interface";
import { IHttpContext } from "./interface/HttpContext.interface";
import { ChatResponse } from "./interface/data/common/Chat";
import { ChatCompletionRequest } from "./interface/data/requests/chat/ChatRequests";

export class ChatClient implements IChatClient {
	constructor(private readonly context: IHttpContext) {}
	public async requestCompletion(
		request: ChatCompletionRequest
	): Promise<ChatResponse> {
		const response = await this.context.post<
			ChatCompletionRequest,
			ChatResponse
		>("/chat/completion", request);
		if (!response.isSuccess || !response.data) {
			throw Error("Failed to request completion");
		}
		return response.data;
	}
}
