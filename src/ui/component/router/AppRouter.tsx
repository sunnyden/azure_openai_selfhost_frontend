import React from "react";
import {
    HashRouter,
    Routes,
    Route,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { useUserContext } from "../../../data/context/UserContext";
import { ChatPage } from "../../page/ChatPage/ChatPage";
import { LoginPage } from "../../page/LoginPage/LoginPage";
import { MCPManagementPage } from "../../page/MCPManagementPage/MCPManagementPage";
import { UsagePage } from "../../page/UsagePage/UsagePage";
import { TitleToolbar } from "../title/TitleToolbar";
import { Spinner } from "@fluentui/react-components";
import MagiPage from "../../page/MagiPage/MagiPage";

function RouteComponents() {
    const navigate = useNavigate();

    const handleBackToChat = () => {
        navigate("/chat");
    };

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route
                path="/usage"
                element={<UsagePage onBack={handleBackToChat} />}
            />
            <Route
                path="/mcp"
                element={<MCPManagementPage onBack={handleBackToChat} />}
            />
            <Route path="/magi" element={<MagiPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
    );
}

export function AppRouter() {
    const { authenticatedUser, initialized } = useUserContext();

    if (!initialized) {
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
                <Spinner label="Loading..." />
            </div>
        );
    }

    if (!authenticatedUser) {
        return (
            <>
                <TitleToolbar />
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        padding: "20px",
                        backgroundColor: "var(--colorNeutralBackground1)",
                    }}
                >
                    <LoginPage />
                </div>
            </>
        );
    }

    return (
        <HashRouter>
            <RouteComponents />
        </HashRouter>
    );
}

