import React, { createContext, useContext, useState } from "react";
import { Navigate } from "react-router-dom";
const Auth = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("erpUser"));
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
