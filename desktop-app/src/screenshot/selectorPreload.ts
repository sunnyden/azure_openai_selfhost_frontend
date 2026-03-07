import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("screenshotAPI", {
    selectRegion: (base64DataUrl: string) =>
        ipcRenderer.invoke("screenshot-region-selected", base64DataUrl),
    cancel: () => ipcRenderer.invoke("screenshot-region-cancelled"),
    onDisplayData: (callback: (data: any) => void) => {
        ipcRenderer.on("screenshot-display-data", (_event, data) => {
            callback(data);
        });
    },
});
