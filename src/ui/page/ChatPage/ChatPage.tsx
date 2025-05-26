import {
	Box,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	Stack,
	Container,
	IconButton,
	Toolbar,
	AppBar,
	Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ChatHistory } from "../../component/chat/ChatHistory";
import { ChatInput } from "../../component/chat/ChatInput";
import { ConversationSidePanel } from "../../component/ConversationSidePanel";
import { WindowControls } from "../../component/window/WindowControls";
import { DraggableArea } from "../../component/window/DraggableArea";
import { UsagePage } from "../UsagePage/UsagePage";
import { useModelContext } from "../../../data/context/ModelContext";
import { useCallback, useState } from "react";

export function ChatPage() {
	const { currentModel, modelList, setCurrentModel } = useModelContext();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState<"chat" | "usage">("chat");

	const onModelChange = useCallback(
		(e: SelectChangeEvent) => {
			const newModel = modelList.find(
				(model) => model.identifier === e.target.value
			);
			return newModel ? setCurrentModel(newModel) : undefined;
		},
		[modelList, setCurrentModel]
	);

	const handleSidebarToggle = () => {
		setSidebarOpen(!sidebarOpen);
	};

	const handleNavigateToUsage = () => {
		setCurrentPage("usage");
		setSidebarOpen(false);
	};

	const handleBackToChat = () => {
		setCurrentPage("chat");
	};

	// Show usage page if that's the current page
	if (currentPage === "usage") {
		return <UsagePage onBack={handleBackToChat} />;
	}

	return modelList.length > 0 ? (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			{/* Top App Bar */}
			<AppBar position="static" elevation={1}>
				<Toolbar sx={{ minHeight: 56 }}>
					<IconButton
						edge="start"
						color="inherit"
						aria-label="menu"
						onClick={handleSidebarToggle}
						sx={{ mr: 2 }}
					>
						<MenuIcon />
					</IconButton>

					<DraggableArea>
						<Typography
							variant="h6"
							component="div"
							sx={{ flexGrow: 1 }}
						>
							Chat
						</Typography>
						<FormControl
							size="small"
							sx={{ minWidth: 200, marginRight: 1 }}
						>
							<Select
								value={currentModel?.identifier || ""}
								onChange={onModelChange}
								sx={{
									color: "inherit",
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor:
											"rgba(255, 255, 255, 0.23)",
									},
									"&:hover .MuiOutlinedInput-notchedOutline":
										{
											borderColor:
												"rgba(255, 255, 255, 0.5)",
										},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline":
										{
											borderColor:
												"rgba(255, 255, 255, 0.8)",
										},
								}}
							>
								{modelList.map((model) => (
									<MenuItem
										key={model.identifier}
										value={model.identifier}
									>
										{model.friendlyName}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</DraggableArea>

					<WindowControls />
				</Toolbar>
			</AppBar>
			{/* Main Content */}
			<Container
				maxWidth={false}
				sx={{ flex: 1, py: 2, overflow: "hidden" }}
			>
				<Stack direction="column" spacing={2} sx={{ height: "100%" }}>
					{/* Flex-grow will make this take available space */}
					<Box sx={{ flexGrow: 1, overflow: "hidden" }}>
						<ChatHistory />
					</Box>
					{/* Chat input at the bottom */}
					<Box>
						<ChatInput />
					</Box>
				</Stack>
			</Container>{" "}
			{/* Side Panel */}
			<ConversationSidePanel
				open={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onNavigateToUsage={handleNavigateToUsage}
			/>
		</Box>
	) : (
		<Stack alignItems={"center"} padding={2} spacing={2}>
			<CircularProgress />
		</Stack>
	);
}
