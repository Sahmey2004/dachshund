import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background:
            'linear-gradient(180deg, rgba(214, 235, 244, 0.95), rgba(245, 232, 215, 0.94)), url("/design/background.png") center/cover no-repeat',
          color: "#4d3d31",
          fontWeight: 700,
        }}
      >
        Checking your Dachshund session...
      </div>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/auth" />;
  }

  return children;
}
