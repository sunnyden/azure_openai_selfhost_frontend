/**
 * Utility function to check if the app is running in an Electron environment
 */
export const isElectron = (): boolean => {
	return !!window?.electronAPI?.isElectron;
};

/**
 * Window control functions for Electron
 */
export const electronWindowControls = {
	minimize: async (): Promise<void> => {
		if (isElectron()) {
			await window.electronAPI?.windowMinimize();
		}
	},

	maximize: async (): Promise<void> => {
		if (isElectron()) {
			await window.electronAPI?.windowMaximize();
		}
	},

	close: async (): Promise<void> => {
		if (isElectron()) {
			await window.electronAPI?.windowClose();
		}
	},

	isMaximized: async (): Promise<boolean> => {
		if (isElectron()) {
			return (await window.electronAPI?.windowIsMaximized()) || false;
		}
		return false;
	},
};
