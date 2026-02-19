import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

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

      {timeLeft > 0 && (
        <div style={styles.timerBar}>
          ⏳ {timeLeft}s remaining
        </div>
      )}

      <div style={styles.wrapper}>
        <div style={styles.grid}>

          {/* TEAM INFO */}
          <div style={styles.card}>
            <h2 style={styles.title}>Team</h2>
            <h1 style={styles.teamName}>{team?.teamName || "Team"}</h1>
            <p style={styles.coins}>🪙 {team?.coins || 0} Coins</p>
          </div>

          {/* ROUND SECTION */}
          <div style={styles.cardCenter}>
            <h2 style={styles.title}>Current Round</h2>

            {round ? (
              <>
                <h2>{round.title}</h2>
                <p>{round.category}</p>
                <p>Status: {round.status}</p>
              </>
            ) : (
              <p>Waiting for admin...</p>
            )}

            <div style={{ marginTop: 20 }}>
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
            </div>

            {message && <p style={styles.msg}>{message}</p>}
          </div>

          {/* LEADERBOARD */}
          <div style={styles.card}>
            <h2 style={styles.title}>Leaderboard</h2>

            {leaderboard.map((t, i) => (
              <div key={i} style={styles.leaderRow}>
                <div style={styles.leftRow}>
                  #{t.rank} {t.teamName}
                  {team && t.teamName === team.teamName && (
                    <span style={styles.youTag}> (You)</span>
                  )}
                </div>
                <div>🪙 {t.coins}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ===== REFINED STYLES ===== */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#05050f,#0d0d2b)",
    color: "#fff",
    padding: 30,
    fontFamily: "Segoe UI",
  },

  wrapper: {
    maxWidth: 1200,
    margin: "auto",
  },

  timerBar: {
    background: "#ff4d6d",
    padding: 12,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 25,
    borderRadius: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr 1fr",
    gap: 25,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 14,
  },

  cardCenter: {
    background: "rgba(255,255,255,0.05)",
    padding: 25,
    borderRadius: 14,
    textAlign: "center",
  },

  title: {
    color: "#00ff9d",
    marginBottom: 15,
  },

  teamName: {
    marginBottom: 10,
  },

  coins: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffd60a",
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #1a1a3a",
    background: "#030308",
    color: "#fff",
    marginBottom: 10,
  },

  bidBtn: {
    width: "100%",
    padding: 12,
    background: "#00ff9d",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  locked: {
    padding: 12,
    background: "rgba(255,77,109,0.15)",
    borderRadius: 8,
  },

  leaderRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  leftRow: {
    display: "flex",
    alignItems: "center",
  },

  youTag: {
    color: "#00ff9d",
    fontWeight: "bold",
    marginLeft: 6,
  },

  msg: {
    marginTop: 15,
    color: "#00ff9d",
  },
};
