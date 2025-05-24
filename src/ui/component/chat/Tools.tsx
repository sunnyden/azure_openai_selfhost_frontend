import {
	AccessTimeOutlined,
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
