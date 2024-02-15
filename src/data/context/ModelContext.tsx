import React, { useEffect } from "react";
import { Model } from "../../api/interface/data/common/Model";
import { useApiClient } from "./useApiClient";
import { useUserContext } from "./UserContext";

type ModelContextType = {
	modelList: Model[];
	currentModel: Model | undefined;
	setCurrentModel: (model: Model) => void;
};
const ModelContext = React.createContext<ModelContextType>({
	modelList: [],
	currentModel: undefined,
	setCurrentModel: (model: Model) => {},
});

export function ModelProvider(props: { children: React.ReactNode }) {
	const client = useApiClient();
	const { authenticatedUser } = useUserContext();
	const [modelList, setModelList] = React.useState<Model[]>([]);
	const [currentModel, setCurrentModel] = React.useState<Model>();
	useEffect(() => {
		if (authenticatedUser) {
			client.modelClient.myModels().then((models) => {
				setModelList(models);
				if (models.length > 0) {
					setCurrentModel(models[0]);
				}
			});
		}
	}, [authenticatedUser]);
	return (
		<ModelContext.Provider
			value={{ modelList, currentModel, setCurrentModel }}
		>
			{props.children}
		</ModelContext.Provider>
	);
}

export function useModelContext() {
	return React.useContext(ModelContext);
}
