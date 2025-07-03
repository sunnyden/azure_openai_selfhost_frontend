import {
    Button,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogBody,
    Tooltip,
    Text,
    Spinner,
    Badge,
} from "@fluentui/react-components";
import {
    MegaphoneRegular,
    Copy24Regular,
    Delete24Regular,
    Edit24Regular,
    ChevronDown16Regular,
    ChevronRight16Regular,
    Brain20Regular,
} from "@fluentui/react-icons";
import Editor from "@monaco-editor/react";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { useTheme } from "../../../data/context/ThemeContext";
import { ChatRole, ToolInfo, ChatMessageContentItem, ChatMessageContentType } from "../../../api/interface/data/common/Chat";
import React, {
    useMemo,
    useRef,
    useEffect,
    useState,
    useCallback,
    memo,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlockWrapper } from "./CodeBlockWrapper";
import {
    BrowseWebPageTool,
    DefaultTool,
    ImageGenerateTool,
    SearchTool,
    TimeTool,
    WeiboTool,
} from "./Tools";
import remarkMath from "./remarkMath";
import { isElectron } from "../../../utils/electronUtils";
import "../../styles/thinking-animations.css";
import "./ChatHistory.css";

function isBlockCode(node: any) {
    const startLine: number = node?.position?.start?.line;
    const endLine: number = node?.position?.end?.line;
    return startLine !== endLine;
}

function detectLanguageFromMessage(node: any) {
    const languageClass: string | undefined = node?.properties?.className?.[0];
    if (!languageClass) return "plaintext";
    const language = languageClass.replace("language-", "");
    const languageMap: { [key: string]: string } = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        rb: "ruby",
        cs: "csharp",
        cpp: "cpp",
        "c++": "cpp",
        sh: "shell",
        bash: "shell",
        ps1: "powershell",
        yml: "yaml",
        md: "markdown",
    };

    return languageMap[language] || language;
}

const markdownComponents = {
    code: ({ node, ...props }: any) => {
        if (isBlockCode(node)) {
            const detectedLanguage = detectLanguageFromMessage(node);
            const code = props.children as string | null;

            return (
                <CodeBlockWrapper
                    code={code ?? ""}
                    detectedLanguage={detectedLanguage}
                />
            );
        }
        return <code>{props.children}</code>;
    },
    table: ({ node, ...props }: any) => (
        <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table
                style={{
                    borderCollapse: "collapse",
                    border: "1px solid var(--colorNeutralStroke2)",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "0.875rem",
                    backgroundColor: "var(--colorNeutralBackground2)",
                }}
                {...props}
            />
        </div>
    ),
    thead: ({ node, ...props }: any) => (
        <thead
            style={{
                backgroundColor: "var(--colorNeutralBackground3)",
                borderBottom: "2px solid var(--colorNeutralStroke2)",
            }}
            {...props}
        />
    ),
    tbody: ({ node, ...props }: any) => <tbody {...props} />,
    tr: ({ node, ...props }: any) => (
        <tr
            style={{
                borderBottom: "1px solid var(--colorNeutralStroke2)",
            }}
            {...props}
        />
    ),
    th: ({ node, ...props }: any) => (
        <th
            style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "var(--colorNeutralForeground1)",
                borderRight: "1px solid var(--colorNeutralStroke2)",
            }}
            {...props}
        />
    ),
    td: ({ node, ...props }: any) => (
        <td
            style={{
                padding: "12px 16px",
                borderRight: "1px solid var(--colorNeutralStroke2)",
                verticalAlign: "top",
            }}
            {...props}
        />
    ),
};

const ChatItem = memo(function ChatItem({
    role,
    content,
    messageIndex,
}: {
    role: ChatRole;
    content: ChatMessageContentItem[];
    messageIndex: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
        null
    );
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    
    // Extract text content for editing and thinking logic
    const textContent = content.find(item => item.type === ChatMessageContentType.Text)?.text || "";
    const [editedMessage, setEditedMessage] = useState(textContent);
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
    const { deleteMessage, updateMessage } = useConversationContext();
    const { resolvedTheme } = useTheme();

    const thinkMessage = useMemo(() => {
        // case 1. still generating <think> data... no ending tag
        // case 2, think finished, <think>data</think>
        // think is starting at the beginning of the message
        const regex = /^<think>([\s\S]*?)(?:<\/think>|$)/;
        const match = textContent.match(regex);
        if (match) {
            const thinkContent = match[1].trim();
            if (thinkContent) {
                return thinkContent;
            }
        }
        return "";
    }, [textContent]);

    const restOfMessage = useMemo(() => {
        // Remove <think> tags and their content from the message
        const regex = /^<think>[\s\S]*?(?:<\/think>|$)/;
        return textContent.replace(regex, "").trim();
    }, [textContent]);

    const thinking = useMemo(
        () => !!thinkMessage && !restOfMessage,
        [thinkMessage, restOfMessage]
    );

    // Check if user message needs full width
    const needsFullWidth = useMemo(() => {
        if (role !== ChatRole.User) return false;

        // Check for multiline code blocks (```code```)
        const hasCodeBlock = /```[\s\S]*?```/.test(restOfMessage);

        // Check for markdown tables (| column | column |)
        const hasTable =
            /\|.*\|/.test(restOfMessage) && restOfMessage.includes("\n");

        // Check for formulas (LaTeX: $...$ or $$...$$)
        const hasFormula = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/.test(restOfMessage);

        return hasCodeBlock || hasTable || hasFormula;
    }, [role, restOfMessage]);
    // Memoize the Markdown components with a stable code component
    // Use messageRef to avoid dependency on message prop

    // Memoize plugins to prevent recreation
    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => [rehypeKatex], []);

    // Memoize style objects
    const listItemSx = useMemo(
        () => ({
            position: "relative",
            "&:hover": {
                backgroundColor: "action.hover",
            },
        }),
        []
    );

    const actionBoxSx = useMemo(
        () => ({
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "background.paper",
            borderRadius: 1,
            boxShadow: 1,
            display: "flex",
            gap: 0.5,
        }),
        []
    );
    // Memoize event handlers
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleCopyToClipboard = async () => {
        try {
            // Create a text representation of all content
            const contentText = content.map(item => {
                if (item.type === ChatMessageContentType.Text) {
                    return item.text || "";
                } else if (item.type === ChatMessageContentType.Image) {
                    return "[Image]"; // Placeholder for images
                }
                return "";
            }).filter(text => text.trim()).join("\n");
            
            await navigator.clipboard.writeText(contentText);
            setShowCopySuccess(true);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setShowCopySuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            const contentText = content.map(item => {
                if (item.type === ChatMessageContentType.Text) {
                    return item.text || "";
                } else if (item.type === ChatMessageContentType.Image) {
                    return "[Image]";
                }
                return "";
            }).filter(text => text.trim()).join("\n");
            
            textArea.value = contentText;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                setShowCopySuccess(true);
            } catch (err) {
                console.error("Fallback copy failed: ", err);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleTouchStart = () => {
        const timer = setTimeout(() => {
            handleCopyToClipboard();
        }, 500); // 500ms for long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleCloseCopySuccess = () => {
        setShowCopySuccess(false);
    };

    const handleDeleteMessage = () => {
        deleteMessage(messageIndex);
    };

    const handleEditMessage = () => {
        setEditedMessage(textContent);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        updateMessage(messageIndex, editedMessage);
        setEditDialogOpen(false);
    };

    const handleCancelEdit = () => {
        setEditedMessage(textContent);
        setEditDialogOpen(false);
    };

    const handleToggleThinking = () => {
        setIsThinkingExpanded(!isThinkingExpanded);
    };

    // Get role-specific styles
    const getRoleStyles = () => {
        switch (role) {
            case ChatRole.User:
                return {
                    container: {
                        display: "flex",
                        justifyContent: needsFullWidth
                            ? "flex-start"
                            : "flex-end",
                        padding: "8px 16px", // Standard padding since buttons are now on the right
                        position: "relative" as const,
                    },
                    messageWrapper: {
                        width: "100%", // Full width to handle code blocks and long content
                        position: "relative" as const,
                        display: "flex",
                        justifyContent: needsFullWidth
                            ? "flex-start"
                            : "flex-end",
                    },
                    messageContent: {
                        backgroundColor: "var(--colorNeutralBackground3)",
                        color: "var(--colorNeutralForeground1)",
                        padding: "12px 16px",
                        borderRadius: "18px 18px 4px 18px",
                        wordWrap: "break-word" as const,
                        wordBreak: "break-word" as const,
                        fontSize: "14px",
                        lineHeight: "1.4",
                        maxWidth: needsFullWidth ? "100%" : "calc(100% - 20px)", // Full width for special content
                        width: needsFullWidth ? "100%" : "fit-content",
                    },
                    actionsPosition: {
                        top: "8px",
                        right: "16px",
                    },
                };
            case ChatRole.Assistant:
                return {
                    container: {
                        display: "flex",
                        justifyContent: "flex-start",
                        padding: "16px",
                        position: "relative" as const,
                    },
                    messageWrapper: {
                        width: "100%",
                    },
                    messageContent: {
                        backgroundColor: "transparent",
                        color: "var(--colorNeutralForeground1)",
                        padding: "0",
                        fontSize: "14px",
                        lineHeight: "1.5",
                    },
                    actionsPosition: {
                        top: "16px",
                        right: "16px",
                    },
                };
            case ChatRole.System:
                return {
                    container: {
                        display: "flex",
                        justifyContent: "flex-start",
                        padding: "12px 16px",
                        position: "relative" as const,
                    },
                    messageWrapper: {
                        width: "100%",
                    },
                    messageContent: {
                        backgroundColor: "var(--colorNeutralBackground3)",
                        border: "1px solid var(--colorNeutralStroke2)",
                        borderLeft:
                            "4px solid var(--colorPaletteYellowBackground3)",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        position: "relative" as const,
                        fontSize: "13px",
                        lineHeight: "1.4",
                        color: "var(--colorNeutralForeground2)",
                    },
                    actionsPosition: {
                        top: "12px",
                        right: "16px",
                    },
                };
            default:
                return {
                    container: {},
                    messageWrapper: {},
                    messageContent: {},
                    actionsPosition: {},
                };
        }
    };

    const roleStyles = getRoleStyles();

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={roleStyles.container}
            >
                <div style={roleStyles.messageWrapper}>
                    {/* System role indicator */}
                    {role === ChatRole.System && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "8px",
                                color: "var(--colorNeutralForeground2)",
                                fontSize: "12px",
                                fontWeight: "600",
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.5px",
                            }}
                        >
                            <MegaphoneRegular
                                style={{ marginRight: "6px", fontSize: "14px" }}
                            />
                            System Message
                        </div>
                    )}

                    <div style={roleStyles.messageContent}>
                        {!!thinkMessage && (
                            <div
                                style={{
                                    marginBottom: "16px",
                                    border: "1px solid var(--colorNeutralStroke2)",
                                    borderRadius: "8px",
                                    backgroundColor:
                                        "var(--colorNeutralBackground2)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    className="thinking-header"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        backgroundColor:
                                            "var(--colorNeutralBackground3)",
                                        borderBottom: isThinkingExpanded
                                            ? "1px solid var(--colorNeutralStroke2)"
                                            : "none",
                                    }}
                                    onClick={handleToggleThinking}
                                >
                                    <Brain20Regular
                                        className={
                                            thinking ? "thinking-pulse" : ""
                                        }
                                        style={{
                                            marginRight: "8px",
                                            color: "var(--colorBrandForeground1)",
                                        }}
                                    />
                                    <Text
                                        size={300}
                                        weight="semibold"
                                        style={{ marginRight: "auto" }}
                                    >
                                        Thinking Process
                                    </Text>
                                    {thinking && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                marginRight: "12px",
                                            }}
                                        >
                                            <Spinner size="extra-small" />
                                            <Badge
                                                appearance="filled"
                                                color="brand"
                                                size="small"
                                                style={{ marginLeft: "8px" }}
                                            >
                                                Thinking...
                                            </Badge>
                                        </div>
                                    )}
                                    {isThinkingExpanded ? (
                                        <ChevronDown16Regular />
                                    ) : (
                                        <ChevronRight16Regular />
                                    )}
                                </div>
                                {isThinkingExpanded && (
                                    <div
                                        className="thinking-expand thinking-fade-in"
                                        style={{
                                            padding: "16px",
                                            maxHeight: "400px",
                                            overflowY: "auto",
                                            fontSize: "0.9rem",
                                            lineHeight: "1.5",
                                            position: "relative",
                                        }}
                                    >
                                        {thinking && !thinkMessage && (
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        padding: "20px",
                                                        color: "var(--colorNeutralForeground2)",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    <Spinner
                                                        size="small"
                                                        style={{
                                                            marginRight: "8px",
                                                        }}
                                                    />
                                                    AI is thinking...
                                                </div>
                                                {/* Shimmer placeholder lines */}
                                                <div
                                                    style={{
                                                        marginTop: "12px",
                                                    }}
                                                >
                                                    <div
                                                        className="thinking-shimmer"
                                                        style={{
                                                            height: "16px",
                                                            borderRadius: "4px",
                                                            marginBottom: "8px",
                                                            width: "90%",
                                                        }}
                                                    />
                                                    <div
                                                        className="thinking-shimmer"
                                                        style={{
                                                            height: "16px",
                                                            borderRadius: "4px",
                                                            marginBottom: "8px",
                                                            width: "75%",
                                                        }}
                                                    />
                                                    <div
                                                        className="thinking-shimmer"
                                                        style={{
                                                            height: "16px",
                                                            borderRadius: "4px",
                                                            width: "85%",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {thinkMessage && (
                                            <Markdown
                                                remarkPlugins={remarkPlugins}
                                                rehypePlugins={rehypePlugins}
                                                components={markdownComponents}
                                            >
                                                {thinkMessage}
                                            </Markdown>
                                        )}
                                        {thinking && thinkMessage && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginTop: "12px",
                                                    padding: "8px 12px",
                                                    backgroundColor:
                                                        "var(--colorNeutralBackground4)",
                                                    borderRadius: "4px",
                                                    fontSize: "0.8rem",
                                                    color: "var(--colorNeutralForeground2)",
                                                }}
                                            >
                                                <Spinner
                                                    size="extra-small"
                                                    style={{
                                                        marginRight: "6px",
                                                    }}
                                                />
                                                Still thinking...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div
                            className={
                                role === ChatRole.User
                                    ? "user-message-content"
                                    : ""
                            }
                        >
                            {/* Render all content items */}
                            {content.map((item, index) => {
                                if (item.type === ChatMessageContentType.Text) {
                                    // For text content, only show the part without <think> tags
                                    const textToShow = index === 0 ? restOfMessage : (item.text || "");
                                    if (!textToShow.trim()) return null;
                                    
                                    return (
                                        <div key={index}>
                                            <Markdown
                                                remarkPlugins={remarkPlugins}
                                                rehypePlugins={rehypePlugins}
                                                components={markdownComponents}
                                            >
                                                {textToShow}
                                            </Markdown>
                                        </div>
                                    );
                                } else if (item.type === ChatMessageContentType.Image && item.imageUrl) {
                                    return (
                                        <div 
                                            key={index} 
                                            style={{ 
                                                margin: "8px 0",
                                                display: "inline-block",
                                                maxWidth: "100%"
                                            }}
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt="Uploaded image"
                                                style={{
                                                    maxWidth: "100%",
                                                    maxHeight: "400px",
                                                    borderRadius: "8px",
                                                    border: "1px solid var(--colorNeutralStroke2)",
                                                    display: "block"
                                                }}
                                                onError={(e) => {
                                                    // Handle image loading errors
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = "none";
                                                    const errorDiv = document.createElement("div");
                                                    errorDiv.textContent = "[Image failed to load]";
                                                    errorDiv.style.color = "var(--colorNeutralForeground3)";
                                                    errorDiv.style.fontStyle = "italic";
                                                    errorDiv.style.padding = "8px";
                                                    errorDiv.style.border = "1px dashed var(--colorNeutralStroke2)";
                                                    errorDiv.style.borderRadius = "4px";
                                                    target.parentNode?.insertBefore(errorDiv, target);
                                                }}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>

                {isHovered && (
                    <div
                        style={{
                            position: "absolute",
                            ...roleStyles.actionsPosition,
                            display: "flex",
                            gap: "4px",
                            backgroundColor: "var(--colorNeutralBackground1)",
                            borderRadius: "4px",
                            padding: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            opacity: 0.9,
                            zIndex: 10,
                        }}
                    >
                        <Tooltip content="Copy message" relationship="label">
                            <Button
                                icon={<Copy24Regular />}
                                appearance="subtle"
                                size="small"
                                onClick={handleCopyToClipboard}
                            />
                        </Tooltip>
                        <Tooltip content="Edit message" relationship="label">
                            <Button
                                icon={<Edit24Regular />}
                                appearance="subtle"
                                size="small"
                                onClick={handleEditMessage}
                            />
                        </Tooltip>
                        <Tooltip content="Delete message" relationship="label">
                            <Button
                                icon={<Delete24Regular />}
                                appearance="subtle"
                                size="small"
                                onClick={handleDeleteMessage}
                            />
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Copy Success Toast */}
            {showCopySuccess && (
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
                    Message copied to clipboard!
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onOpenChange={(_, data) => !data.open && handleCancelEdit()}
            >
                <DialogSurface
                    style={{
                        minWidth: "600px",
                        width: "80vw",
                        maxWidth: "1000px",
                    }}
                >
                    <DialogBody>
                        <DialogTitle>Edit Message</DialogTitle>
                        <DialogContent>
                            <div style={{ marginTop: "16px" }}>
                                <Editor
                                    height="400px"
                                    defaultLanguage="markdown"
                                    value={editedMessage}
                                    onChange={value =>
                                        setEditedMessage(value || "")
                                    }
                                    options={{
                                        minimap: { enabled: false },
                                        wordWrap: "on",
                                        lineNumbers: "on",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        fontSize: 14,
                                        lineHeight: 20,
                                        padding: { top: 10, bottom: 10 },
                                    }}
                                    theme={
                                        resolvedTheme === "dark"
                                            ? "vs-dark"
                                            : "vs-light"
                                    }
                                />
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button
                                    appearance="secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleSaveEdit}
                            >
                                Save
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
});

const ToolItem = memo(function ToolItem({
    tool,
    working,
}: {
    tool: ToolInfo;
    working: boolean;
}) {
    switch (tool.name) {
        case "Search":
            return <SearchTool parameter={tool.parameters} working={working} />;
        case "BrowseWebPage":
            return (
                <BrowseWebPageTool
                    parameter={tool.parameters}
                    working={working}
                />
            );
        case "GenerateImageWithPrompt":
            return (
                <ImageGenerateTool
                    parameter={tool.parameters}
                    working={working}
                />
            );
        case "GetCurrentTime":
            return <TimeTool parameter={tool.parameters} working={working} />;
        case "FetchAndParseHotKeywords":
            return <WeiboTool parameter={tool.parameters} working={working} />;
        default:
            return (
                <DefaultTool
                    parameter={tool.parameters}
                    working={working}
                    name={tool.name}
                />
            );
    }
});

const ToolListItem = memo(function ToolListItem({
    tool,
    working,
}: {
    tool: ToolInfo;
    working: boolean;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "16px",
            }}
        >
            <ToolItem tool={tool} working={working} />
        </div>
    );
});

export function ChatHistory() {
    const { currentConversation, toolUsed, usingTool } =
        useConversationContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            // Use scrollTop to scroll to bottom of the container
            scrollContainerRef.current.scrollTop =
                scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Use setTimeout to ensure DOM is updated before scrolling
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 0);

        return () => clearTimeout(timer);
    }, [currentConversation, toolUsed]);

    return (
        <div
            ref={scrollContainerRef}
            style={{
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    width: "100%",
                    backgroundColor: "var(--colorNeutralBackground1)",
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {currentConversation.map((message, index, array) => (
                    <ChatItem
                        key={index}
                        role={message.role}
                        content={message.content}
                        messageIndex={index}
                    />
                ))}
                {toolUsed.map((tool, index, array) => (
                    <ToolListItem
                        key={index}
                        tool={tool}
                        working={usingTool && array.length === index + 1}
                    />
                ))}
            </div>
            <div ref={messagesEndRef} />
        </div>
    );
}
