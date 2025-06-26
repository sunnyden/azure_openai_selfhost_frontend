import React, { useEffect, useState, useMemo } from "react";
import {
    Button,
    Text,
    Spinner,
    MessageBar,
    Dropdown,
    Option,
    Badge,
    makeStyles,
} from "@fluentui/react-components";
import {
    ArrowLeft20Regular,
    Wallet20Regular,
    DataTrending20Regular,
    DataArea20Regular,
    Filter20Regular,
} from "@fluentui/react-icons";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { User } from "../../../api/interface/data/common/User";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { UsageDataTable } from "../../component/usage/UsageDataTable";
import { AppBar } from "../../component/window/AppBar";
import { StatCard } from "../../component/StatCard";

const useStyles = makeStyles({
    container: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #e1e1e1",
        background: "#f8f9fa",
        minHeight: "56px",
    },
    backButton: {
        marginRight: "12px",
    },
    headerTitle: {
        flexGrow: 1,
        fontSize: "18px",
        fontWeight: "600",
    },
    content: {
        flex: 1,
        padding: "16px",
        overflowY: "auto",
    },
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
    },
    section: {
        padding: "24px",
        border: "1px solid #e1e1e1",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        marginBottom: "24px",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
    },
    sectionTitle: {
        fontSize: "20px",
        fontWeight: "600",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
    },
    filterContainer: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
    },
    dropdown: {
        minWidth: "200px",
    },
});

interface UsagePageProps {
    onBack: () => void;
}

export function UsagePage({ onBack }: UsagePageProps) {
    const styles = useStyles();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>("all");
    const { authenticatedUser } = useUserContext();
    const apiClient = useApiClient();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await apiClient.transactionClient.my();
                setTransactions(data);
            } catch (err: any) {
                setError(err.message || "Failed to fetch usage data");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [apiClient]);

    // Get unique models from transactions
    const availableModels = useMemo(() => {
        const models = Array.from(
            new Set(transactions.map(t => t.requestedService))
        ).sort();
        return models;
    }, [transactions]);

    // Filter transactions based on selected model
    const filteredTransactions = useMemo(() => {
        if (selectedModel === "all") {
            return transactions;
        }
        return transactions.filter(t => t.requestedService === selectedModel);
    }, [transactions, selectedModel]);

    // Calculate statistics based on filtered transactions
    const totalCost = filteredTransactions.reduce(
        (sum, transaction) => sum + transaction.cost,
        0
    );
    const totalTokens = filteredTransactions.reduce(
        (sum, transaction) => sum + transaction.totalTokens,
        0
    );
    const averageCostPerTransaction =
        filteredTransactions.length > 0
            ? totalCost / filteredTransactions.length
            : 0;

    const handleModelChange = (event: any, data: any) => {
        setSelectedModel(data.optionValue);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <AppBar
                    title="Usage Analytics"
                    leftActions={
                        <Button
                            appearance="subtle"
                            icon={<ArrowLeft20Regular />}
                            onClick={onBack}
                        />
                    }
                />
                <div className={styles.content}>
                    <div className={styles.loadingContainer}>
                        <Spinner size="large" />
                        <Text>Loading usage data...</Text>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <AppBar
                    title="Usage Analytics"
                    leftActions={
                        <Button
                            appearance="subtle"
                            icon={<ArrowLeft20Regular />}
                            onClick={onBack}
                        />
                    }
                />
                <div className={styles.content}>
                    <MessageBar intent="error">{error}</MessageBar>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <AppBar
                title="Usage Analytics"
                leftActions={
                    <Button
                        appearance="subtle"
                        icon={<ArrowLeft20Regular />}
                        onClick={onBack}
                    />
                }
            />

            <div className={styles.content}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {/* User Credit Information */}
                    {authenticatedUser && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <Wallet20Regular
                                    style={{
                                        fontSize: "20px",
                                        color: "#0078d4",
                                    }}
                                />
                                <Text className={styles.sectionTitle}>
                                    Credit Information
                                </Text>
                            </div>
                            <div className={styles.statsGrid}>
                                <StatCard
                                    icon={<Wallet20Regular />}
                                    label="Remaining Credit"
                                    value={authenticatedUser.remainingCredit.toFixed(
                                        2
                                    )}
                                    valueColor="#0078d4"
                                />
                                <StatCard
                                    icon={<Wallet20Regular />}
                                    label="Credit Quota"
                                    value={authenticatedUser.creditQuota.toFixed(
                                        2
                                    )}
                                />
                                <StatCard
                                    icon={<Wallet20Regular />}
                                    label="Used Credit"
                                    value={(
                                        authenticatedUser.creditQuota -
                                        authenticatedUser.remainingCredit
                                    ).toFixed(2)}
                                    valueColor="#d13438"
                                />
                            </div>
                        </div>
                    )}

                    {/* Model Filter */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Filter20Regular
                                style={{ fontSize: "20px", color: "#0078d4" }}
                            />
                            <Text className={styles.sectionTitle}>
                                Filter by Model
                            </Text>
                        </div>
                        <div className={styles.filterContainer}>
                            <Dropdown
                                className={styles.dropdown}
                                placeholder="Select a model"
                                value={selectedModel}
                                selectedOptions={[selectedModel]}
                                onOptionSelect={handleModelChange}
                            >
                                <Option value="all">All Models</Option>
                                {availableModels.map(model => (
                                    <Option key={model} value={model}>
                                        {model}
                                    </Option>
                                ))}
                            </Dropdown>
                            {selectedModel !== "all" && (
                                <Text size={300} style={{ color: "#737373" }}>
                                    Showing data for:{" "}
                                    <strong>{selectedModel}</strong>
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Usage Statistics */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <DataArea20Regular
                                style={{ fontSize: "20px", color: "#0078d4" }}
                            />
                            <Text className={styles.sectionTitle}>
                                Usage Statistics
                            </Text>
                            {selectedModel !== "all" && (
                                <Badge color="brand" size="small">
                                    {selectedModel}
                                </Badge>
                            )}
                        </div>
                        <div className={styles.statsGrid}>
                            <StatCard
                                icon={<DataTrending20Regular />}
                                label="Total Transactions"
                                value={filteredTransactions.length}
                            />
                            <StatCard
                                icon={<Wallet20Regular />}
                                label="Total Cost"
                                value={totalCost.toFixed(4)}
                                valueColor="#d13438"
                            />
                            <StatCard
                                icon={<DataArea20Regular />}
                                label="Total Tokens"
                                value={totalTokens.toLocaleString()}
                            />
                            <StatCard
                                icon={<DataTrending20Regular />}
                                label="Avg Cost/Transaction"
                                value={averageCostPerTransaction.toFixed(4)}
                            />
                        </div>
                    </div>

                    {/* Usage Data Table */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <DataTrending20Regular
                                style={{ fontSize: "20px", color: "#0078d4" }}
                            />
                            <Text className={styles.sectionTitle}>
                                Transaction History
                            </Text>
                            {selectedModel !== "all" && (
                                <Badge color="brand" size="small">
                                    {selectedModel}
                                </Badge>
                            )}
                        </div>
                        <UsageDataTable transactions={filteredTransactions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
