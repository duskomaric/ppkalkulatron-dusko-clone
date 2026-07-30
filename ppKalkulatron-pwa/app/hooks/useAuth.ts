/**
 * Auth state lives in a single AuthProvider (see contexts/AuthContext.tsx).
 * Re-exported here so existing `~/hooks/useAuth` imports keep working.
 */
export { useAuth } from "~/contexts/AuthContext";
