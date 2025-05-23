import {
	Avatar,
	Divider,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Box,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { ChatRole } from "../../../api/interface/data/common/Chat";
import React, { useMemo, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { CopyBlock, dracula } from "react-code-blocks";
import { CodeBlockWrapper } from "./CodeBlockWrapper";
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
function getBlockCode(message: string, node: any) {
	const startPos: number = node?.position?.start?.offset;
	const endPos: number = node?.position?.end?.offset;
	if (!!startPos && !!endPos) {
		return message.substring(startPos + 3, endPos - 3);
	}
	return "";
}
function ChatItem({ role, message }: { role: ChatRole; message: string }) {
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
	}, [role]);
	return (
		<ListItem alignItems="flex-start">
			<ListItemAvatar>
				<Avatar alt={role}>{renderAvatar(role)}</Avatar>
			</ListItemAvatar>
			<ListItemText
				primary={userRoleText}
				secondary={
					<Markdown
						components={{
							code: ({ node, ...props }) => {
								if (isBlockCode(message, node)) {
									return (
										<CodeBlockWrapper
											code={props.children as string}
										/>
									);
								}
								return <code>{props.children}</code>;
							},
						}}
					>
						{message}
					</Markdown>
				}
			/>
		</ListItem>
	);
}
export function ChatHistory() {
	const { currentConversation } = useConversationContext();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [currentConversation]);

	return (
		<Box sx={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
			<List sx={{ width: "100%", bgcolor: "background.paper", flexGrow: 1 }}>
				{currentConversation.map((message, index, array) => (
					<React.Fragment key={index}>
						<ChatItem
							role={message.role}
							message={message.content[0].text || ""}
						/>
						{index !== array.length - 1 && (
							<Divider variant="inset" component="li" />
						)}
					</React.Fragment>
				))}
			</List>
			<div ref={messagesEndRef} />
		</Box>
	);
}
