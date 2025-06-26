import React from "react";
import { Button, Dropdown, Option, Title3 } from "@fluentui/react-components";
import { Navigation24Regular } from "@fluentui/react-icons";
import { AppBar } from "../window/AppBar";
import { ThemeToggle } from "../theme/ThemeToggle";
import { useTheme } from "../../../data/context/ThemeContext";
import { Model } from "../../../api/interface/data/common/Model";

interface ChatPageHeaderProps {
    currentModel: Model | undefined;
    modelList: Model[];
    onModelChange: (modelId: string) => void;
    onMenuClick: () => void;
}

export function ChatPageHeader({
    currentModel,
    modelList,
    onModelChange,
    onMenuClick,
}: ChatPageHeaderProps) {
    const { resolvedTheme } = useTheme();

    const leftActions = (
        <Button
            appearance="transparent"
            icon={<Navigation24Regular />}
            onClick={onMenuClick}
            aria-label="menu"
            style={{ color: "inherit" }}
        />
    );

    const rightActions = (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Dropdown
                value={currentModel?.friendlyName || ""}
                onOptionSelect={(_, data) => {
                    if (data.optionValue) {
                        onModelChange(data.optionValue);
                    }
                }}
                style={{
                    minWidth: "200px",
                    color: "inherit",
                }}
            >
                {modelList.map(model => (
                    <Option key={model.identifier} value={model.identifier}>
                        {model.friendlyName}
                    </Option>
                ))}
            </Dropdown>
            <ThemeToggle />
        </div>
    );

    return (
        <AppBar
            leftActions={leftActions}
            rightActions={rightActions}
            title={"Chat"}
            borderBottom="1px solid var(--colorNeutralStroke1)"
        />
    );
}

