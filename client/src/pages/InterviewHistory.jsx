import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { fetchHistory } from "../services/interviewService";
import Loader from "../components/common/Loader";
import "../styles/interviewHistory.css";

const VERDICT_COLORS = {
  Excellent:    "#22c55e",
  Good:         "#00e5ff",
  Average:      "#f59e0b",
  "Needs Work": "#ef4444",
};

const ROLE_LABELS = {
  frontend:    "Frontend",
  backend:     "Backend",
  fullstack:   "Full Stack",
  devops:      "DevOps",
  datascience: "Data Science",
};

const DIFF_COLORS = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

const InterviewHistory = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filter,     setFilter]     = useState("all");
  const [filterVal,  setFilterVal]  = useState("all");
  const [stats,      setStats]      = useState({
    total: 0, avgScore: 0, bestRole: "—", lastDate: "—", bestScore: 0,
  });

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setInterviews(data);
        if (!data.length) return;
        const total     = data.length;
        const avgScore  = Math.round(data.reduce((s, i) => s + i.totalScore, 0) / total);
        const bestScore = Math.max(...data.map((i) => i.totalScore));
        const roleMap   = {};
        data.forEach((i) => {
          roleMap[i.role] = roleMap[i.role] || [];
          roleMap[i.role].push(i.totalScore);
        });
        let bestRole = "—", bestAvg = 0;
        Object.keys(roleMap).forEach((r) => {
          const avg = roleMap[r].reduce((a, b) => a + b, 0) / roleMap[r].length;
          if (avg > bestAvg) { bestAvg = avg; bestRole = r; }
        });
        const lastDate = new Date(data[0].createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        });
        setStats({ total, avgScore, bestRole: ROLE_LABELS[bestRole] || bestRole, lastDate, bestScore });
      })
      .catch((err) => setError(err.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = interviews.filter((i) => {
    if (filter === "role"       && filterVal !== "all") return i.role       === filterVal;
    if (filter === "difficulty" && filterVal !== "all") return i.difficulty === filterVal;
    return true;
  });

  const lineData = [...interviews].reverse().slice(-10).map((i, idx) => ({
    name:  `#${idx + 1}`,
    score: i.totalScore,
    date:  new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  const roleMap = {};
  interviews.forEach((i) => {
    if (!roleMap[i.role]) roleMap[i.role] = [];
    roleMap[i.role].push(i.totalScore);
  });
  const barData = Object.entries(roleMap).map(([role, scores]) => ({
    role:  ROLE_LABELS[role] || role,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  const roles        = [...new Set(interviews.map((i) => i.role))];
  const difficulties = [...new Set(interviews.map((i) => i.difficulty))];

  return (
    <div className="ih-page">
      <div className="ih-bg">
        <div className="ih-orb ih-orb1" />
        <div className="ih-orb ih-orb2" />
        <div className="ih-grid" />
      </div>
      {loading && <Loader text="Loading history…" />}

      <div className="ih-hero">
        <div className="ih-hero-text">
          <h1>Interview History</h1>
          <p>Track your progress across all past sessions</p>
        </div>
      </div>

      <div className="ih-stats-grid">
        {[
          { icon: "📝", label: "Total Interviews", value: stats.total },
          { icon: "📊", label: "Average Score",    value: `${stats.avgScore}%` },
          { icon: "🏆", label: "Best Score",       value: `${stats.bestScore}%` },
          { icon: "🎯", label: "Best Role",        value: stats.bestRole },
          { icon: "📅", label: "Last Interview",   value: stats.lastDate },
        ].map((s, i) => (
          <div key={i} className="ih-stat-card">
            <span className="ih-stat-icon">{s.icon}</span>
            <span className="ih-stat-value">{s.value}</span>
            <span className="ih-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {interviews.length >= 2 && (
        <div className="ih-charts-grid">
          <div className="ih-chart-card">
            <div className="ih-chart-header">
              <h3>📈 Score Trend</h3>
              <span className="ih-chart-sub">Last {lineData.length} interviews</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={stats.avgScore} stroke="rgba(0,229,255,0.3)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="score" name="Score" stroke="#00e5ff"
                  strokeWidth={2.5} dot={{ fill: "#00e5ff", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="ih-chart-card">
            <div className="ih-chart-header">
              <h3>📊 Average Score by Role</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="role" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" name="Avg Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="ih-table-card">
        <div className="ih-table-topbar">
          <h3>All Sessions <span className="ih-count">{filtered.length}</span></h3>
          <div className="ih-filters">
            <select className="ih-select" defaultValue="all"
              onChange={(e) => { setFilter("role"); setFilterVal(e.target.value); }}>
              <option value="all">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
            </select>
            <select className="ih-select" defaultValue="all"
              onChange={(e) => { setFilter("difficulty"); setFilterVal(e.target.value); }}>
              <option value="all">All Levels</option>
              {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="ih-thead">
          <span>Role</span><span>Difficulty</span><span>Date</span>
          <span>Score</span><span>Verdict</span><span>Action</span>
        </div>

        {error && <p className="ih-empty">⚠️ {error}</p>}
        {!loading && !filtered.length && !error && (
          <p className="ih-empty">No interviews yet — start your first AI interview 🚀</p>
        )}

        {filtered.map((item) => {
          const vColor = VERDICT_COLORS[item.verdict] || "#94a3b8";
          const dColor = DIFF_COLORS[item.difficulty] || "#94a3b8";
          const scoreColor =
            item.totalScore >= 85 ? "#22c55e" :
            item.totalScore >= 70 ? "#00e5ff" :
            item.totalScore >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <div key={item._id} className="ih-row">
              <span className="ih-role">{ROLE_LABELS[item.role] || item.role}</span>
              <span>
                <span className="ih-diff-badge" style={{ color: dColor, borderColor: dColor }}>
                  {item.difficulty}
                </span>
              </span>
              <span className="ih-date">
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
              <span className="ih-score-cell">
                <span className="ih-score-num" style={{ color: scoreColor }}>{item.totalScore}%</span>
                <div className="ih-score-bar-track">
                  <div className="ih-score-bar-fill"
                    style={{ width: `${item.totalScore}%`, background: scoreColor }} />
                </div>
              </span>
              <span className="ih-verdict"
                style={{ color: vColor, borderColor: `${vColor}40`, background: `${vColor}10` }}>
                {item.verdict}
              </span>
              <button className="ih-view-btn" onClick={() => navigate(`/interview/${item._id}`)}>
                View →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewHistory;