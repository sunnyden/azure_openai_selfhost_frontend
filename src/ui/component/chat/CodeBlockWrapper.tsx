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
import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import "./CodeBlockWrapper.css";

// Simple languages array
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
] as const;

export const CodeBlockWrapper = memo(
	(props: { code: string; detectedLanguage?: string }) => {
		const [language, setLanguage] = useState(
			props.detectedLanguage || "plaintext"
		);
		const [copySuccess, setCopySuccess] = useState(false);
		const [userOverridden, setUserOverridden] = useState(false);

		// Calculate auto height based on number of lines
		const calculateHeight = useMemo(() => {
			const lineHeight = 18; // Monaco editor default line height
			const padding = 20; // Top and bottom padding
			const minHeight = 100; // Minimum height
			const maxHeight = 600; // Maximum height to prevent overly tall blocks

			const lineCount = props.code.split("\n").length;
			const calculatedHeight = lineCount * lineHeight + padding;

			return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
		}, [props.code]); // Update language when detectedLanguage prop changes, but only if user hasn't overridden
		useEffect(() => {
			if (
				props.detectedLanguage &&
				props.detectedLanguage !== language &&
				!userOverridden
			) {
				setLanguage(props.detectedLanguage);
			}
		}, [props.detectedLanguage, language, userOverridden]);

		// Reset user override when code changes (new code block)
		useEffect(() => {
			setUserOverridden(false);
		}, [props.code]);

		// Memoize all style objects to prevent re-renders
		const stackStyle = useMemo(
			() => ({
				padding: "10px",
				borderRadius: "20px",
				border: "1px solid #e0e0e0",
			}),
			[]
		);

		const typographySx = useMemo(
			() => ({
				mr: 2,
				flexGrow: 1,
				display: { xs: "none", md: "flex" },
				fontWeight: 700,
				color: "inherit",
				textDecoration: "none",
			}),
			[]
		);

		const boxSx = useMemo(() => ({ mr: 1 }), []);

		const editorBoxSx = useMemo(
			() => ({
				border: "1px solid #ddd",
				borderRadius: "8px",
				overflow: "hidden",
			}),
			[]
		);

		const snackbarAnchorOrigin = useMemo(
			() => ({
				vertical: "bottom" as const,
				horizontal: "right" as const,
			}),
			[]
		);

		const alertSx = useMemo(() => ({ width: "100%" }), []);
		// Memoize language options to avoid recreating MenuItem components
		const languageOptions = useMemo(
			() =>
				languages.map((lang) => (
					<MenuItem key={lang} value={lang}>
						{lang}
					</MenuItem>
				)),
			[]
		);

		// Memoize editor options to avoid object recreation
		const editorOptions = useMemo(
			() => ({
				readOnly: true,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				wordWrap: "on" as const,
				lineNumbers: "on" as const,
				folding: false,
				automaticLayout: true,
				contextmenu: true,
				selectOnLineNumbers: true,
				scrollbar: {
					vertical: (calculateHeight >= 600 ? "auto" : "hidden") as
						| "auto"
						| "hidden",
					horizontal: "auto" as const,
				},
			}),
			[calculateHeight]
		);

		// Memoize all callbacks to prevent child re-renders
		const handleCopy = useCallback(async () => {
			try {
				await navigator.clipboard.writeText(props.code);
				setCopySuccess(true);
			} catch (err) {
				console.error("Failed to copy text: ", err);
			}
		}, [props.code]);

		const handleCloseSnackbar = useCallback(() => {
			setCopySuccess(false);
		}, []);
		const handleLanguageChange = useCallback((e: any) => {
			setLanguage(e.target.value);
			setUserOverridden(true);
		}, []);
		return (
			<Stack className="code-block-wrapper" style={stackStyle}>
				<Toolbar>
					<Typography variant="h6" noWrap sx={typographySx}>
						Code
					</Typography>
					<Box minWidth={100} sx={boxSx}>
						{" "}
						<FormControl fullWidth>
							<InputLabel id="code-type-label">
								Language
							</InputLabel>{" "}
							<Select
								labelId="code-type-label"
								value={language}
								label="Language"
								onChange={handleLanguageChange}
							>
								{languageOptions}
							</Select>
						</FormControl>
					</Box>
					<Tooltip title="Copy code">
						<IconButton onClick={handleCopy} color="primary">
							<ContentCopy />
						</IconButton>
					</Tooltip>
				</Toolbar>{" "}
				<Box sx={editorBoxSx}>
					{" "}
					<Editor
						height={`${calculateHeight}px`}
						language={language}
						value={props.code}
						options={editorOptions}
					/>
				</Box>{" "}
				<Snackbar
					open={copySuccess}
					autoHideDuration={3000}
					onClose={handleCloseSnackbar}
					anchorOrigin={snackbarAnchorOrigin}
				>
					<Alert
						onClose={handleCloseSnackbar}
						severity="success"
						sx={alertSx}
					>
						Code copied to clipboard!
					</Alert>
				</Snackbar>{" "}
			</Stack>
		);
	},
	(prevProps, nextProps) => {
		// Only re-render if the code or detectedLanguage props have actually changed
		return (
			prevProps.code === nextProps.code &&
			prevProps.detectedLanguage === nextProps.detectedLanguage
		);
	}
);
