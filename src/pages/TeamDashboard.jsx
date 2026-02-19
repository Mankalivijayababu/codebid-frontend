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
    });

    socket.on("connect", () => fetchState());

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

      {/* TIMER BAR */}
      {timeLeft > 0 && (
        <div style={styles.timerBar}>
          ⏳ {timeLeft}s remaining
        </div>
      )}

      <div style={styles.grid}>

        {/* TEAM INFO */}
        <div style={styles.card}>
          <h2 style={styles.title}>👥 Team</h2>
          <h1>{team?.teamName || "Team"}</h1>
          <p style={styles.coins}>🪙 Coins: {team?.coins || 0}</p>
        </div>

        {/* ROUND + BID */}
        <div style={styles.card}>
          <h2 style={styles.title}>🎯 Current Round</h2>

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
            <div style={styles.locked}>🔒 Bid Locked</div>
          ) : (
            <>
              <input
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                style={styles.input}
              />

              <button
                onClick={placeBid}
                style={styles.bidBtn}
              >
                {placingBid ? "Placing..." : "LOCK BID"}
              </button>
            </>
          )}

          {message && <p style={styles.msg}>{message}</p>}
        </div>

        {/* LEADERBOARD */}
        <div style={styles.card}>
          <h2 style={styles.title}>🏆 Leaderboard</h2>

          {leaderboard.map((t, i) => (
            <div key={i} style={styles.leaderRow}>
              #{t.rank} {t.teamName}
              <span>🪙 {t.coins}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 🎨 PROFESSIONAL FEST UI */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#05050f,#0d0d2b)",
    color: "#fff",
    padding: 40,
    fontFamily: "Segoe UI",
  },

  timerBar: {
    background: "#ff4d6d",
    padding: 12,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
    borderRadius: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr 1fr",
    gap: 25,
  },

  card: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px)",
    padding: 25,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
  },

  title: {
    color: "#00ff9d",
    marginBottom: 10,
  },

  coins: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffd60a",
  },

  input: {
    width: "100%",
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #1a1a3a",
    background: "#030308",
    color: "#fff",
  },

  bidBtn: {
    width: "100%",
    padding: 14,
    marginTop: 12,
    background: "#00ff9d",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  locked: {
    padding: 14,
    background: "rgba(255,77,109,0.15)",
    borderRadius: 8,
    textAlign: "center",
  },

  leaderRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  msg: {
    marginTop: 15,
    color: "#00ff9d",
  },
};
