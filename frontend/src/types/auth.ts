export type Role = "admin" | "barber" | "customer";

export interface User {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  role: Role;
  user: User;
}
