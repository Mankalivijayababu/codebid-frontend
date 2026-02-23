import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);

export default function ProjectorScreen() {

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [winner, setWinner] = useState("");
  const [timer, setTimer] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {

    socket.on("projector:showQuestion", (data) => {
      setQuestion(data.question);
      setOptions(data.options);
      setResult(null);
      setSelectedAnswer("");
    });

    socket.on("projector:showWinner", (team) => {
      setWinner(team.name);
    });

    socket.on("projector:startTimer", (time) => {
      setTimer(time);
    });

    socket.on("bidding:tick", ({ timeLeft }) => {
      setTimer(timeLeft);
    });

    socket.on("projector:showSelectedAnswer", (answer) => {
      setSelectedAnswer(answer);
    });

    socket.on("projector:showResult", (res) => {
      setResult(res); // "correct" or "wrong"
    });

    socket.on("leaderboard:update", (teams) => {
      setLeaderboard(teams);
    });

  }, []);

  return (
    <div style={{ background:"#000", color:"#fff", height:"100vh", padding:"20px" }}>

      {/* TIMER */}
      <div style={{ position:"absolute", left:20, top:20, fontSize:40 }}>
        ⏱ {timer}s
      </div>

      {/* WINNER TEAM */}
      <div style={{ position:"absolute", right:20, top:20, fontSize:30 }}>
        🏆 {winner}
      </div>

      {/* QUESTION */}
      <h1 style={{ textAlign:"center", marginTop:"60px" }}>
        {question}
      </h1>

      {/* OPTIONS */}
      <div style={{ marginTop:"40px", fontSize:"26px" }}>
        {options.map((opt,i)=>(
          <div key={i} style={{ margin:"10px 0" }}>
            {opt}
          </div>
        ))}
      </div>

      {/* SELECTED ANSWER */}
      {selectedAnswer && (
        <div style={{ marginTop:"30px", fontSize:"28px", color:"#00eaff" }}>
          Team Selected: {selectedAnswer}
        </div>
      )}

      {/* RESULT */}
      {result === "correct" && (
        <div style={{ background:"green", padding:"20px", fontSize:"40px", marginTop:"30px" }}>
          ✅ CORRECT
        </div>
      )}

      {result === "wrong" && (
        <div style={{ background:"red", padding:"20px", fontSize:"40px", marginTop:"30px" }}>
          ❌ WRONG
        </div>
      )}

      {/* LEADERBOARD */}
      <div style={{ position:"absolute", bottom:20, width:"100%" }}>
        <h2>Leaderboard</h2>
        {leaderboard.map((t)=>(
          <div key={t._id}>
            {t.teamName} — {t.score} {t.status==="eliminated" && "(OUT)"}
          </div>
        ))}
      </div>

    </div>
  );
}