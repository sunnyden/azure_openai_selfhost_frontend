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
    Tooltip,
} from "@fluentui/react-components";
import { 
    ChevronDown24Regular, 
    Edit24Regular, 
    ImageAdd24Regular,
    Delete24Regular 
} from "@fluentui/react-icons";
import React, { useCallback, useState, useRef } from "react";
import { ChatRole } from "../../../api/interface/data/common/Chat";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { MCPStatusIndicator } from "./MCPStatusIndicator";
import { resizeImageToBase64, isValidImageFile, formatFileSize } from "../../../utils/imageUtils";
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
                        appearance="primary"
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
    const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string; base64?: string }[]>([]);
    const [isProcessingImages, setIsProcessingImages] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        requestCompletion,
        addMessage,
        clearConversation,
        currentConversation,
        lastStopReason,
    } = useConversationContext();
    const [isLoading, setLoading] = useState(false);

    // Image handling functions
    const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessingImages(true);
        const newImages: { file: File; preview: string; base64?: string }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!isValidImageFile(file)) {
                alert(`File ${file.name} is not a supported image format.`);
                continue;
            }

            // Create preview URL
            const preview = URL.createObjectURL(file);
            
            try {
                // Process and resize image to base64
                const base64 = await resizeImageToBase64(file);
                newImages.push({ file, preview, base64 });
            } catch (error) {
                console.error(`Failed to process image ${file.name}:`, error);
                alert(`Failed to process image ${file.name}. Please try again.`);
            }
        }

        setSelectedImages(prev => [...prev, ...newImages]);
        setIsProcessingImages(false);
        
        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const removeImage = useCallback((index: number) => {
        setSelectedImages(prev => {
            const updated = [...prev];
            // Revoke the object URL to free memory
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const clearImages = useCallback(() => {
        selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
        setSelectedImages([]);
    }, [selectedImages]);

    const onAppend = useCallback(() => {
        if (!prompt.trim() && selectedImages.length === 0) return;
        
        const imageBase64s = selectedImages.map(img => img.base64).filter(Boolean) as string[];
        setPrompt("");
        clearImages();
        addMessage(role, prompt, imageBase64s);
    }, [addMessage, role, prompt, selectedImages, clearImages]);

    const onSend = useCallback(async () => {
        if (!prompt.trim() && selectedImages.length === 0) return;
        
        const imageBase64s = selectedImages.map(img => img.base64).filter(Boolean) as string[];
        setPrompt("");
        clearImages();
        setLoading(true);
        try {
            await requestCompletion(role, prompt, imageBase64s);
        } catch (e) {}
        setLoading(false);
    }, [role, prompt, selectedImages, requestCompletion, clearImages]);

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
                return "System";
            case ChatRole.Assistant:
                return "Assistant";
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

            {/* Image Preview Section */}
            {selectedImages.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                    <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        marginBottom: "8px" 
                    }}>
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>
                            Images ({selectedImages.length})
                        </span>
                        <Button 
                            appearance="subtle" 
                            size="small" 
                            onClick={clearImages}
                        >
                            Clear All
                        </Button>
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "8px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        padding: "8px",
                        border: "1px solid var(--colorNeutralStroke2)",
                        borderRadius: "8px",
                        backgroundColor: "var(--colorNeutralBackground2)"
                    }}>
                        {selectedImages.map((img, index) => (
                            <div key={index} style={{ position: "relative" }}>
                                <img
                                    src={img.preview}
                                    alt={`Upload ${index + 1}`}
                                    style={{
                                        width: "100%",
                                        height: "100px",
                                        objectFit: "cover",
                                        borderRadius: "4px",
                                        border: "1px solid var(--colorNeutralStroke1)"
                                    }}
                                />
                                <Tooltip content="Remove image" relationship="label">
                                    <Button
                                        icon={<Delete24Regular />}
                                        appearance="subtle"
                                        size="small"
                                        onClick={() => removeImage(index)}
                                        style={{
                                            position: "absolute",
                                            top: "4px",
                                            right: "4px",
                                            backgroundColor: "rgba(0,0,0,0.7)",
                                            color: "white",
                                            minWidth: "24px",
                                            height: "24px"
                                        }}
                                    />
                                </Tooltip>
                                <div style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    left: "4px",
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    padding: "2px 4px",
                                    borderRadius: "2px",
                                    fontSize: "10px"
                                }}>
                                    {formatFileSize(img.file.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div style={{ position: "relative" }}>
                <Textarea
                    placeholder="Type your message here..."
                    value={prompt}
                    onChange={(e, data) => setPrompt(data.value)}
                    rows={4}
                    resize="vertical"
                    style={{ width: "100%" }}
                />
                
                {/* Image Upload Button */}
                <div style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    display: "flex",
                    gap: "4px"
                }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleImageSelect}
                    />
                    <Tooltip content="Add images" relationship="label">
                        <Button
                            icon={<ImageAdd24Regular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingImages}
                            style={{
                                backgroundColor: "var(--colorNeutralBackground1)",
                                border: "1px solid var(--colorNeutralStroke2)"
                            }}
                        />
                    </Tooltip>
                </div>
            </div>

            {isProcessingImages && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "var(--colorNeutralForeground2)"
                }}>
                    <Spinner size="extra-small" />
                    Processing images...
                </div>
            )}

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
                        <Option value="System">System</Option>
                        <Option value="Assistant">Assistant</Option>
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
