import React, { useEffect } from "react";
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
	const authenticate = async (username: string, password: string) => {
		await client.userClient.auth({ userName: username, password });
		setAuthenticatedUser(await client.userClient.getMyInfo());
	};

	useEffect(() => {
		client.userClient
			.getMyInfo()
			.then((user) => {
				setAuthenticatedUser(user);
			})
			.catch(() => {})
			.finally(() => {
				setInitialized(true);
			});
	}, []);

	const logout = () => {
		setAuthenticatedUser(undefined);
		client.userClient.logout();
	};

	const fetchUserList = async () => {
		setUserList(await client.userClient.list());
	};

	return (
		<UserContext.Provider
			value={{
				authenticatedUser,
				authenticate,
				logout,
				userList,
				fetchUserList,
				initialized,
			}}
		>
			{props.children}
		</UserContext.Provider>
	);
}

export function useUserContext() {
	return React.useContext(UserContext);
}
