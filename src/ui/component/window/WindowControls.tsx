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

    const buttonStyle = {
        minWidth: "32px",
        height: "32px",
        padding: "0",
        color: "inherit",
    };

    const closeButtonStyle = {
        ...buttonStyle,
        ":hover": {
            backgroundColor: "rgba(255, 0, 0, 0.3)",
        },
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
            }}
        >
            <Button
                appearance="transparent"
                size="small"
                onClick={handleMinimize}
                style={buttonStyle}
                aria-label="minimize window"
                icon={<Subtract24Regular />}
            />

            <Button
                appearance="transparent"
                size="small"
                onClick={handleMaximize}
                style={buttonStyle}
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
                appearance="transparent"
                size="small"
                onClick={handleClose}
                style={closeButtonStyle}
                aria-label="close window"
                icon={<Dismiss24Regular />}
            />
        </div>
    );
}
