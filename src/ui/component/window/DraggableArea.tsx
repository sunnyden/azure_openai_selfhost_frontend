import React, { ReactNode } from "react";
import { isElectron } from "../../../utils/electronUtils";

interface DraggableAreaProps {
    children: ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export function DraggableArea({
    children,
    style,
    className,
}: DraggableAreaProps) {
    const baseStyles: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        flexGrow: 1,
        minHeight: "inherit", // Inherit height from parent
        ...style, // Allow custom styles to override
    };

    const electronStyles: any = isElectron()
        ? {
              WebkitAppRegion: "drag",
              userSelect: "none", // Prevent text selection in drag area
          }
        : {};

    const combinedStyles = { ...baseStyles, ...electronStyles };

    const combinedClassName = [
        isElectron() ? "draggable-area electron-drag" : "draggable-area",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div style={combinedStyles} className={combinedClassName}>
            {children}
        </div>
    );
}
