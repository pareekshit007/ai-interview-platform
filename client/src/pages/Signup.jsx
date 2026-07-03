import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw,  setShowPw]  = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      const redirect = sessionStorage.getItem("friendRoomRedirect");
      if (redirect) {
        sessionStorage.removeItem("friendRoomRedirect");
        navigate(redirect);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader text="Creating your account..." />}
      <div className="auth-container">
        <div className="auth-bg-orb auth-bg-orb1" />
        <div className="auth-bg-orb auth-bg-orb2" />
        <div className="auth-bg-grid" />
        <div className="auth-shell">
          <div className="auth-showcase">
            <span className="auth-showcase-eyebrow">AI-Powered Interview Prep</span>
            <h1>Your next interview starts with practice.</h1>
            <p className="auth-showcase-sub">
              Create a free account and get a personalized interview practice space in under a minute.
            </p>

            <div className="auth-feature">
              <div className="auth-feature-icon">🤖</div>
              <div className="auth-feature-text">
                <h4>Resume-tailored AI interviews</h4>
                <p>Questions built from your actual skills and projects — not generic templates.</p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">🎥</div>
              <div className="auth-feature-text">
                <h4>Practice with a friend</h4>
                <p>Live video mock interviews — share a link, no account needed for them.</p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">🏅</div>
              <div className="auth-feature-text">
                <h4>Badges & certificates</h4>
                <p>Earn recognition as you build a real practice streak.</p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">📈</div>
              <div className="auth-feature-text">
                <h4>Track real progress</h4>
                <p>Streaks, badges, and score history so you can see yourself improving.</p>
              </div>
            </div>
          </div>

          <div className="auth-card">
          <Link to="/" className="auth-brand">
            <span className="logo-ai">AI</span>
            <span className="logo-interview">Interview</span>
          </Link>

          <h2>Create Account 🚀</h2>
          <p>Start practicing AI mock interviews today</p>
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="auth-field">
              <span className="auth-field-icon">🧑</span>
              <input type="text" name="name" placeholder="Full Name"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input type="email" name="email" placeholder="Email"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input type={showPw ? "text" : "password"} name="password" placeholder="Password (min 6 chars)"
                value={form.password} onChange={handleChange} required />
              <button type="button" className="auth-field-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input type={showPw ? "text" : "password"} name="confirm" placeholder="Confirm Password"
                value={form.confirm} onChange={handleChange} required />
            </div>

            <button className="auth-btn" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <span className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;