import React, { useEffect, useState } from "react";
import {
	Box,
	Container,
	Typography,
	Paper,
	Card,
	CardContent,
	Grid,
	CircularProgress,
	Alert,
	Stack,
	AppBar,
	Toolbar,
	IconButton,
} from "@mui/material";
import {
	ArrowBack,
	AccountBalanceWallet,
	TrendingUp,
	Assessment,
} from "@mui/icons-material";
import { Transaction } from "../../../api/interface/data/common/Transaction";
import { User } from "../../../api/interface/data/common/User";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { UsageDataTable } from "../../component/usage/UsageDataTable";
import { WindowControls } from "../../component/window/WindowControls";
import { DraggableArea } from "../../component/window/DraggableArea";

interface UsagePageProps {
	onBack: () => void;
}

export function UsagePage({ onBack }: UsagePageProps) {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
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

	const totalCost = transactions.reduce(
		(sum, transaction) => sum + transaction.cost,
		0
	);
	const totalTokens = transactions.reduce(
		(sum, transaction) => sum + transaction.totalTokens,
		0
	);
	const averageCostPerTransaction =
		transactions.length > 0 ? totalCost / transactions.length : 0;

	if (loading) {
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<AppBar position="static" elevation={1}>
					<Toolbar sx={{ minHeight: 56 }}>
						<IconButton
							edge="start"
							color="inherit"
							aria-label="back"
							onClick={onBack}
							sx={{ mr: 2 }}
						>
							<ArrowBack />
						</IconButton>
						<DraggableArea>
							<Typography
								variant="h6"
								component="div"
								sx={{ flexGrow: 1 }}
							>
								Usage Analytics
							</Typography>
						</DraggableArea>
						<WindowControls />
					</Toolbar>
				</AppBar>
				<Container
					maxWidth={false}
					sx={{
						flex: 1,
						py: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Stack alignItems="center" spacing={2}>
						<CircularProgress />
						<Typography>Loading usage data...</Typography>
					</Stack>
				</Container>
			</Box>
		);
	}

	if (error) {
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<AppBar position="static" elevation={1}>
					<Toolbar sx={{ minHeight: 56 }}>
						<IconButton
							edge="start"
							color="inherit"
							aria-label="back"
							onClick={onBack}
							sx={{ mr: 2 }}
						>
							<ArrowBack />
						</IconButton>
						<DraggableArea>
							<Typography
								variant="h6"
								component="div"
								sx={{ flexGrow: 1 }}
							>
								Usage Analytics
							</Typography>
						</DraggableArea>
						<WindowControls />
					</Toolbar>
				</AppBar>
				<Container maxWidth={false} sx={{ flex: 1, py: 2 }}>
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				</Container>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<AppBar position="static" elevation={1}>
				<Toolbar sx={{ minHeight: 56 }}>
					<IconButton
						edge="start"
						color="inherit"
						aria-label="back"
						onClick={onBack}
						sx={{ mr: 2 }}
					>
						<ArrowBack />
					</IconButton>
					<DraggableArea>
						<Typography
							variant="h6"
							component="div"
							sx={{ flexGrow: 1 }}
						>
							Usage Analytics
						</Typography>
					</DraggableArea>
					<WindowControls />
				</Toolbar>
			</AppBar>

			<Container
				maxWidth={false}
				sx={{ flex: 1, py: 2, overflow: "auto" }}
			>
				<Stack spacing={3}>
					{/* User Credit Information */}
					{authenticatedUser && (
						<Paper elevation={2} sx={{ p: 3 }}>
							<Typography
								variant="h5"
								gutterBottom
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
								}}
							>
								<AccountBalanceWallet color="primary" />
								Credit Information
							</Typography>
							<Grid container spacing={3}>
								<Grid item xs={12} md={4}>
									<Card variant="outlined">
										<CardContent>
											<Typography
												color="text.secondary"
												gutterBottom
											>
												Remaining Credit
											</Typography>
											<Typography
												variant="h4"
												component="div"
												color="primary"
											>
												{authenticatedUser.remainingCredit.toFixed(
													2
												)}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={4}>
									<Card variant="outlined">
										<CardContent>
											<Typography
												color="text.secondary"
												gutterBottom
											>
												Credit Quota
											</Typography>
											<Typography
												variant="h4"
												component="div"
											>
												{authenticatedUser.creditQuota.toFixed(
													2
												)}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={4}>
									<Card variant="outlined">
										<CardContent>
											<Typography
												color="text.secondary"
												gutterBottom
											>
												Used Credit
											</Typography>
											<Typography
												variant="h4"
												component="div"
												color="secondary"
											>
												{(
													authenticatedUser.creditQuota -
													authenticatedUser.remainingCredit
												).toFixed(2)}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>
						</Paper>
					)}

					{/* Usage Statistics */}
					<Paper elevation={2} sx={{ p: 3 }}>
						<Typography
							variant="h5"
							gutterBottom
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<Assessment color="primary" />
							Usage Statistics
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12} md={3}>
								<Card variant="outlined">
									<CardContent>
										<Typography
											color="text.secondary"
											gutterBottom
										>
											Total Transactions
										</Typography>
										<Typography
											variant="h4"
											component="div"
										>
											{transactions.length}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={3}>
								<Card variant="outlined">
									<CardContent>
										<Typography
											color="text.secondary"
											gutterBottom
										>
											Total Cost
										</Typography>
										<Typography
											variant="h4"
											component="div"
											color="secondary"
										>
											{totalCost.toFixed(4)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={3}>
								<Card variant="outlined">
									<CardContent>
										<Typography
											color="text.secondary"
											gutterBottom
										>
											Total Tokens
										</Typography>
										<Typography
											variant="h4"
											component="div"
										>
											{totalTokens.toLocaleString()}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={3}>
								<Card variant="outlined">
									<CardContent>
										<Typography
											color="text.secondary"
											gutterBottom
										>
											Avg Cost/Transaction
										</Typography>
										<Typography
											variant="h4"
											component="div"
										>
											{averageCostPerTransaction.toFixed(
												4
											)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</Paper>

					{/* Usage Data Table */}
					<Paper elevation={2} sx={{ p: 3 }}>
						<Typography
							variant="h5"
							gutterBottom
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<TrendingUp color="primary" />
							Transaction History
						</Typography>
						<UsageDataTable transactions={transactions} />
					</Paper>
				</Stack>
			</Container>
		</Box>
	);
}
