export type AgentConfig = {
    name: string;
    model: string;
    criteria: string;
};

export enum DecisionType {
    Approve = "approve",
    Reject = "reject",
    Pending = "pending",
}

export type RoundDecision = {
    decision: DecisionType;
    reason: string;
    round: number;
};

export type AgentState = {
    config: AgentConfig;
    decisions: RoundDecision[];
    isProcessing: boolean;
    finalDecision?: DecisionType;
    finalScore?: number;
};

export enum OverallStatus {
    Idle = "idle",
    Judging = "judging",
    Approved = "approved",
    Rejected = "rejected",
    Error = "error",
}

export type MagiState = {
    title: string;
    content: string;
    agents: [AgentState, AgentState, AgentState];
    currentRound: number;
    overallStatus: OverallStatus;
    finalDecision?: DecisionType;
    error?: string;
};

export type MagiInput = {
    title: string;
    content: string;
    agents: [AgentConfig, AgentConfig, AgentConfig];
};

export type DecisionResponse = {
    decision: "approve" | "reject";
    reason: string;
};

