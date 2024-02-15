import {
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Toolbar,
	Typography,
} from "@mui/material";
import { useState } from "react";
import "./CodeBlockWrapper.css";
import { CopyBlock, dracula } from "react-code-blocks";
const languages = [
	"text",
	"javascript",
	"python",
	"java",
	"c",
	"c++",
	"c#",
	"go",
	"kotlin",
	"swift",
	"typescript",
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
	"plaintext",
];
export function CodeBlockWrapper(props: { code: string }) {
	const [language, setLanguage] = useState("text");
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
				<Box minWidth={100}>
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
			</Toolbar>
			<CopyBlock
				language={language}
				text={props.code}
				showLineNumbers={true}
				theme={dracula}
				wrapLongLines={true}
				codeBlock
			/>
		</Stack>
	);
}
