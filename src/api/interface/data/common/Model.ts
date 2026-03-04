export type Model = {
    identifier: string;
    friendlyName: string;
    endpoint: string;
    deployment: string;
    costPromptToken: number;
    costResponseToken: number;
    isVision: boolean;
    maxTokens: number;
    supportTool: boolean;
    apiVersionOverride?: string | null;
    reasoningModel: boolean;
    key?: string;
};
