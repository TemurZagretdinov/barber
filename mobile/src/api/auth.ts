import { apiClient } from "./client";
import type { LoginResponse, User } from "../types/auth";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>("/users/me");
  return response.data;
}

export async function registerCustomer(
  email: string,
  password: string,
  profile: { full_name?: string | null; phone?: string | null } = {},
): Promise<User> {
  const response = await apiClient.post<User>("/auth/customer", {
    email,
    password,
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
  });
  return response.data;
}
