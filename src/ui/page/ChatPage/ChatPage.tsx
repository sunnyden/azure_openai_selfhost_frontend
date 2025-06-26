import React, { useCallback, useState, Suspense } from "react";
import { Spinner } from "@fluentui/react-components";
import { ChatHistory } from "../../component/chat/ChatHistory";
import { ChatInput } from "../../component/chat/ChatInput";
import { ConversationSidePanel } from "../../component/ConversationSidePanel";
import { ChatPageHeader } from "../../component/chat/ChatPageHeader";
import { UsagePage, MCPManagementPage } from "../../component/DynamicPages";
import { Loading } from "../../component/Loading";
import { useModelContext } from "../../../data/context/ModelContext";

export function ChatPage() {
    const { currentModel, modelList, setCurrentModel } = useModelContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<"chat" | "usage" | "mcp">(
        "chat"
    );

    const onModelChange = useCallback(
        (modelId: string) => {
            const newModel = modelList.find(
                model => model.identifier === modelId
            );
            return newModel ? setCurrentModel(newModel) : undefined;
        },
        [modelList, setCurrentModel]
    );

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleNavigateToUsage = () => {
        setCurrentPage("usage");
        setSidebarOpen(false);
    };

    const handleNavigateToMCP = () => {
        setCurrentPage("mcp");
        setSidebarOpen(false);
    };

    const handleBackToChat = () => {
        setCurrentPage("chat");
    };

    // Show usage page if that's the current page
    if (currentPage === "usage") {
        return (
            <Suspense fallback={<Loading message="Loading usage page..." />}>
                <UsagePage onBack={handleBackToChat} />
            </Suspense>
        );
    }

    // Show MCP management page if that's the current page
    if (currentPage === "mcp") {
        return (
            <Suspense
                fallback={<Loading message="Loading MCP management..." />}
            >
                <MCPManagementPage onBack={handleBackToChat} />
            </Suspense>
        );
    }

    return modelList.length > 0 ? (
        <div
            style={{
                height: "100dvh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Top Header - Fixed height */}
            <ChatPageHeader
                currentModel={currentModel}
                modelList={modelList}
                onModelChange={onModelChange}
                onMenuClick={handleSidebarToggle}
            />

            {/* Main Content Area - Fills remaining space */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    maxWidth: "1200px",
                    width: "100%",
                    margin: "0 auto",
                    padding: "16px",
                    boxSizing: "border-box",
                }}
            >
                {/* Chat History - Scrollable middle section */}
                <div
                    style={{
                        flex: 1,
                        overflow: "hidden",
                        marginBottom: "16px",
                    }}
                >
                    <ChatHistory />
                </div>

                {/* Chat Input - Fixed at bottom */}
                <div style={{ flexShrink: 0 }}>
                    <ChatInput onOpenMCPManagement={handleNavigateToMCP} />
                </div>
            </div>

            {/* Side Panel */}
            <ConversationSidePanel
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpen={() => setSidebarOpen(true)}
                onNavigateToUsage={handleNavigateToUsage}
            />
        </div>
    ) : (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                gap: "20px",
            }}
        >
            <Spinner label="Loading models..." />
        </div>
    );
}
