import React, { useCallback } from "react";
import {
    Box,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Stack,
} from "@mui/material";
import {
    Settings as SettingsIcon,
    Computer as ServerIcon,
    Build as ToolIcon,
} from "@mui/icons-material";
import { useMCPContext } from "../../../data/context/MCPContext";
import { isElectron } from "../../../utils/electronUtils";

interface MCPStatusIndicatorProps {
    onOpenManagement: () => void;
}

export function MCPStatusIndicator({
    onOpenManagement,
}: MCPStatusIndicatorProps) {
    const { isHubRunning, servers, availableTools } = useMCPContext();

    // Only show MCP features in desktop environment
    if (!isElectron()) {
        return null;
    }

    const totalTools = Array.from(availableTools.values()).reduce(
        (total, tools) => total + tools.length,
        0
    );

    const handleClick = useCallback(() => {
        onOpenManagement();
    }, [onOpenManagement]);

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip
                title={
                    isHubRunning
                        ? `MCP Hub Running - ${servers.length} servers, ${totalTools} tools`
                        : "MCP Hub Stopped - Click to manage"
                }
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: isHubRunning
                            ? "success.main"
                            : "grey.300",
                        color: isHubRunning
                            ? "success.contrastText"
                            : "grey.700",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            backgroundColor: isHubRunning
                                ? "success.dark"
                                : "grey.400",
                        },
                    }}
                    onClick={handleClick}
                >
                    <ServerIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        MCP
                    </Typography>
                    {isHubRunning && totalTools > 0 && (
                        <Chip
                            size="small"
                            label={totalTools}
                            sx={{
                                height: 16,
                                fontSize: "0.7rem",
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                color: "inherit",
                                "& .MuiChip-label": {
                                    px: 0.5,
                                },
                            }}
                        />
                    )}
                </Box>
            </Tooltip>
        </Stack>
    );
}
