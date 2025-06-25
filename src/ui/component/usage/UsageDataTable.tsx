import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Typography,
    Box,
    TableSortLabel,
} from "@mui/material";
import { Transaction } from "../../../api/interface/data/common/Transaction";

interface UsageDataTableProps {
    transactions: Transaction[];
}

type Order = "asc" | "desc";
type OrderBy = keyof Transaction;

export function UsageDataTable({ transactions }: UsageDataTableProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState<Order>("desc");
    const [orderBy, setOrderBy] = useState<OrderBy>("time");

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
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

    const getServiceColor = (service: string) => {
        switch (service.toLowerCase()) {
            case "chat":
            case "completion":
                return "primary";
            case "embedding":
                return "secondary";
            case "image":
            case "image_generation":
                return "success";
            default:
                return "default";
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
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    No transaction data available
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === "time"}
                                    direction={
                                        orderBy === "time" ? order : "asc"
                                    }
                                    onClick={() => handleRequestSort("time")}
                                >
                                    Date & Time
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === "transactionId"}
                                    direction={
                                        orderBy === "transactionId"
                                            ? order
                                            : "asc"
                                    }
                                    onClick={() =>
                                        handleRequestSort("transactionId")
                                    }
                                >
                                    Transaction ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === "requestedService"}
                                    direction={
                                        orderBy === "requestedService"
                                            ? order
                                            : "asc"
                                    }
                                    onClick={() =>
                                        handleRequestSort("requestedService")
                                    }
                                >
                                    Service
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={orderBy === "promptTokens"}
                                    direction={
                                        orderBy === "promptTokens"
                                            ? order
                                            : "asc"
                                    }
                                    onClick={() =>
                                        handleRequestSort("promptTokens")
                                    }
                                >
                                    Prompt Tokens
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={orderBy === "responseTokens"}
                                    direction={
                                        orderBy === "responseTokens"
                                            ? order
                                            : "asc"
                                    }
                                    onClick={() =>
                                        handleRequestSort("responseTokens")
                                    }
                                >
                                    Response Tokens
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={orderBy === "totalTokens"}
                                    direction={
                                        orderBy === "totalTokens"
                                            ? order
                                            : "asc"
                                    }
                                    onClick={() =>
                                        handleRequestSort("totalTokens")
                                    }
                                >
                                    Total Tokens
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={orderBy === "cost"}
                                    direction={
                                        orderBy === "cost" ? order : "asc"
                                    }
                                    onClick={() => handleRequestSort("cost")}
                                >
                                    Cost
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTransactions.map(transaction => (
                            <TableRow key={transaction.id} hover>
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatDateTime(transaction.time)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontFamily: "monospace",
                                            fontSize: "0.8rem",
                                            maxWidth: "120px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                        title={transaction.transactionId}
                                    >
                                        {transaction.transactionId}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={transaction.requestedService}
                                        size="small"
                                        color={
                                            getServiceColor(
                                                transaction.requestedService
                                            ) as any
                                        }
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {transaction.promptTokens.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {transaction.responseTokens.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                    >
                                        {transaction.totalTokens.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                        color="secondary.main"
                                    >
                                        {transaction.cost.toFixed(4)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={transactions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
}
