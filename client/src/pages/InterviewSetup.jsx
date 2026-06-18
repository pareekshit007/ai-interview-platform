import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import Loader from "../components/common/Loader";
import "../styles/interviewSetup.css";

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    emoji: "🟢",
    tag: "Beginner",
    desc: "Fundamentals & concept-level questions",
    topics: ["Basic syntax", "Core concepts", "Common patterns"],
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.35)",
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    tag: "Intermediate",
    desc: "Problem-solving & practical scenarios",
    topics: ["System design basics", "Debugging", "Best practices"],
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.35)",
    recommended: true,
  },
  hard: {
    label: "Hard",
    emoji: "🔴",
    tag: "Advanced",
    desc: "Deep dives, architecture & edge cases",
    topics: ["System architecture", "Optimization", "Trade-offs"],
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.35)",
  },
};

const ROLE_LABELS = {
  frontend:    { label: "Frontend Developer",    emoji: "🖥️" },
  backend:     { label: "Backend Developer",     emoji: "⚙️" },
  fullstack:   { label: "Full Stack Developer",  emoji: "🔗" },
  devops:      { label: "DevOps Engineer",       emoji: "🚀" },
  datascience: { label: "Data Scientist",        emoji: "📊" },
  dsa:         { label: "DSA / Algorithms",      emoji: "🧮" },
  hr:          { label: "HR Interview",          emoji: "🤝" },
  aiml:        { label: "AI / ML Engineer",      emoji: "🤖" },
  security:    { label: "Security Engineer",     emoji: "🔐" },
  data:        { label: "Data Analyst",          emoji: "📈" },
};

const STEPS = ["Difficulty", "Device Check", "Ready"];

// Check if user has AI-personalisable profile data
const getProfileContextStatus = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored) return { hasContext: false, items: [] };
    const items = [];
    if (stored.skills?.length > 0)        items.push(`${stored.skills.length} skills`);
    if (stored.experience?.trim())         items.push("experience");
    if (stored.certificationsText?.trim()) items.push("certifications");
    if (stored.projectsText?.trim())       items.push("projects");
    if (stored.resumeFile)                 items.push("resume");
    return { hasContext: items.length > 0, items };
  } catch { return { hasContext: false, items: [] }; }
};

const InterviewSetup = () => {
  const { role }    = useParams();
  const navigate    = useNavigate();
  const { startInterviewSession, loading, error } = useInterview();
  const profileCtx = getProfileContextStatus();

  const [step,       setStep]       = useState(0); // 0=difficulty, 1=devices, 2=ready
  const [difficulty, setDifficulty] = useState("medium");
  const [camera,     setCamera]     = useState(false);
  const [mic,        setMic]        = useState(false);
  const [permError,  setPermError]  = useState("");
  const [camTesting, setCamTesting] = useState(false);
  const [micTesting, setMicTesting] = useState(false);

  const cameraStreamRef = useRef(null);
  const micStreamRef    = useRef(null);
  const videoPreviewRef = useRef(null);

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const checkCamera = async () => {
    if (camera) {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      setCamera(false); return;
    }
    setCamTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      setCamera(true); setPermError("");
    } catch { setPermError("Camera permission denied — allow access in browser settings."); }
    finally { setCamTesting(false); }
  };

  const checkMic = async () => {
    if (mic) {
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
      setMic(false); return;
    }
    setMicTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMic(true); setPermError("");
    } catch { setPermError("Microphone permission denied — allow access in browser settings."); }
    finally { setMicTesting(false); }
  };

  const handleStart = async () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    await startInterviewSession(role, difficulty);
    navigate(`/interview-room/${role}`);
  };

  const roleInfo  = ROLE_LABELS[role] || { label: role, emoji: "💼" };
  const diffConf  = DIFFICULTY_CONFIG[difficulty];
  const canStart  = camera && mic;

  return (
    <>
      {loading && <Loader text="Generating AI questions…" />}
      <div className="setup-page">
        <div className="setup-card">

          {/* Header */}
          <div className="setup-header">
            <div className="setup-role-pill">
              <span>{roleInfo.emoji}</span>
              <span>{roleInfo.label}</span>
            </div>
            <h1 className="setup-title">Interview Setup</h1>
            <p className="setup-sub">Configure your session before we begin</p>
          </div>

          {/* Step progress */}
          <div className="setup-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`setup-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                <div className="step-dot">{i < step ? "✓" : i + 1}</div>
                <span>{s}</span>
                {i < STEPS.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Difficulty ── */}
          {step === 0 && (
            <div className="setup-section">
              <p className="section-label">Select question difficulty</p>
              <div className="difficulty-grid">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, conf]) => (
                  <button
                    key={key}
                    className={`diff-card ${difficulty === key ? "selected" : ""}`}
                    style={difficulty === key ? {
                      "--d-color": conf.color,
                      "--d-bg": conf.bg,
                      "--d-border": conf.border,
                    } : {}}
                    onClick={() => setDifficulty(key)}
                  >
                    {conf.recommended && <span className="diff-recommended">Recommended</span>}
                    <div className="diff-top">
                      <span className="diff-emoji">{conf.emoji}</span>
                      <div>
                        <div className="diff-label">{conf.label}</div>
                        <div className="diff-tag">{conf.tag}</div>
                      </div>
                    </div>
                    <p className="diff-desc">{conf.desc}</p>
                    <div className="diff-topics">
                      {conf.topics.map(t => <span key={t} className="diff-topic">{t}</span>)}
                    </div>
                  </button>
                ))}
              </div>

              <div className="setup-nav">
                <div />
                <button className="nav-btn primary" onClick={() => setStep(1)}>
                  Continue → Device Check
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Device Check ── */}
          {step === 1 && (
            <div className="setup-section">
              <p className="section-label">Test your camera and microphone</p>

              <div className="device-grid">
                {/* Camera */}
                <div className={`device-card ${camera ? "on" : ""}`} onClick={checkCamera}>
                  <div className="device-icon">{camTesting ? "⏳" : camera ? "✅" : "📷"}</div>
                  <div className="device-info">
                    <strong>Camera</strong>
                    <small>{camTesting ? "Testing…" : camera ? "Working" : "Click to test"}</small>
                  </div>
                  <div className="device-toggle">
                    <div className="toggle-track">
                      <div className={`toggle-thumb ${camera ? "on" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Mic */}
                <div className={`device-card ${mic ? "on" : ""}`} onClick={checkMic}>
                  <div className="device-icon">{micTesting ? "⏳" : mic ? "✅" : "🎤"}</div>
                  <div className="device-info">
                    <strong>Microphone</strong>
                    <small>{micTesting ? "Testing…" : mic ? "Working" : "Click to test"}</small>
                  </div>
                  <div className="device-toggle">
                    <div className="toggle-track">
                      <div className={`toggle-thumb ${mic ? "on" : ""}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera preview */}
              {camera && (
                <div className="cam-preview-wrap">
                  <video ref={videoPreviewRef} autoPlay muted playsInline className="cam-preview" />
                  <span className="cam-preview-label">📹 Live preview</span>
                </div>
              )}

              {permError && <div className="setup-error">⚠️ {permError}</div>}

              <div className="setup-nav">
                <button className="nav-btn ghost" onClick={() => setStep(0)}>← Back</button>
                <button
                  className={`nav-btn primary ${!canStart ? "disabled" : ""}`}
                  disabled={!canStart}
                  onClick={() => setStep(2)}
                >
                  Continue → Review
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Ready ── */}
          {step === 2 && (
            <div className="setup-section">
              <div className="ready-summary">
                <div className="summary-row">
                  <span className="summary-label">Role</span>
                  <span className="summary-value">{roleInfo.emoji} {roleInfo.label}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Difficulty</span>
                  <span className="summary-value" style={{ color: diffConf.color }}>
                    {diffConf.emoji} {diffConf.label} — {diffConf.tag}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Questions</span>
                  <span className="summary-value">5 questions · 60 sec each</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Devices</span>
                  <span className="summary-value">✅ Camera &amp; mic ready</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">AI Profile</span>
                  {profileCtx.hasContext ? (
                    <span className="summary-value" style={{ color: "#22c55e" }}>
                      ✨ Personalised — {profileCtx.items.join(", ")}
                    </span>
                  ) : (
                    <span className="summary-value" style={{ color: "#64748b", fontSize: "13px" }}>
                      Generic questions ·{" "}
                      <a href="/profile" style={{ color: "var(--primary)" }}>add profile →</a>
                    </span>
                  )}
                </div>
              </div>

              <div className="ready-tips">
                <p className="tips-label">Quick tips</p>
                <ul>
                  <li>🔇 Find a quiet space — background noise affects speech recognition</li>
                  <li>💡 Speak clearly and at a steady pace</li>
                  <li>⏱️ You have 60 seconds per question — use them fully</li>
                  <li>🎧 Headphones give better mic accuracy than speakers</li>
                </ul>
              </div>

              {error && <div className="setup-error">⚠️ {error}</div>}

              <div className="setup-nav">
                <button className="nav-btn ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="nav-btn start" onClick={handleStart} disabled={loading}>
                  {loading ? <span className="btn-loading"><span className="btn-spinner" />Generating…</span> : "🚀 Start Interview"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default InterviewSetup;