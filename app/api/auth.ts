import { fetchApi } from "~/utils/api";
import type { User } from "../types/user";

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return fetchApi<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
