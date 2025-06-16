import {
	AccessTimeOutlined,
	AutoAwesome,
	AutoAwesomeOutlined,
	AutoFixHighOutlined,
	CheckOutlined,
	Google,
	PublicOutlined,
	SearchOutlined,
} from "@mui/icons-material";
import { Chip, CircularProgress, Link, Stack, Tooltip } from "@mui/material";
import exp from "constants";
import { WeiboIcon } from "./WeiboIcon";

interface ToolProps {
	name?: string;
	parameter: string;
	working: boolean;
}
type ImageGenerationParameter = {
	prompt: string;
};

type SearchParameter = {
	keywords: string;
};

type BrowseWebPageParameter = {
	url: string;
};

export function ImageGenerateTool(props: ToolProps) {
	const { parameter } = props;
	const param = JSON.parse(parameter) as ImageGenerationParameter;
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Tooltip title={param.prompt} placement="top">
				<Chip
					size="small"
					color="secondary"
					label={`Generate image: ${param.prompt.substring(
						0,
						100
					)}...`}
					icon={<AutoFixHighOutlined />}
					deleteIcon={
						props.working ? (
							<CircularProgress size={15} />
						) : (
							<CheckOutlined />
						)
					}
					onDelete={() => {}}
				/>
			</Tooltip>
		</Stack>
	);
}

export function TimeTool(props: ToolProps) {
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Chip
				size="small"
				color="info"
				label="Check current time"
				icon={<AccessTimeOutlined />}
				deleteIcon={
					props.working ? (
						<CircularProgress size={15} />
					) : (
						<CheckOutlined />
					)
				}
				onDelete={() => {}}
			/>
		</Stack>
	);
}

export function WeiboTool(props: ToolProps) {
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Chip
				size="small"
				label="Check hot topics on Weibo"
				icon={<WeiboIcon />}
				deleteIcon={
					props.working ? (
						<CircularProgress size={15} />
					) : (
						<CheckOutlined />
					)
				}
				onDelete={() => {}}
			/>
		</Stack>
	);
}

export function DefaultTool(props: ToolProps){
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Tooltip title={`Parameter: ${tryParseParameter(props.parameter)}`} placement="top">
				<Chip
					size="small"
					label={`Calling tool: ${props.name}`}
					icon={<AutoAwesome />}
					deleteIcon={
						props.working ? (
							<CircularProgress size={15} />
						) : (
							<CheckOutlined />
						)
					}
				/>
			</Tooltip>
		</Stack>
	);
}

function tryParseParameter(parameterJson: string): string{
	let parameter = "";
	try {
		const param = JSON.parse(parameterJson);
		let isFirst = true;
		// for each key
		for (const key in param) {
			if (param.hasOwnProperty(key)) {
				const value = param[key];
				if (!isFirst) {
					parameter += ", ";
				}
				if (typeof value === "string") {
					parameter += `${key}= ${value}`;
				} else if (typeof value === "object") {
					parameter += `${key}= ${JSON.stringify(value)}`;
				} else {
					parameter += `${key}= ${value}`;
				}
				isFirst = false;
			}
		}
	}catch (e) {
		console.error("Error parsing parameter JSON:", e);
		parameter = parameterJson; // fallback to raw string
	}
	return parameter;
}

export function SearchTool(props: ToolProps) {
	const { parameter } = props;
	const param = JSON.parse(parameter) as SearchParameter;
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Chip
				size="small"
				color="primary"
				label={`Search: ${param.keywords}`}
				icon={<Google />}
				deleteIcon={
					props.working ? (
						<CircularProgress size={15} />
					) : (
						<CheckOutlined />
					)
				}
				onDelete={() => {}}
			/>
		</Stack>
	);
}

export function BrowseWebPageTool(props: ToolProps) {
	const { parameter } = props;
	const param = JSON.parse(parameter) as BrowseWebPageParameter;
	return (
		<Stack direction={"row"} spacing={1} alignItems="center">
			<Chip
				size="small"
				color="success"
				label={
					<>
						Visit:
						<Link
							href={param.url}
							color={"inherit"}
							target="_blank"
						>
							{param.url.substring(0, 60)}...
						</Link>
					</>
				}
				icon={<PublicOutlined />}
				deleteIcon={
					props.working ? (
						<CircularProgress size={15} />
					) : (
						<CheckOutlined />
					)
				}
				onDelete={() => {}}
			/>
		</Stack>
	);
}
