// src/components/RequireAuth.jsx
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RequireAuth = ({ inverse = false }) => {
  const { token } = useContext(AuthContext);

  // inverse=true bo'lsa: faqat token yo'q bo'lganda ruxsat
  if (inverse) {
    return !token ? <Outlet /> : <Navigate to="/" replace />;
  }

  // normal holat: faqat token bo'lsa ruxsat
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
