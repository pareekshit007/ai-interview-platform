import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHistory } from "../services/interviewService";
import { logoutUser } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [userName, setUserName] = useState("");
  const [stats,    setStats]    = useState({ total: 0, avgScore: 0, bestScore: 0, lastRole: "—" });

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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { logoutUser(); navigate("/login"); };

  return (
    <>
      {loading && <Loader text="Loading your dashboard..." />}
      <div className="dashboard-container">
        <div className="dashboard-hero">
          <div>
            <h1>Welcome back, {userName} 👋</h1>
            <p>Your AI-powered interview control center</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <div className="dashboard-stats">
          {[
            { icon: "🎤", label: "Total Sessions", value: stats.total },
            { icon: "📊", label: "Average Score",  value: `${stats.avgScore}%` },
            { icon: "🏆", label: "Best Score",     value: `${stats.bestScore}%` },
            { icon: "🎯", label: "Last Role",      value: stats.lastRole },
          ].map((s, i) => (
            <div key={i} className="stat-card glass-card">
              <div className="stat-icon">{s.icon}</div>
              <h2>{s.value}</h2>
              <p>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-cards">
          {[
            { icon: "🎤", title: "Start Interview",    desc: "Practice AI-powered mock interviews.",          action: () => navigate("/roles"),              primary: true  },
            { icon: "📊", title: "Interview History",  desc: "Review past sessions and AI feedback.",         action: () => navigate("/interview-history"),  primary: false },
            { icon: "👤", title: "My Profile",         desc: "Update your profile, skills, and career info.", action: () => navigate("/profile"),            primary: false },
          ].map((c, i) => (
            <div key={i} className={`dashboard-card ${c.primary ? "primary" : ""}`}>
              <div className="icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <button onClick={c.action}>{c.primary ? "Start Now →" : "View →"}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;