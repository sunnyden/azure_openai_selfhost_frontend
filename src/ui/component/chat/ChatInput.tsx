import {
    Button,
    Textarea,
    Dropdown,
    Option,
    Spinner,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    SplitButton,
    Divider,
} from "@fluentui/react-components";
import { ChevronDown24Regular, Edit24Regular } from "@fluentui/react-icons";
import React, { useCallback, useState } from "react";
import { ChatRole } from "../../../api/interface/data/common/Chat";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { MCPStatusIndicator } from "./MCPStatusIndicator";
function ChatButtonGroup({
    onSend,
    onAppend,
    onOpenMCPManagement,
}: {
    onSend: () => void;
    onAppend: () => void;
    onOpenMCPManagement: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleAppend = () => {
        setMenuOpen(false);
        onAppend();
    };

    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Send Button with Dropdown */}
            <Menu
                open={menuOpen}
                onOpenChange={(e, data) => setMenuOpen(data.open)}
            >
                <MenuTrigger disableButtonEnhancement>
                    <SplitButton
                        primaryActionButton={{
                            onClick: onSend,
                            children: "Send",
                        }}
                        menuButton={{
                            "aria-label": "More options",
                        }}
                    />
                </MenuTrigger>
                <MenuPopover>
                    <MenuList>
                        <MenuItem onClick={handleAppend}>
                            Append to history
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
        </div>
    );
}
export function ChatInput({
    onOpenMCPManagement,
}: {
    onOpenMCPManagement?: () => void;
}) {
    const [role, setRole] = useState<ChatRole>(ChatRole.User);
    const [prompt, setPrompt] = useState<string>("");
    const {
        requestCompletion,
        addMessage,
        clearConversation,
        currentConversation,
        lastStopReason,
    } = useConversationContext();
    const [isLoading, setLoading] = useState(false);

    const onAppend = useCallback(() => {
        setPrompt("");
        addMessage(role, prompt);
    }, [addMessage, role, prompt]);

    const onSend = useCallback(async () => {
        setPrompt("");
        setLoading(true);
        try {
            await requestCompletion(role, prompt);
        } catch (e) {}
        setLoading(false);
    }, [role, prompt, requestCompletion]);

    const continueGenerate = useCallback(async () => {
        setLoading(true);
        try {
            await requestCompletion();
        } catch (e) {}
        setLoading(false);
    }, [requestCompletion, setLoading]);

    const handleClearConversation = useCallback(() => {
        clearConversation();
    }, [clearConversation]);

    const handleOpenMCPManagement = useCallback(() => {
        onOpenMCPManagement?.();
    }, [onOpenMCPManagement]);

    const getRoleDisplayName = (role: ChatRole) => {
        switch (role) {
            case ChatRole.User:
                return "User";
            case ChatRole.System:
                return "System Prompt";
            case ChatRole.Assistant:
                return "Assistant Response";
            default:
                return "User";
        }
    };

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px",
                    gap: "20px",
                }}
            >
                <Spinner label="Processing..." />
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                paddingTop: "16px",
            }}
        >
            {/* Continue Generate Button */}
            {currentConversation.length > 0 &&
                currentConversation[currentConversation.length - 1].role ===
                    ChatRole.Assistant &&
                lastStopReason === "length" &&
                !isLoading && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <Button
                            appearance="outline"
                            icon={<Edit24Regular />}
                            onClick={continueGenerate}
                        >
                            Continue Generate
                        </Button>
                    </div>
                )}

            <Divider />

            {/* Message Input */}
            <Textarea
                placeholder="Type your message here..."
                value={prompt}
                onChange={(e, data) => setPrompt(data.value)}
                rows={4}
                resize="vertical"
                style={{ width: "100%" }}
            />

            {/* Bottom Controls */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                }}
            >
                <MCPStatusIndicator
                    onOpenManagement={handleOpenMCPManagement}
                />

                <div
                    style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                    }}
                >
                    {/* Role Dropdown */}
                    <Dropdown
                        value={getRoleDisplayName(role)}
                        onOptionSelect={(_, data) => {
                            if (data.optionValue === "User")
                                setRole(ChatRole.User);
                            else if (data.optionValue === "System")
                                setRole(ChatRole.System);
                            else if (data.optionValue === "Assistant")
                                setRole(ChatRole.Assistant);
                        }}
                        style={{ minWidth: "150px" }}
                    >
                        <Option value="User">User</Option>
                        <Option value="System">System Prompt</Option>
                        <Option value="Assistant">Assistant Response</Option>
                    </Dropdown>

                    {/* Send Button Group */}
                    <ChatButtonGroup
                        onSend={onSend}
                        onAppend={onAppend}
                        onOpenMCPManagement={handleOpenMCPManagement}
                    />
                </div>
            </div>
        </div>
    );
}
