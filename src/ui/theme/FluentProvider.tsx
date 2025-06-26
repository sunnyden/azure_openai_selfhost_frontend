import React from "react";
import {
    FluentProvider as FluentUIProvider,
    webLightTheme,
    webDarkTheme,
    Theme,
} from "@fluentui/react-components";

interface FluentProviderProps {
    children: React.ReactNode;
    theme?: Theme;
}

export function FluentProvider({
    children,
    theme = webLightTheme,
}: FluentProviderProps) {
    return <FluentUIProvider theme={theme}>{children}</FluentUIProvider>;
}

