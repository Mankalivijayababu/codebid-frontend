import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

/* 🔥 PRODUCTION API CONFIG */
const BASE_URL =
  import.meta.env.VITE_API_URL ;

const API = `${BASE_URL}/api`;

export default function LoginPage() {
  const [mode, setMode] = useState("team"); // team | signup | admin
  const [form, setForm] = useState({
    teamName: "",
    repName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ───────── TEAM LOGIN ───────── */
  const handleTeamLogin = async () => {
    try {
      setError("");

      const res = await axios.post(`${API}/auth/login`, {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/team";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  /* ───────── TEAM SIGNUP ───────── */
  const handleSignup = async () => {
    try {
      setError("");

      await axios.post(`${API}/auth/signup`, form);

      alert("Team created successfully! Now login.");
      setMode("team");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  /* ───────── ADMIN LOGIN ───────── */
  const handleAdminLogin = async () => {
    try {
      setError("");

      const res = await axios.post(`${API}/admin/login`, {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed");
    }
  };

  /* ───────── GOOGLE ADMIN LOGIN ───────── */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API}/auth/google`, {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/admin";
    } catch {
      alert("Google admin login failed");
    }
  };

  /* ───────────────── UI ───────────────── */

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* TITLE */}
        <div style={styles.logo}>
          CODE<span style={{ color: "#ffd60a" }}>BID</span>
        </div>
        <p style={styles.subtitle}>THE BIDDING CODE CHAMPIONSHIP</p>

        {/* TABS */}
        <div style={styles.tabs}>
          <button
            onClick={() => setMode("team")}
            style={mode === "team" ? styles.activeTab : styles.tab}
          >
            🎮 Team Login
          </button>

          <button
            onClick={() => setMode("signup")}
            style={mode === "signup" ? styles.activeTab : styles.tab}
          >
            ✏️ Sign Up
          </button>

          <button
            onClick={() => setMode("admin")}
            style={mode === "admin" ? styles.activeTab : styles.tab}
          >
            🛡 Admin
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* TEAM LOGIN */}
        {mode === "team" && (
          <>
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              style={styles.input}
            />

            <button onClick={handleTeamLogin} style={styles.primaryBtn}>
              LOGIN →
            </button>
          </>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <>
            <input
              name="teamName"
              placeholder="Team Name"
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="repName"
              placeholder="Representative Name"
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              style={styles.input}
            />

            <button onClick={handleSignup} style={styles.secondaryBtn}>
              CREATE TEAM →
            </button>
          </>
        )}

        {/* ADMIN LOGIN */}
        {mode === "admin" && (
          <>
            <input
              name="email"
              placeholder="Admin Email"
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              style={styles.input}
            />

            <button onClick={handleAdminLogin} style={styles.adminBtn}>
              ADMIN LOGIN →
            </button>

            <div style={{ marginTop: 18 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert("Google login failed")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* STYLES */

const styles = {
  container: {
    height: "100vh",
    background: "#05050f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    fontFamily: "Rajdhani",
  },

  card: {
    width: 420,
    padding: 35,
    background: "#0c0c1e",
    borderRadius: 14,
    border: "1px solid #1a1a3a",
    boxShadow: "0 0 40px rgba(0,255,157,0.08)",
  },

  logo: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "900",
    fontFamily: "Orbitron",
    color: "#00ff9d",
    marginBottom: 4,
  },

  subtitle: {
    textAlign: "center",
    color: "#55557a",
    fontSize: 12,
    letterSpacing: "3px",
    marginBottom: 28,
  },

  tabs: {
    display: "flex",
    marginBottom: 18,
    gap: 6,
  },

  tab: {
    flex: 1,
    padding: 10,
    background: "#030308",
    border: "1px solid #111128",
    color: "#888",
    cursor: "pointer",
    borderRadius: 8,
  },

  activeTab: {
    flex: 1,
    padding: 10,
    background: "rgba(0,255,157,0.1)",
    border: "1px solid #00ff9d",
    color: "#00ff9d",
    cursor: "pointer",
    borderRadius: 8,
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    padding: 14,
    margin: "8px 0",
    background: "#030308",
    border: "1px solid #111128",
    borderRadius: 8,
    color: "#fff",
  },

  primaryBtn: {
    width: "100%",
    padding: 14,
    marginTop: 10,
    background: "rgba(0,255,157,0.1)",
    border: "1px solid #00ff9d",
    color: "#00ff9d",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: 8,
  },

  secondaryBtn: {
    width: "100%",
    padding: 14,
    marginTop: 10,
    background: "rgba(255,214,10,0.1)",
    border: "1px solid #ffd60a",
    color: "#ffd60a",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: 8,
  },

  adminBtn: {
    width: "100%",
    padding: 14,
    marginTop: 10,
    background: "rgba(255,77,109,0.1)",
    border: "1px solid #ff4d6d",
    color: "#ff4d6d",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: 8,
  },

  error: {
    color: "#ff4d6d",
    marginBottom: 10,
    textAlign: "center",
  },
};
