import { IHttpContext } from "./interface/HttpContext.interface";
import { ApiResponse } from "./interface/data/common/ApiResponse";

export class HttpContext implements IHttpContext {
  private authHeader: string;
  constructor(private baseUrl: string) {
    if (!baseUrl) {
      throw Error("baseUrl is required!");
    }
    this.authHeader = "";
  }
  public async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(this.baseUrl + url, {
      method: "GET",
      headers: {
        Authorization: this.authHeader,
      },
    });
    return response.json();
  }

  public async post<P, T>(url: string, payload: P): Promise<ApiResponse<T>> {
    const response = await fetch(this.baseUrl + url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  public setAuth(auth: string): void {
    this.authHeader = `Bearer ${auth}`;
  }
}
