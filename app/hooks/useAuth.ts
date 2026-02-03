import { useState, useEffect } from "react";
import type { User } from "~/types/user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const loginAction = (token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logoutAction = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    loginAction,
    logoutAction,
  };
}
