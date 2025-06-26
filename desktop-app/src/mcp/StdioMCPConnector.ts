import { MCPConnector } from "./MCPConnector";
import { StdioMCPConfiguration } from "./type";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class StdioMCPConnector extends MCPConnector {
    private childProcess?: ChildProcessWithoutNullStreams;
    constructor(
        private readonly config: StdioMCPConfiguration,
        window: Electron.BrowserWindow,
        sessionId: string
    ) {
        console.log("StdioMCPConnector created with config:", config);
        super(window, sessionId);
    }

    protected connect(): void {
        console.log("Connecting to MCP with command:", this.config.command);
        const { command, args, env, cwd } = this.config;

        try {
            this.childProcess = spawn(command, args, {
                env: env,
                cwd: cwd,
                stdio: ["pipe", "pipe", "pipe"],
            });
        } catch (error) {
            throw new Error(
                `Failed to spawn process "${command}": ${error instanceof Error ? error.message : error}`
            );
        }

        if (
            !this.childProcess.stdout ||
            !this.childProcess.stderr ||
            !this.childProcess.stdin
        ) {
            throw new Error(
                "Failed to establish communication channels with child process"
            );
        }

        // Handle process errors
        this.childProcess.on("error", error => {
            const errorMsg = `MCP process error: ${error.message}`;
            console.error(errorMsg);
            this.onError(new Error(errorMsg));
        });

        this.childProcess.on("exit", (code, signal) => {
            if (code !== 0 && code !== null) {
                const errorMsg = `MCP process exited with code ${code}${signal ? ` (signal: ${signal})` : ""}`;
                console.error(errorMsg);
                this.onError(new Error(errorMsg));
            }
        });

        // Handle stderr output as potential error information
        this.childProcess.stderr.on("data", data => {
            const errorOutput = data.toString().trim();
            if (errorOutput) {
                console.warn("MCP process stderr:", errorOutput);
                // Log stderr but don't treat as fatal error during normal operation
                console.warn("MCP server stderr:", errorOutput);
            }
        });

        // Handle successful connection
        this.childProcess.stdout.on("data", (data: Buffer) => {
            const arrayBuffer = new ArrayBuffer(data.length);
            const view = new Uint8Array(arrayBuffer);
            view.set(new Uint8Array(data));
            this.onMessageReceived(arrayBuffer);
        });
    }

    protected disconnect(): void {
        if (this.childProcess) {
            try {
                if (!this.childProcess.killed) {
                    this.childProcess.kill("SIGTERM");

                    // Give the process a moment to exit gracefully
                    setTimeout(() => {
                        if (this.childProcess && !this.childProcess.killed) {
                            console.warn(
                                "MCP process did not exit gracefully, force killing"
                            );
                            this.childProcess.kill("SIGKILL");
                        }
                    }, 5000);
                }
            } catch (error) {
                console.error("Error disconnecting from MCP process:", error);
            } finally {
                this.childProcess = undefined;
            }
        }
    }

    protected sendToServer(data: ArrayBuffer): void {
        if (!this.childProcess || !this.childProcess.stdin) {
            console.warn("Cannot send data: MCP process not available");
            return;
        }

        if (this.childProcess.killed || this.childProcess.exitCode !== null) {
            console.warn("Cannot send data: MCP process has exited");
            this.onError(new Error("MCP process has unexpectedly terminated"));
            return;
        }

        try {
            console.log("Sending data to MCP server:", data);
            const view = new Uint8Array(data);
            this.childProcess.stdin.write(view);
        } catch (error) {
            console.error("Error sending data to MCP server:", error);
            this.onError(
                new Error(
                    `Failed to send data to MCP server: ${error instanceof Error ? error.message : error}`
                )
            );
        }
    }
}
