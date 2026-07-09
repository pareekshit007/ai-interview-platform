import { useLocation, useNavigate } from "react-router-dom";
import "../styles/resumeInterview.css";

const ResumeInterviewResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  if (state.terminated) {
    return (
      <div className="ri-page ri-center">
        <div className="ri-setup-card ri-flagged">
          <div className="ri-setup-icon">🚫</div>
          <h1>Interview Terminated</h1>
          <p className="ri-setup-sub">
            This session was auto-submitted and flagged after {state.violations} proctoring violations.
          </p>
          <p className="ri-warning-count">Reason: {state.reason}</p>
          <button className="ri-btn ri-btn-primary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="ri-page ri-center">
        <div className="ri-setup-card">
          <h1>Something went wrong</h1>
          <p className="ri-setup-sub">{state.error}</p>
          <button className="ri-btn ri-btn-primary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const { totalScore, verdict, aiFeedback, proctor, newlyEarnedBadges = [] } = state;
  const clean = (proctor?.violations || 0) === 0;

  return (
    <div className="ri-page">
      <div className="ri-results-wrap">
        <div className="ri-setup-card">
          <div className="ri-setup-icon">{verdict === "Excellent" ? "🏆" : verdict === "Good" ? "✅" : "📊"}</div>
          <h1>Resume-Based Interview Complete</h1>
          <div className="ri-score-big">{totalScore}<span>/100</span></div>
          <div className={`ri-verdict-chip ${verdict?.replace(" ", "-").toLowerCase()}`}>{verdict}</div>

          <div className="ri-proctor-summary">
            <strong>{clean ? "🛡️ Clean session — no violations detected" : `⚠️ ${proctor?.violations || 0} violation(s) recorded`}</strong>
            {proctor?.flagged && <p className="ri-flagged-note">This interview has been flagged for review due to proctoring violations.</p>}
          </div>

          {aiFeedback && (
            <div className="ri-feedback-box">
              <h3>AI Feedback</h3>
              <p>{aiFeedback}</p>
            </div>
          )}

          {newlyEarnedBadges.length > 0 && (
            <div className="ri-badges-box">
              <h3>🎉 Badges Earned</h3>
              <div className="ri-badges-row">
                {newlyEarnedBadges.map((b) => (
                  <div key={b.id} className="ri-badge-pill" style={{ borderColor: b.color }}>
                    <span>{b.icon}</span> {b.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {clean && !proctor?.flagged && (
            <div className="ri-certificate" id="ri-certificate-print">
              <div className="ri-cert-border">
                <p className="ri-cert-label">Certificate of Completion</p>
                <h2>Resume-Based Mock Interview</h2>
                <p className="ri-cert-body">
                  This certifies that the candidate completed a strict, resume-tailored technical and HR
                  interview with a final score of <strong>{totalScore}/100</strong> ({verdict}), under full
                  proctoring with zero violations.
                </p>
                <p className="ri-cert-date">{new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <button className="ri-btn ri-btn-secondary" onClick={() => window.print()}>
                🖨️ Print / Save Certificate
              </button>
            </div>
          )}

          <div className="ri-results-actions">
            <button className="ri-btn ri-btn-secondary" onClick={() => navigate("/interview-history")}>View History</button>
            <button className="ri-btn ri-btn-primary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeInterviewResults;