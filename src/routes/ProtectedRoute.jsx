import React from "react";
import { Navigate } from "react-router-dom";
import { hasAnyRole } from "../components/utils/auth";

const ProtectedRoute = ({ children, requiredRoles, redirectTo = "/unauthorized" }) => {
  const { token } = JSON.parse(localStorage.getItem("authData") || "{}");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;