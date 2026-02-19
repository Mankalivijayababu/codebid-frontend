import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import jwt_decode from "jwt-decode";

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
    const decoded = jwt_decode(token);

    // 🔥 Role validation
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

          {/* MAIN LOGIN (TEAM + ADMIN TAB VERSION) */}
          <Route path="/" element={<LoginPage />} />

          {/* SEPARATE ADMIN LOGIN PAGE */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* TEAM DASHBOARD */}
          <Route
            path="/team"
            element={
              <ProtectedRoute role="team">
                <TeamDashboard />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
