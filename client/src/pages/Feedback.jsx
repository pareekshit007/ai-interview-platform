import { useNavigate, useParams } from "react-router-dom";
import { useInterview } from "../context/InterviewContext";
import "../styles/feedback.css";

const parseFeedback = (text) => {
  if (!text) return null;
  const sections = {};
  const patterns = {
    overall:      /OVERALL ASSESSMENT:\s*([\s\S]*?)(?=TOP STRENGTHS:|$)/i,
    strengths:    /TOP STRENGTHS:\s*([\s\S]*?)(?=KEY AREAS|$)/i,
    improvements: /KEY AREAS TO IMPROVE:\s*([\s\S]*?)(?=STUDY RECOMMENDATIONS:|$)/i,
    study:        /STUDY RECOMMENDATIONS:\s*([\s\S]*?)(?=FINAL VERDICT:|$)/i,
    verdict:      /FINAL VERDICT:\s*([\s\S]*?)$/i,
  };
  Object.entries(patterns).forEach(([key,re])=>{const m=text.match(re);if(m)sections[key]=m[1].trim();});
  return Object.keys(sections).length>0?sections:null;
};

const BulletList = ({text})=>{
  if(!text) return null;
  const items=text.split("\n").filter(l=>l.trim().startsWith("•")||l.trim().startsWith("-"));
  if(!items.length) return <p>{text}</p>;
  return <ul>{items.map((item,i)=><li key={i}>{item.replace(/^[•\-]\s*/,"")}</li>)}</ul>;
};

const Feedback = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const { results } = useInterview();
  const sessionFeedback = results?.sessionFeedback||"";
  const parsed = parseFeedback(sessionFeedback);
  const questionScores = results?.questionScores||[];

  return (
    <div className="feedback-page">
      <div className="feedback-container glass-card">
        <h1 className="feedback-title">AI Interview Feedback</h1>
        <p className="feedback-role">{role?.toUpperCase()} · Score: {results?.totalScore??0}% · {results?.verdict}</p>
        {parsed?.overall&&<div className="feedback-section"><h3>Overall Assessment</h3><p>{parsed.overall}</p></div>}
        {parsed?.strengths&&<div className="feedback-section strengths"><h3>✅ Top Strengths</h3><BulletList text={parsed.strengths}/></div>}
        {parsed?.improvements&&<div className="feedback-section improvements"><h3>🎯 Areas to Improve</h3><BulletList text={parsed.improvements}/></div>}
        {parsed?.study&&<div className="feedback-section study"><h3>📚 Study Recommendations</h3><BulletList text={parsed.study}/></div>}
        {!parsed&&sessionFeedback&&<div className="feedback-section"><h3>Feedback</h3><pre className="raw-feedback">{sessionFeedback}</pre></div>}
        {questionScores.length>0&&(
          <div className="question-feedback">
            <h3>Per-Question Breakdown</h3>
            {questionScores.map((q,i)=>(
              <div key={i} className="question-feedback-card">
                <h4>Question {i+1}</h4>
                <p className="q-text">{q.question}</p>
                <div className="q-scores">
                  <span>Score: {q.score}%</span>
                  <span>Confidence: {q.confidence}%</span>
                  <span>Clarity: {q.clarity}%</span>
                </div>
                {q.transcript&&<p className="q-transcript"><em>"{q.transcript.substring(0,150)}{q.transcript.length>150?"...":""}"</em></p>}
              </div>
            ))}
          </div>
        )}
        <div className="feedback-actions">
          <button onClick={()=>navigate(`/scorecard/${role}`)}>View Score Card</button>
          <button className="secondary" onClick={()=>navigate(`/interview-setup/${role}`)}>Retake</button>
          <button className="secondary" onClick={()=>navigate("/dashboard")}>Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;