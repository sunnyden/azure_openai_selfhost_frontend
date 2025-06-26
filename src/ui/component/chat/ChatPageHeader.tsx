import React from "react";
import {
    Toolbar,
    Button,
    Dropdown,
    Option,
    Title3,
} from "@fluentui/react-components";
import { Navigation24Regular } from "@fluentui/react-icons";
import { WindowControls } from "../window/WindowControls";
import { DraggableArea } from "../window/DraggableArea";
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
    return (
        <div
            style={{
                backgroundColor: "var(--colorBrandBackground)",
                color: "var(--colorNeutralForegroundOnBrand)",
                borderBottom: "1px solid var(--colorNeutralStroke1)",
            }}
        >
            <Toolbar
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "56px",
                    padding: "0 16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <Button
                        appearance="transparent"
                        icon={<Navigation24Regular />}
                        onClick={onMenuClick}
                        aria-label="menu"
                        style={{ color: "inherit" }}
                    />

                    <DraggableArea>
                        <Title3
                            style={{
                                color: "inherit",
                                margin: 0,
                                flex: 1,
                            }}
                        >
                            Chat
                        </Title3>
                    </DraggableArea>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <DraggableArea>
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
                                <Option
                                    key={model.identifier}
                                    value={model.identifier}
                                >
                                    {model.friendlyName}
                                </Option>
                            ))}
                        </Dropdown>
                    </DraggableArea>

                    <WindowControls />
                </div>
            </Toolbar>
        </div>
    );
}

