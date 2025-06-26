import React from "react";
import { Spinner } from "@fluentui/react-components";

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
    message = "Loading...",
    fullScreen = false,
}) => {
    const style = fullScreen
        ? {
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column" as const,
              gap: "16px",
          }
        : {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              gap: "16px",
          };

    return (
        <div style={style}>
            <Spinner label={message} />
        </div>
    );
};

