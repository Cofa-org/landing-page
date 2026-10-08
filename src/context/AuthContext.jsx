import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

/**
 * Provee el estado de sesión a toda la app.
 * Al montar, llama a GET /me para saber si hay una cookie activa.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  /** true mientras se verifica la sesión inicial — evita flashes de UI */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    authService
      .me(controller.signal)
      .then((me) => {
        if (!controller.signal.aborted) setUser(me);
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  /** login → setea la cookie y usa el perfil que devuelve el mismo POST. */
  const login = useCallback(async (email, password, turnstileToken) => {
    const me = await authService.login(email, password, turnstileToken);
    setUser(me);
    return me;
  }, []);

  /** logout → revoca la cookie + limpia el estado. */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Si la sesión ya expiró en el server, igual limpiamos el estado local
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
