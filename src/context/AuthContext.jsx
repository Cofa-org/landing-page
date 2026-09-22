import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
    authService
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /** login → setea la cookie + actualiza el estado. */
  const login = useCallback(async (email, password, turnstileToken) => {
    // 1. Autentica y recibe la cookie de sesión
    await authService.login(email, password, turnstileToken);
    // 2. Usa la cookie para obtener los datos del usuario
    try {
      const me = await authService.me();
      setUser(me);
      return me;
    } catch (meError) {
      // Si /me falla inmediatamente después del login (edge case de timing),
      // no dejamos un estado inconsistente: limpiamos y relanzamos.
      setUser(null);
      throw meError;
    }
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
