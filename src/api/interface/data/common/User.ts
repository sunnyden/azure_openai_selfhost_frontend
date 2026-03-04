export type User = {
    id?: number;
    userName: string;
    isAdmin: boolean;
    remainingCredit: number;
    creditQuota: number;
    lastCreditReset?: string | null;
    password?: string;
};
