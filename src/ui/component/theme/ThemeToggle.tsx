import React from "react";
import {
    Button,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    Tooltip,
} from "@fluentui/react-components";
import {
    WeatherSunny24Regular,
    WeatherMoon24Regular,
    Settings24Regular,
} from "@fluentui/react-icons";
import { useTheme, ThemeMode } from "../../../data/context/ThemeContext";

export function ThemeToggle() {
    const { themeMode, resolvedTheme, setThemeMode } = useTheme();

    const getIcon = () => {
        switch (resolvedTheme) {
            case "dark":
                return <WeatherMoon24Regular />;
            case "light":
                return <WeatherSunny24Regular />;
            default:
                return <Settings24Regular />;
        }
    };

    const getTooltipText = () => {
        const modeText =
            themeMode === "system" ? `system (${resolvedTheme})` : themeMode;
        return `Current theme: ${modeText}`;
    };

    const handleThemeChange = (mode: ThemeMode) => {
        setThemeMode(mode);
    };

    return (
        <Menu>
            <MenuTrigger disableButtonEnhancement>
                <Tooltip content={getTooltipText()} relationship="label">
                    <Button
                        appearance="subtle"
                        icon={getIcon()}
                        aria-label="Toggle theme"
                        style={{
                            minWidth: "32px",
                            padding: "6px",
                        }}
                    />
                </Tooltip>
            </MenuTrigger>
            <MenuPopover>
                <MenuList>
                    <MenuItem
                        icon={<WeatherSunny24Regular />}
                        onClick={() => handleThemeChange("light")}
                    >
                        Light theme
                        {themeMode === "light" && " ✓"}
                    </MenuItem>
                    <MenuItem
                        icon={<WeatherMoon24Regular />}
                        onClick={() => handleThemeChange("dark")}
                    >
                        Dark theme
                        {themeMode === "dark" && " ✓"}
                    </MenuItem>
                    <MenuItem
                        icon={<Settings24Regular />}
                        onClick={() => handleThemeChange("system")}
                    >
                        System theme
                        {themeMode === "system" && " ✓"}
                    </MenuItem>
                </MenuList>
            </MenuPopover>
        </Menu>
    );
}

