import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFriendRoom } from "../services/friendRoomService";
import Loader from "../components/common/Loader";
import "../styles/friendRoom.css";

const ROLE_LABELS = {
  frontend: "Frontend Developer", backend: "Backend Developer",
  fullstack: "Full Stack Developer", devops: "DevOps Engineer",
  datascience: "Data Scientist", dsa: "DSA / Algorithms",
  hr: "HR Interview", aiml: "AI / ML Engineer",
  security: "Security Engineer", data: "Data Analyst",
};

const FriendRoomJoin = () => {
  const { code }  = useParams();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom]       = useState(null);
  const [error, setError]     = useState("");

  const token    = localStorage.getItem("token");
  const userRaw  = localStorage.getItem("user");
  const user     = userRaw ? (() => { try { return JSON.parse(userRaw); } catch { return null; } })() : null;
  const isLoggedIn = !!(token && user);

  useEffect(() => {
    getFriendRoom(code)
      .then(setRoom)
      .catch((err) => setError(err.message || "Room not found"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem("friendRoomRedirect", `/friend-interview/join/${code}`);
      navigate("/login");
      return;
    }
    // Always append ?as=guest — the person clicking this link is always the guest
    navigate(`/friend-interview/room/${code}?as=guest`);
  };

  // If coming back from login, auto-redirect into the room as guest
  useEffect(() => {
    if (isLoggedIn && room && !loading) {
      const redirect = sessionStorage.getItem("friendRoomRedirect");
      if (redirect && redirect.includes(code)) {
        sessionStorage.removeItem("friendRoomRedirect");
        navigate(`/friend-interview/room/${code}?as=guest`);
      }
    }
  }, [isLoggedIn, room, loading, code, navigate]);

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

  // hostIsInterviewer = true  → host is interviewer, guest is candidate
  // hostIsInterviewer = false → host is candidate,   guest is interviewer
  // The person on this page is always the GUEST, so:
  const guestIsInterviewer = room?.hostIsInterviewer === false;

  return (
    <div className="fr-root">
      <div className="fr-bg">
        <div className="fr-orb fr-orb1" />
        <div className="fr-orb fr-orb2" />
      </div>

      <div className="fr-wrap">
        <div className="fr-card">
          <span className="fr-tag">YOU'VE BEEN INVITED</span>
          <h1 className="fr-title">{room?.hostName} invited you</h1>
          <p className="fr-sub">
            {ROLE_LABELS[room?.role] || room?.role} mock interview · {room?.difficulty} difficulty
          </p>

          <div className="fr-invite-summary">
            <div className="fr-invite-row">
              <span>Your role</span>
              <strong>{guestIsInterviewer ? "🧑‍💼 Interviewer" : "🎤 Candidate"}</strong>
            </div>
            <div className="fr-invite-row">
              <span>Questions</span>
              <strong>{room?.questionCount} prepared</strong>
            </div>
            <div className="fr-invite-row">
              <span>Session history</span>
              <strong>✅ Saved to your account</strong>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="fr-localhost-warning">
              🔐 You need to <strong>log in or sign up</strong> to join this interview — your results will be saved to your account.
            </div>
          )}

          {isLoggedIn && (
            <div className="fr-logged-in-note">
              ✅ Joining as <strong>{user?.name}</strong>
            </div>
          )}

          <button className="fr-create-btn" onClick={handleJoin}>
            {isLoggedIn ? "🎥 Join Call" : "🔐 Log in to Join"}
          </button>

          {!isLoggedIn && (
            <p className="fr-no-account-note">
              Don't have an account?{" "}
              <span
                className="fr-signup-link"
                onClick={() => {
                  sessionStorage.setItem("friendRoomRedirect", `/friend-interview/join/${code}`);
                  navigate("/signup");
                }}
              >
                Sign up free
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRoomJoin;