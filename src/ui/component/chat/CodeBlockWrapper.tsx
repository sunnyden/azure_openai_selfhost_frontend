import {
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Toolbar,
	Typography,
	IconButton,
	Tooltip,
	Snackbar,
	Alert,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import "../../../utils/monacoConfig"; // Import monaco configuration
import "./CodeBlockWrapper.css";
const languages = [
	"plaintext",
	"javascript",
	"typescript",
	"python",
	"java",
	"csharp",
	"cpp",
	"c",
	"go",
	"kotlin",
	"swift",
	"ruby",
	"rust",
	"php",
	"html",
	"css",
	"scss",
	"sass",
	"less",
	"json",
	"yaml",
	"xml",
	"markdown",
	"sql",
	"shell",
	"powershell",
	"dockerfile",
];
export function CodeBlockWrapper(props: { code: string }) {
	const [language, setLanguage] = useState("plaintext");
	const [copySuccess, setCopySuccess] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(props.code);
			setCopySuccess(true);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	const handleCloseSnackbar = () => {
		setCopySuccess(false);
	};

	return (
		<Stack
			className="code-block-wrapper"
			style={{
				padding: "10px",
				borderRadius: "20px",
				border: "1px solid #e0e0e0",
			}}
		>
			<Toolbar>
				<Typography
					variant="h6"
					noWrap
					sx={{
						mr: 2,
						flexGrow: 1,
						display: { xs: "none", md: "flex" },
						fontWeight: 700,
						color: "inherit",
						textDecoration: "none",
					}}
				>
					Code
				</Typography>
				<Box minWidth={100} sx={{ mr: 1 }}>
					<FormControl fullWidth>
						<InputLabel id="code-type-label">Language</InputLabel>
						<Select
							labelId="code-type-label"
							value={language}
							label="Language"
							onChange={(e) => setLanguage(e.target.value)}
						>
							{languages.map((lang) => (
								<MenuItem key={lang} value={lang}>
									{lang}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Tooltip title="Copy code">
					<IconButton onClick={handleCopy} color="primary">
						<ContentCopy />
					</IconButton>
				</Tooltip>
			</Toolbar>
			<Box
				sx={{
					border: "1px solid #ddd",
					borderRadius: "8px",
					overflow: "hidden",
				}}
			>				<Editor
					height="400px"
					language={language}
					value={props.code}
					theme="vs-dark"
					options={{
						readOnly: true,
						minimap: { enabled: false },
						scrollBeyondLastLine: false,
						wordWrap: "on",
						lineNumbers: "on",
						folding: true,
						automaticLayout: true,
						contextmenu: true,
						selectOnLineNumbers: true,
						// Enable full Monaco features now that workers are properly configured
						quickSuggestions: false, // Still disable suggestions for read-only code viewer
						parameterHints: { enabled: false },
						suggestOnTriggerCharacters: false,
						acceptSuggestionOnEnter: "off",
						tabCompletion: "off",
						wordBasedSuggestions: "off",
					}}
				/>
			</Box>
			<Snackbar
				open={copySuccess}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity="success"
					sx={{ width: "100%" }}
				>
					Code copied to clipboard!
				</Alert>
			</Snackbar>
		</Stack>
	);
}
