import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_API_URL || "https://codebid-1.onrender.com";

const SOCKET_URL = BASE_URL;

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [socket, setSocket] = useState(null);

  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [highestBid, setHighestBid] = useState(null);
  const [teamsOnline, setTeamsOnline] = useState(0);

  const [category, setCategory] = useState("Easy");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);

  const [message, setMessage] = useState("");

  /* ================= SOCKET INIT ================= */

  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    /* BIDS UPDATE */
    newSocket.on("bidding:update", (bids) => {
      const highest = bids.reduce(
        (max, bid) =>
          !max || bid.amount > max.amount ? bid : max,
        null
      );
      setHighestBid(highest);
    });

    /* WINNER */
    newSocket.on("projector:show-winner", (winner) => {
      setMessage(`🏆 Winner: ${winner.teamName}`);
    });

    /* RESULT */
    newSocket.on("projector:result", ({ result }) => {
      if (result === "correct")
        setMessage("✅ Correct Answer");
      else setMessage("❌ Wrong Answer");
    });

    /* LEADERBOARD */
    newSocket.on("leaderboard:update", (teams) => {
      setLeaderboard(teams);
    });

    /* ONLINE COUNT */
    newSocket.on("teams:online", (data) => {
      setTeamsOnline(data.count);
    });

    return () => newSocket.disconnect();
  }, [token]);

  /* ================= ADMIN ACTIONS ================= */

  const startQuestion = () => {
    if (!questionText) {
      setMessage("Enter question");
      return;
    }

    socket.emit("admin:start-question", {
      category,
      question: {
        question: questionText,
        options,
      },
    });

    setHighestBid(null);
    setMessage("🚀 Question Started");
  };

  const endBidding = () => {
    socket.emit("admin:end-bidding");
    setMessage("⛔ Bidding Ended");
  };

  const markCorrect = () => {
    socket.emit("admin:result", { result: "correct" });
  };

  const markWrong = () => {
    socket.emit("admin:result", { result: "wrong" });
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>

        <div style={styles.header}>
          <div>
            <h2 style={{ color: "#00ff9d" }}>⚡ CODEBID CONTROL</h2>
          </div>
          <div>🟢 {teamsOnline} Teams Online</div>
        </div>

        <div style={styles.grid}>

          {/* QUESTION CONTROL */}
          <div style={styles.card}>
            <h3>Start Question</h3>

            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter Question"
              style={styles.input}
            />

            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const updated = [...options];
                  updated[i] = e.target.value;
                  setOptions(updated);
                }}
                placeholder={`Option ${i + 1}`}
                style={styles.input}
              />
            ))}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button style={styles.startBtn} onClick={startQuestion}>
              START
            </button>

            <button style={styles.endBtn} onClick={endBidding}>
              END BIDDING
            </button>

            <button style={styles.correctBtn} onClick={markCorrect}>
              CORRECT
            </button>

            <button style={styles.wrongBtn} onClick={markWrong}>
              WRONG
            </button>
          </div>

          {/* HIGHEST BID */}
          <div style={styles.card}>
            <h3>Highest Bid</h3>
            {highestBid ? (
              <>
                <h2>{highestBid.teamName}</h2>
                <h1>🪙 {highestBid.amount}</h1>
              </>
            ) : (
              <p>No bids</p>
            )}
          </div>

          {/* LEADERBOARD */}
          <div style={styles.card}>
            <h3>Leaderboard</h3>
            {leaderboard.map((t, i) => (
              <div key={i} style={styles.row}>
                #{i + 1} {t.teamName} — 🪙 {t.coins}
              </div>
            ))}
          </div>
        </div>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: { background: "#05050f", minHeight: "100vh", padding: 30, color: "#fff" },
  wrapper: { maxWidth: 1200, margin: "auto" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 },
  card: { background: "#0c0c1e", padding: 20, borderRadius: 10 },
  input: { width: "100%", padding: 10, marginBottom: 10 },
  startBtn: { width: "100%", padding: 10, background: "#00ff9d", marginBottom: 10 },
  endBtn: { width: "100%", padding: 10, background: "#ff4d6d", marginBottom: 10 },
  correctBtn: { width: "100%", padding: 10, background: "#00c853", marginBottom: 10 },
  wrongBtn: { width: "100%", padding: 10, background: "#d50000" },
  row: { padding: 8 },
  message: { marginTop: 20, textAlign: "center", color: "#00ff9d" }
};