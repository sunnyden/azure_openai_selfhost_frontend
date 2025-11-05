import React, { useEffect, useRef } from "react";
import { Button, Spinner } from "@fluentui/react-components";
import { AgentBox } from "./AgentDecision/AgentBox";
import { useMagiContext } from "./JudgementContext/MagiContext";
import { OverallStatus } from "../types";
import { useApiClient } from "../../../../data/context/useApiClient";
import { requestAgentDecision } from "../utils/judgmentEngine";

interface MagiJudgmentPageProps {
    onBack: () => void;
}

export function MagiJudgmentPage({ onBack }: MagiJudgmentPageProps) {
    const {
        magiState,
        updateAgentDecision,
        setAgentProcessing,
        nextRound,
        finalizeJudgment,
        setError,
    } = useMagiContext();
    const apiClient = useApiClient();
    const isRunningRef = useRef(false);

    useEffect(() => {
        if (!magiState || magiState.overallStatus !== OverallStatus.Judging) {
            return;
        }

        // Prevent duplicate runs
        if (isRunningRef.current) {
            return;
        }

        const runJudgmentRound = async () => {
            if (magiState.currentRound > 3) {
                finalizeJudgment();
                return;
            }

            isRunningRef.current = true;

            try {
                // Run all three agents in parallel for the current round
                const promises = magiState.agents.map(async (agent, index) => {
                    setAgentProcessing(index, true);

                    try {
                        const decision = await requestAgentDecision(
                            apiClient.chatClient,
                            agent.config,
                            magiState.content,
                            magiState.currentRound,
                            agent.decisions
                        );

                        updateAgentDecision(index, decision);
                    } finally {
                        setAgentProcessing(index, false);
                    }
                });

                await Promise.all(promises);

                // Wait a bit before next round
                await new Promise(resolve => setTimeout(resolve, 1000));

                nextRound();
            } catch (error) {
                console.error("Error during judgment round:", error);
                setError(
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred"
                );
            } finally {
                isRunningRef.current = false;
            }
        };

        runJudgmentRound();
    }, [magiState?.currentRound]);

    if (!magiState) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <Spinner label="Initializing..." />
            </div>
        );
    }

    const getStatusColor = () => {
        switch (magiState.overallStatus) {
            case OverallStatus.Approved:
                return "#4caf50";
            case OverallStatus.Rejected:
                return "#f44336";
            case OverallStatus.Error:
                return "#ff9800";
            case OverallStatus.Judging:
                return "#2196f3";
            default:
                return "var(--colorNeutralForeground1)";
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--colorNeutralBackground1)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "20px 40px",
                    borderBottom: "1px solid var(--colorNeutralStroke1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: "20px" }}>
                        {magiState.title}
                    </h2>
                </div>
                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: getStatusColor(),
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    Status: {magiState.overallStatus.toUpperCase()}
                    {magiState.overallStatus === OverallStatus.Judging && (
                        <Spinner size="tiny" />
                    )}
                </div>
            </div>

            {/* Judgment Arena */}
            <div
                style={{
                    flex: 1,
                    position: "relative",
                    padding: "40px",
                }}
            >
                <AgentBox agent={magiState.agents[0]} position="top" />
                <AgentBox agent={magiState.agents[1]} position="bottomLeft" />
                <AgentBox agent={magiState.agents[2]} position="bottomRight" />

                {/* Center Info */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        maxWidth: "500px",
                    }}
                >
                    {magiState.overallStatus === OverallStatus.Judging && (
                        <div>
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                }}
                            >
                                Round {magiState.currentRound} / 3
                            </div>
                            <div
                                style={{
                                    color: "var(--colorNeutralForeground3)",
                                }}
                            >
                                Agents are evaluating...
                            </div>
                        </div>
                    )}

                    {magiState.overallStatus !== OverallStatus.Judging &&
                        magiState.overallStatus !== OverallStatus.Idle && (
                            <div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: 700,
                                        color: getStatusColor(),
                                        marginBottom: "16px",
                                    }}
                                >
                                    {magiState.overallStatus ===
                                    OverallStatus.Approved
                                        ? "APPROVED"
                                        : magiState.overallStatus ===
                                            OverallStatus.Rejected
                                          ? "REJECTED"
                                          : "ERROR"}
                                </div>

                                {magiState.error && (
                                    <div
                                        style={{
                                            color: "#f44336",
                                            marginBottom: "16px",
                                            padding: "12px",
                                            backgroundColor:
                                                "var(--colorNeutralBackground2)",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        {magiState.error}
                                    </div>
                                )}

                                {magiState.finalDecision && (
                                    <div style={{ marginTop: "24px" }}>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            Final Decision Breakdown:
                                        </div>
                                        {magiState.agents.map(
                                            (agent, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: "8px 12px",
                                                        backgroundColor:
                                                            "var(--colorNeutralBackground2)",
                                                        borderRadius: "4px",
                                                        marginBottom: "8px",
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <span>
                                                        {agent.config.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {agent.finalDecision} (
                                                        {agent.finalScore?.toFixed(
                                                            2
                                                        )}
                                                        )
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                <Button
                                    appearance="primary"
                                    onClick={onBack}
                                    style={{ marginTop: "24px" }}
                                >
                                    Start New Judgment
                                </Button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

