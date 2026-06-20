import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import { getFriendRoom, finishFriendRoom } from "../services/friendRoomService";
import Loader from "../components/common/Loader";
import "../styles/friendCallRoom.css";

const FriendCallRoom = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const as = searchParams.get("as") === "guest" ? "guest" : "host";

  const [roomMeta, setRoomMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [notes, setNotes] = useState({});       // { [index]: { notes, rating } }
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [micFlip, setMicFlip] = useState(false);
  const [camFlip, setCamFlip] = useState(false);

  const name = as === "host"
    ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").name || "Host"; } catch { return "Host"; } })()
    : (sessionStorage.getItem("friendRoomGuestName") || "Guest");

  const {
    connected, peerPresent, callActive, localStream, remoteStream,
    micOn, camOn, error, roomData, chatMessages,
    toggleMic, toggleCam, sendChatMessage, hangUp,
    emitInterviewEvent, onInterviewEvent,
  } = useWebRTC({ code, as, name });

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef      = useRef(null);

  useEffect(() => {
    getFriendRoom(code).then(setRoomMeta).catch(() => {}).finally(() => setLoadingMeta(false));
  }, [code]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // ── Sync interview state across both peers ──
  useEffect(() => {
    const offs = [
      onInterviewEvent("interview:start", () => setStarted(true)),
      onInterviewEvent("interview:next-question", ({ index }) => setQuestionIndex(index)),
      onInterviewEvent("interview:note", ({ index, notes: n, rating }) => {
        setNotes((prev) => ({ ...prev, [index]: { notes: n, rating } }));
      }),
      onInterviewEvent("interview:end", () => setEnded(true)),
    ];
    return () => offs.forEach((off) => off && off());
  }, [onInterviewEvent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isInterviewer = roomData
    ? (roomData.hostIsInterviewer ? as === "host" : as === "guest")
    : true;

  const questions = roomData?.questions || [];
  const currentQuestion = questions[questionIndex] || "";

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
    emitInterviewEvent("interview:end");
    setEnded(true);
    setFinishing(true);
    try {
      const candidateAnswers = questions.map((q, i) => ({
        questionIndex: i,
        questionText: q,
        notes: notes[i]?.notes || "",
        rating: notes[i]?.rating || 0,
      }));
      await finishFriendRoom(code, candidateAnswers);
    } catch { /* non-critical — room still ends locally either way */ }
    setFinishing(false);
  };

  const handleLeave = () => {
    hangUp();
    navigate(as === "host" ? "/dashboard" : "/");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
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

  if (loadingMeta) return <Loader text="Connecting to room..." />;

  if (error) {
    return (
      <div className="fcr-root">
        <div className="fcr-error-screen">
          <div className="fcr-error-icon">⚠️</div>
          <h2>{error}</h2>
          <button onClick={() => navigate("/")}>← Back home</button>
        </div>
      </div>
    );
  }

  if (ended) {
    const ratedCount = Object.values(notes).filter(n => n.rating > 0).length;
    const avgRating = ratedCount
      ? (Object.values(notes).reduce((s, n) => s + (n.rating || 0), 0) / ratedCount).toFixed(1)
      : null;

    return (
      <div className="fcr-root">
        <div className="fcr-end-screen">
          <div className="fcr-end-icon">🎉</div>
          <h1>Interview complete</h1>
          <p>Great session, {name}! Here's a quick recap.</p>

          {avgRating && (
            <div className="fcr-end-stat">
              <span className="fcr-end-stat-val">{avgRating} / 5</span>
              <span className="fcr-end-stat-lbl">Average interviewer rating</span>
            </div>
          )}

          <div className="fcr-end-notes">
            {questions.map((q, i) => (
              <div key={i} className="fcr-end-note-card">
                <div className="fcr-end-q">Q{i + 1}. {q}</div>
                {notes[i]?.rating > 0 && (
                  <div className="fcr-end-rating">{"⭐".repeat(notes[i].rating)}</div>
                )}
                {notes[i]?.notes && <div className="fcr-end-note-text">{notes[i].notes}</div>}
              </div>
            ))}
          </div>

          <button className="fcr-end-btn" onClick={handleLeave} disabled={finishing}>
            {finishing ? "Saving..." : "Done — Leave Room"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fcr-root">
      {/* ── Header ── */}
      <div className="fcr-header">
        <div className="fcr-header-left">
          <span className="fcr-room-code">Room {code}</span>
          <span className={`fcr-status-dot ${connected ? "online" : "offline"}`} />
          <span className="fcr-status-text">{connected ? "Connected" : "Connecting..."}</span>
        </div>
        <div className="fcr-header-right">
          {isInterviewer ? (
            <span className="fcr-role-badge interviewer">🧑‍💼 Interviewer</span>
          ) : (
            <span className="fcr-role-badge candidate">🎤 Candidate</span>
          )}
        </div>
      </div>

      <div className="fcr-body">
        {/* ── Video area ── */}
        <div className="fcr-video-area">
          <div className="fcr-video-grid">
            <div className="fcr-video-tile">
              <video ref={localVideoRef} autoPlay playsInline muted className={camOn ? "" : "fcr-video-hidden"} />
              {!camOn && <div className="fcr-video-placeholder">📷 Camera off</div>}
              <span className="fcr-video-label">You ({name})</span>
            </div>

            <div className="fcr-video-tile">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline />
              ) : (
                <div className="fcr-video-placeholder">
                  {peerPresent ? "🔄 Connecting video..." : "⏳ Waiting for the other person to join..."}
                </div>
              )}
              <span className="fcr-video-label">{peerPresent ? "Peer" : "Waiting..."}</span>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="fcr-controls">
            <button className={`fcr-ctrl-btn ${!micOn ? "off" : ""} ${micFlip ? "icon-flip" : ""}`} onClick={handleToggleMic} title="Toggle microphone">
              {micOn ? "🎙️" : "🔇"}
            </button>
            <button className={`fcr-ctrl-btn ${!camOn ? "off" : ""} ${camFlip ? "icon-flip" : ""}`} onClick={handleToggleCam} title="Toggle camera">
              {camOn ? "📹" : "📵"}
            </button>
            <button className="fcr-ctrl-btn" onClick={() => setChatOpen((v) => !v)} title="Chat">
              💬 {chatMessages.length > 0 && <span className="fcr-chat-badge">{chatMessages.length}</span>}
            </button>
            <button className="fcr-ctrl-btn fcr-leave" onClick={handleLeave} title="Leave call">
              📴 Leave
            </button>
          </div>

          {!callActive && peerPresent && (
            <p className="fcr-connecting-note">
              Establishing direct video connection — if this takes more than 20-30 seconds, one of you may be on a restrictive network.
            </p>
          )}
        </div>

        {/* ── Interview panel ── */}
        <div className="fcr-side-panel">
          {chatOpen ? (
            <div className="fcr-chat-panel">
              <div className="fcr-chat-messages">
                {chatMessages.length === 0 && <p className="fcr-chat-empty">No messages yet</p>}
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
            <div className="fcr-interview-panel">
              {!started ? (
                <div className="fcr-pre-start">
                  <h3>Ready to begin?</h3>
                  <p>{questions.length} questions prepared for this {roomMeta?.difficulty || "medium"} difficulty session.</p>
                  {isInterviewer ? (
                    <button className="fcr-start-btn" onClick={handleStartInterview} disabled={!peerPresent}>
                      {peerPresent ? "▶️ Start Interview" : "Waiting for peer..."}
                    </button>
                  ) : (
                    <p className="fcr-waiting-note">Waiting for the interviewer to start...</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="fcr-q-progress">Question {questionIndex + 1} of {questions.length}</div>
                  <div className="fcr-q-text">{currentQuestion}</div>

                  {isInterviewer && (
                    <>
                      <div className="fcr-rating-row">
                        <span>Rate this answer:</span>
                        <div className="fcr-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              className={`fcr-star ${(notes[questionIndex]?.rating || 0) >= s ? "filled" : ""}`}
                              onClick={() => handleRatingChange(s)}
                            >★</button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="fcr-notes-input"
                        placeholder="Live notes on this answer (only you see this)..."
                        value={notes[questionIndex]?.notes || ""}
                        onChange={(e) => handleNoteChange(e.target.value)}
                      />
                    </>
                  )}

                  <div className="fcr-q-nav">
                    <button onClick={handlePrev} disabled={questionIndex === 0}>← Prev</button>
                    {questionIndex < questions.length - 1 ? (
                      <button className="primary" onClick={handleNext}>Next →</button>
                    ) : (
                      isInterviewer && (
                        <button className="fcr-end-interview-btn" onClick={handleEndInterview}>
                          🏁 End Interview
                        </button>
                      )
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