import React from "react";
import { Text, makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
    statCard: {
        padding: "20px",
        border: "1px solid var(--colorNeutralStroke2)",
        borderRadius: "8px",
        backgroundColor: "var(--colorNeutralBackground1)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "box-shadow 0.2s ease-in-out",
        ":hover": {
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
    },
    statHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    statIcon: {
        fontSize: "16px",
        color: "var(--colorNeutralForeground2)",
    },
    statLabel: {
        fontSize: "14px",
        fontWeight: "500",
        color: "var(--colorNeutralForeground2)",
        lineHeight: "20px",
        margin: "0",
    },
    statValue: {
        fontSize: "28px",
        fontWeight: "600",
        lineHeight: "36px",
        margin: "0",
        color: "var(--colorNeutralForeground1)",
    },
});

interface StatCardProps {
    label: string;
    value: string | number;
    valueColor?: string;
    formatter?: (value: string | number) => string;
    icon?: React.ReactElement;
}

export function StatCard({
    label,
    value,
    valueColor,
    formatter,
    icon,
}: StatCardProps) {
    const styles = useStyles();

    const formattedValue = formatter ? formatter(value) : value.toString();

    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                {icon && <div className={styles.statIcon}>{icon}</div>}
                <Text className={styles.statLabel}>{label}</Text>
            </div>
            <Text
                className={styles.statValue}
                style={valueColor ? { color: valueColor } : undefined}
            >
                {formattedValue}
            </Text>
        </div>
    );
}

