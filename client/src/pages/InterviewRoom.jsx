import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { analyzeAnswer } from "../utils/analyzeAnswer";
import useRecorder from "../hooks/useRecorder";
import Timer from "../components/interview/Timer";
import "../styles/interview.css";

const InterviewRoom = () => {
  const { role }  = useParams();
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn,   setCameraOn]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audioMode,  setAudioMode]  = useState(null);
  const [inputMode,  setInputMode]  = useState("speech"); // "speech" | "text"
  const [typedText,  setTypedText]  = useState("");

  const { questions, currentIndex, nextQuestion, finishInterview } = useInterview();

  const { transcript, isRecording, error, permState, startRecording, stopRecording, resetTranscript } =
    useRecorder({ echoSuppression: audioMode === "speaker" });

  // Always-fresh ref for speech transcript
  const transcriptRef = useRef("");
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Collect all answers in a ref — never stale
  const allAnswersRef = useRef([]);

  useEffect(() => {
    if (!questions.length) navigate(`/interview-setup/${role}`);
  }, [questions, navigate, role]);

  // ── Camera helpers ─────────────────────────────────────────────────────────
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

  const cleanupMedia = () => { stopRecording(); stopCamera(); };

  const handleModeSelect = async (mode) => {
    setAudioMode(mode);
    await startCamera();
    await startRecording();
  };

  // ── Switch between speech / text input ────────────────────────────────────
  const switchToText = () => {
    stopRecording();
    setInputMode("text");
  };

  const switchToSpeech = async () => {
    setTypedText("");
    setInputMode("speech");
    await startRecording();
  };

  // ── Core: move to next question or finish ──────────────────────────────────
  const handleNext = async () => {
    // Get the answer from whichever input mode is active
    const currentTranscript =
      inputMode === "text" ? typedText.trim() : transcriptRef.current.trim();

    stopRecording();

    const analysis = analyzeAnswer(currentTranscript);
    const isLast   = currentIndex === questions.length - 1;

    const thisAnswer = {
      questionIndex: currentIndex,
      questionText:  questions[currentIndex],
      transcript:    currentTranscript,
      score:         analysis.score,
      confidence:    analysis.confidence,
      clarity:       analysis.clarity,
      sentiment:     analysis.sentiment,
    };

    allAnswersRef.current = [...allAnswersRef.current, thisAnswer];
    nextQuestion(currentTranscript, analysis.score, analysis);

    if (isLast) {
      setSubmitting(true);
      cleanupMedia();
      await finishInterview(allAnswersRef.current);
      setSubmitting(false);
      navigate(`/feedback/${role}`);
    } else {
      setTypedText("");
      resetTranscript();
      if (inputMode === "speech") startRecording();
    }
  };

  if (!questions.length) return null;

  // ── Audio mode selection screen ────────────────────────────────────────────
  if (!audioMode) {
    return (
      <div className="interview-page">
        <div className="audio-mode-card">
          <div className="audio-mode-header">
            <div className="audio-mode-emoji">🎙</div>
            <h2>Choose your answer mode</h2>
            <p>Pick how you want to answer — you can switch anytime during the interview.</p>
          </div>

          <div className="audio-mode-options">
            <button className="audio-mode-btn" onClick={() => handleModeSelect("headphones")}>
              <span className="audio-mode-icon">🎧</span>
              <strong>Headphones + Mic</strong>
              <small>Speak your answers — best accuracy with headphones</small>
              <span className="audio-mode-tag recommended">Recommended</span>
            </button>
            <button className="audio-mode-btn" onClick={() => handleModeSelect("speaker")}>
              <span className="audio-mode-icon">🔊</span>
              <strong>Speakers + Mic</strong>
              <small>Echo suppression enabled — speak clearly and close to mic</small>
              <span className="audio-mode-tag">Works fine</span>
            </button>
          </div>

          <div className="audio-mode-note">
            <strong>Mic not working?</strong> No problem — you can switch to <strong>type your answers</strong> once inside the interview.
          </div>
        </div>
      </div>
    );
  }

  // ── Main interview room ────────────────────────────────────────────────────
  const speechWordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const textWordCount   = typedText.trim().split(/\s+/).filter(Boolean).length;
  const wordCount       = inputMode === "text" ? textWordCount : speechWordCount;

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
                <span>📷</span><p>Camera off</p>
              </div>
            )}
          </div>

          <div className="media-controls">
            <button className="control-btn" onClick={() => cameraOn ? stopCamera() : startCamera()}>
              {cameraOn ? "🎥 Camera On" : "📷 Camera Off"}
            </button>

            {inputMode === "speech" ? (
              <button className={`control-btn ${isRecording ? "active-mic" : ""}`}
                onClick={() => isRecording ? stopRecording() : startRecording()}>
                {isRecording ? "🎙 Mic On" : "🔇 Mic Off"}
              </button>
            ) : (
              <button className="control-btn" style={{ opacity: 0.5, cursor: "default" }} disabled>
                ⌨️ Text Mode
              </button>
            )}

            <button className="control-btn mode-badge"
              title="Click to change audio mode"
              onClick={() => { cleanupMedia(); setAudioMode(null); }}>
              {audioMode === "headphones" ? "🎧" : "🔊"}
            </button>
          </div>

          {permState === "denied" && (
            <div className="perm-error">
              🔒 Mic blocked — <strong>switch to text input below</strong>
            </div>
          )}

          {/* Input mode toggle */}
          <div className="input-mode-toggle">
            <button
              className={`toggle-btn ${inputMode === "speech" ? "active" : ""}`}
              onClick={switchToSpeech}>
              🎙 Voice
            </button>
            <button
              className={`toggle-btn ${inputMode === "text" ? "active" : ""}`}
              onClick={switchToText}>
              ⌨️ Type
            </button>
          </div>
        </div>

        {/* RIGHT — Interview */}
        <div className="glass-card right-panel">
          <Timer duration={60} questionIndex={currentIndex} onTimeUp={handleNext} />

          <div className="question-card">
            <div className="question-label">Question {currentIndex + 1} / {questions.length}</div>
            <p className="question-text">{questions[currentIndex]}</p>
          </div>

          {/* Answer area — speech OR text depending on mode */}
          <div className={`recorder-card ${isRecording && inputMode === "speech" ? "active" : ""} ${error && inputMode === "speech" ? "has-error" : ""}`}>
            <div className="recorder-header">
              <h4>Your Answer {inputMode === "text" ? "⌨️" : "🎙"}</h4>
              <div className="recorder-meta">
                {isRecording && inputMode === "speech" && <span className="rec-live"><span className="rec-dot" />LIVE</span>}
                {wordCount > 0 && <span className="word-count">{wordCount} words</span>}
              </div>
            </div>

            {inputMode === "text" ? (
              <textarea
                className="answer-textarea"
                placeholder="Type your answer here… (speak naturally as if in a real interview)"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                rows={5}
              />
            ) : error ? (
              <div className="recorder-error">⚠️ {error}
                <button className="switch-to-text-btn" onClick={switchToText}>
                  Switch to typing instead →
                </button>
              </div>
            ) : (
              <div className="recorder-text">
                {isRecording
                  ? transcript || <span className="placeholder-text">Listening… start speaking</span>
                  : <span className="muted-text">🔇 Microphone is off</span>
                }
              </div>
            )}

            {audioMode === "speaker" && isRecording && inputMode === "speech" && (
              <div className="speaker-tip">🔊 Speaker mode — speak clearly and avoid background noise</div>
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