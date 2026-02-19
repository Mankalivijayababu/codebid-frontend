import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

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

      // store JWT
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(res.data.admin));

      // redirect
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CODE<span style={{ color: "#ffd60a" }}>BID</span></h1>
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05050f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Rajdhani",
  },

  card: {
    width: "420px",
    padding: "40px",
    background: "#0c0c1e",
    border: "1px solid #1a1a3a",
    borderRadius: "16px",
    boxShadow: "0 0 60px rgba(0,255,157,0.1)",
    textAlign: "center",
  },

  logo: {
    fontFamily: "Orbitron",
    fontSize: "42px",
    letterSpacing: "6px",
    color: "#00ff9d",
    marginBottom: "10px",
  },

  subtitle: {
    fontFamily: "Share Tech Mono",
    fontSize: "12px",
    color: "#55557a",
    letterSpacing: "3px",
    marginBottom: "30px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "14px",
    background: "#030308",
    border: "1px solid #111128",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
  },

  btn: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    background: "rgba(0,255,157,0.1)",
    border: "1px solid #00ff9d",
    color: "#00ff9d",
    fontWeight: "bold",
    letterSpacing: "2px",
    cursor: "pointer",
    borderRadius: "8px",
  },

  error: {
    marginTop: "16px",
    color: "#ff4d6d",
    fontFamily: "Share Tech Mono",
    fontSize: "12px",
  },
};
