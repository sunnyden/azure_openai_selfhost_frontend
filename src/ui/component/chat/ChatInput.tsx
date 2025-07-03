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
    Edit24Regular,
    ImageAdd24Regular,
    Delete24Regular,
    Mic24Regular,
    MicOff24Regular,
    SpeakerMute24Regular,
    MusicNote224Regular,
} from "@fluentui/react-icons";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { ChatRole } from "../../../api/interface/data/common/Chat";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { MCPStatusIndicator } from "./MCPStatusIndicator";
import {
    resizeImageToBase64,
    isValidImageFile,
    formatFileSize,
} from "../../../utils/imageUtils";
import {
    audioToBase64,
    isValidAudioFile,
    getAudioDuration,
    formatDuration,
    startAudioRecording,
    processRecordedAudio,
    stopMediaStream,
} from "../../../utils/audioUtils";
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
    const [selectedImages, setSelectedImages] = useState<
        { file: File; preview: string; base64?: string }[]
    >([]);
    const [selectedAudios, setSelectedAudios] = useState<
        { file: File; preview: string; base64?: string; duration?: number }[]
    >([]);
    const [isProcessingImages, setIsProcessingImages] = useState(false);
    const [isProcessingAudios, setIsProcessingAudios] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null
    );
    const [recordingStream, setRecordingStream] = useState<MediaStream | null>(
        null
    );
    const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(
        null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioFileInputRef = useRef<HTMLInputElement>(null);
    const {
        requestCompletion,
        addMessage,
        clearConversation,
        currentConversation,
        lastStopReason,
    } = useConversationContext();
    const [isLoading, setLoading] = useState(false);

    // Cleanup effect for recording
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (isRecording && recordingStream) {
                stopMediaStream(recordingStream);
            }
            if (recordingTimer) {
                clearInterval(recordingTimer);
            }
        };
    }, [isRecording, recordingStream, recordingTimer]);

    // Image handling functions
    const handleImageSelect = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            setIsProcessingImages(true);
            const newImages: {
                file: File;
                preview: string;
                base64?: string;
            }[] = [];

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
                    console.error(
                        `Failed to process image ${file.name}:`,
                        error
                    );
                    alert(
                        `Failed to process image ${file.name}. Please try again.`
                    );
                }
            }

            setSelectedImages(prev => [...prev, ...newImages]);
            setIsProcessingImages(false);

            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        []
    );

    // Audio handling functions
    const handleAudioSelect = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            setIsProcessingAudios(true);
            const newAudios: {
                file: File;
                preview: string;
                base64?: string;
                duration?: number;
            }[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!isValidAudioFile(file)) {
                    alert(
                        `File ${file.name} is not a supported audio format. Supported formats: MP3, WAV`
                    );
                    continue;
                }

                // Create preview URL
                const preview = URL.createObjectURL(file);

                try {
                    // Process and convert audio to base64
                    const base64 = await audioToBase64(file);
                    const duration = await getAudioDuration(file);
                    newAudios.push({ file, preview, base64, duration });
                } catch (error) {
                    console.error(
                        `Failed to process audio ${file.name}:`,
                        error
                    );
                    alert(
                        `Failed to process audio ${file.name}. Please try again.`
                    );
                }
            }

            setSelectedAudios(prev => [...prev, ...newAudios]);
            setIsProcessingAudios(false);

            // Clear the file input
            if (audioFileInputRef.current) {
                audioFileInputRef.current.value = "";
            }
        },
        []
    );

    const removeAudio = useCallback((index: number) => {
        setSelectedAudios(prev => {
            const updated = [...prev];
            // Revoke the object URL to free memory
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const clearAudios = useCallback(() => {
        selectedAudios.forEach(audio => URL.revokeObjectURL(audio.preview));
        setSelectedAudios([]);
    }, [selectedAudios]);

    // Recording functions
    const startRecording = useCallback(async () => {
        try {
            const recorder = await startAudioRecording();
            const stream = recorder.stream;

            setMediaRecorder(recorder);
            setRecordingStream(stream);
            setIsRecording(true);
            setRecordingTime(0);

            // Start recording timer
            const timer = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            setRecordingTimer(timer);

            // Start recording
            const chunks: Blob[] = [];
            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                try {
                    const blob = new Blob(chunks, { type: "audio/wav" });
                    const { base64, file } = await processRecordedAudio(blob);
                    const duration = await getAudioDuration(file);
                    const preview = URL.createObjectURL(file);

                    setSelectedAudios(prev => [
                        ...prev,
                        { file, preview, base64, duration },
                    ]);
                } catch (error) {
                    console.error("Failed to process recorded audio:", error);
                    alert(
                        "Failed to process recorded audio (format conversion to PCM WAV failed). Please try again."
                    );
                }
            };

            recorder.start();
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert(
                "Failed to start recording. Please check microphone permissions."
            );
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);

            if (recordingStream) {
                stopMediaStream(recordingStream);
                setRecordingStream(null);
            }

            if (recordingTimer) {
                clearInterval(recordingTimer);
                setRecordingTimer(null);
            }

            setMediaRecorder(null);
            setRecordingTime(0);
        }
    }, [mediaRecorder, isRecording, recordingStream, recordingTimer]);

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

    const clearAllMedia = useCallback(() => {
        selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
        selectedAudios.forEach(audio => URL.revokeObjectURL(audio.preview));
        setSelectedImages([]);
        setSelectedAudios([]);
    }, [selectedImages, selectedAudios]);

    const onAppend = useCallback(() => {
        if (
            !prompt.trim() &&
            selectedImages.length === 0 &&
            selectedAudios.length === 0
        )
            return;

        const imageBase64s = selectedImages
            .map(img => img.base64)
            .filter(Boolean) as string[];
        const audioBase64s = selectedAudios
            .map(audio => audio.base64)
            .filter(Boolean) as string[];
        setPrompt("");
        clearAllMedia();
        addMessage(role, prompt, imageBase64s, audioBase64s);
    }, [
        addMessage,
        role,
        prompt,
        selectedImages,
        selectedAudios,
        clearAllMedia,
    ]);

    const onSend = useCallback(async () => {
        if (
            !prompt.trim() &&
            selectedImages.length === 0 &&
            selectedAudios.length === 0
        )
            return;

        const imageBase64s = selectedImages
            .map(img => img.base64)
            .filter(Boolean) as string[];
        const audioBase64s = selectedAudios
            .map(audio => audio.base64)
            .filter(Boolean) as string[];
        setPrompt("");
        clearAllMedia();
        setLoading(true);
        try {
            await requestCompletion(role, prompt, imageBase64s, audioBase64s);
        } catch (e) {}
        setLoading(false);
    }, [
        role,
        prompt,
        selectedImages,
        selectedAudios,
        requestCompletion,
        clearAllMedia,
    ]);

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
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                        }}
                    >
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
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(120px, 1fr))",
                            gap: "8px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            padding: "8px",
                            border: "1px solid var(--colorNeutralStroke2)",
                            borderRadius: "8px",
                            backgroundColor: "var(--colorNeutralBackground2)",
                        }}
                    >
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
                                        border: "1px solid var(--colorNeutralStroke1)",
                                    }}
                                />
                                <Tooltip
                                    content="Remove image"
                                    relationship="label"
                                >
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
                                            height: "24px",
                                        }}
                                    />
                                </Tooltip>
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "4px",
                                        left: "4px",
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        color: "white",
                                        padding: "2px 4px",
                                        borderRadius: "2px",
                                        fontSize: "10px",
                                    }}
                                >
                                    {formatFileSize(img.file.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Audio Preview Section */}
            {selectedAudios.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                        }}
                    >
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>
                            Audio Files ({selectedAudios.length})
                        </span>
                        <Button
                            appearance="subtle"
                            size="small"
                            onClick={clearAudios}
                        >
                            Clear All
                        </Button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            padding: "8px",
                            border: "1px solid var(--colorNeutralStroke2)",
                            borderRadius: "8px",
                            backgroundColor: "var(--colorNeutralBackground2)",
                        }}
                    >
                        {selectedAudios.map((audio, index) => (
                            <div
                                key={index}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px",
                                    backgroundColor:
                                        "var(--colorNeutralBackground1)",
                                    borderRadius: "4px",
                                    border: "1px solid var(--colorNeutralStroke1)",
                                }}
                            >
                                <SpeakerMute24Regular
                                    style={{
                                        color: "var(--colorNeutralForeground2)",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {audio.file.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "10px",
                                            color: "var(--colorNeutralForeground2)",
                                            display: "flex",
                                            gap: "8px",
                                        }}
                                    >
                                        <span>
                                            {formatFileSize(audio.file.size)}
                                        </span>
                                        {audio.duration && (
                                            <span>
                                                {formatDuration(audio.duration)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <audio
                                    controls
                                    src={audio.preview}
                                    style={{
                                        height: "30px",
                                        maxWidth: "150px",
                                    }}
                                />
                                <Tooltip
                                    content="Remove audio"
                                    relationship="label"
                                >
                                    <Button
                                        icon={<Delete24Regular />}
                                        appearance="subtle"
                                        size="small"
                                        onClick={() => removeAudio(index)}
                                        style={{
                                            minWidth: "24px",
                                            height: "24px",
                                            flexShrink: 0,
                                        }}
                                    />
                                </Tooltip>
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

                {/* Audio and Image Upload Buttons */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        display: "flex",
                        gap: "4px",
                    }}
                >
                    {/* Audio file input */}
                    <input
                        ref={audioFileInputRef}
                        type="file"
                        accept="audio/mpeg,audio/wav,audio/mp3"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleAudioSelect}
                    />

                    {/* Image file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleImageSelect}
                    />

                    {/* Recording button */}
                    <Tooltip
                        content={
                            isRecording
                                ? `Recording... ${formatDuration(recordingTime)}`
                                : "Record audio"
                        }
                        relationship="label"
                    >
                        <Button
                            icon={
                                isRecording ? (
                                    <MicOff24Regular />
                                ) : (
                                    <Mic24Regular />
                                )
                            }
                            appearance={isRecording ? "primary" : "subtle"}
                            size="small"
                            onClick={
                                isRecording ? stopRecording : startRecording
                            }
                            disabled={isProcessingAudios}
                            style={{
                                backgroundColor: isRecording
                                    ? "var(--colorPaletteRedBackground3)"
                                    : "var(--colorNeutralBackground1)",
                                border: "1px solid var(--colorNeutralStroke2)",
                                color: isRecording ? "white" : undefined,
                            }}
                        />
                    </Tooltip>

                    {/* Audio file upload button */}
                    <Tooltip content="Add audio files" relationship="label">
                        <Button
                            icon={<MusicNote224Regular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => audioFileInputRef.current?.click()}
                            disabled={isProcessingAudios}
                            style={{
                                backgroundColor:
                                    "var(--colorNeutralBackground1)",
                                border: "1px solid var(--colorNeutralStroke2)",
                            }}
                        />
                    </Tooltip>

                    {/* Image upload button */}
                    <Tooltip content="Add images" relationship="label">
                        <Button
                            icon={<ImageAdd24Regular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingImages}
                            style={{
                                backgroundColor:
                                    "var(--colorNeutralBackground1)",
                                border: "1px solid var(--colorNeutralStroke2)",
                            }}
                        />
                    </Tooltip>
                </div>
            </div>

            {isProcessingImages && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        fontSize: "14px",
                        color: "var(--colorNeutralForeground2)",
                    }}
                >
                    <Spinner size="extra-small" />
                    Processing images...
                </div>
            )}

            {isProcessingAudios && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        fontSize: "14px",
                        color: "var(--colorNeutralForeground2)",
                    }}
                >
                    <Spinner size="extra-small" />
                    Processing audio files...
                </div>
            )}

            {isRecording && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        fontSize: "14px",
                        color: "var(--colorPaletteRedForeground3)",
                    }}
                >
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                                "var(--colorPaletteRedBackground3)",
                            animation: "pulse 1s infinite",
                        }}
                    />
                    Recording... {formatDuration(recordingTime)}
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

