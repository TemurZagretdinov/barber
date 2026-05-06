import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

export const TOKEN_STORAGE_KEY = "sharp-cuts-mobile-token";

const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8090";

export const API_BASE_URL = configuredUrl.replace(/\/$/, "");

console.log("API_BASE_URL:", API_BASE_URL);

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

function paramsToQuery(params: unknown): string {
  if (!params || typeof params !== "object") {
    return "";
  }

  const entries = Object.entries(params as Record<string, unknown>).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => [key, String(item)]);
    }
    return [[key, String(value)]];
  });

  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : "";
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const path = `${config.url ?? ""}${paramsToQuery(config.params)}`;
  console.log("REQUEST URL:", `${API_BASE_URL}${path}`);

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const responseText =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data
          ? JSON.stringify(error.response.data)
          : "";

    console.error("API ERROR:", error);
    console.error("STATUS:", status);
    console.error("RESPONSE:", responseText);

    if (!error.response) {
      throw new ApiError("Server bilan bog'lanishda muammo bor. API URL va backend ishlayotganini tekshiring.");
    }

    const data = error.response.data as { detail?: unknown } | undefined;
    let message = "Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.";

    if (status === 404) {
      message = "Ma'lumot topilmadi.";
    } else if (status && status >= 500) {
      message = "Server xatosi yuz berdi. Keyinroq urinib ko'ring.";
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item)))
        .join(", ");
    }

    throw new ApiError(message, status);
  },
);
