import React, { useState } from "react";
import {
    Button,
    Input,
    Field,
    Text,
    Spinner,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogBody,
    DialogTrigger,
    Switch,
    Badge,
    Tooltip,
    Checkbox,
} from "@fluentui/react-components";
import {
    Add20Regular,
    Delete20Regular,
    Edit20Regular,
    People20Regular,
    ArrowClockwise20Regular,
    LinkMultiple20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { User } from "../../../api/interface/data/common/User";
import { Model } from "../../../api/interface/data/common/Model";
import { useAdminStyles } from "./adminStyles";
import { formatDate } from "./formatDate";

const emptyUser: User = {
    userName: "",
    isAdmin: false,
    remainingCredit: 0,
    creditQuota: 10,
    password: "",
};

interface UsersTabProps {
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export function UsersTab({ onSuccess, onError }: UsersTabProps) {
    const styles = useAdminStyles();
    const apiClient = useApiClient();
    const { userList, fetchUserList } = useUserContext();

    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<User>(emptyUser);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Model management state
    const [modelDialogOpen, setModelDialogOpen] = useState(false);
    const [managingUser, setManagingUser] = useState<User | null>(null);
    const [allModels, setAllModels] = useState<Model[]>([]);
    const [assignedModelIds, setAssignedModelIds] = useState<Set<string>>(
        new Set()
    );
    const [modelDialogLoading, setModelDialogLoading] = useState(false);
    const [modelActionLoading, setModelActionLoading] = useState(false);

    const openCreateDialog = () => {
        setEditingUser(null);
        setUserForm({ ...emptyUser });
        setDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setUserForm({ ...user, password: "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (editingUser) {
                await apiClient.userClient.modify(userForm);
                onSuccess("User updated successfully");
            } else {
                await apiClient.userClient.create(userForm);
                onSuccess("User created successfully");
            }
            setDialogOpen(false);
            await fetchUserList();
        } catch (e: any) {
            onError(e.message || "Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete?.id) return;
        setLoading(true);
        try {
            await apiClient.userClient.remove(userToDelete.id);
            onSuccess("User deleted successfully");
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            await fetchUserList();
        } catch (e: any) {
            onError(e.message || "Failed to delete user");
        } finally {
            setLoading(false);
        }
    };

    const openModelDialog = async (user: User) => {
        setManagingUser(user);
        setModelDialogOpen(true);
        setModelDialogLoading(true);
        try {
            const [all, userModels] = await Promise.all([
                apiClient.modelClient.allModels(),
                apiClient.modelClient.listByUser(user.id!),
            ]);
            setAllModels(all);
            setAssignedModelIds(new Set(userModels.map(m => m.identifier)));
        } catch (e: any) {
            onError(e.message || "Failed to load models");
            setModelDialogOpen(false);
        } finally {
            setModelDialogLoading(false);
        }
    };

    const handleToggleModel = async (model: Model, checked: boolean) => {
        if (!managingUser?.id) return;
        setModelActionLoading(true);
        try {
            if (checked) {
                await apiClient.modelClient.assign({
                    userId: managingUser.id,
                    modelIdentifier: model.identifier,
                });
                setAssignedModelIds(prev => new Set([...prev, model.identifier]));
                onSuccess(`Model "${model.friendlyName}" assigned`);
            } else {
                await apiClient.modelClient.unassign({
                    userId: managingUser.id,
                    modelIdentifier: model.identifier,
                });
                setAssignedModelIds(prev => {
                    const next = new Set(prev);
                    next.delete(model.identifier);
                    return next;
                });
                onSuccess(`Model "${model.friendlyName}" unassigned`);
            }
        } catch (e: any) {
            onError(e.message || "Failed to update model assignment");
        } finally {
            setModelActionLoading(false);
        }
    };

    return (
        <>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <People20Regular />
                        <Text>User Management</Text>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            size="small"
                            icon={<ArrowClockwise20Regular />}
                            onClick={() =>
                                fetchUserList().catch(e => onError(e.message))
                            }
                        >
                            Refresh
                        </Button>
                        <Button
                            size="small"
                            appearance="primary"
                            icon={<Add20Regular />}
                            onClick={openCreateDialog}
                        >
                            Add User
                        </Button>
                    </div>
                </div>
                <div className={styles.tableContainer}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>ID</TableHeaderCell>
                                <TableHeaderCell>Username</TableHeaderCell>
                                <TableHeaderCell>Role</TableHeaderCell>
                                <TableHeaderCell>Remaining Credit</TableHeaderCell>
                                <TableHeaderCell>Credit Quota</TableHeaderCell>
                                <TableHeaderCell>Last Reset</TableHeaderCell>
                                <TableHeaderCell>Actions</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userList.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.userName}</TableCell>
                                    <TableCell>
                                        <Badge
                                            color={user.isAdmin ? "danger" : "informative"}
                                            size="small"
                                        >
                                            {user.isAdmin ? "Admin" : "User"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.remainingCredit.toFixed(2)}</TableCell>
                                    <TableCell>{user.creditQuota.toFixed(2)}</TableCell>
                                    <TableCell>{formatDate(user.lastCreditReset)}</TableCell>
                                    <TableCell>
                                        <div className={styles.actionButtons}>
                                            <Tooltip content="Manage Models" relationship="label">
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    icon={<LinkMultiple20Regular />}
                                                    onClick={() => openModelDialog(user)}
                                                    disabled={!user.id}
                                                />
                                            </Tooltip>
                                            <Tooltip content="Edit" relationship="label">
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    icon={<Edit20Regular />}
                                                    onClick={() => openEditDialog(user)}
                                                />
                                            </Tooltip>
                                            <Tooltip content="Delete" relationship="label">
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    icon={<Delete20Regular />}
                                                    onClick={() => {
                                                        setUserToDelete(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(_, data) => !data.open && setDialogOpen(false)}
            >
                <DialogSurface style={{ minWidth: "500px" }}>
                    <DialogBody>
                        <DialogTitle>
                            {editingUser ? "Edit User" : "Create User"}
                        </DialogTitle>
                        <DialogContent>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    paddingTop: "8px",
                                }}
                            >
                                <Field label="Username" required>
                                    <Input
                                        value={userForm.userName}
                                        onChange={(_, d) =>
                                            setUserForm(f => ({
                                                ...f,
                                                userName: d.value,
                                            }))
                                        }
                                        placeholder="Enter username"
                                    />
                                </Field>
                                <Field
                                    label={
                                        editingUser
                                            ? "Password (leave blank to keep current)"
                                            : "Password"
                                    }
                                    required={!editingUser}
                                >
                                    <Input
                                        type="password"
                                        value={userForm.password || ""}
                                        onChange={(_, d) =>
                                            setUserForm(f => ({
                                                ...f,
                                                password: d.value,
                                            }))
                                        }
                                        placeholder={
                                            editingUser
                                                ? "Leave blank to keep current"
                                                : "Enter password"
                                        }
                                    />
                                </Field>
                                <Field label="Remaining Credit" required>
                                    <Input
                                        type="number"
                                        value={String(userForm.remainingCredit)}
                                        onChange={(_, d) =>
                                            setUserForm(f => ({
                                                ...f,
                                                remainingCredit: Number(d.value),
                                            }))
                                        }
                                    />
                                </Field>
                                <Field label="Credit Quota" required>
                                    <Input
                                        type="number"
                                        value={String(userForm.creditQuota)}
                                        onChange={(_, d) =>
                                            setUserForm(f => ({
                                                ...f,
                                                creditQuota: Number(d.value),
                                            }))
                                        }
                                    />
                                </Field>
                                <Switch
                                    label="Admin Role"
                                    checked={userForm.isAdmin}
                                    onChange={(_, d) =>
                                        setUserForm(f => ({
                                            ...f,
                                            isAdmin: d.checked,
                                        }))
                                    }
                                />
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleSave}
                                disabled={loading || !userForm.userName}
                                icon={
                                    loading ? <Spinner size="tiny" /> : undefined
                                }
                            >
                                {editingUser ? "Save Changes" : "Create User"}
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onOpenChange={(_, data) =>
                    !data.open && setDeleteDialogOpen(false)
                }
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete user{" "}
                                <strong>{userToDelete?.userName}</strong>? This
                                action cannot be undone.
                            </Text>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button
                                    appearance="secondary"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleDelete}
                                disabled={loading}
                                icon={
                                    loading ? <Spinner size="tiny" /> : undefined
                                }
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* Manage Models Dialog */}
            <Dialog
                open={modelDialogOpen}
                onOpenChange={(_, data) =>
                    !data.open && setModelDialogOpen(false)
                }
            >
                <DialogSurface style={{ minWidth: "480px", maxHeight: "80vh" }}>
                    <DialogBody>
                        <DialogTitle>
                            Manage Models — {managingUser?.userName}
                        </DialogTitle>
                        <DialogContent>
                            {modelDialogLoading ? (
                                <div
                                    style={{
                                        padding: "32px",
                                        textAlign: "center",
                                    }}
                                >
                                    <Spinner label="Loading models..." />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                        paddingTop: "8px",
                                        overflowY: "auto",
                                        maxHeight: "50vh",
                                    }}
                                >
                                    {allModels.length === 0 && (
                                        <Text
                                            style={{
                                                color: "var(--colorNeutralForeground3)",
                                            }}
                                        >
                                            No models available.
                                        </Text>
                                    )}
                                    {allModels.map(model => (
                                        <div
                                            key={model.identifier}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "8px 12px",
                                                border: "1px solid var(--colorNeutralStroke2)",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            <Checkbox
                                                checked={assignedModelIds.has(
                                                    model.identifier
                                                )}
                                                disabled={modelActionLoading}
                                                onChange={(_, d) =>
                                                    handleToggleModel(
                                                        model,
                                                        d.checked as boolean
                                                    )
                                                }
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <Text weight="semibold">
                                                    {model.friendlyName}
                                                </Text>
                                                <Text
                                                    size={200}
                                                    style={{
                                                        color: "var(--colorNeutralForeground3)",
                                                    }}
                                                >
                                                    {model.identifier}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                appearance="secondary"
                                onClick={() => setModelDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
}
