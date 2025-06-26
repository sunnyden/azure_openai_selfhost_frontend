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
            className={isElectron() ? "draggable-area" : ""}
        >
            <style>{`
                .draggable-area button,
                .draggable-area input,
                .draggable-area select,
                .draggable-area [role="button"],
                .draggable-area [role="menuitem"],
                .draggable-area [role="combobox"],
                .draggable-area [role="textbox"] {
                    -webkit-app-region: no-drag;
                }
            `}</style>
            {children}
        </div>
    );
}
