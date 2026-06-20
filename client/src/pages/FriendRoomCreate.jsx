import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFriendRoom } from "../services/friendRoomService";
import Loader from "../components/common/Loader";
import "../styles/friendRoom.css";

const ROLE_OPTIONS = [
  { key: "frontend",    label: "Frontend Developer",   emoji: "🖥️" },
  { key: "backend",     label: "Backend Developer",    emoji: "⚙️" },
  { key: "fullstack",   label: "Full Stack Developer", emoji: "🔗" },
  { key: "devops",      label: "DevOps Engineer",      emoji: "🚀" },
  { key: "datascience", label: "Data Scientist",       emoji: "📊" },
  { key: "dsa",         label: "DSA / Algorithms",     emoji: "🧮" },
  { key: "hr",          label: "HR Interview",         emoji: "🤝" },
  { key: "aiml",        label: "AI / ML Engineer",     emoji: "🤖" },
  { key: "security",    label: "Security Engineer",    emoji: "🔐" },
  { key: "data",        label: "Data Analyst",         emoji: "📈" },
];

const FriendRoomCreate = () => {
  const navigate = useNavigate();
  const [role, setRole]               = useState("frontend");
  const [difficulty, setDifficulty]   = useState("medium");
  const [hostIsInterviewer, setHostIsInterviewer] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [created, setCreated]         = useState(null);
  const [copied, setCopied]           = useState(false);
  const [rolePulse, setRolePulse]     = useState("");
  const [diffPulse, setDiffPulse]     = useState("");

  const handleRoleSelect = (key) => {
    setRole(key);
    setRolePulse(key);
    setTimeout(() => setRolePulse(""), 350);
  };

  const handleDifficultySelect = (d) => {
    setDifficulty(d);
    setDiffPulse(d);
    setTimeout(() => setDiffPulse(""), 350);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await createFriendRoom({ role, difficulty, hostIsInterviewer });
      setCreated(data);
    } catch (err) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const joinLink = created
    ? `${window.location.origin}/friend-interview/join/${created.code}`
    : "";

  const isLocalHost = /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(window.location.hostname);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — user can select manually */ }
  };

  if (loading) return <Loader text="Setting up your room..." />;

  return (
    <div className="fr-root">
      <div className="fr-bg">
        <div className="fr-orb fr-orb1" />
        <div className="fr-orb fr-orb2" />
      </div>

      <div className="fr-wrap">
        {!created ? (
          <div className="fr-card">
            <span className="fr-tag">FRIEND INTERVIEW</span>
            <h1 className="fr-title">Practice with a friend</h1>
            <p className="fr-sub">Set up a live video mock interview. Share the link — no account needed for them to join.</p>

            <div className="fr-field">
              <label>Role</label>
              <div className="fr-role-grid">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    className={`fr-role-chip ${role === r.key ? "selected" : ""} ${rolePulse === r.key ? "pulse" : ""}`}
                    onClick={() => handleRoleSelect(r.key)}
                  >
                    <span>{r.emoji}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fr-field">
              <label>Difficulty</label>
              <div className="fr-diff-row">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    className={`fr-diff-chip fr-diff-${d} ${difficulty === d ? "selected" : ""} ${diffPulse === d ? "pulse" : ""}`}
                    onClick={() => handleDifficultySelect(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="fr-field">
              <label>Who plays interviewer?</label>
              <div
                className={`fr-toggle ${hostIsInterviewer ? "left" : "right"}`}
                onClick={() => setHostIsInterviewer((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setHostIsInterviewer((v) => !v)}
              >
                <div className="fr-toggle-thumb" />
                <span className={`fr-toggle-option ${hostIsInterviewer ? "active" : ""}`}>
                  🧑‍💼 I'll interview
                </span>
                <span className={`fr-toggle-option ${!hostIsInterviewer ? "active" : ""}`}>
                  🎤 I'll be the candidate
                </span>
              </div>
            </div>

            {error && <div className="fr-error">⚠️ {error}</div>}

            <button className="fr-create-btn" onClick={handleCreate}>
              🚀 Create Room
            </button>
          </div>
        ) : (
          <div className="fr-card fr-success">
            <div className="fr-success-icon">✅</div>
            <h1 className="fr-title">Room ready!</h1>
            <p className="fr-sub">Share this link with your friend to start the call.</p>

            {isLocalHost && (
              <div className="fr-localhost-warning">
                ⚠️ <strong>You're on localhost.</strong> This link only works on this same computer —
                your friend won't be able to open it. Use your deployed site (e.g. your Vercel URL)
                to generate a link that works for both of you.
              </div>
            )}

            <div className="fr-code-box">
              <span className="fr-code">{created.code}</span>
            </div>

            <div className="fr-link-row">
              <input readOnly value={joinLink} onClick={(e) => e.target.select()} />
              <button onClick={copyLink}>{copied ? "✓ Copied" : "Copy"}</button>
            </div>

            <button
              className="fr-create-btn"
              onClick={() => navigate(`/friend-interview/room/${created.code}?as=host`)}
            >
              🎥 Enter Call Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRoomCreate;