import React, { useState } from 'react';
import {
	Drawer,
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
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Close as CloseIcon,
	Chat as ChatIcon,
} from '@mui/icons-material';
import { useConversationHistory } from '../../data/context/ConversationHistoryContext';

interface ConversationSidePanelProps {
	open: boolean;
	onClose: () => void;
}

export function ConversationSidePanel({ open, onClose }: ConversationSidePanelProps) {
	const {
		conversations,
		currentConversationId,
		createNewConversation,
		deleteConversation,
		updateConversationTitle,
		selectConversation,
	} = useConversationHistory();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

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
		setEditTitle('');
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditTitle('');
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

	const formatDate = (date: Date) => {
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	};

	return (
		<>
			<Drawer
				anchor="left"
				open={open}
				onClose={onClose}
				variant="temporary"
				sx={{
					'& .MuiDrawer-paper': {
						width: 320,
						boxSizing: 'border-box',
					},
				}}
			>
				<Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<ChatIcon />
						Chat History
					</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
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

				<Divider />

				<List sx={{ flex: 1, overflow: 'auto' }}>
					{conversations.length === 0 ? (
						<Box sx={{ p: 3, textAlign: 'center' }}>
							<Typography variant="body2" color="text.secondary">
								No conversations yet. Start a new conversation to begin chatting!
							</Typography>
						</Box>
					) : (
						conversations.map((conversation) => (
							<ListItem
								key={conversation.id}
								disablePadding
								sx={{
									backgroundColor:
										currentConversationId === conversation.id
											? 'action.selected'
											: 'transparent',
								}}
							>
								<ListItemButton
									onClick={() => handleSelectConversation(conversation.id)}
									sx={{ pr: 1 }}
								>
									<ListItemText
										primary={
											editingId === conversation.id ? (
												<TextField
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															handleSaveEdit();
														} else if (e.key === 'Escape') {
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
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														fontWeight:
															currentConversationId === conversation.id
																? 'medium'
																: 'normal',
													}}
												>
													{conversation.title}
												</Typography>
											)
										}
										secondary={
											<Typography variant="caption" color="text.secondary">
												{formatDate(conversation.updatedAt)} • {conversation.messages.length} messages
											</Typography>
										}
									/>
									{editingId !== conversation.id && (
										<Box sx={{ display: 'flex', gap: 0.5 }}>
											<Tooltip title="Rename">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleStartEdit(conversation.id, conversation.title);
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
														handleDeleteClick(conversation.id);
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
			</Drawer>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
				<DialogTitle>Delete Conversation</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this conversation? This action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelDelete}>Cancel</Button>
					<Button onClick={handleConfirmDelete} color="error" variant="contained">
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
