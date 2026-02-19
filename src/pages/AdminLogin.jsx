import React, { useState } from "react";
import axios from "axios";

/* 🔥 PRODUCTION SAFE ENV */
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://codebid-1.onrender.com";

const API = `${BASE_URL}/api`;

export default function AdminLogin() {
  const [email, setEmail] = useState("host@codebid.com");
  const [password, setPassword] = useState("host123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API}/admin/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(res.data.admin));

      window.location.href = "./admin";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>
          CODE<span style={{ color: "#ffd60a" }}>BID</span>
        </h1>
        <p style={styles.subtitle}>ADMIN CONTROL ACCESS</p>

        <input
          style={styles.input}
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.btn} onClick={handleLogin} disabled={loading}>
          {loading ? "AUTHENTICATING..." : "LOGIN →"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

/* ✅ REQUIRED STYLES OBJECT */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#05050f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Segoe UI",
  },

  card: {
    width: 420,
    padding: 40,
    background: "#0c0c1e",
    borderRadius: 16,
    border: "1px solid #1a1a3a",
    boxShadow: "0 0 40px rgba(0,255,157,0.1)",
    textAlign: "center",
  },

  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#00ff9d",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 12,
    color: "#55557a",
    letterSpacing: "3px",
    marginBottom: 25,
  },

  input: {
    width: "100%",
    padding: 14,
    marginBottom: 14,
    background: "#030308",
    border: "1px solid #111128",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
  },

  btn: {
    width: "100%",
    padding: 14,
    background: "rgba(0,255,157,0.1)",
    border: "1px solid #00ff9d",
    color: "#00ff9d",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: 8,
  },

  error: {
    marginTop: 14,
    color: "#ff4d6d",
    fontSize: 13,
  },
};
