import { Link } from "react-router-dom";
import "../../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <h2 className="footer-logo">AI Interview Platform</h2>
        <p className="footer-tagline">
          Practice smarter. Perform better. Get interview-ready with AI.
        </p>
      </div>

      <div className="footer-links">
        <div>
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/roles">Start Interview</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div>
          <h4>Company</h4>
          <Link to="/contact">Contact</Link>
          <a href="#">About</a>
          <a href="#">Careers</a>
        </div>

        <div>
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AI Interview Platform</span>
        <span>Built with ❤️ using React & AI</span>
      </div>
    </footer>
  );
};

export default Footer;
