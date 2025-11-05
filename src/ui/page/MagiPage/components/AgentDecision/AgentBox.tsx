import React, { useState } from "react";
import { Card, tokens } from "@fluentui/react-components";
import { AgentState, DecisionType } from "../../types";

interface AgentBoxProps {
    agent: AgentState;
    position: "top" | "bottomLeft" | "bottomRight";
}

export function AgentBox({ agent, position }: AgentBoxProps) {
    const [showDetails, setShowDetails] = useState(false);

    const getBackgroundColor = () => {
        if (agent.isProcessing) {
            return "var(--colorBrandBackground)";
        }

        // If finalized
        if (agent.finalDecision !== undefined) {
            return agent.finalDecision === DecisionType.Approve
                ? "#4caf50"
                : "#f44336";
        }

        // Check current round decision
        if (agent.decisions.length > 0) {
            const lastDecision = agent.decisions[agent.decisions.length - 1];
            if (lastDecision.decision === DecisionType.Approve) {
                return "#4caf50";
            } else if (lastDecision.decision === DecisionType.Reject) {
                return "#f44336";
            }
        }

        // Pending
        return "#ffc107";
    };

    const getPositionStyle = () => {
        switch (position) {
            case "top":
                return {
                    top: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                };
            case "bottomLeft":
                return {
                    bottom: "80px",
                    left: "15%",
                };
            case "bottomRight":
                return {
                    bottom: "80px",
                    right: "15%",
                };
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                ...getPositionStyle(),
            }}
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
        >
            <Card
                style={{
                    width: "280px",
                    padding: "20px",
                    backgroundColor: getBackgroundColor(),
                    color: "white",
                    transition: "all 0.3s ease",
                    animation: agent.isProcessing
                        ? "flash 1s infinite"
                        : "none",
                    cursor: "pointer",
                    boxShadow: tokens.shadow16,
                }}
            >
                <div style={{ marginBottom: "12px" }}>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "20px",
                            fontWeight: 600,
                        }}
                    >
                        {agent.config.name}
                    </h3>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.9,
                            marginTop: "4px",
                        }}
                    >
                        Model: {agent.config.model}
                    </div>
                </div>

                {agent.decisions.length > 0 && (
                    <div style={{ fontSize: "14px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                            Latest Decision:
                        </div>
                        <div>
                            Round{" "}
                            {agent.decisions[agent.decisions.length - 1].round}:{" "}
                            {
                                agent.decisions[agent.decisions.length - 1]
                                    .decision
                            }
                        </div>
                    </div>
                )}

                {agent.finalDecision !== undefined && (
                    <div style={{ marginTop: "12px", fontSize: "14px" }}>
                        <div style={{ fontWeight: 600 }}>
                            Final: {agent.finalDecision}
                        </div>
                        <div style={{ fontSize: "12px", opacity: 0.9 }}>
                            Score: {agent.finalScore?.toFixed(2)}
                        </div>
                    </div>
                )}
            </Card>

            {showDetails && agent.decisions.length > 0 && (
                <Card
                    style={{
                        position: "absolute",
                        top: position === "top" ? "100%" : "auto",
                        bottom: position !== "top" ? "100%" : "auto",
                        left: 0,
                        marginTop: position === "top" ? "8px" : "0",
                        marginBottom: position !== "top" ? "8px" : "0",
                        width: "350px",
                        padding: "16px",
                        backgroundColor: "var(--colorNeutralBackground1)",
                        zIndex: 1000,
                        boxShadow: tokens.shadow28,
                    }}
                >
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
                        Decision History
                    </h4>

                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                marginBottom: "4px",
                            }}
                        >
                            Criteria:
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "var(--colorNeutralForeground3)",
                            }}
                        >
                            {agent.config.criteria}
                        </div>
                    </div>

                    {agent.decisions.map((decision, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: "12px",
                                paddingBottom: "12px",
                                borderBottom:
                                    index < agent.decisions.length - 1
                                        ? "1px solid var(--colorNeutralStroke2)"
                                        : "none",
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    marginBottom: "4px",
                                }}
                            >
                                Round {decision.round}:{" "}
                                <span
                                    style={{
                                        color:
                                            decision.decision ===
                                            DecisionType.Approve
                                                ? "#4caf50"
                                                : "#f44336",
                                    }}
                                >
                                    {decision.decision.toUpperCase()}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "var(--colorNeutralForeground3)",
                                }}
                            >
                                {decision.reason}
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            <style>
                {`
                    @keyframes flash {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.6; }
                    }
                `}
            </style>
        </div>
    );
}

