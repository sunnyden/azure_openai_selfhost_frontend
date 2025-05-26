import React, { ReactNode } from "react";
import { Box } from "@mui/material";
import { isElectron } from "../../../utils/electronUtils";

interface DraggableAreaProps {
	children: ReactNode;
}

export function DraggableArea({ children }: DraggableAreaProps) {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				flexGrow: 1,
				// Make the area draggable in Electron
				...(isElectron() && {
					WebkitAppRegion: "drag",
					// Make all interactive elements non-draggable
					"& .MuiIconButton-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiFormControl-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiSelect-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiMenuItem-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiMenu-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiButton-root": {
						WebkitAppRegion: "no-drag",
					},
					"& .MuiTextField-root": {
						WebkitAppRegion: "no-drag",
					},
					"& input": {
						WebkitAppRegion: "no-drag",
					},
					"& button": {
						WebkitAppRegion: "no-drag",
					},
					"& select": {
						WebkitAppRegion: "no-drag",
					},
				}),
			}}
		>
			{children}
		</Box>
	);
}
