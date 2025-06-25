import { privateDecrypt } from "crypto";
import { IUserClient } from "./interface/ApiClient.interface";
import { IHttpContext } from "./interface/HttpContext.interface";
import { User } from "./interface/data/common/User";
import {
    LoginRequest,
    RemoveUserRequest,
} from "./interface/data/requests/login/UserRequests";

export class UserClient implements IUserClient {
    public isAdmin: boolean = false;
    public userName: string = "";
    private userCredentials: LoginRequest | null = null;
    constructor(private context: IHttpContext) {
        window.setInterval(() => {
            this.context.setAuth(this.authToken);
        }, 1000 * 60);
        this.context.setAuth(this.authToken);
    }

    public async auth(credentials: LoginRequest): Promise<void> {
        const response = await this.context.post<LoginRequest, string>(
            "/user/auth",
            credentials
        );
        if (!response.isSuccess || !response.data) {
            throw Error("Failed to authenticate");
        }
        this.authToken = response.data;
        this.context.setAuth(response.data);
        const jwtData = response.data.split(".")[1];
        const decodedJwtJsonData = window.atob(jwtData);
        const decodedJwtData = JSON.parse(decodedJwtJsonData);
        const role = decodedJwtData.role;
        this.isAdmin = role == "ADMIN";
        this.userName = decodedJwtData.username;
        this.userCredentials = credentials;
    }
    public async create(newUser: User): Promise<User> {
        const response = await this.context.post<User, User>(
            "/user/create",
            newUser
        );
        if (!response.isSuccess || !response.data) {
            throw Error("Failed to create user");
        }
        return response.data;
    }
    public async modify(modifiedUser: User): Promise<void> {
        const response = await this.context.post<User, void>(
            "/user/modify",
            modifiedUser
        );
        if (!response.isSuccess) {
            throw Error("Failed to modify user");
        }
    }
    public async remove(userId: number): Promise<void> {
        const response = await this.context.post<RemoveUserRequest, void>(
            "/user/delete",
            { userId: userId }
        );
        if (!response.isSuccess) {
            throw Error("Failed to remove user");
        }
    }
    public async list(): Promise<User[]> {
        const response = await this.context.get<User[]>("/user/list");
        if (!response.isSuccess || !response.data) {
            throw Error("Failed to fetch users");
        }
        return response.data;
    }
    public async getMyInfo(): Promise<User> {
        const response = await this.context.get<User>("/user/me");
        if (!response.isSuccess || !response.data) {
            throw Error("Failed to fetch user info");
        }
        return response.data;
    }
    public logout(): void {
        this.authToken = "";
        this.context.setAuth("");
    }

    private set authToken(token: string) {
        window.localStorage.setItem("authToken", token);
    }

    private get authToken(): string {
        const token = window.localStorage.getItem("authToken");
        if (!token || UserClient.isTokenExpired(token)) {
            return "";
        }
        if (UserClient.isTokenExpiring(token) && this.userCredentials) {
            this.refreshToken();
        }
        return token;
    }

    private async refreshToken(): Promise<void> {
        if (!this.userCredentials) {
            return;
        }
        const response = await this.context.post<LoginRequest, string>(
            "/user/auth",
            this.userCredentials
        );
        if (response.isSuccess && response.data) {
            this.authToken = response.data;
            this.context.setAuth(response.data);
        }
    }

    private static isTokenExpiring(token: string): boolean {
        const expireMargin = 1000 * 60 * 5; // 5 minutes
        if (!token) {
            return true;
        }
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
            return true;
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        const expires = payload.exp;
        const now = new Date();
        const expireDate = new Date(0);
        expireDate.setUTCSeconds(expires);
        return now.getTime() + expireMargin > expireDate.getTime();
    }

    private static isTokenExpired(token: string): boolean {
        if (!token) {
            return true;
        }
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
            return true;
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        const expires = payload.exp;
        const now = new Date();
        const expireDate = new Date(0);
        expireDate.setUTCSeconds(expires);
        return now.getTime() > expireDate.getTime();
    }
}
