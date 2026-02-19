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

      window.location.href = "/admin";
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

/* styles same as your previous file */
