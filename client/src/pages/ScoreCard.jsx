import { useNavigate, useParams } from "react-router-dom";
import "../styles/ScoreCard.css";

const ScoreCard = () => {
  const navigate = useNavigate();
  const { role } = useParams();

  // ✅ TEMP score (later replace with backend value)
  const score = 72;

  // ✅ SAFETY (prevents NaN%)
  const safeScore = Number.isFinite(score) ? score : 0;

  return (
    <div className="score-page">
      <div className="score-card">
        <h1>Interview Score Card</h1>

        <div className="score-value">
          {/* SCORE CIRCLE */}
          <div
            className="score-circle"
            style={{ "--score": safeScore }}
          >
            <span className="score-percent">{safeScore}%</span>
          </div>

          {/* SCORE DETAILS */}
          <div className="score-details">
            <p>
              <strong>Role:</strong> {role.toUpperCase()}
            </p>
            <p>
              Overall interview performance based on communication,
              confidence, and technical accuracy.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="score-actions">
          <button
            className="primary-btn"
            onClick={() => navigate(`/feedback/${role}`)}
          >
            View Feedback
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/interview-setup/${role}`)}
          >
            Retake Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
