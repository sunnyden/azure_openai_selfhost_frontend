import React from "react";
import {
    Text,
    Spinner,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Button,
} from "@fluentui/react-components";
import {
    DataTrending20Regular,
    ArrowClockwise20Regular,
} from "@fluentui/react-icons";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { useAdminStyles } from "./adminStyles";
import { formatDate } from "./formatDate";

interface TransactionsTabProps {
    transactions: Transaction[];
    loading: boolean;
    onRefresh: () => void;
}

export function TransactionsTab({
    transactions,
    loading,
    onRefresh,
}: TransactionsTabProps) {
    const styles = useAdminStyles();

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <DataTrending20Regular />
                    <Text>All Transactions</Text>
                </div>
                <Button
                    size="small"
                    icon={<ArrowClockwise20Regular />}
                    onClick={onRefresh}
                >
                    Refresh
                </Button>
            </div>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                    <Spinner label="Loading transactions..." />
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>ID</TableHeaderCell>
                                <TableHeaderCell>Time</TableHeaderCell>
                                <TableHeaderCell>User ID</TableHeaderCell>
                                <TableHeaderCell>Model</TableHeaderCell>
                                <TableHeaderCell>Prompt Tokens</TableHeaderCell>
                                <TableHeaderCell>Response Tokens</TableHeaderCell>
                                <TableHeaderCell>Total Tokens</TableHeaderCell>
                                <TableHeaderCell>Cost</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.id}</TableCell>
                                    <TableCell>{formatDate(tx.time)}</TableCell>
                                    <TableCell>{tx.userId}</TableCell>
                                    <TableCell>{tx.requestedService}</TableCell>
                                    <TableCell>{tx.promptTokens}</TableCell>
                                    <TableCell>{tx.responseTokens}</TableCell>
                                    <TableCell>{tx.totalTokens}</TableCell>
                                    <TableCell>{tx.cost.toFixed(6)}</TableCell>
                                </TableRow>
                            ))}
                            {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <Text
                                            style={{
                                                color: "var(--colorNeutralForeground3)",
                                            }}
                                        >
                                            No transactions found.
                                        </Text>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
