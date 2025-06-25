import React, { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import {
    Minimize as MinimizeIcon,
    CropSquare as MaximizeIcon,
    FilterNone as RestoreIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import {
    electronWindowControls,
    isElectron,
} from "../../../utils/electronUtils";

export function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);

    // Check if window is maximized on mount
    useEffect(() => {
        const checkMaximized = async () => {
            if (isElectron()) {
                const maximized = await electronWindowControls.isMaximized();
                setIsMaximized(maximized);
            }
        };
        checkMaximized();
    }, []);

    const handleMinimize = () => {
        electronWindowControls.minimize();
    };

    const handleMaximize = async () => {
        await electronWindowControls.maximize();
        // Toggle the maximized state
        setIsMaximized(!isMaximized);
    };

    const handleClose = () => {
        electronWindowControls.close();
    };

    // Only render if running in Electron
    if (!isElectron()) {
        return null;
    }

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
            }}
        >
            <IconButton
                size="small"
                onClick={handleMinimize}
                sx={{
                    color: "inherit",
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
                aria-label="minimize window"
            >
                <MinimizeIcon fontSize="small" />
            </IconButton>

            <IconButton
                size="small"
                onClick={handleMaximize}
                sx={{
                    color: "inherit",
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
                aria-label={isMaximized ? "restore window" : "maximize window"}
            >
                {isMaximized ? (
                    <RestoreIcon fontSize="small" />
                ) : (
                    <MaximizeIcon fontSize="small" />
                )}
            </IconButton>

            <IconButton
                size="small"
                onClick={handleClose}
                sx={{
                    color: "inherit",
                    "&:hover": {
                        backgroundColor: "rgba(255, 0, 0, 0.3)",
                    },
                }}
                aria-label="close window"
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
