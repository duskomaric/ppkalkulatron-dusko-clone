import { fetchApi } from "~/utils/api";
import type { User } from "~/types/user";

export async function updateUser(userId: number, token: string, userData: Partial<User>): Promise<{ data: User }> {
  return fetchApi<{ data: User }>(`/users/${userId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(userData),
  });
}
