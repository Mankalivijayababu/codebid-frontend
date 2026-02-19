import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

/* 🔥 AUTO ENV SWITCH */

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://codebid-1.onrender.com";

const API = `${BASE_URL}/api`;
const SOCKET_URL = BASE_URL;



export default function TeamDashboard() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [socket, setSocket] = useState(null);
  const [team, setTeam] = useState(null);
  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [alreadyBid, setAlreadyBid] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  /* ───────── FETCH INITIAL STATE ───────── */

  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/game/state`, { headers });

      setRound(res.data.round);
      setLeaderboard(res.data.leaderboard);
      setTeam(res.data.team);

      // detect already bid
      if (res.data.round?.bids?.some(b => b.teamName === res.data.team?.teamName)) {
        setAlreadyBid(true);
      }

    } catch (err) {
      console.log("State fetch failed");
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  /* ───────── SOCKET ENGINE ───────── */

  useEffect(() => {
    if (!token) return;

    const newSocket = io("https://codebid.onrender.com", {
      auth: { token },
      transports: ["polling", "websocket"],
      upgrade: true,
      rememberUpgrade: true,

      reconnection: true,
      reconnectionAttempts: 10,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 Team connected");
      fetchState();
    });

    newSocket.on("force:logout", (data) => {
      alert(data.message);
      localStorage.removeItem("token");
      window.location.href = "/";
    });

    newSocket.on("round:started", (data) => {
      setRound(data);
      setAlreadyBid(false);
      setBidAmount("");
      setTimeLeft(data.duration || 30);
      setMessage("🚀 New bidding round started!");
    });

    newSocket.on("timer:update", (data) => {
      setTimeLeft(data.timeLeft);
    });

    newSocket.on("bidding:ended", () => {
      setTimeLeft(0);
      setMessage("⏹️ Bidding closed. Waiting for result...");
      fetchState();
    });

    newSocket.on("round:completed", (data) => {
      setLeaderboard(data.leaderboard);
      setMessage(`🏆 Winner: ${data.winner}`);
      fetchState();
    });

    newSocket.on("round:force-reset", () => {
      setMessage("⚠ Round cancelled by admin");
      setRound(null);
    });

    return () => newSocket.disconnect();
  }, [token]);

  /* ───────── PLACE BID ───────── */

  const placeBid = async () => {
    if (!bidAmount || alreadyBid || placingBid) return;

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

  /* ───────── UI ───────── */

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>⚡ CODEBID</div>
            <div style={styles.teamName}>{team?.teamName}</div>
          </div>

          {timeLeft > 0 && (
            <div style={styles.timerBox}>
              <div style={styles.timerLabel}>BIDDING TIMER</div>
              <div style={styles.timer}>{timeLeft}s</div>
            </div>
          )}

          <div style={styles.wallet}>
            <div style={styles.walletCoins}>🪙 {team?.coins || 0}</div>
            <div style={styles.walletLabel}>YOUR COINS</div>
          </div>
        </div>

        {/* STATUS STRIP */}
        {round && (
          <div style={styles.statusStrip}>
            {round.status === "bidding"
              ? "🟢 BIDDING OPEN"
              : round.status === "reviewing"
              ? "🟡 ADMIN REVIEWING"
              : "⏸ WAITING FOR NEXT ROUND"}
          </div>
        )}

        {/* GRID */}
        <div style={styles.grid}>

          {/* ROUND INFO */}
          {round ? (
            <div style={styles.panel}>
              <div style={styles.panelTitle}>CURRENT QUESTION</div>

              <h2 style={styles.roundTitle}>{round.title}</h2>

              <div style={styles.badges}>
                <span style={styles.levelBadge(round.category)}>
                  {round.category?.toUpperCase()}
                </span>
                <span style={styles.rewardHint}>
                  💰 Reward = Your bid amount
                </span>
              </div>

              <p style={styles.meta}>Round #{round.roundNumber}</p>
            </div>
          ) : (
            <div style={styles.panel}>
              <div style={styles.panelTitle}>WAITING</div>
              <p>Admin hasn't started a round yet</p>
            </div>
          )}

          {/* BIDDING PANEL */}
          <div style={styles.panel}>
            <div style={styles.panelTitle}>PLACE SECRET BID</div>

            {alreadyBid ? (
              <div style={styles.lockedBox}>
                🔒 Your bid is locked
              </div>
            ) : (
              <>
                <input
                  placeholder="Enter bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={styles.input}
                />

                <button
                  style={styles.bidBtn}
                  onClick={placeBid}
                  disabled={placingBid || round?.status !== "bidding"}
                >
                  {placingBid ? "Placing..." : "💸 LOCK BID"}
                </button>
              </>
            )}
          </div>

          {/* LEADERBOARD */}
          <div style={styles.leaderboard}>
            <div style={styles.panelTitle}>LIVE LEADERBOARD</div>

            {leaderboard.map((t, i) => (
              <div
                key={i}
                style={{
                  ...styles.leaderRow,
                  background:
                    t.teamName === team?.teamName
                      ? "rgba(0,255,157,0.08)"
                      : i === 0
                      ? "rgba(255,214,10,0.08)"
                      : "transparent",
                }}
              >
                <span>#{t.rank}</span>
                <span>
                  {t.teamName}
                  {t.teamName === team?.teamName && (
                    <span style={styles.youTag}> YOU</span>
                  )}
                </span>
                <span>🪙 {t.coins}</span>
              </div>
            ))}
          </div>
        </div>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}

/* ───────── STYLES ───────── */

const styles = {
  page: { minHeight: "100vh", background: "#05050f", color: "#e0e0f0" },
  wrapper: { maxWidth: "1500px", margin: "auto", padding: "30px" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  logo: { fontSize: "26px", color: "#00ff9d" },
  teamName: { fontSize: "14px", color: "#777" },
  timerBox: { border: "1px solid #1a1a3a", padding: "12px" },
  timerLabel: { fontSize: "10px", color: "#777" },
  timer: { fontSize: "32px", color: "#ff4d6d" },
  wallet: { textAlign: "right" },
  walletCoins: { fontSize: "28px", color: "#ffd60a" },
  walletLabel: { fontSize: "10px", color: "#777" },
  statusStrip: {
    padding: "12px",
    background: "rgba(0,255,157,0.06)",
    border: "1px solid #00ff9d",
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  panel: { background: "#0c0c1e", padding: "24px", borderRadius: "14px" },
  panelTitle: { fontSize: "11px", color: "#00ff9d", marginBottom: "10px" },
  roundTitle: { fontSize: "22px" },
  badges: { display: "flex", gap: "10px", marginTop: "10px" },
  levelBadge: (level) => ({
    padding: "4px 10px",
    background:
      level === "Hard"
        ? "#ff4d6d"
        : level === "Medium"
        ? "#ffd60a"
        : "#00ff9d",
    color: "#000",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  }),
  rewardHint: { fontSize: "12px", color: "#777" },
  meta: { color: "#777" },
  input: { width: "100%", padding: "14px", background: "#030308", color: "#fff", marginBottom: "10px" },
  bidBtn: { width: "100%", padding: "14px", background: "#00ff9d", border: "none", fontWeight: "bold" },
  lockedBox: { padding: "20px", border: "1px dashed #00ff9d", textAlign: "center", color: "#00ff9d" },
  leaderboard: { gridColumn: "span 2", background: "#0c0c1e", padding: "24px", borderRadius: "14px" },
  leaderRow: { display: "flex", justifyContent: "space-between", padding: "12px" },
  youTag: { marginLeft: 8, fontSize: 10, color: "#00ff9d" },
  message: { marginTop: "20px", textAlign: "center", color: "#00ff9d" },
};
