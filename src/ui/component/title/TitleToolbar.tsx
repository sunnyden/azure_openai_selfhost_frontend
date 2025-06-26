import {
    Toolbar,
    Title3,
    Avatar,
    Button,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    Tooltip,
} from "@fluentui/react-components";
import { useState } from "react";
import { useUserContext } from "../../../data/context/UserContext";
import { WindowControls } from "../window/WindowControls";
import { DraggableArea } from "../window/DraggableArea";
import { isElectron } from "../../../utils/electronUtils";

function stringToColor(string: string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

function getInitials(name: string) {
    const splitedName = name.split(" ");
    if (splitedName.length < 2) {
        return name[0]?.toUpperCase() || "";
    }
    return `${splitedName[0][0]}${splitedName[1][0]}`.toUpperCase();
}

export function TitleToolbar() {
    const { authenticatedUser, logout } = useUserContext();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
    };

    return (
        <div
            style={{
                backgroundColor: "var(--colorBrandBackground)",
                color: "var(--colorNeutralForegroundOnBrand)",
                padding: "0 16px",
                borderBottom: "1px solid var(--colorNeutralStroke1)",
            }}
        >
            <Toolbar
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "56px",
                }}
            >
                <DraggableArea>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                        }}
                    >
                        <Title3
                            style={{
                                color: "inherit",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                letterSpacing: "0.3rem",
                                margin: 0,
                            }}
                        >
                            ChatGPT Selfhost
                        </Title3>
                    </div>

                    {authenticatedUser?.userName && (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Menu
                                open={menuOpen}
                                onOpenChange={(e, data) =>
                                    setMenuOpen(data.open)
                                }
                            >
                                <MenuTrigger disableButtonEnhancement>
                                    <Tooltip
                                        content="Open settings"
                                        relationship="label"
                                    >
                                        <Button
                                            appearance="transparent"
                                            style={{
                                                padding: 0,
                                                minWidth: "auto",
                                            }}
                                        >
                                            <Avatar
                                                name={
                                                    authenticatedUser.userName
                                                }
                                                color="colorful"
                                                initials={getInitials(
                                                    authenticatedUser.userName
                                                )}
                                                style={{
                                                    backgroundColor:
                                                        stringToColor(
                                                            authenticatedUser.userName
                                                        ),
                                                }}
                                            />
                                        </Button>
                                    </Tooltip>
                                </MenuTrigger>
                                <MenuPopover>
                                    <MenuList>
                                        <MenuItem onClick={handleLogout}>
                                            Logout
                                        </MenuItem>
                                    </MenuList>
                                </MenuPopover>
                            </Menu>
                        </div>
                    )}
                </DraggableArea>

                <WindowControls />
            </Toolbar>
        </div>
    );
}
