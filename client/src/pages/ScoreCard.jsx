import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import "../styles/scorecard.css";

const ScoreCard = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const { results } = useInterview();
  const score   = results?.totalScore ?? 0;
  const verdict = results?.verdict    ?? "—";
  const verdictColor = { Excellent:"#22c55e", Good:"#3b82f6", Average:"#f59e0b", "Needs Work":"#ef4444" }[verdict]||"#888";

  return (
    <div className="score-page">
      <div className="score-card">
        <h1>Interview Score Card</h1>
        <div className="score-value">
          <div className="score-circle" style={{"--score":score}}>
            <span className="score-percent">{score}%</span>
          </div>
          <div className="score-details">
            <p><strong>Role:</strong> {role?.toUpperCase()}</p>
            <p><strong>Difficulty:</strong> {results?.difficulty||"medium"}</p>
            <p><strong>Verdict:</strong> <span style={{color:verdictColor,fontWeight:600}}>{verdict}</span></p>
          </div>
        </div>
        <div className="score-metrics">
          {[
            {label:"Confidence",    value:results?.confidence    ??0},
            {label:"Clarity",       value:results?.clarity       ??0},
            {label:"Sentiment",     value:results?.sentiment     ??0},
            {label:"Communication", value:results?.communication ??0},
          ].map((m)=>(
            <div key={m.label} className="metric-row">
              <span className="metric-label">{m.label}</span>
              <div className="metric-bar"><div className="metric-fill" style={{width:`${m.value}%`}}/></div>
              <span className="metric-value">{m.value}%</span>
            </div>
          ))}
        </div>
        {results?.questionScores?.length>0&&(
          <div className="question-scores">
            <h3>Per Question</h3>
            {results.questionScores.map((q,i)=>(
              <div key={i} className="q-score-row">
                <span className="q-label">Q{i+1}</span>
                <div className="metric-bar"><div className="metric-fill" style={{width:`${q.score}%`}}/></div>
                <span className="metric-value">{q.score}%</span>
              </div>
            ))}
          </div>
        )}
        <div className="score-actions">
          <button className="primary-btn" onClick={()=>navigate(`/feedback/${role}`)}>View AI Feedback</button>
          <button className="secondary-btn" onClick={()=>navigate(`/interview-setup/${role}`)}>Retake</button>
          <button className="secondary-btn" onClick={()=>navigate("/dashboard")}>Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;