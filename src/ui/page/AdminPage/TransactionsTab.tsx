import React, { useMemo, useState } from "react";
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
    Select,
    Field,
} from "@fluentui/react-components";
import {
    DataTrending20Regular,
    ArrowClockwise20Regular,
    ArrowSortDown20Regular,
    ArrowSortUp20Regular,
} from "@fluentui/react-icons";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { useAdminStyles } from "./adminStyles";
import { formatDate } from "./formatDate";

type SortField = keyof Transaction;
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

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

    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("desc");
        }
        setPage(1);
    };

    const sorted = useMemo(() => {
        return [...transactions].sort((a, b) => {
            const av = a[sortField];
            const bv = b[sortField];
            if (av === undefined || av === null) return 1;
            if (bv === undefined || bv === null) return -1;
            const cmp =
                typeof av === "number" && typeof bv === "number"
                    ? av - bv
                    : String(av).localeCompare(String(bv));
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [transactions, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDir === "asc" ? (
            <ArrowSortUp20Regular style={{ verticalAlign: "middle" }} />
        ) : (
            <ArrowSortDown20Regular style={{ verticalAlign: "middle" }} />
        );
    };

    const headerCellStyle = { cursor: "pointer", userSelect: "none" as const };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <DataTrending20Regular />
                    <Text>All Transactions</Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Field label="Rows per page" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                        <Select
                            value={String(pageSize)}
                            onChange={(_, d) => {
                                setPageSize(Number(d.value));
                                setPage(1);
                            }}
                            style={{ width: "80px" }}
                        >
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Button
                        size="small"
                        icon={<ArrowClockwise20Regular />}
                        onClick={onRefresh}
                    >
                        Refresh
                    </Button>
                </div>
            </div>
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                    <Spinner label="Loading transactions..." />
                </div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() => handleSort("id")}
                                    >
                                        ID <SortIcon field="id" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() => handleSort("time")}
                                    >
                                        Time <SortIcon field="time" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() => handleSort("userId")}
                                    >
                                        User ID <SortIcon field="userId" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() =>
                                            handleSort("requestedService")
                                        }
                                    >
                                        Model{" "}
                                        <SortIcon field="requestedService" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() =>
                                            handleSort("promptTokens")
                                        }
                                    >
                                        Prompt Tokens{" "}
                                        <SortIcon field="promptTokens" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() =>
                                            handleSort("responseTokens")
                                        }
                                    >
                                        Response Tokens{" "}
                                        <SortIcon field="responseTokens" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() =>
                                            handleSort("totalTokens")
                                        }
                                    >
                                        Total Tokens{" "}
                                        <SortIcon field="totalTokens" />
                                    </TableHeaderCell>
                                    <TableHeaderCell
                                        style={headerCellStyle}
                                        onClick={() => handleSort("cost")}
                                    >
                                        Cost <SortIcon field="cost" />
                                    </TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.id}</TableCell>
                                        <TableCell>
                                            {formatDate(tx.time)}
                                        </TableCell>
                                        <TableCell>{tx.userId}</TableCell>
                                        <TableCell>
                                            {tx.requestedService}
                                        </TableCell>
                                        <TableCell>{tx.promptTokens}</TableCell>
                                        <TableCell>
                                            {tx.responseTokens}
                                        </TableCell>
                                        <TableCell>{tx.totalTokens}</TableCell>
                                        <TableCell>
                                            {tx.cost.toFixed(6)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginated.length === 0 && (
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
                    {/* Pagination controls */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                            padding: "12px 16px",
                            borderTop: "1px solid var(--colorNeutralStroke2)",
                        }}
                    >
                        <Text size={200}>
                            {sorted.length === 0
                                ? "0 records"
                                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} of ${sorted.length}`}
                        </Text>
                        <Button
                            size="small"
                            appearance="subtle"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Prev
                        </Button>
                        <Text size={200}>
                            Page {page} / {totalPages}
                        </Text>
                        <Button
                            size="small"
                            appearance="subtle"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
