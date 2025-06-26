import React from "react";
import { FluentProvider as FluentUIProvider } from "@fluentui/react-components";
import { ThemeProvider, useTheme } from "../../data/context/ThemeContext";

interface FluentProviderProps {
    children: React.ReactNode;
}

function FluentProviderInner({ children }: FluentProviderProps) {
    const { theme } = useTheme();
    return <FluentUIProvider theme={theme}>{children}</FluentUIProvider>;
}

export function FluentProvider({ children }: FluentProviderProps) {
    return (
        <ThemeProvider>
            <FluentProviderInner>{children}</FluentProviderInner>
        </ThemeProvider>
    );
}

