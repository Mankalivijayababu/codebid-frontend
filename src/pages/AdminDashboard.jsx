import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

/* 🔥 PRODUCTION SAFE ENV CONFIG */
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://codebid-1.onrender.com";

const API = `${BASE_URL}/api`;
const SOCKET_URL = BASE_URL;

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Easy");
  const [message, setMessage] = useState("");

  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bids, setBids] = useState([]);

  const [highestBid, setHighestBid] = useState(null);
  const [teamsOnline, setTeamsOnline] = useState(0);
  const [winnerTeam, setWinnerTeam] = useState(null);

  /* ================= FETCH GAME STATE ================= */
  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/game/state`, {
        headers: authHeaders,
      });

      setRound(res.data?.round || null);
      setLeaderboard(res.data?.leaderboard || []);
    } catch (err) {
      console.log("State fetch error:", err?.message);
    }
  };

  useEffect(() => {
    if (token) fetchState();
  }, [token]);

  /* ================= SOCKET CONNECTION ================= */
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("bid:received", (data) => {
      setBids((prev) => {
        const updated = [...prev, data];
        const highest = updated.reduce(
          (max, bid) => (!max || bid.amount > max.amount ? bid : max),
          null
        );
        setHighestBid(highest);
        return updated;
      });
    });

    socket.on("round:started", (data) => {
      setRound(data);
      setBids([]);
      setHighestBid(null);
      setWinnerTeam(null);
      setMessage("🚀 Round Started");
    });

    socket.on("bidding:ended", () => {
      setMessage("⛔ Bidding Ended");
    });

    /* 🔥 FIXED RESULT HANDLER */
    socket.on("round:completed", (data) => {
      const { teamName, result } = data;

      if (result === "correct") {
        setWinnerTeam(teamName);
        setMessage(`🏆 ${teamName} answered correctly`);
      } else {
        setWinnerTeam(null);
        setMessage(`❌ ${teamName} answered wrong`);
      }

      fetchState();
    });

    socket.on("teams:online", (data) => {
      setTeamsOnline(data?.count || 0);
    });

    return () => socket.disconnect();
  }, [token]);

  /* ================= ADMIN ACTIONS ================= */

  const startRound = async () => {
    if (!title) return setMessage("Enter question title");

    try {
      await axios.post(
        `${API}/game/start`,
        { title, category },
        { headers: authHeaders }
      );
      setTitle("");
    } catch {
      setMessage("Start failed");
    }
  };

  const endBidding = async () => {
    try {
      await axios.post(`${API}/game/end-bidding`, {}, { headers: authHeaders });
      setMessage("⛔ Bidding Ended");
    } catch {
      setMessage("End failed");
    }
  };

  const markCorrect = async () => {
    try {
      await axios.post(
        `${API}/game/result`,
        { result: "correct" },
        { headers: authHeaders }
      );
    } catch {
      setMessage("Correct failed");
    }
  };

  const markWrong = async () => {
    try {
      await axios.post(
        `${API}/game/result`,
        { result: "wrong" },
        { headers: authHeaders }
      );
    } catch {
      setMessage("Wrong failed");
    }
  };

  const resetRound = async () => {
    try {
      await axios.patch(`${API}/game/force-reset`, {}, { headers: authHeaders });
    } catch {
      setMessage("Reset failed");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>⚡ CODEBID CONTROL</div>
            <div style={styles.sub}>Realtime Auction Engine</div>
          </div>
          <div style={styles.online}>🟢 {teamsOnline} Teams Online</div>
        </div>

        {/* TOP SECTION */}
        <div style={styles.topGrid}>
          
          {/* CURRENT ROUND */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>CURRENT ROUND</div>
            {round ? (
              <>
                <h2 style={styles.roundTitle}>{round.title}</h2>
                <div style={styles.badge}>{round.category}</div>
                <div>Status: {round.status}</div>
              </>
            ) : (
              <div>No active round</div>
            )}
          </div>

          {/* HIGHEST BID */}
          <div style={styles.cardCenter}>
            <div style={styles.cardTitle}>HIGHEST BID</div>
            {highestBid ? (
              <>
                <h2 style={styles.bidTeam}>{highestBid.teamName}</h2>
                <h1 style={styles.bidAmount}>🪙 {highestBid.amount}</h1>
              </>
            ) : (
              <div>No bids yet</div>
            )}
          </div>

          {/* ADMIN CONTROLS */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>ADMIN CONTROLS</div>

            <input
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Question Title"
            />

            <select
              style={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <div style={styles.btnGroup}>
              <button style={styles.startBtn} onClick={startRound}>START</button>
              <button style={styles.endBtn} onClick={endBidding}>END</button>
            </div>

            <div style={styles.btnGroup}>
              <button style={styles.correctBtn} onClick={markCorrect}>CORRECT</button>
              <button style={styles.wrongBtn} onClick={markWrong}>WRONG</button>
            </div>

            <button style={styles.resetBtn} onClick={resetRound}>
              RESET ROUND
            </button>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div style={styles.leaderboardCard}>
          <div style={styles.cardTitle}>LIVE LEADERBOARD</div>

          {leaderboard.length === 0 ? (
            <div>No teams yet</div>
          ) : (
            leaderboard.map((team, i) => (
              <div
                key={i}
                style={
                  team.teamName === winnerTeam
                    ? styles.winnerRow
                    : styles.leaderRow
                }
              >
                <span>#{team.rank} {team.teamName}</span>
                <span>🪙 {team.coins}</span>
              </div>
            ))
          )}
        </div>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}
