import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// Configure Monaco Editor to load locally instead of from CDN
import "./utils/monacoConfig";
import { UserContextProvider } from "./data/context/UserContext";
import { ModelProvider } from "./data/context/ModelContext";
import { ConversationProvider } from "./data/context/ConversationContext";
import { ConversationHistoryProvider } from "./data/context/ConversationHistoryContext";
import { MCPProvider } from "./data/context/MCPContext";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <UserContextProvider>
            <ModelProvider>
                <MCPProvider>
                    <ConversationHistoryProvider>
                        <ConversationProvider>
                            <App />
                        </ConversationProvider>
                    </ConversationHistoryProvider>
                </MCPProvider>
            </ModelProvider>
        </UserContextProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
