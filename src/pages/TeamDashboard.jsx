import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

/* 🔥 PRODUCTION SAFE ENV CONFIG */
const BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const API = `${BASE_URL}/api`;
const SOCKET_URL = BASE_URL;

export default function TeamDashboard() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [socket, setSocket] = useState(null);
  const [team, setTeam] = useState(null);
  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = [];

  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [alreadyBid, setAlreadyBid] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  /* FETCH STATE */
  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/game/state`, { headers });

      setRound(res.data.round);
      setLeaderboard(res.data.leaderboard);
      setTeam(res.data.team);

      if (
        res.data.round?.bids?.some(
          (b) => b.teamName === res.data.team?.teamName
        )
      ) {
        setAlreadyBid(true);
      }
    } catch (err) {
      console.log("State fetch failed");
    }
  };

  useEffect(() => {
    if (token) fetchState();
  }, [token]);

  /* SOCKET ENGINE */
  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 Team connected");
      fetchState();
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

  /* PLACE BID */
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

  return (
    <div style={{ padding: 40, background: "#05050f", minHeight: "100vh", color: "#fff" }}>
      <h1>⚡ CODEBID</h1>

      <h3>{team?.teamName}</h3>
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
          />
          <button onClick={placeBid}>LOCK BID</button>
        </>
      )}

      <hr />

      <h3>Leaderboard</h3>
      {leaderboard.map((t, i) => (
        <div key={i}>
          #{t.rank} {t.teamName} — 🪙 {t.coins}
        </div>
      ))}

      {message && <p>{message}</p>}
    </div>
  );
}
