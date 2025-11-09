import {
    ChatMessage,
    ChatRole,
    ChatMessageContentType,
} from "../../../../api/interface/data/common/Chat";
import { IChatClient } from "../../../../api/interface/ApiClient.interface";
import {
    DecisionResponse,
    DecisionType,
    RoundDecision,
    AgentConfig,
} from "../types";

const MAX_RETRIES = 3;

export async function requestAgentDecision(
    chatClient: IChatClient,
    agentConfig: AgentConfig,
    content: string,
    round: number,
    previousDecisions: RoundDecision[]
): Promise<RoundDecision> {
    const systemPrompt = buildSystemPrompt(
        agentConfig,
        content,
        previousDecisions
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const messages: ChatMessage[] = [
                {
                    role: ChatRole.System,
                    content: [
                        {
                            type: ChatMessageContentType.Text,
                            text: systemPrompt,
                        },
                    ],
                },
                {
                    role: ChatRole.User,
                    content: [
                        {
                            type: ChatMessageContentType.Text,
                            text: "Please provide your decision.",
                        },
                    ],
                },
            ];

            // Use streaming API to avoid bugs with non-streaming API
            let fullResponse = "";
            const stream = chatClient.requestCompletionStream({
                model: agentConfig.model,
                request: { messages },
            });

            for await (const chunk of stream) {
                if (chunk.data) {
                    fullResponse += chunk.data;
                }
            }

            const decisionResponse = parseDecisionResponse(fullResponse);

            return {
                decision:
                    decisionResponse.decision === "approve"
                        ? DecisionType.Approve
                        : DecisionType.Reject,
                reason: decisionResponse.reason,
                round,
            };
        } catch (error) {
            lastError = error as Error;
            console.error(
                `Attempt ${attempt}/${MAX_RETRIES} failed for ${agentConfig.name}:`,
                error
            );

            if (attempt < MAX_RETRIES) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve =>
                    setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
                );
            }
        }
    }

    throw new Error(
        `Failed to get decision from ${agentConfig.name} after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
}

function buildSystemPrompt(
    agentConfig: AgentConfig,
    content: string,
    previousDecisions: RoundDecision[]
): string {
    let prompt = `You are ${agentConfig.name}, an AI agent responsible for making decisions based on specific criteria.

CONTENT TO EVALUATE:
${content}

YOUR DECISION CRITERIA:
${agentConfig.criteria}

You must evaluate the content and make a decision: APPROVE or REJECT.
Your decision MUST be based strictly on the criteria provided above.
`;

    if (previousDecisions.length > 0) {
        prompt += `\nPREVIOUS ROUND DECISIONS:\n`;
        previousDecisions.forEach(decision => {
            prompt += `Round ${decision.round}: ${decision.decision.toUpperCase()}\nReason: ${decision.reason}\n\n`;
        });
        prompt += `Consider your previous decisions and reasoning when making this round's decision.\n`;
    }

    prompt += `\nRESPONSE FORMAT:
You must respond with a valid JSON object in the following format:
{
  "decision": "approve" | "reject",
  "reason": "detailed explanation of your decision"
}

IMPORTANT:
- Your response must be a valid JSON object
- The "decision" field must be exactly either "approve" or "reject" (lowercase)
- The "reason" field must contain a clear, detailed explanation
- Do not include any text before or after the JSON object`;

    return prompt;
}

function parseDecisionResponse(responseText: string): DecisionResponse {
    try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON object found in response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (
            !parsed.decision ||
            (parsed.decision !== "approve" && parsed.decision !== "reject")
        ) {
            throw new Error("Invalid decision value in response");
        }

        if (!parsed.reason || typeof parsed.reason !== "string") {
            throw new Error("Invalid or missing reason in response");
        }

        return {
            decision: parsed.decision,
            reason: parsed.reason,
        };
    } catch (error) {
        console.error("Failed to parse decision response:", responseText);
        throw new Error(`Failed to parse agent response: ${error}`);
    }
}

