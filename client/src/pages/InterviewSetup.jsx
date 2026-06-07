import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import Loader from "../components/common/Loader";
import "../styles/interviewSetup.css";

const InterviewSetup = () => {
  const { role }   = useParams();
  const navigate   = useNavigate();
  const { startInterviewSession, loading, error } = useInterview();

  const [camera,     setCamera]     = useState(false);
  const [mic,        setMic]        = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [permError,  setPermError]  = useState("");

  const cameraStreamRef = useRef(null);
  const micStreamRef    = useRef(null);

  const checkCamera = async () => {
    if (camera) {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null; setCamera(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream; setCamera(true); setPermError("");
    } catch { setPermError("Camera permission denied"); }
  };

  const checkMic = async () => {
    if (mic) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null; setMic(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream; setMic(true); setPermError("");
    } catch { setPermError("Microphone permission denied"); }
  };

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const handleStart = async () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    await startInterviewSession(role, difficulty);
    navigate(`/interview-room/${role}`);
  };

  return (
    <>
      {loading && <Loader text="Generating AI questions..." />}
      <div className="setup-page">
        <div className="setup-card">
          <div className="header">
            <div className="badge">PRE-CHECK</div>
            <h1>{role.toUpperCase()} Interview</h1>
          </div>

          <div className="section">
            <h3>Difficulty Level</h3>
            <div className="difficulty-buttons">
              {["easy","medium","hard"].map((d) => (
                <button key={d} className={`diff-btn ${difficulty===d?"active":""}`}
                  onClick={() => setDifficulty(d)}>
                  {d.charAt(0).toUpperCase()+d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Device Checks</h3>
            <div className={`check-item ${camera?"on":""}`} onClick={checkCamera}>
              <div className="icon">📷</div>
              <div className="meta"><strong>Camera</strong><small>{camera?"Detected":"Click to test"}</small></div>
              <div className="toggle"><span/></div>
            </div>
            <div className={`check-item ${mic?"on":""}`} onClick={checkMic}>
              <div className="icon">🎤</div>
              <div className="meta"><strong>Microphone</strong><small>{mic?"Detected":"Click to test"}</small></div>
              <div className="toggle"><span/></div>
            </div>
          </div>

          {(permError||error) && <p className="error-text">{permError||error}</p>}

          <div className="footer">
            <div className={`status ${camera&&mic?"ok":""}`}>
              {camera&&mic?"System Ready ✅":"Complete all checks to continue"}
            </div>
            <button className={`join-btn ${camera&&mic?"active":""}`}
              disabled={!(camera&&mic)||loading} onClick={handleStart}>
              {loading?"Loading Questions...":"Start Interview"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterviewSetup;