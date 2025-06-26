import { lazy } from "react";

// Dynamically import heavy pages
export const UsagePage = lazy(() =>
    import("../page/UsagePage/UsagePage").then(module => ({
        default: module.UsagePage,
    }))
);

export const MCPManagementPage = lazy(() =>
    import("../page/MCPManagementPage/MCPManagementPage").then(module => ({
        default: module.MCPManagementPage,
    }))
);

