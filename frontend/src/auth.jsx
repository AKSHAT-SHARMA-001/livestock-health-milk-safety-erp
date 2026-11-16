import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
const Auth = createContext();
function expiresAt(user) {
  try {
    const payload = user.token
      .split(".")[0]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return Number(atob(payload).split(":")[3]) * 1000;
  } catch {
    return 0;
  }
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("erpUser"));
      return saved &&
        ["FARMER", "VET", "ADMIN"].includes(saved.role) &&
        expiresAt(saved) > Date.now()
        ? saved
        : null;
    } catch {
      return null;
    }
  });
  function login(u) {
    setUser(u);
    sessionStorage.setItem("erpUser", JSON.stringify(u));
  }
  function logout() {
    setUser(null);
    sessionStorage.removeItem("erpUser");
  }
  useEffect(() => {
    window.addEventListener("erp-session-expired", logout);
    return () => window.removeEventListener("erp-session-expired", logout);
  }, []);
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(logout, Math.max(0, expiresAt(user) - Date.now()));
    return () => clearTimeout(timer);
  }, [user]);
  return (
    <Auth.Provider value={{ user, login, logout }}>{children}</Auth.Provider>
  );
}
export const useAuth = () => useContext(Auth);
// Unit 2: role-based protected routes and useContext.
export function Protected({ roles, children }) {
  const { user } = useAuth();
  return !user ? (
    <Navigate to="/login" />
  ) : !roles.includes(user.role) ? (
    <Navigate to="/" />
  ) : (
    children
  );
}
