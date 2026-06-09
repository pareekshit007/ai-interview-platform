import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { analyzeAnswer } from "../utils/analyzeAnswer";
import useRecorder from "../hooks/useRecorder";
import Timer from "../components/interview/Timer";
import "../styles/interview.css";

const InterviewRoom = () => {
  const { role }    = useParams();
  const navigate    = useNavigate();
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);

  const [cameraOn,   setCameraOn]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audioMode,  setAudioMode]  = useState(null); // null | "headphones" | "speaker"

  const { questions, currentIndex, answers, nextQuestion, finishInterview } = useInterview();

  // headphones = echo suppression OFF (not needed, no feedback risk)
  // speakers   = echo suppression ON  (mic would pick up question audio)
  const { transcript, isRecording, error, permState, startRecording, stopRecording, resetTranscript } =
    useRecorder({ echoSuppression: audioMode === "speaker" });

  useEffect(() => {
    if (!questions.length) navigate(`/interview-setup/${role}`);
  }, [questions, navigate, role]);

  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch { setCameraOn(false); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const cleanupMedia = () => {
    stopRecording();
    stopCamera();
  };

  const handleModeSelect = async (mode) => {
    setAudioMode(mode);
    await startCamera();
    await startRecording();
  };

  const handleNext = async () => {
    stopRecording();
    const analysis = analyzeAnswer(transcript);
    const isLast   = currentIndex === questions.length - 1;
    nextQuestion(transcript, analysis.score);

    if (isLast) {
      setSubmitting(true);
      cleanupMedia();
      const finalAnswers = [...answers, {
        questionIndex: currentIndex,
        questionText:  questions[currentIndex],
        transcript,
        score:      analysis.score,
        confidence: analysis.confidence,
        clarity:    analysis.clarity,
        sentiment:  analysis.sentiment,
      }];
      await finishInterview(finalAnswers);
      setSubmitting(false);
      navigate(`/feedback/${role}`);
    } else {
      resetTranscript();
      startRecording();
    }
  };

  if (!questions.length) return null;

  // ── Audio mode selection ──────────────────────────────────────────────────
  if (!audioMode) {
    return (
      <div className="interview-page">
        <div className="audio-mode-card">
          <div className="audio-mode-header">
            <div className="audio-mode-emoji">🎙</div>
            <h2>How are you listening?</h2>
            <p>This sets up your mic correctly so speech recognition works well.</p>
          </div>

          <div className="audio-mode-options">
            <button className="audio-mode-btn" onClick={() => handleModeSelect("headphones")}>
              <span className="audio-mode-icon">🎧</span>
              <strong>Headphones</strong>
              <small>Best accuracy — mic won't pick up question audio</small>
              <span className="audio-mode-tag recommended">Recommended</span>
            </button>
            <button className="audio-mode-btn" onClick={() => handleModeSelect("speaker")}>
              <span className="audio-mode-icon">🔊</span>
              <strong>Speakers</strong>
              <small>Echo suppression enabled — speak clearly and close to mic</small>
              <span className="audio-mode-tag">Works fine</span>
            </button>
          </div>

          <div className="audio-mode-note">
            <strong>Mic not working?</strong> Check that your browser has mic permission — look for a camera/mic icon in the address bar.
          </div>
        </div>
      </div>
    );
  }

  // ── Main room ─────────────────────────────────────────────────────────────
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="interview-page">
      <div className="interview-layout">

        {/* LEFT — Camera */}
        <div className="glass-card left-panel">
          <div className="camera-wrapper">
            <video ref={videoRef} autoPlay muted playsInline
              className={`camera-box ${!cameraOn ? "camera-off" : ""}`} />
            {!cameraOn && (
              <div className="camera-placeholder">
                <span>📷</span>
                <p>Camera off</p>
              </div>
            )}
          </div>

          <div className="media-controls">
            <button className="control-btn" onClick={() => cameraOn ? stopCamera() : startCamera()}>
              {cameraOn ? "🎥 Camera On" : "📷 Camera Off"}
            </button>
            <button className={`control-btn ${isRecording ? "active-mic" : ""}`}
              onClick={() => isRecording ? stopRecording() : startRecording()}>
              {isRecording ? "🎙 Mic On" : "🔇 Mic Off"}
            </button>
            <button className="control-btn mode-badge"
              title="Click to change audio mode"
              onClick={() => { cleanupMedia(); setAudioMode(null); }}>
              {audioMode === "headphones" ? "🎧" : "🔊"}
            </button>
          </div>

          {/* Permission error shown under controls */}
          {permState === "denied" && (
            <div className="perm-error">
              🔒 Mic blocked — allow access in browser settings and refresh
            </div>
          )}
        </div>

        {/* RIGHT — Interview */}
        <div className="glass-card right-panel">
          <Timer duration={60} questionIndex={currentIndex} onTimeUp={handleNext} />

          <div className="question-card">
            <div className="question-label">Question {currentIndex + 1} / {questions.length}</div>
            <p className="question-text">{questions[currentIndex]}</p>
          </div>

          <div className={`recorder-card ${isRecording ? "active" : ""} ${error ? "has-error" : ""}`}>
            <div className="recorder-header">
              <h4>Your Answer</h4>
              <div className="recorder-meta">
                {isRecording && <span className="rec-live"><span className="rec-dot" />LIVE</span>}
                {wordCount > 0 && <span className="word-count">{wordCount} words</span>}
              </div>
            </div>

            {error ? (
              <div className="recorder-error">⚠️ {error}</div>
            ) : (
              <div className="recorder-text">
                {isRecording
                  ? transcript || <span className="placeholder-text">Listening… start speaking</span>
                  : <span className="muted-text">🔇 Microphone is off</span>
                }
              </div>
            )}

            {audioMode === "speaker" && isRecording && (
              <div className="speaker-tip">🔊 Speaker mode — speak clearly and avoid loud background noise</div>
            )}
          </div>

          <button className="neon-btn" onClick={handleNext} disabled={submitting}>
            {submitting
              ? <span className="saving-state"><span className="saving-spinner" />Saving…</span>
              : currentIndex === questions.length - 1 ? "Finish Interview →" : "Next Question →"
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewRoom;