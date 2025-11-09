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
            return "rgb(104 255 151)"; // Orange for processing (審議中)
        }

        // If finalized
        if (agent.finalDecision !== undefined) {
            return agent.finalDecision === DecisionType.Approve
                ? "rgb(0 206 255)" // Bright green for approve (可決)
                : "rgb(211 1 14)"; // Bright red for reject (否決)
        }

        // Check current round decision
        if (agent.decisions.length > 0) {
            const lastDecision = agent.decisions[agent.decisions.length - 1];
            if (lastDecision.decision === DecisionType.Approve) {
                return "rgb(0 206 255)";
            } else if (lastDecision.decision === DecisionType.Reject) {
                return "rgb(211 1 14)";
            }
        }

        // Pending - using cyan like CASPER in the image
        return "rgb(0 206 255)";
    };
    // rgb(0 206 255) cyan
    // green: rgb(104 255 151)
    // red: rgb(211 1 14)

    // Get gradient background for mixed states (like CASPER's cyan/red split)
    const getBackgroundStyle = () => {
        const baseColor = getBackgroundColor();

        // For bottom left (CASPER position), add gradient effect if it has mixed decisions
        if (position === "bottomLeft" && agent.decisions.length > 0) {
            const hasApprove = agent.decisions.some(
                d => d.decision === DecisionType.Approve
            );
            const hasReject = agent.decisions.some(
                d => d.decision === DecisionType.Reject
            );

            if (hasApprove && hasReject && !agent.finalDecision) {
                return {
                    background: `linear-gradient(135deg, rgb(0 206 255) 0%, rgb(0 206 255) 50%, rgb(211 1 14) 50%, rgb(211 1 14) 100%)`,
                };
            }
        }

        return {
            backgroundColor: baseColor,
        };
    };

    const getStatusText = () => {
        if (agent.isProcessing) {
            return "審議中"; // Judging/Deliberating
        }
        if (agent.finalDecision === DecisionType.Approve) {
            return "承認"; // Approved
        }
        if (agent.finalDecision === DecisionType.Reject) {
            return "否定"; // Rejected
        }
        if (agent.decisions.length > 0) {
            const lastDecision = agent.decisions[agent.decisions.length - 1];
            if (lastDecision.decision === DecisionType.Approve) {
                return "承認"; // Approved in deliberation
            } else if (lastDecision.decision === DecisionType.Reject) {
                return "否定"; // Rejected in deliberation
            }
        }
        return "待機"; // Waiting
    };

    const getPositionStyle = () => {
        switch (position) {
            case "top":
                return {
                    top: "0%",
                    left: "50%",
                    transform: "translateX(-50%)",
                };
            case "bottomLeft":
                return {
                    bottom: "17%",
                    left: "4%",
                };
            case "bottomRight":
                return {
                    bottom: "17%",
                    right: "4%",
                };
        }
    };

    // Extract agent number from name or use position
    const agentNumber =
        agent.config.name.match(/\d+/)?.[0] ||
        (position === "top" ? "1" : position === "bottomLeft" ? "2" : "3");

    // Get shape based on position to match the reference image exactly
    const getShapeClipPath = () => {
        switch (position) {
            case "top":
                // Top trapezoid - narrower at top, wider at bottom
                return "polygon(0 0, 100% 0, 100% 73%, 71% 100%, 29% 100%, 0 73%)";
            case "bottomLeft":
                // Left pentagon - angled on right side
                return "polygon(0 0, 65% 0, 100% 65%, 100% 100%, 0 100%)";
            case "bottomRight":
                // Right pentagon - angled on left side
                return "polygon(0 65%, 35% 0, 100% 0, 100% 100%, 0 100%)";
        }
    };

    const getShapeDimensions = () => {
        switch (position) {
            case "top":
                return { width: "42rem", height: "46rem" };
            case "bottomLeft":
            case "bottomRight":
                return { width: "49rem", height: "26rem" };
        }
    };

    const getModelTextAlign = () => {
        switch (position) {
            case "top":
                return {
                    bottom: "30rem",
                    left: "50%",
                };
            case "bottomLeft":
                return {
                    bottom: "15rem",
                    left: "50%",
                };
            case "bottomRight":
                return {
                    bottom: "15rem",
                    left: "50%",
                };
        }
    };

    const getModelStatusAlign = () => {
        switch (position) {
            case "top":
                return {
                    bottom: "15rem",
                    left: "50%",
                };
            case "bottomLeft":
                return {
                    bottom: "1rem",
                    left: "50%",
                };
            case "bottomRight":
                return {
                    bottom: "1rem",
                    left: "50%",
                };
        }
    };

    const dimensions = getShapeDimensions();

    return (
        <div
            style={{
                position: "absolute",
                zIndex: 2,
                ...getPositionStyle(),
            }}
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
        >
            <div
                style={{
                    position: "relative",
                    ...dimensions,
                    ...getBackgroundStyle(),
                    clipPath: getShapeClipPath(),
                    transition: "all 0.1s ease",
                    animation: agent.isProcessing
                        ? "flash 0.2s infinite"
                        : "none",
                    cursor: "pointer",
                    boxShadow: `0 0 30px transparent, inset 0 0 20px transparent`,
                    border: "4px solid transparent",
                }}
            >
                {/* Main content area */}
                <div
                    style={{
                        padding: "20px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#000",
                        fontFamily: "Courier New, monospace",
                        fontWeight: "bold",
                        position: "relative",
                    }}
                >
                    {/* Agent name - large and centered */}
                    <div
                        style={{
                            fontSize: "6rem",
                            fontWeight: "bold",
                            width: "100%",
                            textAlign: "center",
                            // letterSpacing: "3px",
                            fontFamily: "sans-serif",
                            position: "absolute",
                            ...getModelTextAlign(),
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        {agent.config.name.toUpperCase()}
                    </div>

                    {/* Status in Japanese - bottom */}
                    <div
                        style={{
                            width: "fit-content",
                            height: "6rem",
                            border: "0.8rem solid #000",
                            backgroundColor: "rgba(0,0,0,0.25)",
                            fontSize: "6rem",
                            lineHeight: "6rem",
                            letterSpacing: "0.1rem",
                            fontWeight: "bolder",
                            fontFamily: "MatissePro-Bolder",
                            position: "absolute",
                            transform: "translate(-50%, -50%)",
                            ...getModelStatusAlign(),
                        }}
                    >
                        {getStatusText()}
                    </div>
                </div>
            </div>

            {/* Details tooltip - shown on hover */}
            {showDetails && agent.decisions.length > 0 && (
                <Card
                    style={{
                        position: "absolute",
                        top: position === "top" ? "100%" : "auto",
                        bottom: position !== "top" ? "100%" : "auto",
                        left: 0,
                        marginTop: position === "top" ? "12px" : "0",
                        marginBottom: position !== "top" ? "12px" : "0",
                        width: "380px",
                        padding: "16px",
                        backgroundColor: "#1a1a1a",
                        color: "#00FF00",
                        border: "2px solid #00FF00",
                        zIndex: 1000,
                        boxShadow: "0 0 20px rgba(0,255,0,0.3)",
                        fontFamily: "Courier New, monospace",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 12px 0",
                            fontSize: "14px",
                            color: "#00FF00",
                            borderBottom: "1px solid #00FF00",
                            paddingBottom: "8px",
                        }}
                    >
                        ■ DECISION HISTORY
                    </h4>

                    <div style={{ marginBottom: "12px" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "11px",
                                marginBottom: "4px",
                                color: "#FFa500",
                            }}
                        >
                            CRITERIA:
                        </div>
                        <div
                            style={{
                                fontSize: "11px",
                                color: "#00FF00",
                                opacity: 0.8,
                            }}
                        >
                            {agent.config.criteria}
                        </div>
                    </div>

                    <div
                        style={{
                            marginBottom: "8px",
                            fontSize: "11px",
                            color: "#FF6600",
                        }}
                    >
                        MODEL: {agent.config.model}
                    </div>

                    {agent.decisions.map((decision, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: "10px",
                                paddingBottom: "10px",
                                borderBottom:
                                    index < agent.decisions.length - 1
                                        ? "1px solid #00FF0040"
                                        : "none",
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "12px",
                                    marginBottom: "4px",
                                }}
                            >
                                ROUND {decision.round}:{" "}
                                <span
                                    style={{
                                        color:
                                            decision.decision ===
                                            DecisionType.Approve
                                                ? "#00FF00"
                                                : "#FF0000",
                                    }}
                                >
                                    {decision.decision === DecisionType.Approve
                                        ? "承認"
                                        : "否定"}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#00FF00",
                                    opacity: 0.7,
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
                        100% { filter: brightness(1); }
                        0% { filter: brightness(0); }
                    }
                `}
            </style>
        </div>
    );
}

