// This file contains utilities for the renderer process (web content)
// It can be imported by any web scripts that need to interact with Electron APIs

export interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    getVersion: () => Promise<string>;
}

// Type declaration for the global electronAPI
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Utility functions that can be used in the web app
export class DesktopUtils {
    static isElectron(): boolean {
        return isBrowser && typeof (window as any).electronAPI !== "undefined";
    }

    static async openExternalUrl(url: string): Promise<void> {
        if (this.isElectron() && isBrowser) {
            await (window as any).electronAPI.openExternal(url);
        } else if (isBrowser) {
            window.open(url, "_blank");
        }
    }

    static async getAppVersion(): Promise<string> {
        if (this.isElectron() && isBrowser) {
            return await (window as any).electronAPI.getVersion();
        }
        return "web";
    }
}
