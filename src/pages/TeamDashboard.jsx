import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

/* 🔥 PRODUCTION SAFE ENV CONFIG */
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://codebid-1.onrender.com";

const API = `${BASE_URL}/api`;
const SOCKET_URL = BASE_URL;

export default function TeamDashboard() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [team, setTeam] = useState(null);
  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [alreadyBid, setAlreadyBid] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  /* FETCH GAME STATE */
  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/game/state`, { headers });

      setRound(res.data?.round || null);
      setLeaderboard(res.data?.leaderboard || []);
      setTeam(res.data?.team || null);

      if (
        res.data?.round?.bids?.some(
          (b) => b.teamName === res.data?.team?.teamName
        )
      ) {
        setAlreadyBid(true);
      }
    } catch (err) {
      console.log("State fetch failed:", err?.message);
    }
  };

  useEffect(() => {
    if (token) fetchState();
  }, [token]);

  /* SOCKET ENGINE */
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log("🟢 Team connected");
      fetchState();
    });

    socket.on("round:started", (data) => {
      setRound(data);
      setAlreadyBid(false);
      setBidAmount("");
      setTimeLeft(data?.duration || 30);
      setMessage("🚀 New bidding round started!");
    });

    socket.on("timer:update", (data) => {
      setTimeLeft(data?.timeLeft || 0);
    });

    socket.on("bidding:ended", () => {
      setTimeLeft(0);
      setMessage("⏹️ Bidding closed. Waiting for result...");
      fetchState();
    });

    socket.on("round:completed", (data) => {
      setLeaderboard(data?.leaderboard || []);
      setMessage(`🏆 Winner: ${data?.winner || ""}`);
      fetchState();
    });

    socket.on("round:force-reset", () => {
      setMessage("⚠ Round cancelled by admin");
      setRound(null);
    });

    return () => socket.disconnect();
  }, [token]);

  /* PLACE BID */
  const placeBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) {
      setMessage("Enter valid bid");
      return;
    }

    if (alreadyBid || placingBid) return;

    if (round?.status !== "bidding") {
      setMessage("❌ Bidding not active");
      return;
    }

    try {
      setPlacingBid(true);

      await axios.post(
        `${API}/game/bid`,
        { amount: parseInt(bidAmount) },
        { headers }
      );

      setAlreadyBid(true);
      setMessage("🔒 Bid locked successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Bid failed");
    } finally {
      setPlacingBid(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.logo}>⚡ CODEBID</h1>

        <h3>{team?.teamName || "Team"}</h3>
        <h2>🪙 Coins: {team?.coins || 0}</h2>

        {timeLeft > 0 && <h2>⏳ {timeLeft}s</h2>}

        {round ? (
          <>
            <h2>{round.title}</h2>
            <p>{round.category}</p>
            <p>Status: {round.status}</p>
          </>
        ) : (
          <p>Waiting for admin...</p>
        )}

        <hr />

        {alreadyBid ? (
          <p>🔒 Your bid is locked</p>
        ) : (
          <>
            <input
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid"
              style={styles.input}
            />
            <button onClick={placeBid} style={styles.btn}>
              {placingBid ? "Placing..." : "LOCK BID"}
            </button>
          </>
        )}

        <hr />

        <h3>Leaderboard</h3>
        {leaderboard.map((t, i) => (
          <div key={i}>
            #{t.rank} {t.teamName} — 🪙 {t.coins}
          </div>
        ))}

        {message && <p style={styles.msg}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05050f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  card: {
    width: 450,
    padding: 30,
    background: "#0c0c1e",
    borderRadius: 12,
  },
  logo: { color: "#00ff9d" },
  input: { width: "100%", padding: 12, marginTop: 10 },
  btn: { width: "100%", padding: 12, marginTop: 10 },
  msg: { marginTop: 15, color: "#00ff9d" }
};
