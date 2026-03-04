import React, { useCallback, useEffect, useState } from "react";
import {
    Button,
    MessageBar,
    Tab,
    TabList,
    makeStyles,
    Spinner,
} from "@fluentui/react-components";
import {
    ArrowLeft20Regular,
    People20Regular,
    Server20Regular,
    DataTrending20Regular,
    Chat20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { AppBar } from "../../component/window/AppBar";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { UsersTab } from "./UsersTab";
import { ModelsTab } from "./ModelsTab";
import { TransactionsTab } from "./TransactionsTab";
import { ChatHistoryTab } from "./ChatHistoryTab";

const useStyles = makeStyles({
    container: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
    },
    content: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    tabContent: {
        flex: 1,
        overflowY: "auto",
        padding: "16px",
    },
});

type TabValue = "users" | "models" | "transactions" | "chathistory";

interface AdminPageProps {
    onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
    const styles = useStyles();
    const apiClient = useApiClient();
    const { fetchUserList } = useUserContext();

    const [selectedTab, setSelectedTab] = useState<TabValue>("users");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Transactions data (fetched at this level and passed down as props)
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    const showSuccess = useCallback((msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    }, []);

    const showError = useCallback((msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 5000);
    }, []);

    const loadTransactions = useCallback(async () => {
        setTransactionsLoading(true);
        try {
            const data = await apiClient.transactionClient.all();
            setTransactions(data);
        } catch (e: any) {
            showError(e.message || "Failed to load transactions");
        } finally {
            setTransactionsLoading(false);
        }
    }, [apiClient]);

    // Load users on mount (needed by ModelsTab and ChatHistoryTab assign pickers)
    useEffect(() => {
        fetchUserList().catch(e =>
            showError(e.message || "Failed to load users")
        );
    }, [fetchUserList]);

    // Load transactions when that tab is first selected
    useEffect(() => {
        if (selectedTab === "transactions") {
            loadTransactions();
        }
    }, [selectedTab, loadTransactions]);

    return (
        <div className={styles.container}>
            <AppBar
                title="Admin Portal"
                leftActions={
                    <Button
                        appearance="subtle"
                        icon={<ArrowLeft20Regular />}
                        onClick={onBack}
                    />
                }
            />

            {successMessage && (
                <MessageBar intent="success" style={{ margin: "8px 16px 0" }}>
                    {successMessage}
                </MessageBar>
            )}
            {error && (
                <MessageBar intent="error" style={{ margin: "8px 16px 0" }}>
                    {error}
                </MessageBar>
            )}

            <div className={styles.content}>
                <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(_, data) =>
                        setSelectedTab(data.value as TabValue)
                    }
                    style={{
                        padding: "0 16px",
                        borderBottom:
                            "1px solid var(--colorNeutralStroke2)",
                    }}
                >
                    <Tab value="users" icon={<People20Regular />}>
                        Users
                    </Tab>
                    <Tab value="models" icon={<Server20Regular />}>
                        Models
                    </Tab>
                    <Tab
                        value="transactions"
                        icon={<DataTrending20Regular />}
                    >
                        Transactions
                    </Tab>
                    <Tab value="chathistory" icon={<Chat20Regular />}>
                        Chat History
                    </Tab>
                </TabList>

                <div className={styles.tabContent}>
                    {selectedTab === "users" && (
                        <UsersTab
                            onSuccess={showSuccess}
                            onError={showError}
                        />
                    )}
                    {selectedTab === "models" && (
                        <ModelsTab
                            onSuccess={showSuccess}
                            onError={showError}
                        />
                    )}
                    {selectedTab === "transactions" && (
                        <TransactionsTab
                            transactions={transactions}
                            loading={transactionsLoading}
                            onRefresh={loadTransactions}
                        />
                    )}
                    {selectedTab === "chathistory" && (
                        <ChatHistoryTab
                            onSuccess={showSuccess}
                            onError={showError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

