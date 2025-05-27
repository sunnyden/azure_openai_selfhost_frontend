import React, { useState } from "react";
import {
	SwipeableDrawer,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	IconButton,
	Typography,
	Box,
	Button,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Tooltip,
	Divider,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Close as CloseIcon,
	Chat as ChatIcon,
	Assessment as AssessmentIcon,
	GetApp as ExportIcon,
	Publish as ImportIcon,
	FileDownload as FileDownloadIcon,
	MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useConversationHistory } from "../../data/context/ConversationHistoryContext";
import { isElectron } from "../../utils/electronUtils";

interface ConversationSidePanelProps {
	open: boolean;
	onClose: () => void;
	onOpen: () => void;
	onNavigateToUsage: () => void;
}

export function ConversationSidePanel({
	open,
	onClose,
	onOpen,
	onNavigateToUsage,
}: ConversationSidePanelProps) {
	const {
		conversations,
		currentConversationId,
		createNewConversation,
		deleteConversation,
		updateConversationTitle,
		selectConversation,
		exportConversation,
		exportAllConversations,
		loadConversationsFromFile,
	} = useConversationHistory();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [conversationToDelete, setConversationToDelete] = useState<
		string | null
	>(null);
	const [exportMenuAnchor, setExportMenuAnchor] =
		useState<null | HTMLElement>(null);
	const [exportConversationId, setExportConversationId] = useState<
		string | null
	>(null);

	const handleNewConversation = () => {
		createNewConversation();
		onClose();
	};

	const handleSelectConversation = (id: string) => {
		selectConversation(id);
		onClose();
	};

	const handleStartEdit = (id: string, currentTitle: string) => {
		setEditingId(id);
		setEditTitle(currentTitle);
	};

	const handleSaveEdit = () => {
		if (editingId && editTitle.trim()) {
			updateConversationTitle(editingId, editTitle.trim());
		}
		setEditingId(null);
		setEditTitle("");
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditTitle("");
	};

	const handleDeleteClick = (id: string) => {
		setConversationToDelete(id);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (conversationToDelete) {
			deleteConversation(conversationToDelete);
		}
		setDeleteDialogOpen(false);
		setConversationToDelete(null);
	};

	const handleCancelDelete = () => {
		setDeleteDialogOpen(false);
		setConversationToDelete(null);
	};

	const handleExportMenuOpen = (
		event: React.MouseEvent<HTMLElement>,
		conversationId?: string
	) => {
		setExportMenuAnchor(event.currentTarget);
		setExportConversationId(conversationId || null);
	};

	const handleExportMenuClose = () => {
		setExportMenuAnchor(null);
		setExportConversationId(null);
	};

	const handleExportSingleConversation = (exportConversationId: string) => {
		if (exportConversationId) {
			exportConversation(exportConversationId);
		}
	};

	const handleExportAllConversations = () => {
		exportAllConversations();
		handleExportMenuClose();
	};

	const handleImportConversations = () => {
		loadConversationsFromFile();
		handleExportMenuClose();
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (diffDays === 1) {
			return "Yesterday";
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: "short" });
		} else {
			return date.toLocaleDateString([], {
				month: "short",
				day: "numeric",
			});
		}
	};
	return (
		<>
			{" "}
			<SwipeableDrawer
				anchor="left"
				open={open}
				onClose={onClose}
				onOpen={onOpen}
				disableBackdropTransition={false}
				disableDiscovery={true}
				sx={{
					"& .MuiDrawer-paper": {
						width: 320,
						boxSizing: "border-box",
						// Ensure drawer content is not draggable in Electron
						...(isElectron() && {
							WebkitAppRegion: "no-drag",
						}),
					},
				}}
			>
				{" "}
				<Box
					sx={{
						p: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Typography
						variant="h6"
						component="div"
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<ChatIcon />
						Chat History
					</Typography>
					<Box sx={{ display: "flex", gap: 0.5 }}>
						<Tooltip title="Export/Import">
							<IconButton
								onClick={(e) => handleExportMenuOpen(e)}
								size="small"
							>
								<MoreVertIcon />
							</IconButton>
						</Tooltip>
						<IconButton onClick={onClose} size="small">
							<CloseIcon />
						</IconButton>
					</Box>
				</Box>
				<Box sx={{ px: 2, pb: 2 }}>
					<Button
						variant="contained"
						fullWidth
						startIcon={<AddIcon />}
						onClick={handleNewConversation}
						size="small"
					>
						New Conversation
					</Button>
				</Box>
				<Divider />{" "}
				<List sx={{ flex: 1, overflow: "auto" }}>
					{conversations.length === 0 ? (
						<Box sx={{ p: 3, textAlign: "center" }}>
							<Typography variant="body2" color="text.secondary">
								No conversations yet. Start a new conversation
								to begin chatting!
							</Typography>
						</Box>
					) : (
						conversations.map((conversation) => (
							<ListItem
								key={conversation.id}
								disablePadding
								sx={{
									backgroundColor:
										currentConversationId ===
										conversation.id
											? "action.selected"
											: "transparent",
								}}
							>
								<ListItemButton
									onClick={() =>
										handleSelectConversation(
											conversation.id
										)
									}
									sx={{ pr: 1 }}
								>
									<ListItemText
										primary={
											editingId === conversation.id ? (
												<TextField
													value={editTitle}
													onChange={(e) =>
														setEditTitle(
															e.target.value
														)
													}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															handleSaveEdit();
														} else if (
															e.key === "Escape"
														) {
															handleCancelEdit();
														}
													}}
													onBlur={handleSaveEdit}
													variant="outlined"
													size="small"
													fullWidth
													autoFocus
												/>
											) : (
												<Typography
													variant="body2"
													sx={{
														overflow: "hidden",
														textOverflow:
															"ellipsis",
														whiteSpace: "nowrap",
														fontWeight:
															currentConversationId ===
															conversation.id
																? "medium"
																: "normal",
													}}
												>
													{conversation.title}
												</Typography>
											)
										}
										secondary={
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{formatDate(
													conversation.updatedAt
												)}{" "}
												• {conversation.messages.length}{" "}
												messages
											</Typography>
										}
									/>{" "}
									{editingId !== conversation.id && (
										<Box sx={{ display: "flex", gap: 0.5 }}>
											<Tooltip title="Export">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleExportSingleConversation(
															conversation.id
														);
													}}
												>
													<FileDownloadIcon fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Rename">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleStartEdit(
															conversation.id,
															conversation.title
														);
													}}
												>
													<EditIcon fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Delete">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteClick(
															conversation.id
														);
													}}
													color="error"
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</Box>
									)}
								</ListItemButton>
							</ListItem>
						))
					)}
				</List>
				{/* Usage Analytics Button */}
				<Box sx={{ p: 2, pt: 0 }}>
					<Divider sx={{ mb: 2 }} />
					<Button
						variant="outlined"
						fullWidth
						startIcon={<AssessmentIcon />}
						onClick={onNavigateToUsage}
						size="small"
					>
						View Usage Analytics{" "}
					</Button>
				</Box>
			</SwipeableDrawer>
			{/* Export/Import Menu */}
			<Menu
				anchorEl={exportMenuAnchor}
				open={Boolean(exportMenuAnchor)}
				onClose={handleExportMenuClose}
				sx={{
					// Ensure menu content is not draggable in Electron
					...(isElectron() && {
						"& .MuiMenu-paper": {
							WebkitAppRegion: "no-drag",
						},
					}),
				}}
			>
				{
					// Global export/import menu
					[
						<MenuItem
							key="export-all"
							onClick={handleExportAllConversations}
						>
							<ExportIcon sx={{ mr: 1 }} fontSize="small" />
							Export All Conversations
						</MenuItem>,
						<MenuItem
							key="import"
							onClick={handleImportConversations}
						>
							<ImportIcon sx={{ mr: 1 }} fontSize="small" />
							Import Conversations
						</MenuItem>,
					]
				}
			</Menu>
			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={handleCancelDelete}
				sx={{
					// Ensure dialog content is not draggable in Electron
					...(isElectron() && {
						"& .MuiDialog-paper": {
							WebkitAppRegion: "no-drag",
						},
					}),
				}}
			>
				<DialogTitle>Delete Conversation</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this conversation? This
						action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelDelete}>Cancel</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
