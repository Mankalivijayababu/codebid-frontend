import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import LoginPage from "./pages/LoginPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TeamDashboard from "./pages/TeamDashboard";

/**
 * 🔐 Admin Route Protection
 */
function AdminProtected({ children }) {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin-login" />;
}

/**
 * 👥 Team Route Protection
 */
function TeamProtected({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="499618344811-iqp4jk3c7fccll4jophrsq3mt5moglr2.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>

          {/* MAIN LOGIN */}
          <Route path="/" element={<LoginPage />} />

          {/* ADMIN LOGIN */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <AdminProtected>
                <AdminDashboard />
              </AdminProtected>
            }
          />

          {/* TEAM DASHBOARD */}
          <Route
            path="/team"
            element={
              <TeamProtected>
                <TeamDashboard />
              </TeamProtected>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
