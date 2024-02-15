import React from "react";
import { ApiClient } from "../../api/ApiClient";

const client = new ApiClient("/api");

export function useApiClient() {
	return React.useMemo(() => client, []);
}
