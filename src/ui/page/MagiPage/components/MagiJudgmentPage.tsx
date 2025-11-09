import React, { useEffect, useMemo, useRef } from "react";
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
                return "rgb(211 1 14)";
            case OverallStatus.Error:
                return "#ff4d00ff";
            case OverallStatus.Judging:
                return "rgb(254 254 147)";
            default:
                return "var(--colorNeutralForeground1)";
        }
    };

    const getStatusText = () => {
        switch (magiState.overallStatus) {
            case OverallStatus.Approved:
                return "可決";
            case OverallStatus.Rejected:
                return "否決";
            case OverallStatus.Error:
                return "ERROR";
            case OverallStatus.Judging:
                return "審議中";
            default:
                return "UNKNOWN";
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
            {/* <div
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
            </div> */}

            {/* Judgment Arena */}
            <div
                style={{
                    position: "relative",
                    padding: "0px",
                    width: "128rem",
                    height: "72rem",
                    border: "0.1rem solid #fff",
                }}
            >
                <AgentBox agent={magiState.agents[0]} position="top" />
                <AgentBox agent={magiState.agents[1]} position="bottomLeft" />
                <AgentBox agent={magiState.agents[2]} position="bottomRight" />
                <div
                    style={{
                        position: "absolute",
                        width: "128rem",
                        top: 0,
                        left: 0,
                        height: "8rem",
                        borderTop: "double 1rem rgb(95 252 165)",
                        borderBottom: "double 1rem rgb(95 252 165)",
                        display: "flex",
                        fontSize: "7rem",
                        justifyContent: "space-between",
                        alignContent: "center",
                        fontFamily: "MatissePro-Bolder",
                        color: "#f78a09",
                        lineHeight: "8rem",
                    }}
                >
                    <div
                        style={{
                            marginLeft: "12rem",
                            letterSpacing: "2rem",
                            background: "transparent",
                        }}
                    >
                        提訴
                    </div>
                    <div
                        style={{
                            marginRight: "12rem",
                            letterSpacing: "2rem",
                            background: "transparent",
                        }}
                    >
                        決議
                    </div>
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: "12rem",
                        left: "1rem",
                        fontSize: "2rem",
                        lineHeight: "2rem",
                        color: "#f78a09",
                    }}
                >
                    <div>TITLE: {magiState.title.toUpperCase()}</div>
                    <div style={{ fontSize: "1.2rem" }}>
                        ROUND: {magiState.currentRound}
                    </div>
                    <div style={{ fontSize: "1.2rem" }}>TOTAL ROUNDS: 4</div>
                </div>
                {/* Triangle Border */}
                <svg
                    style={{
                        position: "absolute",
                        top: "61%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "61rem",
                        height: "50rem",
                        zIndex: 1,
                    }}
                    viewBox="0 0 400 250"
                >
                    <polygon
                        points="200,0 0,200 400,200"
                        fill="none"
                        stroke="#f78a09"
                        strokeWidth="8"
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        top: "69%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "fit-content",
                        height: "fit-content",
                        color: "#f78a09",
                        fontSize: "4rem",
                        fontFamily: "serif",
                        fontWeight: "bold",
                        zIndex: 1,
                    }}
                >
                    MAGI
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: "17rem",
                        right: "5rem",
                        width: "32rem",
                        height: "36rem",
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            width: "fit-content",
                            height: "fit-content",
                            lineHeight: "7rem",
                            padding: "0rem 1rem",
                            color: getStatusColor(),
                            fontSize: "7rem",
                            fontFamily: "MatissePro-Bolder",
                            fontWeight: "bold",
                            border: `double 0.5rem ${getStatusColor()}`,
                            zIndex: 1,
                            animation:
                                magiState.overallStatus ===
                                OverallStatus.Judging
                                    ? "flashOverall 1s infinite"
                                    : undefined,
                        }}
                        className={
                            magiState.overallStatus === OverallStatus.Judging
                                ? "flashOverall"
                                : ""
                        }
                    >
                        {getStatusText()}
                    </div>
                </div>

                <style>
                    {`
                    @keyframes flashOverall {
                        100% { opacity: 1; }
                        0% { opacity: 0; }
                    }
                `}
                </style>
                {/* Center Info */}
                {/* <div
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
                                                        justifyContent:
                                                            "space-between",
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
                                                            color:
                                                                agent.finalDecision ===
                                                                DecisionType.Approve
                                                                    ? "#00FF00"
                                                                    : "#FF0000",
                                                        }}
                                                    >
                                                        {agent.finalDecision ===
                                                        DecisionType.Approve
                                                            ? "可決"
                                                            : "否決"}{" "}
                                                        (
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
                </div> */}
            </div>
        </div>
    );
}

