import React, { useCallback, useEffect, useState } from "react";
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
    Select,
} from "@fluentui/react-components";
import {
    Add20Regular,
    Delete20Regular,
    Edit20Regular,
    Server20Regular,
    ArrowClockwise20Regular,
    LinkAdd20Regular,
    LinkDismiss20Regular,
} from "@fluentui/react-icons";
import { useApiClient } from "../../../data/context/useApiClient";
import { useUserContext } from "../../../data/context/UserContext";
import { Model } from "../../../api/interface/data/common/Model";
import { useAdminStyles } from "./adminStyles";

const emptyModel: Model = {
    identifier: "",
    friendlyName: "",
    endpoint: "",
    deployment: "",
    key: "",
    costPromptToken: 0,
    costResponseToken: 0,
    isVision: false,
    isAudio: false,
    maxTokens: 128000,
    supportTool: true,
    apiVersionOverride: null,
    reasoningModel: false,
};

interface ModelsTabProps {
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export function ModelsTab({ onSuccess, onError }: ModelsTabProps) {
    const styles = useAdminStyles();
    const apiClient = useApiClient();
    const { userList } = useUserContext();

    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<Model[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    // Create/Edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [modelForm, setModelForm] = useState<Model>(emptyModel);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

    // Assign / Unassign
    const [assignUserId, setAssignUserId] = useState("");
    const [assignModelIdentifier, setAssignModelIdentifier] = useState("");
    const [unassignUserId, setUnassignUserId] = useState("");
    const [unassignModelIdentifier, setUnassignModelIdentifier] = useState("");

    const loadModels = useCallback(async () => {
        setModelsLoading(true);
        try {
            const data = await apiClient.modelClient.allModels();
            setModels(data);
        } catch (e: any) {
            onError(e.message || "Failed to load models");
        } finally {
            setModelsLoading(false);
        }
    }, [apiClient, onError]);

    useEffect(() => {
        loadModels();
    }, [loadModels]);

    const openCreateDialog = () => {
        setEditingModel(null);
        setModelForm({ ...emptyModel });
        setDialogOpen(true);
    };

    const openEditDialog = (model: Model) => {
        setEditingModel(model);
        setModelForm({ ...model, key: "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (editingModel) {
                await apiClient.modelClient.update(modelForm);
                onSuccess("Model updated successfully");
            } else {
                await apiClient.modelClient.add(modelForm);
                onSuccess("Model added successfully");
            }
            setDialogOpen(false);
            await loadModels();
        } catch (e: any) {
            onError(e.message || "Failed to save model");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!modelToDelete) return;
        setLoading(true);
        try {
            await apiClient.modelClient.remove(modelToDelete.identifier);
            onSuccess("Model deleted successfully");
            setDeleteDialogOpen(false);
            setModelToDelete(null);
            await loadModels();
        } catch (e: any) {
            onError(e.message || "Failed to delete model");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!assignUserId || !assignModelIdentifier) return;
        setLoading(true);
        try {
            await apiClient.modelClient.assign({
                userId: Number(assignUserId),
                modelIdentifier: assignModelIdentifier,
            });
            onSuccess("Model assigned successfully");
            setAssignUserId("");
            setAssignModelIdentifier("");
        } catch (e: any) {
            onError(e.message || "Failed to assign model");
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async () => {
        if (!unassignUserId || !unassignModelIdentifier) return;
        setLoading(true);
        try {
            await apiClient.modelClient.unassign({
                userId: Number(unassignUserId),
                modelIdentifier: unassignModelIdentifier,
            });
            onSuccess("Model unassigned successfully");
            setUnassignUserId("");
            setUnassignModelIdentifier("");
        } catch (e: any) {
            onError(e.message || "Failed to unassign model");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Model list */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <Server20Regular />
                        <Text>Model Management</Text>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            size="small"
                            icon={<ArrowClockwise20Regular />}
                            onClick={loadModels}
                        >
                            Refresh
                        </Button>
                        <Button
                            size="small"
                            appearance="primary"
                            icon={<Add20Regular />}
                            onClick={openCreateDialog}
                        >
                            Add Model
                        </Button>
                    </div>
                </div>
                {modelsLoading ? (
                    <div style={{ padding: "32px", textAlign: "center" }}>
                        <Spinner label="Loading models..." />
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Identifier</TableHeaderCell>
                                    <TableHeaderCell>Friendly Name</TableHeaderCell>
                                    <TableHeaderCell>Deployment</TableHeaderCell>
                                    <TableHeaderCell>Max Tokens</TableHeaderCell>
                                    <TableHeaderCell>Features</TableHeaderCell>
                                    <TableHeaderCell>Prompt Cost</TableHeaderCell>
                                    <TableHeaderCell>Response Cost</TableHeaderCell>
                                    <TableHeaderCell>Actions</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map(model => (
                                    <TableRow key={model.identifier}>
                                        <TableCell>{model.identifier}</TableCell>
                                        <TableCell>{model.friendlyName}</TableCell>
                                        <TableCell>{model.deployment}</TableCell>
                                        <TableCell>
                                            {model.maxTokens.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "4px",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                {model.isVision && (
                                                    <Badge size="small" color="success">
                                                        Vision
                                                    </Badge>
                                                )}
                                                {model.isAudio && (
                                                    <Badge size="small" color="success">
                                                        Audio
                                                    </Badge>
                                                )}
                                                {model.supportTool && (
                                                    <Badge size="small" color="informative">
                                                        Tools
                                                    </Badge>
                                                )}
                                                {model.reasoningModel && (
                                                    <Badge size="small" color="warning">
                                                        Reasoning
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{model.costPromptToken}</TableCell>
                                        <TableCell>{model.costResponseToken}</TableCell>
                                        <TableCell>
                                            <div className={styles.actionButtons}>
                                                <Tooltip
                                                    content="Edit"
                                                    relationship="label"
                                                >
                                                    <Button
                                                        size="small"
                                                        appearance="subtle"
                                                        icon={<Edit20Regular />}
                                                        onClick={() =>
                                                            openEditDialog(model)
                                                        }
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    content="Delete"
                                                    relationship="label"
                                                >
                                                    <Button
                                                        size="small"
                                                        appearance="subtle"
                                                        icon={<Delete20Regular />}
                                                        onClick={() => {
                                                            setModelToDelete(model);
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
                )}
            </div>

            {/* Assign / Unassign */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <LinkAdd20Regular />
                        <Text>Assign / Unassign Model</Text>
                    </div>
                </div>
                <div
                    style={{
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    <Text weight="semibold" size={300}>
                        Assign Model to User
                    </Text>
                    <div className={styles.formRow}>
                        <Field label="User" className={styles.formField}>
                            <Select
                                value={assignUserId}
                                onChange={(_, data) =>
                                    setAssignUserId(data.value)
                                }
                            >
                                <option value="">Select user...</option>
                                {userList.map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.userName} (ID: {u.id})
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Model" className={styles.formField}>
                            <Select
                                value={assignModelIdentifier}
                                onChange={(_, data) =>
                                    setAssignModelIdentifier(data.value)
                                }
                            >
                                <option value="">Select model...</option>
                                {models.map(m => (
                                    <option
                                        key={m.identifier}
                                        value={m.identifier}
                                    >
                                        {m.friendlyName}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <div
                            style={{ display: "flex", alignItems: "flex-end" }}
                        >
                            <Button
                                appearance="primary"
                                icon={<LinkAdd20Regular />}
                                onClick={handleAssign}
                                disabled={
                                    !assignUserId ||
                                    !assignModelIdentifier ||
                                    loading
                                }
                            >
                                Assign
                            </Button>
                        </div>
                    </div>

                    <Text weight="semibold" size={300}>
                        Unassign Model from User
                    </Text>
                    <div className={styles.formRow}>
                        <Field label="User" className={styles.formField}>
                            <Select
                                value={unassignUserId}
                                onChange={(_, data) =>
                                    setUnassignUserId(data.value)
                                }
                            >
                                <option value="">Select user...</option>
                                {userList.map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.userName} (ID: {u.id})
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Model" className={styles.formField}>
                            <Select
                                value={unassignModelIdentifier}
                                onChange={(_, data) =>
                                    setUnassignModelIdentifier(data.value)
                                }
                            >
                                <option value="">Select model...</option>
                                {models.map(m => (
                                    <option
                                        key={m.identifier}
                                        value={m.identifier}
                                    >
                                        {m.friendlyName}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <div
                            style={{ display: "flex", alignItems: "flex-end" }}
                        >
                            <Button
                                appearance="outline"
                                icon={<LinkDismiss20Regular />}
                                onClick={handleUnassign}
                                disabled={
                                    !unassignUserId ||
                                    !unassignModelIdentifier ||
                                    loading
                                }
                            >
                                Unassign
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(_, data) => !data.open && setDialogOpen(false)}
            >
                <DialogSurface
                    style={{
                        minWidth: "560px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    }}
                >
                    <DialogBody>
                        <DialogTitle>
                            {editingModel ? "Edit Model" : "Add Model"}
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
                                <div className={styles.formRow}>
                                    <Field
                                        label="Identifier"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            value={modelForm.identifier}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    identifier: d.value,
                                                }))
                                            }
                                            placeholder="e.g. gpt-4o"
                                            disabled={!!editingModel}
                                        />
                                    </Field>
                                    <Field
                                        label="Friendly Name"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            value={modelForm.friendlyName}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    friendlyName: d.value,
                                                }))
                                            }
                                            placeholder="e.g. GPT-4o"
                                        />
                                    </Field>
                                </div>
                                <Field label="Endpoint" required>
                                    <Input
                                        value={modelForm.endpoint}
                                        onChange={(_, d) =>
                                            setModelForm(f => ({
                                                ...f,
                                                endpoint: d.value,
                                            }))
                                        }
                                        placeholder="https://my-resource.openai.azure.com/"
                                    />
                                </Field>
                                <div className={styles.formRow}>
                                    <Field
                                        label="Deployment"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            value={modelForm.deployment}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    deployment: d.value,
                                                }))
                                            }
                                            placeholder="e.g. gpt-4o"
                                        />
                                    </Field>
                                    <Field
                                        label={
                                            editingModel
                                                ? "API Key (leave blank to keep)"
                                                : "API Key"
                                        }
                                        required={!editingModel}
                                        className={styles.formField}
                                    >
                                        <Input
                                            type="password"
                                            value={modelForm.key || ""}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    key: d.value,
                                                }))
                                            }
                                            placeholder={
                                                editingModel
                                                    ? "Leave blank to keep current"
                                                    : "Azure OpenAI key"
                                            }
                                        />
                                    </Field>
                                </div>
                                <div className={styles.formRow}>
                                    <Field
                                        label="Cost per Prompt Token"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            type="number"
                                            value={String(
                                                modelForm.costPromptToken
                                            )}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    costPromptToken: Number(
                                                        d.value
                                                    ),
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Cost per Response Token"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            type="number"
                                            value={String(
                                                modelForm.costResponseToken
                                            )}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    costResponseToken: Number(
                                                        d.value
                                                    ),
                                                }))
                                            }
                                        />
                                    </Field>
                                </div>
                                <div className={styles.formRow}>
                                    <Field
                                        label="Max Tokens"
                                        required
                                        className={styles.formField}
                                    >
                                        <Input
                                            type="number"
                                            value={String(modelForm.maxTokens)}
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    maxTokens: Number(d.value),
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="API Version Override"
                                        className={styles.formField}
                                    >
                                        <Input
                                            value={
                                                modelForm.apiVersionOverride ||
                                                ""
                                            }
                                            onChange={(_, d) =>
                                                setModelForm(f => ({
                                                    ...f,
                                                    apiVersionOverride:
                                                        d.value || null,
                                                }))
                                            }
                                            placeholder="e.g. 2024-02-01 (optional)"
                                        />
                                    </Field>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "24px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Switch
                                        label="Vision Support"
                                        checked={modelForm.isVision}
                                        onChange={(_, d) =>
                                            setModelForm(f => ({
                                                ...f,
                                                isVision: d.checked,
                                            }))
                                        }
                                    />
                                    <Switch
                                        label="Audio Support"
                                        checked={modelForm.isAudio}
                                        onChange={(_, d) =>
                                            setModelForm(f => ({
                                                ...f,
                                                isAudio: d.checked,
                                            }))
                                        }
                                    />
                                    <Switch
                                        label="Tool/Function Calling"
                                        checked={modelForm.supportTool}
                                        onChange={(_, d) =>
                                            setModelForm(f => ({
                                                ...f,
                                                supportTool: d.checked,
                                            }))
                                        }
                                    />
                                    <Switch
                                        label="Reasoning Model"
                                        checked={modelForm.reasoningModel}
                                        onChange={(_, d) =>
                                            setModelForm(f => ({
                                                ...f,
                                                reasoningModel: d.checked,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={handleSave}
                                disabled={
                                    loading ||
                                    !modelForm.identifier ||
                                    !modelForm.friendlyName ||
                                    !modelForm.endpoint ||
                                    !modelForm.deployment
                                }
                                icon={
                                    loading ? <Spinner size="tiny" /> : undefined
                                }
                            >
                                {editingModel ? "Save Changes" : "Add Model"}
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
                        <DialogTitle>Delete Model</DialogTitle>
                        <DialogContent>
                            <Text>
                                Are you sure you want to permanently delete
                                model{" "}
                                <strong>{modelToDelete?.friendlyName}</strong>?
                                All user assignments will also be removed.
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
        </>
    );
}
