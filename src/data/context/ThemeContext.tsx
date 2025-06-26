import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, webLightTheme, webDarkTheme } from "@fluentui/react-components";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
    themeMode: ThemeMode;
    resolvedTheme: "light" | "dark";
    theme: Theme;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [themeMode, setThemeMode] = useState<ThemeMode>("system");
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
            setSystemTheme(e.matches ? "dark" : "light");
        };

        // Set initial value
        updateSystemTheme(mediaQuery);

        // Listen for changes
        mediaQuery.addEventListener("change", updateSystemTheme);

        return () => {
            mediaQuery.removeEventListener("change", updateSystemTheme);
        };
    }, []);

    // Load saved theme preference from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme-mode") as ThemeMode;
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
            setThemeMode(savedTheme);
        }
    }, []);

    // Save theme preference to localStorage
    useEffect(() => {
        localStorage.setItem("theme-mode", themeMode);
    }, [themeMode]);

    // Calculate resolved theme
    const resolvedTheme: "light" | "dark" =
        themeMode === "system" ? systemTheme : themeMode;

    // Get FluentUI theme
    const theme = resolvedTheme === "dark" ? webDarkTheme : webLightTheme;

    const value: ThemeContextType = {
        themeMode,
        resolvedTheme,
        theme,
        setThemeMode,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

