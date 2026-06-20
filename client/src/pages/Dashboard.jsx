import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHistory } from "../services/interviewService";
import { logoutUser } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [userName, setUserName] = useState("");
  const [stats,    setStats]    = useState({ total: 0, avgScore: 0, bestScore: 0, lastRole: "—" });
  const [recentInterviews, setRecentInterviews] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) { navigate("/login"); return; }
    setUserName(user.name || "Candidate");

    fetchHistory()
      .then((interviews) => {
        if (!interviews.length) return;
        const total     = interviews.length;
        const avgScore  = Math.round(interviews.reduce((s, i) => s + i.totalScore, 0) / total);
        const bestScore = Math.max(...interviews.map((i) => i.totalScore));
        const lastRole  = interviews[0]?.role || "—";
        setStats({ total, avgScore, bestScore, lastRole });
        setRecentInterviews(interviews.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { logoutUser(); navigate("/login"); };

  const getScoreColor = (score) => {
    if (score >= 85) return "#00f5a0";
    if (score >= 70) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getVerdict = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Needs Work";
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      {loading && <Loader text="Loading your dashboard..." />}

      <div className="db-root">
        {/* ── Ambient background ── */}
        <div className="db-bg">
          <div className="db-orb db-orb1" />
          <div className="db-orb db-orb2" />
          <div className="db-orb db-orb3" />
          <div className="db-grid" />
        </div>

        <div className="db-wrap">

          {/* ── HEADER ── */}
          <header className="db-header">
            <div className="db-header-left">
              <span className="db-tag">DASHBOARD</span>
              <h1 className="db-greeting">
                {greeting()},<br />
                <span className="db-name">{userName}</span>
              </h1>
              <p className="db-sub">Your AI-powered interview command center</p>
            </div>
            <div className="db-header-right">
              <div className="db-score-ring">
                <svg viewBox="0 0 80 80" className="db-ring-svg">
                  <circle cx="40" cy="40" r="32" className="db-ring-bg" />
                  <circle
                    cx="40" cy="40" r="32"
                    className="db-ring-fill"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 32}`,
                      strokeDashoffset: `${2 * Math.PI * 32 * (1 - stats.avgScore / 100)}`,
                      stroke: getScoreColor(stats.avgScore),
                    }}
                  />
                </svg>
                <div className="db-ring-inner">
                  <span className="db-ring-val">{stats.avgScore}%</span>
                  <span className="db-ring-lbl">avg</span>
                </div>
              </div>
              <button className="db-logout" onClick={handleLogout}>
                <span>↩</span> Logout
              </button>
            </div>
          </header>

          {/* ── STATS ROW ── */}
          <div className="db-stats">
            {[
              { icon: "◈", label: "Total Sessions",  value: stats.total,             color: "#00f5a0" },
              { icon: "◉", label: "Average Score",   value: `${stats.avgScore}%`,    color: "#3b82f6" },
              { icon: "◆", label: "Best Score",      value: `${stats.bestScore}%`,   color: "#f59e0b" },
              { icon: "◎", label: "Last Role",       value: stats.lastRole,           color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i} className="db-stat" style={{ "--accent": s.color, animationDelay: `${i * 0.1}s` }}>
                <div className="db-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="db-stat-val">{s.value}</div>
                <div className="db-stat-lbl">{s.label}</div>
                <div className="db-stat-bar">
                  <div className="db-stat-bar-fill" style={{ background: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="db-main">

            {/* LEFT — Actions */}
            <div className="db-actions">
              <h2 className="db-section-title">Quick Actions</h2>

              <div
                className="db-action-primary"
                onClick={() => navigate("/roles")}
              >
                <div className="db-action-glow" />
                <div className="db-action-content">
                  <div className="db-action-icon">⚡</div>
                  <div>
                    <h3>Start Interview</h3>
                    <p>AI generates questions tailored to your role and difficulty</p>
                  </div>
                </div>
                <div className="db-action-arrow">→</div>
              </div>

              <div
                className="db-action-primary db-action-friend"
                onClick={() => navigate("/friend-interview/create")}
              >
                <div className="db-action-glow" />
                <div className="db-action-content">
                  <div className="db-action-icon">👥</div>
                  <div>
                    <h3>Mock Interview with a Friend</h3>
                    <p>Live video call — share a link, no account needed for them</p>
                  </div>
                </div>
                <div className="db-action-arrow">→</div>
              </div>

              <div className="db-action-secondary-row">
                <div className="db-action-secondary" onClick={() => navigate("/interview-history")}>
                  <div className="db-action-s-icon">📋</div>
                  <div>
                    <h4>History</h4>
                    <p>Past sessions</p>
                  </div>
                  <span>→</span>
                </div>
                <div className="db-action-secondary" onClick={() => navigate("/progress")}>
                  <div className="db-action-s-icon">📈</div>
                  <div>
                    <h4>Progress</h4>
                    <p>Trends & streaks</p>
                  </div>
                  <span>→</span>
                </div>
                <div className="db-action-secondary" onClick={() => navigate("/profile")}>
                  <div className="db-action-s-icon">👤</div>
                  <div>
                    <h4>Profile</h4>
                    <p>Update info</p>
                  </div>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* RIGHT — Recent Sessions */}
            <div className="db-recent">
              <h2 className="db-section-title">Recent Sessions</h2>

              {recentInterviews.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">🎯</div>
                  <p>No interviews yet</p>
                  <span>Start your first AI mock interview!</span>
                  <button onClick={() => navigate("/roles")}>Begin Now →</button>
                </div>
              ) : (
                <div className="db-session-list">
                  {recentInterviews.map((item, i) => (
                    <div key={i} className="db-session" style={{ animationDelay: `${i * 0.1 + 0.3}s` }}>
                      <div className="db-session-left">
                        <div className="db-session-role">{item.role}</div>
                        <div className="db-session-meta">
                          {item.difficulty} · {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <div className="db-session-right">
                        <div className="db-session-score" style={{ color: getScoreColor(item.totalScore) }}>
                          {item.totalScore}%
                        </div>
                        <div className="db-session-verdict" style={{ color: getScoreColor(item.totalScore) }}>
                          {getVerdict(item.totalScore)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="db-view-all" onClick={() => navigate("/interview-history")}>
                    View All Sessions →
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── MOTIVATIONAL FOOTER ── */}
          <div className="db-footer-strip">
            <span className="db-strip-text">
              {stats.total === 0
                ? "🚀 Ready to ace your next interview? Start practicing now!"
                : stats.avgScore >= 80
                ? `🏆 Outstanding! ${stats.avgScore}% average — you're interview-ready!`
                : `💪 Keep going! ${stats.total} session${stats.total > 1 ? "s" : ""} completed. Practice makes perfect.`}
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;