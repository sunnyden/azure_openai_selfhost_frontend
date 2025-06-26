import React, { ReactNode } from "react";
import { isElectron } from "../../../utils/electronUtils";

interface DraggableAreaProps {
    children: ReactNode;
}

export function DraggableArea({ children }: DraggableAreaProps) {
    const baseStyles: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        flexGrow: 1,
    };

    const electronStyles: any = isElectron()
        ? {
              WebkitAppRegion: "drag",
          }
        : {};

    const combinedStyles = { ...baseStyles, ...electronStyles };

    return (
        <div
            style={combinedStyles}
            className={isElectron() ? "draggable-area electron-drag" : ""}
        >
            {children}
        </div>
    );
}
