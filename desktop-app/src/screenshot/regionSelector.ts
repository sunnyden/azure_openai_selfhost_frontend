import { BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { captureAllScreens, DisplayCapture } from "./screenshotCapture";
import { getSelectorHtml } from "./selectorHtml";

/**
 * Creates one overlay BrowserWindow per display, each positioned exactly on
 * its corresponding screen. This ensures correct rendering regardless of
 * per-monitor DPI differences. The user can drag-select on any display;
 * the active overlay crops the result and all overlays close.
 *
 * Returns null if the user cancels (Escape).
 */
export async function captureScreenshotRegion(
    mainWindow: BrowserWindow
): Promise<string | null> {
    // 1. Capture every screen
    const virtualScreen = await captureAllScreens();

    if (virtualScreen.displays.length === 0) {
        throw new Error("No displays captured");
    }

    // 2. Create one overlay window per display
    const overlayWindows: BrowserWindow[] = [];
    const preloadPath = path.join(__dirname, "selectorPreload.js");

    for (const display of virtualScreen.displays) {
        const overlay = new BrowserWindow({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
            frame: false,
            transparent: false,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            hasShadow: false,
            enableLargerThanScreen: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preloadPath,
            },
        });

        overlay.setMenuBarVisibility(false);

        // Use screen-saver level to render above the taskbar on all platforms
        overlay.setAlwaysOnTop(true, "screen-saver");

        // Explicitly set bounds after creation to ensure we cover the full
        // display area including the taskbar (not just the work area)
        overlay.setBounds({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
        });

        overlayWindows.push(overlay);
    }

    // 3. Load HTML and send screenshot data for each overlay
    await Promise.all(
        virtualScreen.displays.map(async (display, i) => {
            const overlay = overlayWindows[i];
            const html = getSelectorHtml(
                display.bounds.width,
                display.bounds.height
            );
            await overlay.loadURL(
                `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
            );
            // Send this display's screenshot via IPC
            overlay.webContents.send("screenshot-display-data", {
                base64: display.base64,
                width: display.bounds.width,
                height: display.bounds.height,
                scaleFactor: display.scaleFactor,
            });
        })
    );

    // 4. Wait for selection or cancellation from any overlay
    return new Promise<string | null>(resolve => {
        let resolved = false;

        const closeAll = () => {
            for (const w of overlayWindows) {
                if (!w.isDestroyed()) w.close();
            }
        };

        const cleanup = () => {
            if (resolved) return;
            resolved = true;
            ipcMain.removeHandler("screenshot-region-selected");
            ipcMain.removeHandler("screenshot-region-cancelled");
            closeAll();
        };

        ipcMain.handle(
            "screenshot-region-selected",
            (_event, base64DataUrl: string) => {
                cleanup();
                resolve(base64DataUrl);
            }
        );

        ipcMain.handle("screenshot-region-cancelled", () => {
            cleanup();
            resolve(null);
        });

        // If any overlay is closed externally, cancel
        for (const overlay of overlayWindows) {
            overlay.on("closed", () => {
                if (!resolved) {
                    cleanup();
                    resolve(null);
                }
            });
        }
    });
}
