import React, { useCallback, useEffect, useMemo } from "react";
import { User } from "../../api/interface/data/common/User";
import { useApiClient } from "./useApiClient";

type UserContextData = {
    authenticatedUser?: User;
    authenticate: (username: string, password: string) => Promise<void>;
    logout: () => void;
    userList: User[];
    fetchUserList: () => Promise<void>;
    initialized: boolean;
};

const UserContext = React.createContext<UserContextData>({
    authenticate: async () => {},
    logout: () => {},
    userList: [],
    fetchUserList: async () => {},
    initialized: false,
});

export function UserContextProvider(props: { children: React.ReactNode }) {
    const [authenticatedUser, setAuthenticatedUser] = React.useState<User>();
    const [userList, setUserList] = React.useState<User[]>([]);
    const [initialized, setInitialized] = React.useState(false);
    const client = useApiClient();
    const authenticate = useCallback(async (username: string, password: string) => {
        await client.userClient.auth({ userName: username, password });
        await client.mcpHubService.start();
        setAuthenticatedUser(await client.userClient.getMyInfo());
    }, [client]);

    useEffect(() => {
        client.userClient
            .getMyInfo()
            .then(user => {
                setAuthenticatedUser(user);
            })
            .catch(() => {})
            .finally(() => {
                setInitialized(true);
            });
    }, []);

    const logout = useCallback(() => {
        setAuthenticatedUser(undefined);
        client.userClient.logout();
    }, [client]);

    const fetchUserList = useCallback(async () => {
        setUserList(await client.userClient.list());
    }, [client]);

    const contextValue = useMemo(() => ({
        authenticatedUser,
        authenticate,
        logout,
        userList,
        fetchUserList,
        initialized,
    }), [authenticatedUser, authenticate, logout, userList, fetchUserList, initialized]);

    return (
        <UserContext.Provider
            value={contextValue}
        >
            {props.children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    return React.useContext(UserContext);
}
