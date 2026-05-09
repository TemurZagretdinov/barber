import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    silentStatuses?: number[];
  }

  export interface InternalAxiosRequestConfig {
    _networkRetry?: boolean;
    silentStatuses?: number[];
  }
}

export const TOKEN_STORAGE_KEY = "sharp-cuts-mobile-token";
export const USER_STORAGE_KEY = "sharp-cuts-mobile-user";
export const API_FALLBACK_URL = "https://barber-backend-nukr.onrender.com";

const NETWORK_RETRY_DELAY_MS = 800;

type RetryableAxiosConfig = NonNullable<AxiosError["config"]> & {
  _networkRetry?: boolean;
  silentStatuses?: number[];
};

function getConfiguredApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  return envUrl || API_FALLBACK_URL;
}

const configuredUrl = getConfiguredApiUrl();

export const API_BASE_URL = configuredUrl.replace(/\/$/, "");

let unauthorizedHandler: (() => Promise<void> | void) | null = null;
let clearingUnauthorizedSession = false;

if (__DEV__) {
  console.log("API_BASE_URL:", API_BASE_URL);
}

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

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  timeoutErrorMessage: "API request timed out.",
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestUrl(config?: AxiosError["config"]): string {
  if (!config) {
    return API_BASE_URL;
  }

  return `${config.baseURL ?? API_BASE_URL}${config.url ?? ""}${paramsToQuery(config.params)}`;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const path = `${config.url ?? ""}${paramsToQuery(config.params)}`;
  if (__DEV__) {
    console.log("REQUEST URL:", `${API_BASE_URL}${path}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetryableAxiosConfig | undefined;
    const method = config?.method?.toLowerCase() ?? "get";

    if (!error.response && config && method === "get" && !config._networkRetry) {
      config._networkRetry = true;
      await delay(NETWORK_RETRY_DELAY_MS);
      return apiClient.request(config);
    }

    const responseText =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data
          ? JSON.stringify(error.response.data)
          : "";

    const shouldLogError = !status || !config?.silentStatuses?.includes(status);

    if (__DEV__ && shouldLogError) {
      console.log("API ERROR:", {
        message: error.message,
        code: error.code,
        method,
        url: requestUrl(config),
        status,
        response: responseText || undefined,
      });
    }

    if (!error.response) {
      throw new ApiError("Server bilan bog‘lanishda muammo bor. Internet yoki API URL’ni tekshiring.");
    }

    const data = error.response.data as { detail?: unknown } | undefined;
    let message = "Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.";

    if (status === 401) {
      message = "Sessiya tugagan. Iltimos, qayta kiring.";
      if (!clearingUnauthorizedSession) {
        clearingUnauthorizedSession = true;
        try {
          if (unauthorizedHandler) {
            await unauthorizedHandler();
          } else {
            await clearStoredSession();
          }
        } finally {
          clearingUnauthorizedSession = false;
        }
      }
    } else if (status === 404) {
      message = "Ma’lumot topilmadi.";
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
