import { authStore } from "../store/authStore";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => "");
  return text || null;
}

function errorMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) return String((item as { msg: unknown }).msg);
          return String(item);
        })
        .join(", ");
    }
  }
  if (typeof payload === "string") return payload;
  return "Request failed";
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = authStore.getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await readPayload(response);
  if (!response.ok) {
    if (response.status === 401) {
      const isAuthRoute = window.location.pathname.includes("/login") || window.location.pathname.includes("/register");
      if (!isAuthRoute) {
        authStore.signOut();
        const currentPath = window.location.pathname;
        let loginUrl = "/customer/login";
        if (currentPath.startsWith("/admin")) loginUrl = "/admin/login";
        if (currentPath.startsWith("/barber")) loginUrl = "/barber/login";
        
        window.location.href = `${loginUrl}?error=${encodeURIComponent("Session expired. Please login again.")}`;
        throw new ApiError(response.status, "Session expired", payload);
      }
    }
    throw new ApiError(response.status, errorMessage(payload), payload);
  }
  return payload as T;
}
