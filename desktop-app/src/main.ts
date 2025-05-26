import { app, BrowserWindow, Menu, shell } from "electron";
import * as path from "path";

class MainApp {
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		this.initializeApp();
	}

	private initializeApp(): void {
		// This method will be called when Electron has finished initialization
		app.whenReady().then(() => {
			this.createWindow();
			this.setupMenu();

			app.on("activate", () => {
				// On macOS it's common to re-create a window in the app when the
				// dock icon is clicked and there are no other windows open.
				if (BrowserWindow.getAllWindows().length === 0) {
					this.createWindow();
				}
			});
		});

		// Quit when all windows are closed, except on macOS
		app.on("window-all-closed", () => {
			if (process.platform !== "darwin") {
				app.quit();
			}
		}); // Handle security - prevent new window creation
		app.on("web-contents-created", (event, contents) => {
			contents.setWindowOpenHandler(({ url }) => {
				shell.openExternal(url);
				return { action: "deny" };
			});
		});
	}

	private createWindow(): void {
		// Create the browser window
		this.mainWindow = new BrowserWindow({
			width: 1200,
			height: 800,
			minWidth: 800,
			minHeight: 600,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				webSecurity: true,
			},
			show: false, // Don't show until ready
			icon: this.getIconPath(),
		});

		// Load the remote URL
		this.mainWindow.loadURL("https://chat.hq.gd");

		// Show window when ready to prevent visual flash
		this.mainWindow.once("ready-to-show", () => {
			this.mainWindow?.show();

			// Open DevTools in development
			if (process.env.NODE_ENV === "development") {
				this.mainWindow?.webContents.openDevTools();
			}
		});

		// Handle window closed
		this.mainWindow.on("closed", () => {
			this.mainWindow = null;
		});

		// Handle external links
		this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url);
			return { action: "deny" };
		});
	}

	private getIconPath(): string | undefined {
		const iconPath = path.join(__dirname, "..", "assets");

		if (process.platform === "win32") {
			return path.join(iconPath, "icon.ico");
		} else if (process.platform === "darwin") {
			return path.join(iconPath, "icon.icns");
		} else {
			return path.join(iconPath, "icon.png");
		}
	}

	private setupMenu(): void {
		const template: Electron.MenuItemConstructorOptions[] = [
			{
				label: "File",
				submenu: [
					{
						label: "Reload",
						accelerator: "CmdOrCtrl+R",
						click: () => {
							this.mainWindow?.reload();
						},
					},
					{
						label: "Force Reload",
						accelerator: "CmdOrCtrl+Shift+R",
						click: () => {
							this.mainWindow?.webContents.reloadIgnoringCache();
						},
					},
					{ type: "separator" },
					{
						label: "Quit",
						accelerator:
							process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
						click: () => {
							app.quit();
						},
					},
				],
			},
			{
				label: "Edit",
				submenu: [
					{ role: "undo" },
					{ role: "redo" },
					{ type: "separator" },
					{ role: "cut" },
					{ role: "copy" },
					{ role: "paste" },
				],
			},
			{
				label: "View",
				submenu: [
					{ role: "toggleDevTools" },
					{ type: "separator" },
					{ role: "resetZoom" },
					{ role: "zoomIn" },
					{ role: "zoomOut" },
					{ type: "separator" },
					{ role: "togglefullscreen" },
				],
			},
			{
				label: "Window",
				submenu: [{ role: "minimize" }, { role: "close" }],
			},
		];

		if (process.platform === "darwin") {
			// macOS specific menu adjustments
			template.unshift({
				label: app.getName(),
				submenu: [
					{ role: "about" },
					{ type: "separator" },
					{ role: "services" },
					{ type: "separator" },
					{ role: "hide" },
					{ role: "hideOthers" },
					{ role: "unhide" },
					{ type: "separator" },
					{ role: "quit" },
				],
			});

			// Window menu
			(template[4].submenu as Electron.MenuItemConstructorOptions[]).push(
				{ type: "separator" },
				{ role: "front" }
			);
		}

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}
}

// Create the main application instance
new MainApp();
