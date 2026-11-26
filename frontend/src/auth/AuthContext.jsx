import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { leerSesion, guardarSesion, borrarSesion } from "../session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion());

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    guardarSesion(data);
    setSesion(data);
  };

  const logout = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  // Si el servidor responde 401 (token vencido), se cierra la sesion automaticamente
  useEffect(() => {
    window.addEventListener("farmacias:sesion-expirada", logout);
    return () => window.removeEventListener("farmacias:sesion-expirada", logout);
  }, [logout]);

  const valor = useMemo(() => {
    const usuario = sesion ? sesion.usuario : null;
    const rol = usuario ? usuario.rol : null;
    return {
      usuario,
      rol,
      login,
      logout,
      puedeEscribir: rol === "ADMIN" || rol === "GERENTE",
      esAdmin: rol === "ADMIN",
      puedeVerBitacora: rol === "ADMIN" || rol === "AUDITOR",
    };
  }, [sesion, logout]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
