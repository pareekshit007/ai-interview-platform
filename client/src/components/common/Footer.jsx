import { Link } from "react-router-dom";
import "../../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <h2>AI<span>Interview</span></h2>
          <p>
            Practice interviews with AI-powered feedback and real-world
            scenarios. Get confident. Get hired.
          </p>
        </div>

        {/* Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/roles">Roles</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Info */}
        <div className="footer-info">
          <h4>Resources</h4>
          <span>Mock Interviews</span>
          <span>Performance Feedback</span>
          <span>Interview History</span>
          <span>Career Growth</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} AIInterview. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
