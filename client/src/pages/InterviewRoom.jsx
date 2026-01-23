import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import QuestionCard from "../components/interview/QuestionCard";
import AnswerRecorder from "../components/interview/AnswerRecorder";
import Timer from "../components/interview/Timer";
import ProgressBar from "../components/interview/ProgressBar";

import useRecorder from "../hooks/useRecorder";
import { analyzeAnswer } from "../utils/analyzeAnswer";
import { useInterview } from "../context/InterviewContext";

import "../styles/interview.css";

const InterviewRoom = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const {
    QUESTIONS,
    currentIndex,
    nextQuestion,
    finished,
  } = useInterview();

  const {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
  } = useRecorder();

  // 🔴 CENTRAL CAMERA STOP FUNCTION
  const stopCamera = () => {
    stopRecording();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let mounted = true;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setTimeout(startRecording, 1500);
      })
      .catch(console.error);

    // 🔴 cleanup on unmount
    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);

  const handleNext = () => {
    stopRecording();
    const score = analyzeAnswer(transcript);
    nextQuestion(transcript, score);

    if (finished) {
      stopCamera();          // 🔴 STOP CAMERA
      navigate("/feedback");
    } else {
      startRecording();
    }
  };

  if (!QUESTIONS?.length) return null;

  return (
    <div className="interview-page">
      <div className="glass-card">
        <h1>{role.toUpperCase()} Interview</h1>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="camera-box"
        />

        <ProgressBar
          current={currentIndex + 1}
          total={QUESTIONS.length}
        />

        <Timer duration={60} onTimeUp={handleNext} />

        <QuestionCard question={QUESTIONS[currentIndex]} />

        <AnswerRecorder
          transcript={transcript}
          isRecording={isRecording}
        />

        <button className="neon-btn" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
