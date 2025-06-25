import {
    Box,
    Button,
    ButtonGroup,
    CircularProgress,
    ClickAwayListener,
    Divider,
    FormControl,
    Grow,
    InputLabel,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { ChatRole } from "../../../api/interface/data/common/Chat";
import { useConversationContext } from "../../../data/context/ConversationContext";
import { MCPStatusIndicator } from "./MCPStatusIndicator";
function ChatButtonGroup({
    onSend,
    onAppend,
    onOpenMCPManagement,
}: {
    onSend: () => void;
    onAppend: () => void;
    onOpenMCPManagement: () => void;
}) {
    const [moreOptionEnabled, setMoreOptionEnabled] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const handleToggle = useCallback(() => {
        setMoreOptionEnabled(prevOpen => !prevOpen);
    }, [setMoreOptionEnabled]);
    const handleClose = useCallback((event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }

        setMoreOptionEnabled(false);
    }, []);
    const handleAppend = () => {
        setMoreOptionEnabled(false);
        onAppend();
    };
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {/* Send Button Group */}
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                aria-label="Button group with a nested menu"
            >
                <Button onClick={onSend}>Send</Button>
                <Button
                    size="small"
                    aria-controls={
                        moreOptionEnabled ? "split-button-menu" : undefined
                    }
                    aria-expanded={moreOptionEnabled ? "true" : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={moreOptionEnabled}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === "bottom"
                                    ? "center top"
                                    : "center bottom",
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    <MenuItem onClick={handleAppend}>
                                        Append to history
                                    </MenuItem>
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </Stack>
    );
}
export function ChatInput({
    onOpenMCPManagement,
}: {
    onOpenMCPManagement?: () => void;
}) {
    const [role, setRole] = useState<ChatRole>(ChatRole.User);
    const [prompt, setPrompt] = useState<string>("");
    const {
        requestCompletion,
        addMessage,
        clearConversation,
        currentConversation,
        lastStopReason,
    } = useConversationContext();
    const [isLoading, setLoading] = useState(false);

    const onAppend = useCallback(() => {
        setPrompt("");
        addMessage(role, prompt);
    }, [addMessage, role, prompt]);

    const onSend = useCallback(async () => {
        setPrompt("");
        setLoading(true);
        try {
            await requestCompletion(role, prompt);
        } catch (e) {}
        setLoading(false);
    }, [role, prompt, requestCompletion]);

    const continueGenerate = useCallback(async () => {
        setLoading(true);
        try {
            await requestCompletion();
        } catch (e) {}
        setLoading(false);
    }, [requestCompletion, setLoading]);

    const handleClearConversation = useCallback(() => {
        clearConversation();
    }, [clearConversation]);

    const handleOpenMCPManagement = useCallback(() => {
        onOpenMCPManagement?.();
    }, [onOpenMCPManagement]);
    return isLoading ? (
        <Stack alignItems={"center"} padding={2} spacing={2}>
            <CircularProgress />
        </Stack>
    ) : (
        <Stack paddingTop={2} spacing={2}>
            {currentConversation.length > 0 &&
                currentConversation[currentConversation.length - 1].role ===
                    ChatRole.Assistant &&
                lastStopReason === "length" &&
                !isLoading && (
                    <Box
                        textAlign={"center"}
                        sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<BorderColorIcon />}
                            onClick={continueGenerate}
                        >
                            Continue Generate
                        </Button>
                    </Box>
                )}
            <Divider variant="inset" />

            <TextField
                label="Message"
                multiline
                rows={4}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
            />
            <Stack
                direction={"row"}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
            >
                <MCPStatusIndicator
                    onOpenManagement={handleOpenMCPManagement}
                />
                <Stack direction={"row"} spacing={2} alignItems="center">
                    <FormControl size="small">
                        <InputLabel id="chat-role-label">Role</InputLabel>
                        <Select
                            labelId="chat-role-label"
                            value={role}
                            label="Role"
                            onChange={e => setRole(e.target.value as ChatRole)}
                        >
                            <MenuItem value={ChatRole.User}>User</MenuItem>
                            <MenuItem value={ChatRole.System}>
                                System Prompt
                            </MenuItem>
                            <MenuItem value={ChatRole.Assistant}>
                                Assistant Response
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <ChatButtonGroup
                        onSend={onSend}
                        onAppend={onAppend}
                        onOpenMCPManagement={handleOpenMCPManagement}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
}
