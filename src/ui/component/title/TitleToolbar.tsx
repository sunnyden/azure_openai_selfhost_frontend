import {
    AppBar,
    Avatar,
    Box,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
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

function stringAvatar(name: string) {
    const splitedName = name.split(" ");
    if (splitedName.length < 2) {
        return {
            sx: {
                bgcolor: stringToColor(name),
            },
            children: name[0][0],
        };
    }
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: `${splitedName[0][0]}${splitedName[1][0]}`,
    };
}
export function TitleToolbar() {
    const { authenticatedUser, logout } = useUserContext();
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    const handleLogout = () => {
        handleCloseUserMenu();
        logout();
    };
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <DraggableArea>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                flexGrow: 1,
                                display: { xs: "none", md: "flex" },
                                fontFamily: "monospace",
                                fontWeight: 700,
                                letterSpacing: ".3rem",
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        >
                            ChatGPT Selfhost
                        </Typography>
                        <Typography
                            variant="h5"
                            noWrap
                            sx={{
                                mr: 2,
                                display: { xs: "flex", md: "none" },
                                flexGrow: 1,
                                fontFamily: "monospace",
                                fontWeight: 700,
                                letterSpacing: ".3rem",
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        >
                            ChatGPT Selfhost
                        </Typography>

                        {authenticatedUser?.userName && (
                            <Box sx={{ flexGrow: 0 }}>
                                <Tooltip title="Open settings">
                                    <IconButton
                                        onClick={handleOpenUserMenu}
                                        sx={{ p: 0 }}
                                    >
                                        <Avatar
                                            alt={authenticatedUser.userName}
                                            {...stringAvatar(
                                                authenticatedUser.userName
                                            )}
                                        />
                                    </IconButton>
                                </Tooltip>{" "}
                                <Menu
                                    sx={{
                                        mt: "45px",
                                        // Ensure menu content is not draggable in Electron
                                        ...(isElectron() && {
                                            "& .MuiMenu-paper": {
                                                WebkitAppRegion: "no-drag",
                                            },
                                        }),
                                    }}
                                    id="menu-appbar"
                                    anchorEl={anchorElUser}
                                    anchorOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleCloseUserMenu}
                                >
                                    <MenuItem onClick={handleLogout}>
                                        <Typography textAlign="center">
                                            Logout
                                        </Typography>
                                    </MenuItem>
                                </Menu>
                            </Box>
                        )}
                    </DraggableArea>

                    <WindowControls />
                </Toolbar>
            </Container>
        </AppBar>
    );
}
