import React, { useState, useEffect } from "react";
import { Button } from "@fluentui/react-components";
import {
    Subtract24Regular,
    Square24Regular,
    SquareMultiple24Regular,
    Dismiss24Regular,
} from "@fluentui/react-icons";
import {
    electronWindowControls,
    isElectron,
} from "../../../utils/electronUtils";

export function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<
        "minimize" | "maximize" | "close" | null
    >(null);
    const [pressedButton, setPressedButton] = useState<
        "minimize" | "maximize" | "close" | null
    >(null);

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

    const getButtonStyle = (buttonType: "minimize" | "maximize" | "close") => {
        const baseStyle = {
            minWidth: "46px",
            height: "32px",
            padding: "0",
            color: "inherit",
            borderRadius: "0",
            border: "none",
            transition: "background-color 0.1s ease",
            fontSize: "16px",
        };

        let backgroundColor = "transparent";

        if (pressedButton === buttonType) {
            if (buttonType === "close") {
                backgroundColor = "#c42b1c"; // Darker red when pressed
            } else {
                backgroundColor = "rgba(255, 255, 255, 0.2)"; // Light overlay when pressed
            }
        } else if (hoveredButton === buttonType) {
            if (buttonType === "close") {
                backgroundColor = "#e81123"; // Red on hover for close
            } else {
                backgroundColor = "rgba(255, 255, 255, 0.1)"; // Light overlay on hover
            }
        }

        return {
            ...baseStyle,
            backgroundColor,
        };
    };

    return (
        <div
            className="window-controls"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0px", // No gap between buttons like Windows
                userSelect: "none",
            }}
        >
            <Button
                className="window-control-button minimize"
                appearance="transparent"
                size="small"
                onClick={handleMinimize}
                onMouseEnter={() => setHoveredButton("minimize")}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setPressedButton("minimize")}
                onMouseUp={() => setPressedButton(null)}
                style={getButtonStyle("minimize")}
                aria-label="minimize window"
                icon={<Subtract24Regular />}
            />

            <Button
                className="window-control-button maximize"
                appearance="transparent"
                size="small"
                onClick={handleMaximize}
                onMouseEnter={() => setHoveredButton("maximize")}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setPressedButton("maximize")}
                onMouseUp={() => setPressedButton(null)}
                style={getButtonStyle("maximize")}
                aria-label={isMaximized ? "restore window" : "maximize window"}
                icon={
                    isMaximized ? (
                        <SquareMultiple24Regular />
                    ) : (
                        <Square24Regular />
                    )
                }
            />

            <Button
                className="window-control-button close"
                appearance="transparent"
                size="small"
                onClick={handleClose}
                onMouseEnter={() => setHoveredButton("close")}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setPressedButton("close")}
                onMouseUp={() => setPressedButton(null)}
                style={getButtonStyle("close")}
                aria-label="close window"
                icon={<Dismiss24Regular />}
            />
        </div>
    );
}
