// Electron API declarations
declare global {
	interface Window {
		electronAPI?: {
			windowMinimize: () => Promise<void>;
			windowMaximize: () => Promise<void>;
			windowClose: () => Promise<void>;
			windowIsMaximized: () => Promise<boolean>;
			isElectron: boolean;
			openExternal: (url: string) => Promise<void>;
			getVersion: () => Promise<string>;
		};
	}
}

export {};
