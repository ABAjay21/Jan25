import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  // Check if the token exists and is valid
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Optionally: Add token expiration check
  const isTokenExpired = (token: string) => {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.exp * 1000 < Date.now();
  };

  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
