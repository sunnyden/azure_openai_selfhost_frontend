import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Login } from "./ui/component/login/Login";
import {
	UserContextProvider,
	useUserContext,
} from "./data/context/UserContext";
import { ChatPage } from "./ui/page/ChatPage/ChatPage";
import { TitleToolbar } from "./ui/component/title/TitleToolbar";
import { CircularProgress, Container, Stack } from "@mui/material";

function App() {
	const { authenticatedUser, initialized } = useUserContext();
	return (
		<div className="App">
			<TitleToolbar />
			{initialized ? (
				<Container maxWidth="xl">
					{authenticatedUser ? <ChatPage /> : <Login />}
				</Container>
			) : (
				<Stack alignItems={"center"} padding={2} spacing={2}>
					<CircularProgress />
				</Stack>
			)}
		</div>
	);
}

export default App;
