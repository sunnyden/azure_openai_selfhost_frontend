import { makeStyles } from "@fluentui/react-components";

export const useAdminStyles = makeStyles({
    section: {
        border: "1px solid var(--colorNeutralStroke2)",
        borderRadius: "8px",
        backgroundColor: "var(--colorNeutralBackground1)",
        marginBottom: "16px",
        overflow: "hidden",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--colorNeutralStroke2)",
        backgroundColor: "var(--colorNeutralBackground2)",
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "16px",
        fontWeight: "600",
    },
    tableContainer: {
        overflowX: "auto",
    },
    actionButtons: {
        display: "flex",
        gap: "4px",
    },
    formRow: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
    },
    formField: {
        flex: "1 1 200px",
        minWidth: "200px",
    },
});
