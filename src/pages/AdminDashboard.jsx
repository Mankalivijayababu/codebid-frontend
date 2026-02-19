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

  const [timeLeft, setTimeLeft] = useState(0);
  const [highestBid, setHighestBid] = useState(null);
  const [teamsOnline, setTeamsOnline] = useState(0);

  /* FETCH STATE */
  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/game/state`, {
        headers: authHeaders,
      });

      setRound(res.data?.round || null);
      setLeaderboard(res.data?.leaderboard || []);
    } catch (err) {
      console.log("State fetch error:", err?.response?.data || err.message);
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
      console.log("🟢 Admin socket connected:", socket.id);
    });

    socket.on("bid:received", (data) => {
      setBids((prev) => {
        const updated = [...(prev || []), data];

        const highest = updated.reduce((max, bid) => {
          if (!max) return bid;
          return bid.amount > max.amount ? bid : max;
        }, null);

        setHighestBid(highest);
        return updated;
      });
    });

    socket.on("round:started", (data) => {
      setRound(data);
      setBids([]);
      setHighestBid(null);
      setTimeLeft(data?.duration || 30);
      setMessage("🚀 Round Started");
    });

    socket.on("timer:update", (data) => {
      setTimeLeft(data?.timeLeft || 0);
    });

    socket.on("bidding:ended", (data) => {
      if (data?.winner) setHighestBid(data.winner);
      setMessage("⏹️ Bidding Closed");
      fetchState();
    });

    socket.on("round:completed", (data) => {
      setLeaderboard(data?.leaderboard || []);
      setMessage(`🏆 Winner: ${data?.winner || ""}`);
      fetchState();
    });

    socket.on("round:force-reset", () => {
      setMessage("⚠ Round Reset");
      fetchState();
    });

    socket.on("teams:online", (data) => {
      setTeamsOnline(data?.count || 0);
    });

    return () => socket.disconnect();
  }, [token]);

  /* ADMIN ACTIONS */

  const startRound = async () => {
    if (!title) return setMessage("Enter question title");

    try {
      await axios.post(
        `${API}/game/start`,
        { title, category },
        { headers: authHeaders }
      );
      setTitle("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Start failed");
    }
  };

  const endBidding = async () => {
    try {
      await axios.post(`${API}/game/end-bidding`, {}, { headers: authHeaders });
    } catch (err) {
      setMessage(err.response?.data?.message || "End failed");
    }
  };

  const markResult = async (result) => {
    try {
      await axios.post(
        `${API}/game/result`,
        { result },
        { headers: authHeaders }
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Result failed");
    }
  };

  const forceReset = async () => {
    try {
      await axios.patch(
        `${API}/game/force-reset`,
        {},
        { headers: authHeaders }
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>⚡ CODEBID CONTROL</div>
            <div style={styles.sub}>Realtime Auction Engine</div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.online}>
              🟢 {teamsOnline} Teams Online
            </div>

            {timeLeft > 0 && (
              <div style={styles.timerBox}>
                <div style={styles.timerLabel}>ROUND TIMER</div>
                <div style={styles.timer}>{timeLeft}s</div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>CURRENT ROUND</div>
            {round ? (
              <>
                <h2>{round.title}</h2>
                <div style={styles.badge}>{round.category}</div>
                <div style={styles.meta}>Round #{round.roundNumber}</div>
                <div style={styles.meta}>Status: {round.status}</div>
              </>
            ) : (
              <div style={styles.meta}>Waiting for round start...</div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>HIGHEST BID LIVE</div>
            {highestBid ? (
              <div style={styles.highestBox}>
                <div style={styles.highestTeam}>
                  {highestBid.teamName}
                </div>
                <div style={styles.highestAmount}>
                  🪙 {highestBid.amount}
                </div>
              </div>
            ) : (
              <div style={styles.meta}>No bids yet</div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>LIVE BIDS</div>
            <div style={styles.bidList}>
              {(bids || []).map((bid, i) => (
                <div key={i} style={styles.bidRow}>
                  <span>{bid.teamName}</span>
                  <span>🪙 {bid.amount}</span>
                </div>
              ))}
            </div>
          </div>

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

            <button style={styles.startBtn} onClick={startRound}>
              🚀 START ROUND
            </button>

            <button style={styles.endBtn} onClick={endBidding}>
              ⏹ END BIDDING
            </button>

            <div style={styles.judgeRow}>
              <button
                style={styles.correctBtn}
                onClick={() => markResult("correct")}
              >
                ✅ CORRECT
              </button>
              <button
                style={styles.wrongBtn}
                onClick={() => markResult("wrong")}
              >
                ❌ WRONG
              </button>
            </div>

            <button style={styles.resetBtn} onClick={forceReset}>
              ⚠ FORCE RESET
            </button>
          </div>
        </div>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}
