import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { registerUser, sendSignupOtp } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/auth.css";

const RESEND_COOLDOWN = 60; // seconds, must match server-side cooldown

const Signup = () => {
  const navigate = useNavigate();
  const [step,    setStep]    = useState("details"); // "details" | "otp"
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });
  const [otp,     setOtp]     = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Step 1: validate details locally, then ask the server to email a code
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      await sendSignupOtp({ name: form.name, email: form.email });
      setStep("otp");
      setInfo(`We sent a 6-digit code to ${form.email}. Enter it below to finish signing up.`);
      startCooldown();
    } catch (err) {
      setError(err.message || "Couldn't send verification code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify the code and create the account in one request
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) return setError("Enter the 6-digit code from your email");

    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password, otp: otp.trim() });
      const redirect = sessionStorage.getItem("friendRoomRedirect");
      if (redirect) {
        sessionStorage.removeItem("friendRoomRedirect");
        navigate(redirect);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendSignupOtp({ name: form.name, email: form.email });
      setInfo("A new code is on its way — check your inbox.");
      startCooldown();
    } catch (err) {
      setError(err.message || "Couldn't resend code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setStep("details");
    setOtp("");
    setError("");
    setInfo("");
  };

  return (
    <>
      {loading && <Loader text={step === "details" ? "Sending verification code..." : "Verifying..."} />}
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

          {step === "details" ? (
            <>
              <h2>Create Account 🚀</h2>
              <p>Start practicing AI mock interviews today</p>
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSendOtp}>
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
                  {loading ? "Sending code..." : "Continue"}
                </button>
              </form>

              <span className="auth-footer">
                Already have an account? <Link to="/login">Login</Link>
              </span>
            </>
          ) : (
            <>
              <button type="button" className="auth-back-link" onClick={handleBackToDetails}>
                ← Back
              </button>
              <h2>Verify your email 🔐</h2>
              {info && <div className="auth-success">{info}</div>}
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleVerifyAndSignup}>
                <p className="auth-otp-hint">
                  Enter the code sent to <strong>{form.email}</strong>. It expires in 10 minutes.
                </p>

                <div className="auth-field">
                  <input
                    className="auth-otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                    required
                  />
                </div>

                <button className="auth-btn" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>

                <div className="auth-resend">
                  <span>Didn't get the code?</span>
                  <button type="button" onClick={handleResend} disabled={cooldown > 0 || loading}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;