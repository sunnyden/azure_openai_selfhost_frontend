import React, { useCallback } from "react";
import { Button, Tooltip, Badge, Text } from "@fluentui/react-components";
import {
    Settings24Regular,
    Desktop24Regular,
    Wrench24Regular,
} from "@fluentui/react-icons";
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
        return <div style={{ display: "flex", alignItems: "center" }}></div>;
    }

    const totalTools = Array.from(availableTools.values()).reduce(
        (total, tools) => total + tools.length,
        0
    );

    const handleClick = useCallback(() => {
        onOpenManagement();
    }, [onOpenManagement]);

    const tooltipText = isHubRunning
        ? `MCP Hub Running - ${servers.length} servers, ${totalTools} tools`
        : "MCP Hub Stopped - Click to manage";

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <Tooltip content={tooltipText} relationship="label">
                <Button
                    appearance="subtle"
                    onClick={handleClick}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        backgroundColor: isHubRunning
                            ? "var(--colorPaletteGreenBackground2)"
                            : "var(--colorNeutralBackground3)",
                        color: isHubRunning
                            ? "var(--colorPaletteGreenForeground2)"
                            : "var(--colorNeutralForeground2)",
                        border: `1px solid ${
                            isHubRunning
                                ? "var(--colorPaletteGreenBorder1)"
                                : "var(--colorNeutralStroke1)"
                        }`,
                    }}
                >
                    <Desktop24Regular style={{ fontSize: "16px" }} />
                    <Text size={200} weight="medium">
                        MCP
                    </Text>
                    {isHubRunning && totalTools > 0 && (
                        <Badge
                            size="small"
                            appearance="filled"
                            color="brand"
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                color: "var(--colorBrandForeground1)",
                                fontSize: "10px",
                                minWidth: "16px",
                                height: "16px",
                            }}
                        >
                            {totalTools}
                        </Badge>
                    )}
                </Button>
            </Tooltip>
        </div>
    );
}
