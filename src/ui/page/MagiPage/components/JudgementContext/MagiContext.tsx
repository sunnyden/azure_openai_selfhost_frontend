import React, { createContext, useContext, useState } from "react";
import {
    MagiState,
    MagiInput,
    AgentState,
    OverallStatus,
    DecisionType,
    RoundDecision,
} from "../../types";

type MagiContextType = {
    magiState: MagiState | null;
    initializeJudgment: (input: MagiInput) => void;
    updateAgentDecision: (agentIndex: number, decision: RoundDecision) => void;
    setAgentProcessing: (agentIndex: number, isProcessing: boolean) => void;
    nextRound: () => void;
    finalizeJudgment: () => void;
    setError: (error: string) => void;
    reset: () => void;
};

const MagiContext = createContext<MagiContextType | undefined>(undefined);

export function MagiProvider({ children }: { children: React.ReactNode }) {
    const [magiState, setMagiState] = useState<MagiState | null>(null);

    const initializeJudgment = (input: MagiInput) => {
        const agents: [AgentState, AgentState, AgentState] = [
            {
                config: input.agents[0],
                decisions: [],
                isProcessing: false,
            },
            {
                config: input.agents[1],
                decisions: [],
                isProcessing: false,
            },
            {
                config: input.agents[2],
                decisions: [],
                isProcessing: false,
            },
        ];

        setMagiState({
            title: input.title,
            content: input.content,
            agents,
            currentRound: 1,
            overallStatus: OverallStatus.Judging,
        });
    };

    const updateAgentDecision = (
        agentIndex: number,
        decision: RoundDecision
    ) => {
        setMagiState((prev: MagiState | null) => {
            if (!prev) return prev;
            const newAgents = [...prev.agents] as [
                AgentState,
                AgentState,
                AgentState,
            ];
            newAgents[agentIndex] = {
                ...newAgents[agentIndex],
                decisions: [...newAgents[agentIndex].decisions, decision],
            };
            return { ...prev, agents: newAgents };
        });
    };

    const setAgentProcessing = (agentIndex: number, isProcessing: boolean) => {
        setMagiState((prev: MagiState | null) => {
            if (!prev) return prev;
            const newAgents = [...prev.agents] as [
                AgentState,
                AgentState,
                AgentState,
            ];
            newAgents[agentIndex] = {
                ...newAgents[agentIndex],
                isProcessing,
            };
            return { ...prev, agents: newAgents };
        });
    };

    const nextRound = () => {
        setMagiState((prev: MagiState | null) => {
            if (!prev) return prev;
            return { ...prev, currentRound: prev.currentRound + 1 };
        });
    };

    const finalizeJudgment = () => {
        setMagiState((prev: MagiState | null) => {
            if (!prev) return prev;

            // Calculate final scores for each agent
            const weights = [0.25, 0.35, 0.4]; // weights for round 1, 2, 3
            const newAgents = prev.agents.map((agent: AgentState) => {
                let score = 0;
                agent.decisions.forEach((decision: RoundDecision) => {
                    // Use the round number from decision (1-indexed) to get weight
                    const weightIndex = decision.round - 1;
                    if (weightIndex >= 0 && weightIndex < weights.length) {
                        const value =
                            decision.decision === DecisionType.Approve ? 1 : 0;
                        score += value * weights[weightIndex];
                    }
                });
                const finalDecision =
                    score >= 0.5 ? DecisionType.Approve : DecisionType.Reject;
                return { ...agent, finalScore: score, finalDecision };
            }) as [AgentState, AgentState, AgentState];

            // Calculate overall decision (at least 2 approvals)
            const approvalCount = newAgents.filter(
                (agent: AgentState) =>
                    agent.finalDecision === DecisionType.Approve
            ).length;
            const finalDecision =
                approvalCount >= 2 ? DecisionType.Approve : DecisionType.Reject;
            const overallStatus =
                finalDecision === DecisionType.Approve
                    ? OverallStatus.Approved
                    : OverallStatus.Rejected;

            return {
                ...prev,
                agents: newAgents,
                finalDecision,
                overallStatus,
            };
        });
    };

    const setError = (error: string) => {
        setMagiState((prev: MagiState | null) => {
            if (!prev) return prev;
            return { ...prev, error, overallStatus: OverallStatus.Error };
        });
    };

    const reset = () => {
        setMagiState(null);
    };

    return (
        <MagiContext.Provider
            value={{
                magiState,
                initializeJudgment,
                updateAgentDecision,
                setAgentProcessing,
                nextRound,
                finalizeJudgment,
                setError,
                reset,
            }}
        >
            {children}
        </MagiContext.Provider>
    );
}

export function useMagiContext() {
    const context = useContext(MagiContext);
    if (!context) {
        throw new Error("useMagiContext must be used within MagiProvider");
    }
    return context;
}

