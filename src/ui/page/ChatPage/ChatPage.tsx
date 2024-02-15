import {
	Box,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	Stack,
} from "@mui/material";
import { ChatHistory } from "../../component/chat/ChatHistory";
import { ChatInput } from "../../component/chat/ChatInput";
import { useModelContext } from "../../../data/context/ModelContext";
import { useCallback } from "react";

export function ChatPage() {
	const { currentModel, modelList, setCurrentModel } = useModelContext();
	const onModelChange = useCallback(
		(e: SelectChangeEvent) => {
			const newModel = modelList.find(
				(model) => model.identifier === e.target.value
			);
			return newModel ? setCurrentModel(newModel) : undefined;
		},
		[modelList, setCurrentModel]
	);
	return modelList.length > 0 ? (
		<Stack marginTop={2}>
			<Box>
				<FormControl style={{ minWidth: 200 }}>
					<InputLabel id="chat-model-label">Model</InputLabel>
					<Select
						labelId="chat-model-label"
						value={currentModel?.identifier}
						defaultValue={currentModel?.identifier}
						label="Model"
						onChange={onModelChange}
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
			</Box>
			<ChatHistory />
			<ChatInput />
		</Stack>
	) : (
		<Stack alignItems={"center"} padding={2} spacing={2}>
			<CircularProgress />
		</Stack>
	);
}
