import { Link } from "react-router-dom";
import "../../styles/footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-overlay" />

      <div className="footer-inner">
        <div className="footer-container">

          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">AI<span>Interview</span></div>
            <p className="footer-tagline">
              Practice with AI-powered mock interviews, get real-time feedback,
              and walk into your next interview with confidence.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">🤖 Gemini AI</span>
              <span className="footer-badge">🎙 Speech Recognition</span>
              <span className="footer-badge">📊 Instant Feedback</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigate</h4>
            <div className="footer-links">
              <Link to="/">🏠 Home</Link>
              <Link to="/roles">💼 Roles</Link>
              <Link to="/dashboard">📊 Dashboard</Link>
              <Link to="/contact">✉️ Contact</Link>
            </div>
          </div>

          {/* Features */}
          <div className="footer-col">
            <h4 className="footer-col-title">Features</h4>
            <div className="footer-links">
              <span>🎯 Mock Interviews</span>
              <span>📝 Performance Feedback</span>
              <span>📈 Interview History</span>
              <span>🔊 Speech Analysis</span>
              <span>🏆 Score Tracking</span>
            </div>
          </div>

          {/* Roles */}
          <div className="footer-col">
            <h4 className="footer-col-title">Interview Roles</h4>
            <div className="footer-links">
              <Link to="/interview-setup/frontend">🖥️ Frontend Dev</Link>
              <Link to="/interview-setup/backend">⚙️ Backend Dev</Link>
              <Link to="/interview-setup/fullstack">🔗 Full Stack</Link>
              <Link to="/interview-setup/devops">🚀 DevOps</Link>
              <Link to="/interview-setup/datascience">📊 Data Science</Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {year} AIInterview. All rights reserved.</p>
          <div className="footer-bottom-right">
            <span>Built with React + Gemini AI</span>
            <span className="footer-dot">·</span>
            <span>MERN Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;