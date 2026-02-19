import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";   // ✅ FIXED

import LoginPage from "./pages/LoginPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TeamDashboard from "./pages/TeamDashboard";

/**
 * 🔐 Generic Role Protection
 */
function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);  // ✅ FIXED

    if (decoded.role !== role) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (err) {
    return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="499618344811-iqp4jk3c7fccll4jophrsq3mt5moglr2.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute role="team">
                <TeamDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
