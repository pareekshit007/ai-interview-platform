import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import { getFriendRoom, finishFriendRoom, joinRoomAsUser } from "../services/friendRoomService";
import Loader from "../components/common/Loader";
import "../styles/friendCallRoom.css";

const ROLE_LABELS = {
  frontend: "Frontend Developer", backend: "Backend Developer",
  fullstack: "Full Stack Developer", devops: "DevOps Engineer",
  datascience: "Data Scientist", dsa: "DSA / Algorithms",
  hr: "HR Interview", aiml: "AI / ML Engineer",
  security: "Security Engineer", data: "Data Analyst",
};

const VERDICT_EMOJI = { Excellent: "🏆", Good: "✅", Average: "📈", "Needs Work": "💪" };
const VERDICT_COLOR = { Excellent: "#22c55e", Good: "#00e5ff", Average: "#f59e0b", "Needs Work": "#ef4444" };

const FriendCallRoom = () => {
  const { code }         = useParams();
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const as               = searchParams.get("as") === "guest" ? "guest" : "host";

  // ── Auth ──
  const token   = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const user    = userRaw ? (() => { try { return JSON.parse(userRaw); } catch { return null; } })() : null;
  const name    = user?.name || (as === "host" ? "Host" : "Guest");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token || !user) {
      sessionStorage.setItem("friendRoomRedirect", `/friend-interview/join/${code}`);
      navigate("/login");
    }
  }, [token, user, code, navigate]);

  const [roomMeta, setRoomMeta]       = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [started, setStarted]         = useState(false);
  const [ended, setEnded]             = useState(false);
  const [notes, setNotes]             = useState({});
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatInput, setChatInput]     = useState("");
  const [finishing, setFinishing]     = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [micFlip, setMicFlip]         = useState(false);
  const [camFlip, setCamFlip]         = useState(false);
  const [registeredToRoom, setRegisteredToRoom] = useState(false);

  const {
    connected, peerPresent, callActive,
    localStream, remoteStream,
    micOn, camOn, error, roomData, chatMessages,
    toggleMic, toggleCam, sendChatMessage, hangUp,
    emitInterviewEvent, onInterviewEvent,
  } = useWebRTC({ code, as, name });

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef     = useRef(null);

  // ── Fetch room meta + register user to room ──
  useEffect(() => {
    if (!token) return;
    getFriendRoom(code)
      .then(async (data) => {
        setRoomMeta(data);
        // Register logged-in user as guest in DB so their userId is attached
        if (as === "guest" && !registeredToRoom) {
          try {
            await joinRoomAsUser(code);
            setRegisteredToRoom(true);
          } catch { /* non-critical if already registered */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, [code, as, token]);

  // ── Attach media streams to video elements ──
  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // ── Sync interview state from socket events ──
  useEffect(() => {
    const offs = [
      onInterviewEvent("interview:start", () => setStarted(true)),
      onInterviewEvent("interview:next-question", ({ index }) => setQuestionIndex(index)),
      onInterviewEvent("interview:note", ({ index, notes: n, rating }) => {
        setNotes((prev) => ({ ...prev, [index]: { notes: n, rating } }));
      }),
      onInterviewEvent("interview:end", () => {
        setEnded(true);
        // Candidate-side auto-finish (interviewer already called handleEndInterview)
        // Just mark ended locally; actual API call was made by the interviewer
      }),
      onInterviewEvent("interview:scorecard", (data) => {
        setScoreResult(data);
      }),
    ];
    return () => offs.forEach((off) => off && off());
  }, [onInterviewEvent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isInterviewer = roomData
    ? (roomData.hostIsInterviewer ? as === "host" : as === "guest")
    : as === "host";

  const questions      = roomData?.questions || [];
  const currentQuestion = questions[questionIndex] || "";

  // ── Interview controls ──
  const handleStartInterview = () => {
    setStarted(true);
    emitInterviewEvent("interview:start");
  };

  const handleNext = () => {
    const next = Math.min(questionIndex + 1, questions.length - 1);
    setQuestionIndex(next);
    emitInterviewEvent("interview:next-question", { index: next });
  };

  const handlePrev = () => {
    const prev = Math.max(questionIndex - 1, 0);
    setQuestionIndex(prev);
    emitInterviewEvent("interview:next-question", { index: prev });
  };

  const handleNoteChange = (text) => {
    const updated = { notes: text, rating: notes[questionIndex]?.rating || 0 };
    setNotes((prev) => ({ ...prev, [questionIndex]: updated }));
    emitInterviewEvent("interview:note", { index: questionIndex, ...updated });
  };

  const handleRatingChange = (rating) => {
    const updated = { notes: notes[questionIndex]?.notes || "", rating };
    setNotes((prev) => ({ ...prev, [questionIndex]: updated }));
    emitInterviewEvent("interview:note", { index: questionIndex, ...updated });
  };

  const handleEndInterview = async () => {
    setEnded(true);
    setFinishing(true);

    const candidateAnswers = questions.map((q, i) => ({
      questionIndex: i,
      questionText: q,
      notes: notes[i]?.notes || "",
      rating: notes[i]?.rating || 0,
    }));

    try {
      const result = await finishFriendRoom(code, candidateAnswers, user?._id || null);
      setScoreResult(result);
      // Broadcast scorecard to the other peer so they also see the end screen
      emitInterviewEvent("interview:end");
      emitInterviewEvent("interview:scorecard", result);
    } catch (err) {
      console.error("Finish failed:", err);
      emitInterviewEvent("interview:end");
    } finally {
      setFinishing(false);
    }
  };

  const handleLeave = () => {
    hangUp();
    if (scoreResult?.hostInterviewId || scoreResult?.guestInterviewId) {
      const myInterviewId = as === "host" ? scoreResult.hostInterviewId : scoreResult.guestInterviewId;
      if (myInterviewId) {
        navigate(`/interview/${myInterviewId}`);
        return;
      }
    }
    navigate(as === "host" ? "/dashboard" : "/dashboard");
  };

  const handleToggleMic = () => {
    toggleMic();
    setMicFlip(true);
    setTimeout(() => setMicFlip(false), 320);
  };

  const handleToggleCam = () => {
    toggleCam();
    setCamFlip(true);
    setTimeout(() => setCamFlip(false), 320);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  // ── Loading ──
  if (!token || !user) return null; // redirect in progress
  if (loadingMeta) return <Loader text="Connecting to room..." />;

  // ── Error ──
  if (error) {
    return (
      <div className="fcr-root">
        <div className="fcr-error-screen">
          <div className="fcr-error-icon">⚠️</div>
          <h2>{error}</h2>
          <button onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ── End / Scorecard screen ──
  if (ended) {
    const score   = scoreResult?.candidateScore ?? null;
    const verdict = scoreResult?.candidateVerdict ?? null;
    const vColor  = VERDICT_COLOR[verdict] || "#94a3b8";
    const vEmoji  = VERDICT_EMOJI[verdict] || "📋";

    return (
      <div className="fcr-root">
        <div className="fcr-end-screen">
          <div className="fcr-end-icon">{vEmoji}</div>
          <h1>Interview Complete!</h1>
          <p className="fcr-end-sub">Great session, {name}.</p>

          {score !== null && (
            <div className="fcr-score-ring" style={{ "--score-color": vColor }}>
              <svg viewBox="0 0 120 120" className="fcr-ring-svg">
                <circle cx="60" cy="60" r="50" className="fcr-ring-bg" />
                <circle
                  cx="60" cy="60" r="50"
                  className="fcr-ring-fill"
                  style={{
                    stroke: vColor,
                    strokeDasharray: `${(score / 100) * 314} 314`,
                  }}
                />
              </svg>
              <div className="fcr-ring-score">
                <span className="fcr-ring-num">{score}</span>
                <span className="fcr-ring-label">/ 100</span>
              </div>
            </div>
          )}

          {verdict && (
            <div className="fcr-verdict-badge" style={{ background: `${vColor}18`, border: `1.5px solid ${vColor}55`, color: vColor }}>
              {vEmoji} {verdict}
            </div>
          )}

          <div className="fcr-end-notes">
            {questions.map((q, i) => (
              <div key={i} className="fcr-end-note-card">
                <div className="fcr-end-q">Q{i + 1}. {q}</div>
                {notes[i]?.rating > 0 && (
                  <div className="fcr-end-rating">
                    {"⭐".repeat(notes[i].rating)}{"☆".repeat(5 - notes[i].rating)}
                  </div>
                )}
                {notes[i]?.notes && (
                  <div className="fcr-end-note-text">📝 {notes[i].notes}</div>
                )}
              </div>
            ))}
          </div>

          <div className="fcr-end-actions">
            <button className="fcr-end-btn fcr-end-primary" onClick={handleLeave} disabled={finishing}>
              {finishing ? "Saving..." : "📊 View Full Scorecard"}
            </button>
            <button className="fcr-end-btn fcr-end-ghost" onClick={() => navigate("/dashboard")}>
              🏠 Dashboard
            </button>
          </div>

          <p className="fcr-end-saved-note">
            ✅ This session has been saved to your interview history.
          </p>
        </div>
      </div>
    );
  }

  // ── Main call room ──
  return (
    <div className="fcr-root">

      {/* ── Header ── */}
      <div className="fcr-header">
        <div className="fcr-header-left">
          <span className="fcr-logo">AI<span>Interview</span></span>
          <span className="fcr-room-code">#{code}</span>
          <span className={`fcr-status-dot ${connected ? "online" : "offline"}`} />
          <span className="fcr-status-text">{connected ? "Connected" : "Connecting..."}</span>
        </div>
        <div className="fcr-header-right">
          <span className={`fcr-role-badge ${isInterviewer ? "interviewer" : "candidate"}`}>
            {isInterviewer ? "🧑‍💼 Interviewer" : "🎤 Candidate"}
          </span>
          <span className="fcr-user-name">{name}</span>
        </div>
      </div>

      <div className="fcr-body">

        {/* ── Left: video + controls ── */}
        <div className="fcr-video-area">

          {/* Pre-start waiting banner */}
          {!started && (
            <div className="fcr-waiting-banner">
              <div className="fcr-waiting-icon">🎬</div>
              <div className="fcr-waiting-text">
                <strong>{peerPresent ? "Both participants connected" : "Waiting for the other person..."}</strong>
                <span>
                  {isInterviewer
                    ? peerPresent ? "You can start the interview when ready." : "Share the room link to invite your candidate."
                    : "Waiting for the interviewer to start the session."}
                </span>
              </div>
              {isInterviewer && peerPresent && (
                <button className="fcr-start-btn" onClick={handleStartInterview}>
                  ▶️ Start Interview
                </button>
              )}
            </div>
          )}

          {/* Video tiles */}
          <div className={`fcr-video-grid ${!peerPresent ? "single" : ""}`}>
            {/* Local */}
            <div className="fcr-video-tile fcr-tile-local">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted
                  className={camOn ? "" : "fcr-video-off"} />
              ) : (
                <div className="fcr-video-placeholder fcr-cam-loading">📷 Starting camera...</div>
              )}
              {!camOn && localStream && (
                <div className="fcr-video-placeholder">📷 Camera off</div>
              )}
              <span className="fcr-video-label">
                You ({name}) {isInterviewer ? "· Interviewer" : "· Candidate"}
              </span>
              <div className="fcr-tile-indicators">
                {!micOn && <span className="fcr-muted-badge">🔇</span>}
              </div>
            </div>

            {/* Remote */}
            <div className="fcr-video-tile fcr-tile-remote">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline />
              ) : (
                <div className="fcr-video-placeholder">
                  {peerPresent
                    ? <><div className="fcr-connecting-spin" />Connecting video...</>
                    : "⏳ Waiting for the other person to join..."}
                </div>
              )}
              <span className="fcr-video-label">
                {peerPresent
                  ? (isInterviewer ? "Candidate" : "Interviewer")
                  : "Waiting..."}
              </span>
            </div>
          </div>

          {/* Controls bar */}
          <div className="fcr-controls">
            <button
              className={`fcr-ctrl-btn ${!micOn ? "off" : ""} ${micFlip ? "icon-flip" : ""}`}
              onClick={handleToggleMic}
              title={micOn ? "Mute mic" : "Unmute mic"}
            >
              {micOn ? "🎙️" : "🔇"}
              <span className="fcr-ctrl-label">{micOn ? "Mute" : "Unmute"}</span>
            </button>

            <button
              className={`fcr-ctrl-btn ${!camOn ? "off" : ""} ${camFlip ? "icon-flip" : ""}`}
              onClick={handleToggleCam}
              title={camOn ? "Turn off camera" : "Turn on camera"}
            >
              {camOn ? "📹" : "📵"}
              <span className="fcr-ctrl-label">{camOn ? "Camera" : "Off"}</span>
            </button>

            <button
              className={`fcr-ctrl-btn ${chatOpen ? "active" : ""}`}
              onClick={() => setChatOpen((v) => !v)}
              title="Toggle chat"
            >
              💬
              {chatMessages.length > 0 && !chatOpen && (
                <span className="fcr-chat-badge">{chatMessages.length}</span>
              )}
              <span className="fcr-ctrl-label">Chat</span>
            </button>

            <button className="fcr-ctrl-btn fcr-leave" onClick={() => { hangUp(); navigate("/dashboard"); }}>
              📴
              <span className="fcr-ctrl-label">Leave</span>
            </button>
          </div>

          {!callActive && peerPresent && (
            <p className="fcr-connecting-note">
              🔄 Establishing peer-to-peer connection — this may take a few seconds on some networks.
            </p>
          )}
        </div>

        {/* ── Right: interview panel or chat ── */}
        <div className="fcr-side-panel">

          {chatOpen ? (
            /* ── Chat ── */
            <div className="fcr-chat-panel">
              <div className="fcr-chat-header">
                <span>💬 Chat</span>
                <button onClick={() => setChatOpen(false)}>✕</button>
              </div>
              <div className="fcr-chat-messages">
                {chatMessages.length === 0 && (
                  <p className="fcr-chat-empty">No messages yet — use this if audio has issues.</p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`fcr-chat-msg ${m.self || m.from === name ? "self" : ""}`}>
                    <span className="fcr-chat-from">{m.from}</span>
                    <span className="fcr-chat-text">{m.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="fcr-chat-input-row">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Type a message..."
                />
                <button onClick={handleSendChat}>Send</button>
              </div>
            </div>

          ) : (
            /* ── Interview panel ── */
            <div className="fcr-interview-panel">

              {!started ? (
                /* Pre-start state for side panel */
                <div className="fcr-pre-start">
                  <div className="fcr-pre-start-icon">🎯</div>
                  <h3>
                    {ROLE_LABELS[roomMeta?.role] || roomMeta?.role} Interview
                  </h3>
                  <p>{questions.length} questions · {roomMeta?.difficulty} difficulty</p>

                  <div className="fcr-pre-start-role">
                    <div className={`fcr-role-pill ${isInterviewer ? "int" : "cand"}`}>
                      {isInterviewer ? "🧑‍💼 You are the Interviewer" : "🎤 You are the Candidate"}
                    </div>
                    {isInterviewer && (
                      <p className="fcr-int-hint">
                        You control question navigation and can rate each answer. The candidate sees the same question you do.
                      </p>
                    )}
                    {!isInterviewer && (
                      <p className="fcr-int-hint">
                        Answer each question out loud. The interviewer will navigate and rate your responses.
                      </p>
                    )}
                  </div>

                  {isInterviewer ? (
                    <button
                      className="fcr-start-btn-panel"
                      onClick={handleStartInterview}
                      disabled={!peerPresent}
                    >
                      {peerPresent ? "▶️ Start Interview" : "⏳ Waiting for candidate..."}
                    </button>
                  ) : (
                    <div className="fcr-candidate-waiting">
                      <div className="fcr-pulse-dot" />
                      <span>Waiting for the interviewer to start...</span>
                    </div>
                  )}
                </div>

              ) : (
                /* Active interview */
                <>
                  <div className="fcr-q-header">
                    <div className="fcr-q-progress-bar">
                      <div
                        className="fcr-q-progress-fill"
                        style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                      />
                    </div>
                    <span className="fcr-q-counter">
                      Question {questionIndex + 1} / {questions.length}
                    </span>
                  </div>

                  <div className="fcr-q-text">{currentQuestion}</div>

                  {isInterviewer && (
                    <>
                      <div className="fcr-rating-section">
                        <span className="fcr-rating-label">Rate this answer:</span>
                        <div className="fcr-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              className={`fcr-star ${(notes[questionIndex]?.rating || 0) >= s ? "filled" : ""}`}
                              onClick={() => handleRatingChange(s)}
                            >★</button>
                          ))}
                        </div>
                        {notes[questionIndex]?.rating > 0 && (
                          <span className="fcr-rating-val">{notes[questionIndex].rating}/5</span>
                        )}
                      </div>
                      <textarea
                        className="fcr-notes-input"
                        placeholder="Notes on this answer (only you see this)..."
                        value={notes[questionIndex]?.notes || ""}
                        onChange={(e) => handleNoteChange(e.target.value)}
                      />
                    </>
                  )}

                  {!isInterviewer && (
                    <div className="fcr-candidate-active">
                      <div className="fcr-candidate-hint">
                        🎤 Speak your answer clearly. The interviewer will rate your response and move to the next question.
                      </div>
                    </div>
                  )}

                  <div className="fcr-q-nav">
                    {isInterviewer && (
                      <>
                        <button
                          className="fcr-nav-btn"
                          onClick={handlePrev}
                          disabled={questionIndex === 0}
                        >← Prev</button>

                        {questionIndex < questions.length - 1 ? (
                          <button className="fcr-nav-btn primary" onClick={handleNext}>
                            Next →
                          </button>
                        ) : (
                          <button
                            className="fcr-nav-btn end"
                            onClick={handleEndInterview}
                            disabled={finishing}
                          >
                            {finishing ? "Saving..." : "🏁 End Interview"}
                          </button>
                        )}
                      </>
                    )}
                    {!isInterviewer && (
                      <div className="fcr-candidate-nav-note">
                        The interviewer controls navigation.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendCallRoom;