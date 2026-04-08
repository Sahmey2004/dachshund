import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import LandingPage from "./views/LandingPage.jsx";
import DashboardPage from "./views/DashboardPage.jsx";
import AboutPage from "./views/AboutPage.jsx";
import AuthPage from "./views/AuthPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
