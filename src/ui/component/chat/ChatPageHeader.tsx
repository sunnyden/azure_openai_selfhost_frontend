import React from "react";
import { Button, Dropdown, Option, Title3 } from "@fluentui/react-components";
import { Navigation24Regular } from "@fluentui/react-icons";
import { AppBar } from "../window/AppBar";
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
    );

    return (
        <AppBar
            leftActions={leftActions}
            rightActions={rightActions}
            title={"Chat"}
            backgroundColor="var(--colorBrandBackground)"
            color="var(--colorNeutralForegroundOnBrand)"
            borderBottom="1px solid var(--colorNeutralStroke1)"
        />
    );
}

