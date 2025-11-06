import React, { useEffect, useRef } from "react";
import { Button, Spinner } from "@fluentui/react-components";
import { AgentBox } from "./AgentDecision/AgentBox";
import { useMagiContext } from "./JudgementContext/MagiContext";
import { OverallStatus, DecisionType } from "../types";
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
                backgroundColor: "#0a0a0a",
                backgroundImage: `
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 255, 0, 0.03) 2px,
                        rgba(0, 255, 0, 0.03) 4px
                    )
                `,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "20px 40px",
                    borderBottom: "2px solid #00FF00",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#000",
                    fontFamily: "Courier New, monospace",
                }}
            >
                <div>
                    <h2 
                        style={{ 
                            margin: 0, 
                            fontSize: "20px",
                            color: "#00FF00",
                            fontWeight: "bold",
                            letterSpacing: "1px",
                        }}
                    >
                        ■ {magiState.title.toUpperCase()}
                    </h2>
                </div>
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: getStatusColor(),
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        letterSpacing: "1px",
                    }}
                >
                    STATUS: {magiState.overallStatus.toUpperCase()}
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
                        maxWidth: "600px",
                        zIndex: 10,
                    }}
                >
                    {magiState.overallStatus === OverallStatus.Judging && (
                        <div
                            style={{
                                fontFamily: "Courier New, monospace",
                                color: "#00FF00",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "64px",
                                    fontWeight: "bold",
                                    marginBottom: "12px",
                                    textShadow: "0 0 20px #00FF00",
                                    letterSpacing: "8px",
                                }}
                            >
                                MAGI
                            </div>
                            <div
                                style={{
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    marginBottom: "8px",
                                    color: "#FF6600",
                                }}
                            >
                                ROUND {magiState.currentRound} / 3
                            </div>
                            <div
                                style={{
                                    color: "#00FF00",
                                    fontSize: "14px",
                                    opacity: 0.7,
                                }}
                            >
                                SYSTEM EVALUATION IN PROGRESS...
                            </div>
                        </div>
                    )}

                    {magiState.overallStatus !== OverallStatus.Judging &&
                        magiState.overallStatus !== OverallStatus.Idle && (
                            <div
                                style={{
                                    fontFamily: "Courier New, monospace",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "64px",
                                        fontWeight: "bold",
                                        color: getStatusColor(),
                                        marginBottom: "16px",
                                        textShadow: `0 0 20px ${getStatusColor()}`,
                                        letterSpacing: "4px",
                                    }}
                                >
                                    {magiState.overallStatus ===
                                    OverallStatus.Approved
                                        ? "可決"
                                        : magiState.overallStatus ===
                                            OverallStatus.Rejected
                                          ? "否決"
                                          : "ERROR"}
                                </div>

                                {magiState.error && (
                                    <div
                                        style={{
                                            color: "#FF0000",
                                            marginBottom: "16px",
                                            padding: "12px",
                                            backgroundColor: "#1a0000",
                                            border: "1px solid #FF0000",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {magiState.error}
                                    </div>
                                )}

                                {magiState.finalDecision && (
                                    <div style={{ marginTop: "24px" }}>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                marginBottom: "12px",
                                                color: "#00FF00",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            FINAL DECISION BREAKDOWN:
                                        </div>
                                        {magiState.agents.map(
                                            (agent, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: "8px 12px",
                                                        backgroundColor: "#000",
                                                        border: "1px solid #00FF00",
                                                        borderRadius: "2px",
                                                        marginBottom: "8px",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        color: "#00FF00",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    <span>
                                                        {agent.config.name.toUpperCase()}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: agent.finalDecision === DecisionType.Approve ? "#00FF00" : "#FF0000",
                                                        }}
                                                    >
                                                        {agent.finalDecision === DecisionType.Approve ? "可決" : "否決"} (
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
                                    style={{ 
                                        marginTop: "24px",
                                        backgroundColor: "#00FF00",
                                        color: "#000",
                                        fontWeight: "bold",
                                        border: "2px solid #00FF00",
                                    }}
                                >
                                    START NEW JUDGMENT
                                </Button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}