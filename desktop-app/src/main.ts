import { app, BrowserWindow, Menu, shell, ipcMain } from "electron";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import { createServer } from "net";

class MainApp {
	private mainWindow: BrowserWindow | null = null;
	private devServerProcess: ChildProcess | null = null;
	private isDevelopment: boolean =
		process.env.NODE_ENV === "development" ||
		process.env.ELECTRON_DEV === "true";

	constructor() {
		this.initializeApp();
	}
	private initializeApp(): void {
		// This method will be called when Electron has finished initialization
		app.whenReady().then(async () => {
			if (this.isDevelopment) {
				await this.startDevelopmentServer();
			}
			this.createWindow();
			this.setupMenu();
			this.setupIpcHandlers(); // Add IPC handlers

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
				this.cleanup();
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
			titleBarStyle: "hidden", // Hide the default title bar
			titleBarOverlay: false, // Disable overlay on Windows 11
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				webSecurity: true,
				preload: path.join(__dirname, "preload.js"), // Enable preload script
			},
			show: false, // Don't show until ready
			icon: this.getIconPath(),
		});
		// Load the appropriate URL
		const url = this.isDevelopment
			? "http://localhost:3000"
			: "https://chat.hq.gd";
		this.mainWindow.loadURL(url);

		// Show window when ready to prevent visual flash
		this.mainWindow.once("ready-to-show", () => {
			this.mainWindow?.show(); // Open DevTools in development
			if (this.isDevelopment) {
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

	private setupIpcHandlers(): void {
		// Window control handlers
		ipcMain.handle("window-minimize", () => {
			this.mainWindow?.minimize();
		});

		ipcMain.handle("window-maximize", () => {
			if (this.mainWindow?.isMaximized()) {
				this.mainWindow.unmaximize();
			} else {
				this.mainWindow?.maximize();
			}
		});

		ipcMain.handle("window-close", () => {
			this.mainWindow?.close();
		});

		ipcMain.handle("window-is-maximized", () => {
			return this.mainWindow?.isMaximized() || false;
		});

		// Other existing handlers
		ipcMain.handle("open-external", (event, url: string) => {
			shell.openExternal(url);
		});

		ipcMain.handle("get-version", () => {
			return app.getVersion();
		});
	}

	private async startDevelopmentServer(): Promise<void> {
		console.log("Starting development server...");

		// Check if port 3000 is already in use
		const isPortAvailable = await this.checkPortAvailable(3000);
		if (!isPortAvailable) {
			console.log(
				"Port 3000 is already in use, assuming React dev server is running"
			);
			return;
		}
		return new Promise((resolve, reject) => {
			// Calculate the correct project root path
			// __dirname will be desktop-app/dist when compiled
			// We need to go up to the parent directory of desktop-app
			const projectRoot = path.resolve(__dirname, "..", "..");

			console.log("Project root:", projectRoot);

			// Start the React development server
			this.devServerProcess = spawn("npm", ["start"], {
				cwd: projectRoot,
				shell: true,
				stdio: "pipe",
			});

			if (
				!this.devServerProcess.stdout ||
				!this.devServerProcess.stderr
			) {
				reject(new Error("Failed to start development server"));
				return;
			}

			// Listen for server ready signal
			this.devServerProcess.stdout.on("data", (data: Buffer) => {
				const output = data.toString();
				console.log("React server:", output);

				// Check if the development server is ready
				if (
					output.includes("webpack compiled") ||
					output.includes("Local:")
				) {
					setTimeout(resolve, 2000); // Give it a moment to fully start
				}
			});

			this.devServerProcess.stderr.on("data", (data: Buffer) => {
				console.error("React server error:", data.toString());
			});

			this.devServerProcess.on("error", (error: Error) => {
				console.error("Failed to start development server:", error);
				reject(error);
			});

			// Timeout after 30 seconds
			setTimeout(() => {
				if (this.devServerProcess && !this.devServerProcess.killed) {
					resolve(); // Assume it's ready even if we didn't get the signal
				}
			}, 30000);
		});
	}

	private checkPortAvailable(port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const server = createServer();

			server.listen(port, () => {
				server.once("close", () => {
					resolve(true);
				});
				server.close();
			});

			server.on("error", () => {
				resolve(false);
			});
		});
	}

	private cleanup(): void {
		if (this.devServerProcess) {
			console.log("Stopping development server...");
			this.devServerProcess.kill("SIGTERM");
			this.devServerProcess = null;
		}
	}
}

// Create the main application instance
new MainApp();
