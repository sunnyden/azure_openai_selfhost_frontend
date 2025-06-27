import {
    Avatar,
    Divider,
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
} from "@fluentui/react-components";
import {
    Bot24Regular,
    MegaphoneRegular,
    Person24Regular,
    Copy24Regular,
    Delete24Regular,
    Edit24Regular,
} from "@fluentui/react-icons";
import Editor from "@monaco-editor/react";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { useTheme } from "../../../data/context/ThemeContext";
import { ChatRole, ToolInfo } from "../../../api/interface/data/common/Chat";
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
function renderAvatar(role: ChatRole) {
    switch (role) {
        case ChatRole.Assistant:
            return <Bot24Regular />;
        case ChatRole.User:
            return <Person24Regular />;
        case ChatRole.System:
            return <MegaphoneRegular />;
        default:
            throw new Error("Invalid role");
    }
}
function isBlockCode(message: string, node: any) {
    const startPos: number = node?.position?.start?.offset;
    if (!!startPos) {
        return message.substring(startPos, startPos + 3) === "```";
    }
    return false;
}

function detectLanguageFromMessage(message: string, node: any) {
    const startPos: number = node?.position?.start?.offset;
    if (!startPos) return "plaintext";

    // Find the first line of the code block (```language)
    const codeBlockStart = message.substring(startPos);
    const firstLineEnd = codeBlockStart.indexOf("\n");
    if (firstLineEnd === -1) return "plaintext";

    const firstLine = codeBlockStart.substring(0, firstLineEnd);
    const languageMatch = firstLine.match(/^```(\w+)/);

    if (languageMatch && languageMatch[1]) {
        const language = languageMatch[1].toLowerCase();
        // Map common language aliases to supported languages
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

    return "plaintext";
}

const ChatItem = memo(function ChatItem({
    role,
    message,
    messageIndex,
}: {
    role: ChatRole;
    message: string;
    messageIndex: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
        null
    );
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editedMessage, setEditedMessage] = useState(message);
    const { deleteMessage, updateMessage } = useConversationContext();
    const { resolvedTheme } = useTheme();

    // Use a ref to store the current message without triggering re-renders
    const messageRef = useRef(message);
    useEffect(() => {
        messageRef.current = message;
    }, [message]);

    const userRoleText = useMemo(() => {
        switch (role) {
            case ChatRole.Assistant:
                return "Assistant";
            case ChatRole.User:
                return "User";
            case ChatRole.System:
                return "System";
            default:
                return "Unknown";
        }
    }, [role]);
    // Memoize the Markdown components with a stable code component
    // Use messageRef to avoid dependency on message prop
    const markdownComponents = useMemo(
        () => ({
            code: ({ node, ...props }: any) => {
                const currentMessage = messageRef.current;

                if (isBlockCode(currentMessage, node)) {
                    const detectedLanguage = detectLanguageFromMessage(
                        currentMessage,
                        node
                    );
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
        }),
        [] // No dependencies - keeps the component stable
    );
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
            await navigator.clipboard.writeText(message);
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
            textArea.value = message;
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
        setEditedMessage(message);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        updateMessage(messageIndex, editedMessage);
        setEditDialogOpen(false);
    };

    const handleCancelEdit = () => {
        setEditedMessage(message);
        setEditDialogOpen(false);
    };

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "16px",
                    position: "relative",
                }}
            >
                <Avatar
                    style={{ marginRight: "16px" }}
                    icon={renderAvatar(role)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        weight="semibold"
                        size={300}
                        style={{ marginBottom: "8px" }}
                    >
                        {userRoleText}
                    </Text>
                    <div>
                        <Markdown
                            remarkPlugins={remarkPlugins}
                            rehypePlugins={rehypePlugins}
                            components={markdownComponents}
                        >
                            {message}
                        </Markdown>
                    </div>
                </div>
                {isHovered && (
                    <div
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
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
                    <React.Fragment key={index}>
                        <ChatItem
                            role={message.role}
                            message={message.content[0].text || ""}
                            messageIndex={index}
                        />
                        {index !== array.length - 1 && (
                            <div
                                style={{
                                    height: "1px",
                                    backgroundColor:
                                        "var(--colorNeutralStroke1)",
                                    padding: "0 0 0 60px",
                                    margin: 0,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
                {toolUsed.map((tool, index, array) => (
                    <React.Fragment key={index}>
                        <ToolListItem
                            tool={tool}
                            working={usingTool && array.length === index + 1}
                        />
                    </React.Fragment>
                ))}
            </div>
            <div ref={messagesEndRef} />
        </div>
    );
}
