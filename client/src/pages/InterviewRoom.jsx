import { useEffect, useRef, useState } from "react";
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

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const {
    QUESTIONS,
    currentIndex,
    nextQuestion,
    finished,
    resetInterview,
  } = useInterview();

  const {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
  } = useRecorder();

  // 🔴 Start camera
  const startCamera = async () => {
    if (streamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    streamRef.current = stream;
    videoRef.current.srcObject = stream;
  };

  // 🔴 Stop camera
  const stopCamera = () => {
    stopRecording();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  // 🎥 Toggle Camera
  const toggleCamera = () => {
    if (cameraOn) {
      streamRef.current
        ?.getVideoTracks()
        .forEach(track => (track.enabled = false));
    } else {
      streamRef.current
        ?.getVideoTracks()
        .forEach(track => (track.enabled = true));
    }
    setCameraOn(!cameraOn);
  };

  // 🎙️ Toggle Mic
  const toggleMic = () => {
    streamRef.current
      ?.getAudioTracks()
      .forEach(track => (track.enabled = !micOn));
    setMicOn(!micOn);
  };

  // 🔁 Init interview
  useEffect(() => {
    resetInterview();

    let mounted = true;

    startCamera().then(() => {
      if (!mounted) return;
      setTimeout(startRecording, 1500);
    });

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
      stopCamera();
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
          className={`camera-box ${!cameraOn ? "camera-off" : ""}`}
        />

        {/* 🔘 CONTROLS */}
        <div className="media-controls">
          <button onClick={toggleCamera} className="control-btn">
            {cameraOn ? "🎥 Camera On" : "🚫 Camera Off"}
          </button>

          <button onClick={toggleMic} className="control-btn">
            {micOn ? "🎙️ Mic On" : "🔇 Mic Muted"}
          </button>
        </div>

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
