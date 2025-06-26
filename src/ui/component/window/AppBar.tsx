import React, { ReactNode } from "react";
import { Button, makeStyles } from "@fluentui/react-components";
import { WindowControls } from "./WindowControls";
import { DraggableArea } from "./DraggableArea";
import { isElectron } from "../../../utils/electronUtils";

interface AppBarProps {
    title?: ReactNode;
    leftActions?: ReactNode;
    rightActions?: ReactNode;
    children?: ReactNode;
    backgroundColor?: string;
    color?: string;
    borderBottom?: string;
}
const useStyles = makeStyles({
    appBar: {
        display: "flex",
        alignItems: "center",
        height: "56px",
        padding: "0 0 0 16px",
        borderBottom: "1px solid var(--colorNeutralStroke1)",
        background: "var(--colorNeutralBackground3)",
        gap: "12px",
        // Base draggable area styles
        WebkitAppRegion: "drag",
        userSelect: "none",
    },
    leftSection: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        WebkitAppRegion: "no-drag",
    },
    centerSection: {
        display: "flex",
        alignItems: "center",
        flex: 1,
        minWidth: 0, // Allow text truncation
    },
    rightSection: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        WebkitAppRegion: "no-drag",
        marginRight: isElectron() ? "0" : "16px", // Adjust margin for Electron
    },
    title: {
        fontSize: "18px",
        fontWeight: "600",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
});

export function AppBar({
    title,
    leftActions,
    rightActions,
    children,
    backgroundColor,
    color,
    borderBottom,
}: AppBarProps) {
    const styles = useStyles();

    const customStyle: React.CSSProperties = {
        ...(backgroundColor && { backgroundColor }),
        ...(color && { color }),
        ...(borderBottom && { borderBottom }),
    };

    return (
        <div className={`${styles.appBar} app-bar`} style={customStyle}>
            {/* Left Actions */}
            {leftActions && (
                <div className={`${styles.leftSection} left-actions`}>
                    {leftActions}
                </div>
            )}

            {/* Center - Draggable Area with Title or Custom Content */}
            <DraggableArea className={styles.centerSection}>
                {children ||
                    (title && <div className={styles.title}>{title}</div>)}
            </DraggableArea>

            {/* Right Actions */}
            {rightActions && (
                <div className={`${styles.rightSection} right-actions`}>
                    {rightActions}
                </div>
            )}

            {/* Window Controls (only in Electron) */}
            <WindowControls />
        </div>
    );
}

