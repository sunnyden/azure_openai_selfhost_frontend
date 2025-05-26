import {
	Avatar,
	Divider,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Box,
	IconButton,
	Tooltip,
	Snackbar,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { ChatRole, ToolInfo } from "../../../api/interface/data/common/Chat";
import React, {
	useMemo,
	useRef,
	useEffect,
	useState,
	useCallback,
	memo,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlockWrapper } from "./CodeBlockWrapper";
import {
	BrowseWebPageTool,
	ImageGenerateTool,
	SearchTool,
	TimeTool,
	WeiboTool,
} from "./Tools";
import remarkMath from "./remarkMath";
import { isElectron } from "../../../utils/electronUtils";
function renderAvatar(role: ChatRole) {
	switch (role) {
		case ChatRole.Assistant:
			return <SmartToyIcon />;
		case ChatRole.User:
			return <PersonIcon />;
		case ChatRole.System:
			return <CampaignIcon />;
		default:
			throw new Error("Invalid role");
	}
}
function isBlockCode(message: string, node: any) {
	const startPos: number = node?.position?.start?.offset;
	if (!!startPos) {
		return message.substring(startPos, startPos + 3) === "```";
	}
	return false;
}

function detectLanguageFromMessage(message: string, node: any) {
	const startPos: number = node?.position?.start?.offset;
	if (!startPos) return "plaintext";

	// Find the first line of the code block (```language)
	const codeBlockStart = message.substring(startPos);
	const firstLineEnd = codeBlockStart.indexOf("\n");
	if (firstLineEnd === -1) return "plaintext";

	const firstLine = codeBlockStart.substring(0, firstLineEnd);
	const languageMatch = firstLine.match(/^```(\w+)/);

	if (languageMatch && languageMatch[1]) {
		const language = languageMatch[1].toLowerCase();
		// Map common language aliases to supported languages
		const languageMap: { [key: string]: string } = {
			js: "javascript",
			jsx: "javascript",
			ts: "typescript",
			tsx: "typescript",
			py: "python",
			rb: "ruby",
			cs: "csharp",
			cpp: "cpp",
			"c++": "cpp",
			sh: "shell",
			bash: "shell",
			ps1: "powershell",
			yml: "yaml",
			md: "markdown",
		};

		return languageMap[language] || language;
	}

	return "plaintext";
}
function getBlockCode(message: string, node: any) {
	const startPos: number = node?.position?.start?.offset;
	const endPos: number = node?.position?.end?.offset;
	if (!!startPos && !!endPos) {
		return message.substring(startPos + 3, endPos - 3);
	}
	return "";
}
const ChatItem = memo(function ChatItem({
	role,
	message,
	messageIndex,
}: {
	role: ChatRole;
	message: string;
	messageIndex: number;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const [showCopySuccess, setShowCopySuccess] = useState(false);
	const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
		null
	);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editedMessage, setEditedMessage] = useState(message);
	const { deleteMessage, updateMessage } = useConversationContext();

	const userRoleText = useMemo(() => {
		switch (role) {
			case ChatRole.Assistant:
				return "Assistant";
			case ChatRole.User:
				return "User";
			case ChatRole.System:
				return "System";
			default:
				return "Unknown";
		}
	}, [role]); // Memoize the Markdown components to prevent unnecessary re-renders
	const markdownComponents = useMemo(
		() => ({
			code: ({ node, ...props }: any) => {
				if (isBlockCode(message, node)) {
					const detectedLanguage = detectLanguageFromMessage(
						message,
						node
					);
					return (
						<CodeBlockWrapper
							code={props.children as string}
							detectedLanguage={detectedLanguage}
						/>
					);
				}
				return <code>{props.children}</code>;
			},
		}),
		[message]
	);
	// Memoize plugins to prevent recreation
	const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
	const rehypePlugins = useMemo(() => [rehypeKatex], []);

	// Memoize style objects
	const listItemSx = useMemo(
		() => ({
			position: "relative",
			"&:hover": {
				backgroundColor: "action.hover",
			},
		}),
		[]
	);

	const actionBoxSx = useMemo(
		() => ({
			position: "absolute",
			top: 8,
			right: 8,
			backgroundColor: "background.paper",
			borderRadius: 1,
			boxShadow: 1,
			display: "flex",
			gap: 0.5,
		}),
		[]
	);

	const iconButtonSx = useMemo(() => ({ padding: 0.5 }), []);

	// Memoize Snackbar props
	const snackbarAnchorOrigin = useMemo(
		() => ({ vertical: "bottom" as const, horizontal: "center" as const }),
		[]
	);

	const snackbarSx = useMemo(
		() => ({
			// Ensure snackbar content is not draggable in Electron
			...(isElectron() && {
				"& .MuiSnackbar-root": {
					WebkitAppRegion: "no-drag",
				},
			}),
		}),
		[]
	);

	const alertSx = useMemo(() => ({ width: "100%" }), []);
	// Memoize event handlers
	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	// Memoize Dialog styles
	const dialogSx = useMemo(
		() => ({
			// Ensure dialog content is not draggable in Electron
			...(isElectron() && {
				"& .MuiDialog-paper": {
					WebkitAppRegion: "no-drag",
				},
			}),
		}),
		[]
	);

	const editorBoxSx = useMemo(
		() => ({
			height: 400,
			border: "1px solid #e0e0e0",
			borderRadius: 1,
			mt: 1,
		}),
		[]
	);

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(message);
			setShowCopySuccess(true);
		} catch (err) {
			console.error("Failed to copy text: ", err);
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = message;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			textArea.style.top = "-999999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand("copy");
				setShowCopySuccess(true);
			} catch (err) {
				console.error("Fallback copy failed: ", err);
			}
			document.body.removeChild(textArea);
		}
	};

	const handleTouchStart = () => {
		const timer = setTimeout(() => {
			handleCopyToClipboard();
		}, 500); // 500ms for long press
		setLongPressTimer(timer);
	};

	const handleTouchEnd = () => {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			setLongPressTimer(null);
		}
	};

	const handleCloseCopySuccess = () => {
		setShowCopySuccess(false);
	};

	const handleDeleteMessage = () => {
		deleteMessage(messageIndex);
	};

	const handleEditMessage = () => {
		setEditedMessage(message);
		setEditDialogOpen(true);
	};

	const handleSaveEdit = () => {
		updateMessage(messageIndex, editedMessage);
		setEditDialogOpen(false);
	};

	const handleCancelEdit = () => {
		setEditedMessage(message);
		setEditDialogOpen(false);
	};

	return (
		<>
			{" "}
			<ListItem
				alignItems="flex-start"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onTouchCancel={handleTouchEnd}
				sx={listItemSx}
			>
				<ListItemAvatar>
					<Avatar alt={role}>{renderAvatar(role)}</Avatar>
				</ListItemAvatar>
				<ListItemText
					primary={userRoleText}
					secondary={
						<Markdown
							remarkPlugins={remarkPlugins}
							rehypePlugins={rehypePlugins}
							components={markdownComponents}
						>
							{message}
						</Markdown>
					}
				/>{" "}
				{isHovered && (
					<Box sx={actionBoxSx}>
						<Tooltip title="Copy message">
							<IconButton
								size="small"
								onClick={handleCopyToClipboard}
								sx={iconButtonSx}
							>
								<ContentCopyIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Tooltip title="Edit message">
							<IconButton
								size="small"
								onClick={handleEditMessage}
								sx={iconButtonSx}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</Tooltip>{" "}
						<Tooltip title="Delete message">
							<IconButton
								size="small"
								onClick={handleDeleteMessage}
								sx={iconButtonSx}
								color="error"
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</ListItem>{" "}
			<Snackbar
				open={showCopySuccess}
				autoHideDuration={2000}
				onClose={handleCloseCopySuccess}
				anchorOrigin={snackbarAnchorOrigin}
				sx={snackbarSx}
			>
				<Alert
					onClose={handleCloseCopySuccess}
					severity="success"
					sx={alertSx}
				>
					Message copied to clipboard!
				</Alert>
			</Snackbar>
			{/* Edit Dialog */}{" "}
			<Dialog
				open={editDialogOpen}
				onClose={handleCancelEdit}
				maxWidth="lg"
				fullWidth
				sx={dialogSx}
			>
				<DialogTitle>Edit Message</DialogTitle>
				<DialogContent>
					<Box sx={editorBoxSx}>
						<Editor
							height="400px"
							defaultLanguage="markdown"
							value={editedMessage}
							onChange={(value) => setEditedMessage(value || "")}
							options={{
								minimap: { enabled: false },
								wordWrap: "on",
								lineNumbers: "on",
								scrollBeyondLastLine: false,
								automaticLayout: true,
								fontSize: 14,
								lineHeight: 20,
								padding: { top: 10, bottom: 10 },
							}}
							theme="vs-light"
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelEdit}>Cancel</Button>
					<Button onClick={handleSaveEdit} variant="contained">
						Save
					</Button>
				</DialogActions>
			</Dialog>{" "}
		</>
	);
});

const ToolItem = memo(function ToolItem({
	tool,
	working,
}: {
	tool: ToolInfo;
	working: boolean;
}) {
	switch (tool.name) {
		case "Search":
			return <SearchTool parameter={tool.parameters} working={working} />;
		case "BrowseWebPage":
			return (
				<BrowseWebPageTool
					parameter={tool.parameters}
					working={working}
				/>
			);
		case "GenerateImageWithPrompt":
			return (
				<ImageGenerateTool
					parameter={tool.parameters}
					working={working}
				/>
			);
		case "GetCurrentTime":
			return <TimeTool parameter={tool.parameters} working={working} />;
		case "FetchAndParseHotKeywords":
			return <WeiboTool parameter={tool.parameters} working={working} />;
		default:
			return <></>;
	}
});

const ToolListItem = memo(function ToolListItem({
	tool,
	working,
}: {
	tool: ToolInfo;
	working: boolean;
}) {
	return (
		<ListItem alignItems="flex-start">
			<ToolItem tool={tool} working={working} />
		</ListItem>
	);
});

export function ChatHistory() {
	const { currentConversation, toolUsed, usingTool } =
		useConversationContext();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [currentConversation, toolUsed]);

	return (
		<Box
			sx={{
				height: "100%",
				overflow: "auto",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<List
				sx={{ width: "100%", bgcolor: "background.paper", flexGrow: 1 }}
			>
				{currentConversation.map((message, index, array) => (
					<React.Fragment key={index}>
						<ChatItem
							role={message.role}
							message={message.content[0].text || ""}
							messageIndex={index}
						/>
						{index !== array.length - 1 && (
							<Divider variant="inset" component="li" />
						)}
					</React.Fragment>
				))}
				{toolUsed.map((tool, index, array) => (
					<React.Fragment key={index}>
						<ToolListItem
							tool={tool}
							working={usingTool && array.length === index + 1}
						/>
					</React.Fragment>
				))}
			</List>
			<div ref={messagesEndRef} />
		</Box>
	);
}
