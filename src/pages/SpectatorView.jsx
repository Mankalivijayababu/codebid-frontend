import { useState, useEffect, useRef } from "react";
import { teamsAPI } from "../services/api";
import { connectSocket } from "../services/socket";
import { useSocketMany } from "../hooks/useSocket";

function ParticlesBg() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 70 }, () => ({ x: Math.random()*c.width, y: Math.random()*c.height, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, o:Math.random()*.3+.05 }));
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>c.width)p.vx*=-1; if(p.y<0||p.y>c.height)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle=`rgba(0,255,170,${p.o})`; ctx.fill(); });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,255,170,${.06*(1-d/120)})`;ctx.lineWidth=.5;ctx.stroke();}}
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

function Clock() {
  const [t, setT] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setT(Date.now()), 1000); return () => clearInterval(id); }, []);
  const d = new Date(t), p = n => String(n).padStart(2, "0");
  return <span style={{ fontFamily:"monospace", color:"#00ffaa", fontSize:20, letterSpacing:3 }}>{p(d.getHours())}:{p(d.getMinutes())}:{p(d.getSeconds())}</span>;
}

const medals = ["🥇","🥈","🥉"];

export default function SpectatorView() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [roundInfo,   setRoundInfo]   = useState(null);
  const [lastResult,  setLastResult]  = useState(null);
  const [showResult,  setShowResult]  = useState(false);

  useEffect(() => {
    // Connect as spectator (no token needed for read-only)
    connectSocket("spectator");
    teamsAPI.getLeaderboard().then(d => setLeaderboard(d.leaderboard || [])).catch(() => {});
  }, []);

  useSocketMany({
    "round:started": (data) => {
      setRoundInfo(data);
      setShowResult(false);
      setLastResult(null);
    },
    "round:status": (data) => {
      setRoundInfo(prev => prev ? { ...prev, status: data.status } : null);
    },
    "round:completed": (data) => {
      setLeaderboard(data.leaderboard || []);
      setLastResult({ result: data.result, winner: data.winnerName, coins: data.coinsChange });
      setShowResult(true);
      setTimeout(() => setShowResult(false), 5000);
    },
    "game:reset": () => {
      setLeaderboard(prev => prev.map(t => ({ ...t, coins: 2000, correctAnswers: 0, wrongAnswers: 0 })));
      setRoundInfo(null);
    },
  });

  return (
    <div style={{ minHeight:"100vh", background:"#050a0f", color:"#e8f4f8", fontFamily:"'Segoe UI', system-ui, sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes slideUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes winPop    { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes coinGlow  { 0%,100%{text-shadow:0 0 10px rgba(255,215,0,.3)} 50%{text-shadow:0 0 30px rgba(255,215,0,.8)} }
      `}</style>
      <ParticlesBg />

      <div style={{ position:"relative", zIndex:1, padding:"32px 48px", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:40 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <span style={{ fontSize:42, }}>⚡</span>
            <div>
              <div style={{ fontSize:48, fontWeight:900, background:"linear-gradient(135deg,#00ffaa,#00cc88)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-2, lineHeight:1 }}>CODEBID</div>
              <div style={{ fontSize:14, color:"rgba(232,244,248,0.4)", letterSpacing:4, textTransform:"uppercase" }}>Live Leaderboard</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <Clock />
            {roundInfo && (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:10, justifyContent:"flex-end" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background: roundInfo.status==="bidding" ? "#00ffaa" : "#ffaa00", display:"inline-block", animation: roundInfo.status==="bidding" ? "pulse 1.3s infinite" : "none" }} />
                <span style={{ fontSize:14, fontWeight:700, color: roundInfo.status==="bidding" ? "#00ffaa" : "#ffaa00" }}>
                  {roundInfo.status==="bidding" ? "BIDDING OPEN" : "REVIEWING"} · Round #{roundInfo.roundNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Round title banner */}
        {roundInfo && (
          <div style={{ textAlign:"center", marginBottom:36, padding:"16px 32px", background:"rgba(255,215,0,0.07)", border:"1px solid rgba(255,215,0,0.2)", borderRadius:16, animation:"slideUp 0.4s ease" }}>
            <div style={{ fontSize:13, letterSpacing:3, color:"rgba(255,215,0,0.6)", textTransform:"uppercase", marginBottom:6 }}>Current Question</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#ffd700" }}>{roundInfo.title}</div>
          </div>
        )}

        {/* Result overlay */}
        {showResult && lastResult && (
          <div style={{
            position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:50,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)",
          }}>
            <div style={{
              textAlign:"center", padding:"60px 80px", borderRadius:32,
              background: lastResult.result==="correct" ? "rgba(0,255,170,0.1)" : "rgba(255,68,68,0.1)",
              border:`2px solid ${lastResult.result==="correct" ? "rgba(0,255,170,0.5)" : "rgba(255,68,68,0.5)"}`,
              animation:"winPop 0.5s ease",
              boxShadow: lastResult.result==="correct" ? "0 0 80px rgba(0,255,170,0.3)" : "0 0 80px rgba(255,68,68,0.3)",
            }}>
              <div style={{ fontSize:100, marginBottom:20 }}>{lastResult.result==="correct" ? "🎉" : "😔"}</div>
              <div style={{ fontSize:52, fontWeight:900, color: lastResult.result==="correct" ? "#00ffaa" : "#ff4444", marginBottom:12 }}>{lastResult.winner}</div>
              <div style={{ fontSize:28, color:"rgba(232,244,248,0.7)", marginBottom:20 }}>
                {lastResult.result==="correct" ? "Correct Answer!" : "Wrong Answer!"}
              </div>
              <div style={{ fontSize:40, fontWeight:900, fontFamily:"monospace", color:"#ffd700", animation:"coinGlow 1s infinite" }}>
                {lastResult.coins > 0 ? `+${lastResult.coins}` : lastResult.coins} coins
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign:"center", paddingTop:80, color:"rgba(232,244,248,0.3)", fontSize:20 }}>Waiting for teams to register...</div>
          ) : (
            leaderboard.map((team, i) => (
              <div key={team.id} style={{
                display:"flex", alignItems:"center", gap:24, padding:"20px 32px", borderRadius:18,
                background: i===0 ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.03)",
                border:`1px solid ${i===0 ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.06)"}`,
                animation:`slideUp ${0.1+i*0.07}s ease`,
                transition:"all 0.4s ease",
              }}>
                {/* Rank */}
                <div style={{ width:64, height:64, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", background: i<3 ? "rgba(255,215,0,0.12)" : "rgba(0,0,0,0.3)", fontSize: i<3 ? 36 : 22, fontWeight:900, color: i<3 ? "#ffd700" : "#555", border:`1px solid ${i<3 ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.06)"}`, flexShrink:0 }}>
                  {i<3 ? medals[i] : i+1}
                </div>
                {/* Team info */}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:28, fontWeight:900, marginBottom:4 }}>{team.teamName}</div>
                  <div style={{ fontSize:14, color:"rgba(232,244,248,0.4)" }}>{team.repName} · {team.correctAnswers}✅ {team.wrongAnswers}❌ · {team.accuracy}% accuracy</div>
                </div>
                {/* Coins */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#ffd700,#ffaa00)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"#7a3e00" }}>₿</div>
                  <span style={{ fontSize:38, fontWeight:900, fontFamily:"monospace", background:"linear-gradient(135deg,#ffd700,#ffaa00)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{team.coins.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:32, fontSize:12, color:"rgba(232,244,248,0.2)", letterSpacing:2 }}>
          CODEBID · VRSEC · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
