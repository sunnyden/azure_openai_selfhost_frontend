import React from "react";
import "./App.css";
import { FluentProvider } from "./ui/theme/FluentProvider";
import { AppRouter } from "./ui/component/router/AppRouter";

function App() {
    return (
        <FluentProvider>
            <div
                className="App"
                style={{
                    backgroundColor: "var(--colorNeutralBackground1)",
                    minHeight: "100dvh",
                }}
            >
                <AppRouter />
            </div>
        </FluentProvider>
    );
}

export default App;
