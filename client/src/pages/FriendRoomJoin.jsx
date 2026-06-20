import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFriendRoom } from "../services/friendRoomService";
import Loader from "../components/common/Loader";
import "../styles/friendRoom.css";

const ROLE_LABELS = {
  frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Full Stack Developer",
  devops: "DevOps Engineer", datascience: "Data Scientist", dsa: "DSA / Algorithms",
  hr: "HR Interview", aiml: "AI / ML Engineer", security: "Security Engineer", data: "Data Analyst",
};

const FriendRoomJoin = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom]       = useState(null);
  const [name, setName]       = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    getFriendRoom(code)
      .then(setRoom)
      .catch((err) => setError(err.message || "Room not found"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    sessionStorage.setItem("friendRoomGuestName", name.trim());
    navigate(`/friend-interview/room/${code}?as=guest`);
  };

  if (loading) return <Loader text="Looking up room..." />;

  if (error && !room) {
    return (
      <div className="fr-root">
        <div className="fr-wrap">
          <div className="fr-card fr-error-card">
            <div className="fr-success-icon">❌</div>
            <h1 className="fr-title">Room not found</h1>
            <p className="fr-sub">{error} — the link may have expired or be mistyped.</p>
            <button className="fr-create-btn" onClick={() => navigate("/")}>← Back home</button>
          </div>
        </div>
      </div>
    );
  }

  const candidateRole = room.hostIsInterviewer ? "Candidate" : "Interviewer";

  return (
    <div className="fr-root">
      <div className="fr-bg">
        <div className="fr-orb fr-orb1" />
        <div className="fr-orb fr-orb2" />
      </div>

      <div className="fr-wrap">
        <div className="fr-card">
          <span className="fr-tag">YOU'VE BEEN INVITED</span>
          <h1 className="fr-title">{room.hostName} invited you</h1>
          <p className="fr-sub">
            {ROLE_LABELS[room.role] || room.role} mock interview · {room.difficulty} difficulty
          </p>

          <div className="fr-invite-summary">
            <div className="fr-invite-row">
              <span>Your role</span>
              <strong>{candidateRole === "Candidate" ? "🎤 Candidate" : "🧑‍💼 Interviewer"}</strong>
            </div>
            <div className="fr-invite-row">
              <span>Questions</span>
              <strong>{room.questionCount} prepared</strong>
            </div>
          </div>

          <div className="fr-field">
            <label>Your name</label>
            <input
              className="fr-name-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={40}
            />
          </div>

          {error && <div className="fr-error">⚠️ {error}</div>}

          <button className="fr-create-btn" onClick={handleJoin}>
            🎥 Join Call
          </button>
          <p className="fr-no-account-note">No account needed — you're joining as a guest.</p>
        </div>
      </div>
    </div>
  );
};

export default FriendRoomJoin;