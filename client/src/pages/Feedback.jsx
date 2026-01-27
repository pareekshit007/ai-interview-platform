import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import "../styles/feedback.css";

const Feedback = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const { results } = useInterview();

  return (
    <div className="feedback-page">
      <div className="feedback-container glass-card">

        <h1 className="feedback-title">AI Interview Feedback</h1>

        <div className="question-feedback">
          {results?.questionScores?.map((_, i) => (
            <div key={i} className="question-feedback-card">
              <h4>Question {i + 1}</h4>
              <p><strong>What went well:</strong> Relevant answer</p>
              <p><strong>Needs improvement:</strong> Confidence</p>
            </div>
          ))}
        </div>

        <div className="feedback-actions">
          <button onClick={() => navigate(`/scorecard/${role}`)}>
            View ScoreCard
          </button>

          <button
            className="secondary"
            onClick={() => navigate(`/interview-setup/${role}`)}
          >
            Retake Interview
          </button>
        </div>

      </div>
    </div>
  );
};

export default Feedback;
