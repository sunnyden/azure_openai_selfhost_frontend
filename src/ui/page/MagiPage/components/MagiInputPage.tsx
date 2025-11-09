import React, { useState, useEffect } from "react";
import {
    Button,
    Field,
    Input,
    Textarea,
    Dropdown,
    Option,
    Card,
} from "@fluentui/react-components";
import { AgentConfig, MagiInput } from "../types";
import { useModelContext } from "../../../../data/context/ModelContext";
import { Model } from "../../../../api/interface/data/common/Model";

interface MagiInputPageProps {
    onStartJudgment: (input: MagiInput) => void;
}

const MAGI_HISTORY_KEY = "magi_history";
const MAX_HISTORY_ITEMS = 10;

type HistoryItem = {
    id: string;
    timestamp: number;
    input: MagiInput;
};

export function MagiInputPage({ onStartJudgment }: MagiInputPageProps) {
    const { modelList } = useModelContext();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [agents, setAgents] = useState<
        [AgentConfig, AgentConfig, AgentConfig]
    >([
        { name: "", model: "", criteria: "" },
        { name: "", model: "", criteria: "" },
        { name: "", model: "", criteria: "" },
    ]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(MAGI_HISTORY_KEY);
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                setHistory(parsed);
            } catch (error) {
                console.error("Failed to load MAGI history:", error);
            }
        }
    }, []);

    const saveToHistory = (input: MagiInput) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            input,
        };

        const updatedHistory = [newItem, ...history].slice(
            0,
            MAX_HISTORY_ITEMS
        );
        setHistory(updatedHistory);
        localStorage.setItem(MAGI_HISTORY_KEY, JSON.stringify(updatedHistory));
    };

    const loadFromHistory = (item: HistoryItem) => {
        setTitle(item.input.title);
        setContent(item.input.content);
        setAgents(item.input.agents);
        setShowHistory(false);
    };

    const deleteHistoryItem = (id: string) => {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem(MAGI_HISTORY_KEY, JSON.stringify(updatedHistory));
    };

    const updateAgent = (
        index: number,
        field: keyof AgentConfig,
        value: string
    ) => {
        const newAgents = [...agents] as [
            AgentConfig,
            AgentConfig,
            AgentConfig,
        ];
        newAgents[index] = { ...newAgents[index], [field]: value };
        setAgents(newAgents);
    };

    const handleSubmit = () => {
        // Validation
        if (!title.trim() || !content.trim()) {
            alert("Please provide both title and content");
            return;
        }

        for (let i = 0; i < 3; i++) {
            if (
                !agents[i].name.trim() ||
                !agents[i].model.trim() ||
                !agents[i].criteria.trim()
            ) {
                alert(`Please complete all fields for Agent ${i + 1}`);
                return;
            }
        }

        const input: MagiInput = { title, content, agents };

        // Save to history before starting judgment
        saveToHistory(input);

        onStartJudgment(input);
    };

    return (
        <div
            style={{
                padding: "40px",
                maxWidth: "900px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}
        >
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 600 }}>
                MAGI - Multi-Agent Gating Interface
            </h1>

            {history.length > 0 && (
                <div>
                    <Button
                        appearance="subtle"
                        onClick={() => setShowHistory(!showHistory)}
                        style={{ marginBottom: "12px" }}
                    >
                        {showHistory ? "Hide" : "Show"} History (
                        {history.length})
                    </Button>

                    {showHistory && (
                        <div
                            style={{
                                marginBottom: "16px",
                                maxHeight: "400px",
                                overflowY: "auto",
                                border: "1px solid var(--colorNeutralStroke1)",
                                borderRadius: "8px",
                                padding: "12px",
                                backgroundColor:
                                    "var(--colorNeutralBackground2)",
                            }}
                        >
                            {history.map(item => (
                                <Card
                                    key={item.id}
                                    style={{
                                        marginBottom: "8px",
                                        padding: "12px",
                                        cursor: "pointer",
                                        backgroundColor:
                                            "var(--colorNeutralBackground1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "start",
                                        }}
                                    >
                                        <div
                                            onClick={() =>
                                                loadFromHistory(item)
                                            }
                                            style={{ flex: 1 }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {item.input.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "var(--colorNeutralForeground3)",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                {new Date(
                                                    item.timestamp
                                                ).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "12px" }}>
                                                Agents:{" "}
                                                {item.input.agents
                                                    .map(a => a.name)
                                                    .join(", ")}
                                            </div>
                                        </div>
                                        <Button
                                            appearance="subtle"
                                            size="small"
                                            onClick={e => {
                                                e.stopPropagation();
                                                deleteHistoryItem(item.id);
                                            }}
                                            style={{ color: "#f44336" }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Field label="Judgment Title" required>
                <Input
                    value={title}
                    onChange={(e, data) => setTitle(data.value)}
                    placeholder="e.g., Travel to Japan Request"
                />
            </Field>

            <Field label="Content to Judge" required>
                <Textarea
                    value={content}
                    onChange={(e, data) => setContent(data.value)}
                    placeholder="Enter the content that needs decision..."
                    rows={6}
                    resize="vertical"
                />
            </Field>

            <div style={{ marginTop: "16px" }}>
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: 600,
                        marginBottom: "16px",
                    }}
                >
                    Agent Configuration
                </h2>
                <p
                    style={{
                        color: "var(--colorNeutralForeground3)",
                        marginBottom: "24px",
                    }}
                >
                    Configure exactly three agents to perform the
                    decision-making process.
                </p>

                {[0, 1, 2].map(index => (
                    <div
                        key={index}
                        style={{
                            padding: "20px",
                            border: "1px solid var(--colorNeutralStroke1)",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            backgroundColor: "var(--colorNeutralBackground2)",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                marginBottom: "16px",
                            }}
                        >
                            Agent {index + 1}
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            <Field label="Agent Name" required>
                                <Input
                                    value={agents[index].name}
                                    onChange={(e, data) =>
                                        updateAgent(index, "name", data.value)
                                    }
                                    placeholder={`e.g., Agent ${String.fromCharCode(65 + index)}`}
                                />
                            </Field>

                            <Field label="Model" required>
                                <Dropdown
                                    placeholder="Select a model"
                                    value={agents[index].model}
                                    selectedOptions={
                                        agents[index].model
                                            ? [agents[index].model]
                                            : []
                                    }
                                    onOptionSelect={(e, data) =>
                                        updateAgent(
                                            index,
                                            "model",
                                            data.optionValue || ""
                                        )
                                    }
                                >
                                    {modelList.map((model: Model) => (
                                        <Option
                                            key={model.identifier}
                                            value={model.identifier}
                                        >
                                            {model.friendlyName}
                                        </Option>
                                    ))}
                                </Dropdown>
                            </Field>

                            <Field label="Decision Criteria" required>
                                <Textarea
                                    value={agents[index].criteria}
                                    onChange={(e, data) =>
                                        updateAgent(
                                            index,
                                            "criteria",
                                            data.value
                                        )
                                    }
                                    placeholder="Enter the criteria this agent must follow..."
                                    rows={4}
                                    resize="vertical"
                                />
                            </Field>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                appearance="primary"
                size="large"
                onClick={handleSubmit}
                style={{ alignSelf: "flex-start" }}
            >
                Start Judgment
            </Button>
        </div>
    );
}

