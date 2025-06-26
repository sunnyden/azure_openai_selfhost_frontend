import React from "react";
import "./App.css";
import { Login } from "./ui/component/login/Login";
import { useUserContext } from "./data/context/UserContext";
import { ChatPage } from "./ui/page/ChatPage/ChatPage";
import { TitleToolbar } from "./ui/component/title/TitleToolbar";
import { Spinner } from "@fluentui/react-components";
import { FluentProvider } from "./ui/theme/FluentProvider";

function App() {
    const { authenticatedUser, initialized } = useUserContext();
    return (
        <FluentProvider>
            <div
                className="App"
                style={{
                    backgroundColor: "var(--colorNeutralBackground1)",
                    minHeight: "100dvh",
                }}
            >
                {initialized ? (
                    authenticatedUser ? (
                        <ChatPage />
                    ) : (
                        <>
                            <TitleToolbar />
                            <div
                                style={{
                                    maxWidth: "1200px",
                                    margin: "0 auto",
                                    padding: "20px",
                                    backgroundColor:
                                        "var(--colorNeutralBackground1)",
                                }}
                            >
                                <Login />
                            </div>
                        </>
                    )
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
                        <Spinner label="Loading..." />
                    </div>
                )}
            </div>
        </FluentProvider>
    );
}

export default App;
