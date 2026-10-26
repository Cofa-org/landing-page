import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import { AUTH_SESSION_CAUSE, AUTH_SESSION_CONFIG, AUTH_SESSION_EVENT } from "../constants/AUTH.js";
import { writeAuthFlash } from "../screens/auth/authFlash.js";

const LOGIN_PATH = "/ingresar";

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
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error?.cause === AUTH_SESSION_CAUSE.INVALID) writeAuthFlash(AUTH_SESSION_CONFIG.EXPIRED_MESSAGE);
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // El back decide el vencimiento. Tras 30 min sin pedidos se le consulta para
  // sacar al usuario aunque no toque nada; un pedido rechazado por sesión también.
  useEffect(() => {
    if (!user) return undefined;
    let timer;
    let active = true;
    const schedule = () => {
      clearTimeout(timer);
      if (!active) return;
      timer = setTimeout(() => {
        authService.me().catch(() => schedule());
      }, AUTH_SESSION_CONFIG.IDLE_MS);
    };
    const onExpired = () => {
      active = false;
      clearTimeout(timer);
      writeAuthFlash(AUTH_SESSION_CONFIG.EXPIRED_MESSAGE);
      // Con la recarga se limpia el estado; un setUser(null) antes dejaría que la
      // ruta privada navegue al login, consuma el aviso y la recarga lo pierda.
      if (window.location.pathname !== LOGIN_PATH) window.location.assign(LOGIN_PATH);
      else setUser(null);
    };

    schedule();
    window.addEventListener(AUTH_SESSION_EVENT.ACTIVITY, schedule);
    window.addEventListener(AUTH_SESSION_EVENT.EXPIRED, onExpired);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener(AUTH_SESSION_EVENT.ACTIVITY, schedule);
      window.removeEventListener(AUTH_SESSION_EVENT.EXPIRED, onExpired);
    };
  }, [user]);

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
