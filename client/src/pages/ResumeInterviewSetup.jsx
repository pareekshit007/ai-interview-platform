import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/userService";
import { startResumeInterview } from "../services/resumeInterviewService";
import "../styles/resumeInterview.css";

const ResumeInterviewSetup = () => {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasEnoughContext = !!(
    profile?.resumeUrl || profile?.summary?.trim() || profile?.skills?.length || profile?.experience?.trim()
  );

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const data = await startResumeInterview();
      navigate("/resume-interview/room", { state: { ...data } });
    } catch (err) {
      setError(err.message || "Failed to generate interview");
      setStarting(false);
    }
  };

  if (loading) return <div className="ri-page ri-center"><div className="ri-spinner" /></div>;

  return (
    <div className="ri-page">
      <div className="ri-setup-card">
        <div className="ri-setup-icon">📄🎯</div>
        <h1>Resume-Based Interview</h1>
        <p className="ri-setup-sub">
          A strict, resume-tailored interview built from your actual skills, projects, and experience —
          Technical round first, then HR round. No timer. Every answer is recorded via speech.
        </p>

        {!hasEnoughContext ? (
          <div className="ri-warning-box">
            <strong>Your profile needs more detail first.</strong>
            <p>Upload your resume, or fill in your summary, skills, and experience in your Profile so the AI has something real to interview you on.</p>
            <button className="ri-btn ri-btn-secondary" onClick={() => navigate("/profile")}>
              Go to Profile
            </button>
          </div>
        ) : (
          <div className="ri-context-summary">
            <h3>What we'll use to tailor your interview:</h3>
            <ul>
              {profile.resumeUrl && <li>✅ Uploaded resume file</li>}
              {profile.summary?.trim() && <li>✅ Profile summary</li>}
              {profile.skills?.length > 0 && <li>✅ {profile.skills.length} listed skills</li>}
              {profile.experience?.trim() && <li>✅ Experience details</li>}
              {profile.projectsText?.trim() && <li>✅ Projects</li>}
            </ul>
          </div>
        )}

        <div className="ri-rules-box">
          <h3>This interview is strict — please read before starting:</h3>
          <ul>
            <li>🖥️ Runs in fullscreen. Exiting fullscreen counts as a violation.</li>
            <li>👀 Switching tabs or losing window focus counts as a violation.</li>
            <li>🚫 Copy, paste, and right-click are disabled.</li>
            <li>⚠️ 3 violations will auto-submit and flag your interview.</li>
            <li>🎙️ Speak your answers — they're recorded per question.</li>
            <li>⏱️ No timer — take the time you need, but stay focused.</li>
          </ul>
        </div>

        {error && <div className="ri-error">{error}</div>}

        <button
          className="ri-btn ri-btn-primary"
          onClick={handleStart}
          disabled={!hasEnoughContext || starting}
        >
          {starting ? "Generating your interview…" : "🚀 Generate My Interview"}
        </button>
      </div>
    </div>
  );
};

export default ResumeInterviewSetup;