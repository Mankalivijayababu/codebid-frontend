import axios from "axios";

const RAW_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
// Normalize so env can be either "http://host:port" OR "http://host:port/api"
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");

const api = axios.create({ baseURL: `${BASE_URL}/api` });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cb_token");
      localStorage.removeItem("cb_user");
      window.location.href = "/";
    }
    return Promise.reject(err.response?.data || err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  signup:      (data) => api.post("/auth/signup", data),
  login:       (data) => api.post("/auth/login", data),
  googleAdmin: (credential) => api.post("/auth/google", { credential }),
  me:          ()     => api.get("/auth/me"),
};

// ── Game ─────────────────────────────────────────────────────
export const gameAPI = {
  getState:   ()     => api.get("/game/state"),
  startRound: (data) => api.post("/game/start", data),
  placeBid:   (data) => api.post("/game/bid", data),
  endBidding: ()     => api.post("/game/end-bidding"),
  markResult: (data) => api.post("/game/result", data),
  getHistory: ()     => api.get("/game/history"),
};

// ── Teams ────────────────────────────────────────────────────
export const teamsAPI = {
  getAll:        ()         => api.get("/teams"),
  getLeaderboard:()         => api.get("/teams/leaderboard"),
  reset:         ()         => api.post("/teams/reset"),
  disable:       (id)       => api.patch(`/teams/${id}/disable`),
  enable:        (id)       => api.patch(`/teams/${id}/enable`),
  updateCoins:   (id, coins)=> api.patch(`/teams/${id}/coins`, { coins }),
  remove:        (id)       => api.delete(`/teams/${id}`),
};
