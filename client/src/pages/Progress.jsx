import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchProgress } from "../services/interviewService";
import Loader from "../components/common/Loader";
import "../styles/progress.css";

const ROLE_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full Stack",
  devops: "DevOps",
  datascience: "Data Science",
  dsa: "DSA",
  hr: "HR",
  aiml: "AI / ML",
  security: "Security",
  data: "Data Analyst",
};

const TOPIC_RESOURCES = {
  "React & Hooks": "https://react.dev/learn",
  "JavaScript Core": "https://javascript.info/",
  "CSS & Styling": "https://web.dev/learn/css/",
  "System Design": "https://github.com/donnemartin/system-design-primer",
  "Databases & SQL": "https://www.sqltutorial.org/",
  "APIs & Backend": "https://restfulapi.net/",
  "Authentication & Security": "https://owasp.org/www-project-top-ten/",
  "Data Structures": "https://www.geeksforgeeks.org/data-structures/",
  "Algorithms": "https://www.geeksforgeeks.org/fundamentals-of-algorithms/",
  "Machine Learning": "https://developers.google.com/machine-learning/crash-course",
  "DevOps & Cloud": "https://roadmap.sh/devops",
  "Behavioral / HR": "https://www.themuse.com/advice/behavioral-interview-questions-answers-examples",
  "Data Analysis": "https://www.kaggle.com/learn",
  "General": "https://roadmap.sh/",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="pg-tooltip">
      <div className="pg-tooltip-score">{d.score}%</div>
      <div className="pg-tooltip-meta">
        {ROLE_LABELS[d.role] || d.role} · {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>
    </div>
  );
};

const Progress = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetchProgress()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <Loader text="Crunching your numbers..." />;

  const hasData = data && data.totalSessions > 0;

  return (
    <div className="pg-root">
      <div className="pg-bg">
        <div className="pg-orb pg-orb1" />
        <div className="pg-orb pg-orb2" />
        <div className="pg-grid" />
      </div>

      <div className="pg-wrap">
        <header className="pg-header">
          <span className="pg-tag">PROGRESS</span>
          <h1 className="pg-title">Your interview journey</h1>
          <p className="pg-sub">Track trends, streaks, and where to focus next.</p>
        </header>

        {!hasData ? (
          <div className="pg-empty">
            <div className="pg-empty-icon">📈</div>
            <p>No data yet</p>
            <span>Complete a few interviews and your progress will show up here.</span>
            <button onClick={() => navigate("/roles")}>Start an Interview →</button>
          </div>
        ) : (
          <>
            {/* ── Streak + Stats row ── */}
            <div className="pg-top-row">
              <div className="pg-streak-card">
                <div className="pg-streak-flame">🔥</div>
                <div className="pg-streak-num">{data.currentStreak}</div>
                <div className="pg-streak-lbl">day streak</div>
                <div className="pg-streak-best">Best: {data.longestStreak} days</div>
              </div>

              <div className="pg-stats-grid">
                <div className="pg-stat">
                  <div className="pg-stat-val">{data.totalSessions}</div>
                  <div className="pg-stat-lbl">Sessions</div>
                </div>
                <div className="pg-stat">
                  <div className="pg-stat-val">{data.avgScore}%</div>
                  <div className="pg-stat-lbl">Avg Score</div>
                </div>
                <div className="pg-stat">
                  <div className="pg-stat-val">{data.bestScore}%</div>
                  <div className="pg-stat-lbl">Best Score</div>
                </div>
                <div className="pg-stat">
                  <div className="pg-stat-val">{data.avgConfidence || 0}%</div>
                  <div className="pg-stat-lbl">Avg Confidence</div>
                </div>
              </div>
            </div>

            {/* ── Score trend chart ── */}
            <section className="pg-section">
              <h2 className="pg-section-title">Score trend</h2>
              <div className="pg-chart-card">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.scoreTrend}>
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f5a0" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00f5a0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#00f5a0" strokeWidth={2.5} fill="url(#scoreFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="pg-two-col">
              {/* ── Weak topics ── */}
              <section className="pg-section">
                <h2 className="pg-section-title">Focus areas</h2>
                {data.weakTopics.length === 0 ? (
                  <div className="pg-card pg-no-weak">
                    Not enough repeated topics yet to spot a pattern — keep practicing!
                  </div>
                ) : (
                  <div className="pg-weak-list">
                    {data.weakTopics.map((t, i) => (
                      <div key={i} className="pg-weak-card">
                        <div className="pg-weak-top">
                          <span className="pg-weak-topic">{t.topic}</span>
                          <span className="pg-weak-score">{t.avgScore}%</span>
                        </div>
                        <div className="pg-weak-bar">
                          <div
                            className="pg-weak-bar-fill"
                            style={{ width: `${t.avgScore}%`, background: t.avgScore < 40 ? "#ef4444" : "#f59e0b" }}
                          />
                        </div>
                        <div className="pg-weak-foot">
                          <span>Seen in {t.count} answer{t.count > 1 ? "s" : ""}</span>
                          <a href={TOPIC_RESOURCES[t.topic] || TOPIC_RESOURCES.General} target="_blank" rel="noreferrer">
                            Study resource →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Role breakdown ── */}
              <section className="pg-section">
                <h2 className="pg-section-title">By role</h2>
                <div className="pg-role-list">
                  {data.roleBreakdown.map((r, i) => (
                    <div key={i} className="pg-role-row">
                      <span className="pg-role-name">{ROLE_LABELS[r.role] || r.role}</span>
                      <div className="pg-role-bar">
                        <div className="pg-role-bar-fill" style={{ width: `${r.avgScore}%` }} />
                      </div>
                      <span className="pg-role-score">{r.avgScore}%</span>
                      <span className="pg-role-count">{r.count}×</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;