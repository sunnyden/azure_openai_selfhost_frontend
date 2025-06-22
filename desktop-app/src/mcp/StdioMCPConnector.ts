import { MCPConnector } from "./MCPConnector";
import { StdioMCPConfiguration } from "./type";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class StdioMCPConnector extends MCPConnector {
    private childProcess?: ChildProcessWithoutNullStreams;
    constructor(private readonly config: StdioMCPConfiguration, window: Electron.BrowserWindow){
        console.log("StdioMCPConnector created with config:", config);
        super(window);
    }
    
    protected connect(): void {
        console.log("Connecting to MCP with command:", this.config.command);
        const { command, args, env, cwd } = this.config;
        this.childProcess = spawn(command, args, {
            env: env,
            cwd: cwd,
            stdio: ["pipe", "pipe", "pipe"]
        });
        if (!this.childProcess.stdout || !this.childProcess.stderr) {
            throw new Error("Failed to start child process");
        }
        this.childProcess.stdout.on("data", (data: Buffer) => {
            const arrayBuffer = new ArrayBuffer(data.length);
            const view = new Uint8Array(arrayBuffer);
            view.set(new Uint8Array(data));
            this.onMessageReceived(arrayBuffer);
        });
    }

    protected disconnect(): void {
        this.childProcess?.kill();
    }

    protected sendToServer(data: ArrayBuffer): void {
        if (!this.childProcess || !this.childProcess.stdin) {
            return;
        }
        console.log("Sending data to MCP server:", data);
        const view = new Uint8Array(data);
        this.childProcess.stdin.write(view);
    }
}