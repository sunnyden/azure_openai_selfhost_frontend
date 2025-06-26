import { Button, Dropdown, Option, Tooltip } from "@fluentui/react-components";
import { Copy24Regular } from "@fluentui/react-icons";
import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "../../../data/context/ThemeContext";
import "./CodeBlockWrapper.css";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
loader.config({ monaco });

// Simple languages array
const languages = [
    "plaintext",
    "javascript",
    "typescript",
    "python",
    "java",
    "csharp",
    "cpp",
    "c",
    "go",
    "kotlin",
    "swift",
    "ruby",
    "rust",
    "php",
    "html",
    "css",
    "scss",
    "sass",
    "less",
    "json",
    "yaml",
    "xml",
    "markdown",
    "sql",
    "shell",
    "powershell",
    "dockerfile",
] as const;

export const CodeBlockWrapper = memo(
    (props: { code: string; detectedLanguage?: string }) => {
        const [language, setLanguage] = useState(
            props.detectedLanguage || "plaintext"
        );
        const [copySuccess, setCopySuccess] = useState(false);
        const [userOverridden, setUserOverridden] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const { resolvedTheme } = useTheme();

        // Calculate auto height based on number of lines
        const calculateHeight = useMemo(() => {
            const lineHeight = 18; // Monaco editor default line height
            const padding = 20; // Top and bottom padding
            const minHeight = 100; // Minimum height
            const maxHeight = 600; // Maximum height to prevent overly tall blocks

            const lineCount = props.code.split("\n").length;
            const calculatedHeight = lineCount * lineHeight + padding;

            return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
        }, [props.code]); // Update language when detectedLanguage prop changes, but only if user hasn't overridden
        useEffect(() => {
            if (
                props.detectedLanguage &&
                props.detectedLanguage !== language &&
                !userOverridden
            ) {
                setLanguage(props.detectedLanguage);
            }
        }, [props.detectedLanguage, language, userOverridden]);

        // Reset user override when code changes (new code block)
        useEffect(() => {
            setUserOverridden(false);
        }, [props.code]);

        // Memoize all style objects to prevent re-renders
        const stackStyle = useMemo(
            () => ({
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #e0e0e0",
            }),
            []
        );

        const typographySx = useMemo(
            () => ({
                mr: 2,
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
            }),
            []
        );

        const boxSx = useMemo(() => ({ mr: 1 }), []);

        const editorBoxSx = useMemo(
            () => ({
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
            }),
            []
        );

        const snackbarAnchorOrigin = useMemo(
            () => ({
                vertical: "bottom" as const,
                horizontal: "right" as const,
            }),
            []
        );

        // Memoize language options for dropdown
        const languageOptions = useMemo(() => {
            // Create a list that includes the current language if it's not in the predefined list
            const allLanguages: string[] = [...languages];
            if (!languages.includes(language as any)) {
                allLanguages.unshift(language); // Add current language at the beginning
            }
            
            return allLanguages.map(lang => (
                <Option key={lang} value={lang}>
                    {lang}
                </Option>
            ));
        }, [language]);

        // Memoize editor options to avoid object recreation
        const editorOptions = useMemo(
            () => ({
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on" as const,
                lineNumbers: "on" as const,
                folding: false,
                automaticLayout: true,
                contextmenu: true,
                selectOnLineNumbers: true,
                fixedOverflowWidgets: true,
                scrollbar: {
                    vertical: (calculateHeight >= 600 ? "auto" : "hidden") as
                        | "auto"
                        | "hidden",
                    horizontal: "auto" as const,
                },
            }),
            [calculateHeight]
        );

        // Memoize all callbacks to prevent child re-renders
        const handleCopy = useCallback(async () => {
            try {
                await navigator.clipboard.writeText(props.code);
                setCopySuccess(true);
            } catch (err) {
                console.error("Failed to copy text: ", err);
            }
        }, [props.code]);

        const handleCloseSnackbar = useCallback(() => {
            setCopySuccess(false);
        }, []);

        const handleLanguageChange = useCallback((event: any, data: any) => {
            setLanguage(data.optionValue || "plaintext");
            setUserOverridden(true);
        }, []);

        const handleMouseEnter = useCallback(() => {
            setIsHovered(true);
        }, []);

        const handleMouseLeave = useCallback(() => {
            setIsHovered(false);
        }, []);

        return (
            <div
                className="code-block-wrapper"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ position: "relative" }}
            >
                <div style={{ position: "relative" }}>
                    {isHovered && (
                        <div
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 15,
                                zIndex: 10,
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                backgroundColor:
                                    resolvedTheme === "dark"
                                        ? "rgba(32, 32, 32, 0.9)"
                                        : "rgba(255, 255, 255, 0.9)",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                backdropFilter: "blur(4px)",
                                boxShadow:
                                    resolvedTheme === "dark"
                                        ? "0 2px 8px rgba(0,0,0,0.3)"
                                        : "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                        >
                            <Tooltip
                                content="Select language"
                                relationship="label"
                            >
                                <Dropdown
                                    value={language}
                                    selectedOptions={[language]}
                                    onOptionSelect={handleLanguageChange}
                                    style={{ minWidth: "100px" }}
                                    size="small"
                                >
                                    {languageOptions}
                                </Dropdown>
                            </Tooltip>
                            <Tooltip content="Copy code" relationship="label">
                                <Button
                                    icon={<Copy24Regular />}
                                    appearance="subtle"
                                    size="small"
                                    onClick={handleCopy}
                                />
                            </Tooltip>
                        </div>
                    )}
                    <Editor
                        height={`${calculateHeight}px`}
                        language={language}
                        value={props.code}
                        options={editorOptions}
                        theme={
                            resolvedTheme === "dark" ? "vs-dark" : "vs-light"
                        }
                    />
                </div>

                {/* Copy Success Notification */}
                {copySuccess && (
                    <div
                        style={{
                            position: "fixed",
                            top: "20px",
                            right: "20px",
                            zIndex: 1000,
                            backgroundColor: "var(--colorBrandBackground)",
                            color: "white",
                            padding: "12px 16px",
                            borderRadius: "4px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                    >
                        Code copied to clipboard!
                    </div>
                )}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if the code or detectedLanguage props have actually changed
        return (
            prevProps.code === nextProps.code &&
            prevProps.detectedLanguage === nextProps.detectedLanguage
        );
    }
);
