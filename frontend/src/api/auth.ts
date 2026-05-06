import { apiRequest } from "./client";
import type { LoginResponse, User } from "../types/auth";

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerCustomer(email: string, password: string, fullName?: string, phone?: string) {
  return apiRequest<User>("/auth/customer", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName, phone }),
  });
}

export function me() {
  return apiRequest<User>("/users/me");
}
