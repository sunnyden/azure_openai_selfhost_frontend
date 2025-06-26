import React, { useState, useMemo } from "react";
import {
    Table,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableCellLayout,
    Text,
    Badge,
    Button,
    Dropdown,
    Option,
    makeStyles,
} from "@fluentui/react-components";
import {
    ChevronUp16Regular,
    ChevronDown16Regular,
    ChevronLeft16Regular,
    ChevronRight16Regular,
} from "@fluentui/react-icons";
import { Transaction } from "../../../api/interface/data/common/Transaction";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    emptyState: {
        textAlign: "center",
        padding: "32px",
        color: "#737373",
    },
    sortButton: {
        padding: "0",
        minWidth: "auto",
        "& .fui-Button__icon": {
            fontSize: "16px",
        },
    },
    pagination: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderTop: "1px solid #e1e1e1",
        marginTop: "16px",
    },
    paginationInfo: {
        color: "#737373",
        fontSize: "14px",
    },
    paginationControls: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    transactionId: {
        fontFamily: "monospace",
        fontSize: "12px",
        maxWidth: "120px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    tableContainer: {
        border: "1px solid #e1e1e1",
        borderRadius: "6px",
        overflow: "hidden",
    },
});

interface UsageDataTableProps {
    transactions: Transaction[];
}

type Order = "asc" | "desc";
type OrderBy = keyof Transaction;

export function UsageDataTable({ transactions }: UsageDataTableProps) {
    const styles = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState<Order>("desc");
    const [orderBy, setOrderBy] = useState<OrderBy>("time");

    const handleChangePage = (newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (value: string) => {
        setRowsPerPage(parseInt(value, 10));
        setPage(0);
    };

    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getServiceColor = (
        service: string
    ):
        | "success"
        | "warning"
        | "brand"
        | "danger"
        | "important"
        | "informative"
        | "severe"
        | "subtle" => {
        switch (service.toLowerCase()) {
            case "chat":
            case "completion":
                return "brand";
            case "embedding":
                return "informative";
            case "image":
            case "image_generation":
                return "success";
            default:
                return "subtle";
        }
    };

    const sortedTransactions = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => {
            let aValue = a[orderBy];
            let bValue = b[orderBy];

            // Handle different data types
            if (orderBy === "time") {
                aValue = new Date(aValue as string).getTime();
                bValue = new Date(bValue as string).getTime();
            } else if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = (bValue as string).toLowerCase();
            }

            if (order === "asc") {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
        return sorted;
    }, [transactions, order, orderBy]);

    const paginatedTransactions = useMemo(() => {
        return sortedTransactions.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [sortedTransactions, page, rowsPerPage]);

    if (transactions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Text size={300}>No transaction data available</Text>
            </div>
        );
    }

    const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage);
    const startItem = page * rowsPerPage + 1;
    const endItem = Math.min(
        (page + 1) * rowsPerPage,
        sortedTransactions.length
    );

    const SortButton = ({
        column,
        children,
    }: {
        column: OrderBy;
        children: React.ReactNode;
    }) => (
        <Button
            appearance="transparent"
            onClick={() => handleRequestSort(column)}
            className={styles.sortButton}
            icon={
                orderBy === column ? (
                    order === "asc" ? (
                        <ChevronUp16Regular />
                    ) : (
                        <ChevronDown16Regular />
                    )
                ) : undefined
            }
            iconPosition="after"
        >
            {children}
        </Button>
    );

    return (
        <div className={styles.container}>
            <div className={styles.tableContainer}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>
                                <SortButton column="time">
                                    Date & Time
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="transactionId">
                                    Transaction ID
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="requestedService">
                                    Service
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="promptTokens">
                                    Prompt Tokens
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="responseTokens">
                                    Response Tokens
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="totalTokens">
                                    Total Tokens
                                </SortButton>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <SortButton column="cost">Cost</SortButton>
                            </TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTransactions.map(transaction => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text size={200}>
                                            {formatDateTime(transaction.time)}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text
                                            size={200}
                                            className={styles.transactionId}
                                            title={transaction.transactionId}
                                        >
                                            {transaction.transactionId}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Badge
                                            size="small"
                                            color={getServiceColor(
                                                transaction.requestedService
                                            )}
                                            appearance="outline"
                                        >
                                            {transaction.requestedService}
                                        </Badge>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text size={200}>
                                            {transaction.promptTokens.toLocaleString()}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text size={200}>
                                            {transaction.responseTokens.toLocaleString()}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text size={200} weight="semibold">
                                            {transaction.totalTokens.toLocaleString()}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                                <TableCell>
                                    <TableCellLayout>
                                        <Text
                                            size={200}
                                            weight="semibold"
                                            style={{ color: "#d13438" }}
                                        >
                                            {transaction.cost.toFixed(4)}
                                        </Text>
                                    </TableCellLayout>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Custom Pagination */}
            <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                    <Text size={200} className={styles.paginationInfo}>
                        Showing {startItem}-{endItem} of{" "}
                        {sortedTransactions.length} transactions
                    </Text>
                </div>
                <div className={styles.paginationControls}>
                    <Text size={200}>Rows per page:</Text>
                    <Dropdown
                        value={rowsPerPage.toString()}
                        selectedOptions={[rowsPerPage.toString()]}
                        onOptionSelect={(e, data) =>
                            handleChangeRowsPerPage(data.optionValue!)
                        }
                    >
                        <Option value="5">5</Option>
                        <Option value="10">10</Option>
                        <Option value="25">25</Option>
                        <Option value="50">50</Option>
                    </Dropdown>
                    <Button
                        appearance="subtle"
                        icon={<ChevronLeft16Regular />}
                        onClick={() => handleChangePage(page - 1)}
                        disabled={page === 0}
                        size="small"
                    />
                    <Text size={200}>
                        {page + 1} of {totalPages}
                    </Text>
                    <Button
                        appearance="subtle"
                        icon={<ChevronRight16Regular />}
                        onClick={() => handleChangePage(page + 1)}
                        disabled={page >= totalPages - 1}
                        size="small"
                    />
                </div>
            </div>
        </div>
    );
}
