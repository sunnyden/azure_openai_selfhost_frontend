import {
	Alert,
	Backdrop,
	Button,
	CircularProgress,
	Paper,
	Stack,
	TextField,
} from "@mui/material";
import "./Login.css";
import { useUserContext } from "../../../data/context/UserContext";
import { useCallback, useState } from "react";
export function Login() {
	const { authenticate } = useUserContext();
	const [isLoading, setIsLoading] = useState(false);
	const [userName, setUserName] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const login = useCallback(async () => {
		setIsLoading(true);
		try {
			await authenticate(userName, password);
		} catch (error: any) {
			setErrorMessage(error?.message);
		} finally {
			setIsLoading(false);
		}
	}, [authenticate, userName, password]);
	return (
		<Paper elevation={3} className="login-panel">
			<Stack spacing={2}>
				{errorMessage && (
					<Alert severity="error">
						Failed to login, error: {errorMessage}.
					</Alert>
				)}
				<TextField
					label="Username"
					variant="outlined"
					value={userName}
					onChange={(e) => setUserName(e.target.value)}
				/>
				<TextField
					label="Password"
					variant="outlined"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Button variant="contained" onClick={login}>
					Login
				</Button>
			</Stack>
			<Backdrop
				sx={{
					color: "#fff",
					zIndex: (theme) => theme.zIndex.drawer + 1,
				}}
				open={isLoading}
			>
				<CircularProgress color="inherit" />
			</Backdrop>
		</Paper>
	);
}
