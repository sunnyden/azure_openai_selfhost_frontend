import {
    Card,
    Button,
    Input,
    MessageBar,
    Spinner,
    Field,
} from "@fluentui/react-components";
import "./Login.css";
import { useUserContext } from "../../../data/context/UserContext";
import { useCallback, useState } from "react";

export function Login() {
    const { authenticate } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const login = useCallback(async () => {
        setIsLoading(true);
        try {
            await authenticate(userName, password);
        } catch (error: any) {
            setErrorMessage(error?.message);
        } finally {
            setIsLoading(false);
        }
    }, [authenticate, userName, password]);

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            login();
        }
    };

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    gap: "20px",
                }}
            >
                <Spinner label="Logging in..." size="large" />
            </div>
        );
    }

    return (
        <Card
            className="login-panel"
            style={{
                maxWidth: "400px",
                margin: "0 auto",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            }}
        >
            {errorMessage && (
                <MessageBar intent="error">
                    Failed to login, error: {errorMessage}.
                </MessageBar>
            )}

            <Field label="Username">
                <Input
                    value={userName}
                    onChange={(e, data) => setUserName(data.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your username"
                />
            </Field>

            <Field label="Password">
                <Input
                    type="password"
                    value={password}
                    onChange={(e, data) => setPassword(data.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                />
            </Field>

            <Button
                appearance="primary"
                onClick={login}
                disabled={!userName || !password}
                style={{ width: "100%" }}
            >
                Login
            </Button>
        </Card>
    );
}
