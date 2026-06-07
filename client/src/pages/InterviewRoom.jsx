import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import { analyzeAnswer } from "../utils/analyzeAnswer";
import Timer from "../components/interview/Timer";
import "../styles/interview.css";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const InterviewRoom = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null), streamRef = useRef(null), recognitionRef = useRef(null);
  const [cameraOn,   setCameraOn]   = useState(true);
  const [micOn,      setMicOn]      = useState(true);
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { questions, currentIndex, answers, nextQuestion, finishInterview } = useInterview();

  useEffect(() => {
    if (!questions.length) navigate(`/interview-setup/${role}`);
  }, [questions, navigate, role]);

  const cleanupMedia = () => {
    recognitionRef.current?.stop(); recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false); setMicOn(false);
  };

  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch { setCameraOn(false); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const startListening = () => {
    if (!SpeechRecognition || recognitionRef.current) return;
    const r = new SpeechRecognition();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
    };
    r.start(); recognitionRef.current = r; setMicOn(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop(); recognitionRef.current = null; setMicOn(false);
  };

  useEffect(() => { startCamera(); startListening(); return cleanupMedia; }, []);

  const handleNext = async () => {
    stopListening();
    const analysis = analyzeAnswer(transcript);
    const isLast = currentIndex === questions.length - 1;
    nextQuestion(transcript, analysis.score);
    setTranscript("");

    if (isLast) {
      setSubmitting(true);
      cleanupMedia();
      const finalAnswers = [...answers, {
        questionIndex: currentIndex, questionText: questions[currentIndex],
        transcript, score: analysis.score, confidence: analysis.confidence,
        clarity: analysis.clarity, sentiment: analysis.sentiment,
      }];
      await finishInterview(finalAnswers);
      setSubmitting(false);
      navigate(`/feedback/${role}`);
    } else {
      startListening();
    }
  };

  if (!questions.length) return null;

  return (
    <div className="interview-page">
      <div className="interview-layout">
        <div className="glass-card left-panel">
          <video ref={videoRef} autoPlay muted playsInline
            className={`camera-box ${!cameraOn?"camera-off":""}`} />
          <div className="media-controls">
            <button className="control-btn" onClick={() => cameraOn?stopCamera():startCamera()}>
              🎥 {cameraOn?"Camera On":"Camera Off"}
            </button>
            <button className="control-btn" onClick={() => micOn?stopListening():startListening()}>
              🎙 {micOn?"Mic On":"Mic Muted"}
            </button>
          </div>
        </div>
        <div className="glass-card right-panel">
          <div className="top-right"><Timer duration={60} onTimeUp={handleNext} /></div>
          <div className="question-card">
            <h3>Question {currentIndex+1} / {questions.length}</h3>
            <p>{questions[currentIndex]}</p>
          </div>
          <div className={`recorder-card ${micOn?"active":""}`}>
            <h4>Your Answer (Live)</h4>
            <div className="recorder-text">
              {micOn ? transcript||"Start speaking..." : <span className="muted-text">Microphone muted</span>}
            </div>
          </div>
          <button className="neon-btn" onClick={handleNext} disabled={submitting}>
            {submitting?"Saving...":currentIndex===questions.length-1?"Finish Interview":"Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;