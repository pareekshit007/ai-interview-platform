import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { forgotPassword, resetPassword } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/auth.css";

const RESEND_COOLDOWN = 60; // seconds, must match server-side cooldown

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step,    setStep]    = useState("email"); // "email" | "reset" | "done"
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Step 1: request a reset code. Backend always replies with the same
  // generic message, whether or not the email is registered.
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await forgotPassword({ email });
      setInfo(data.message || "If that email is registered, a reset code has been sent.");
      setStep("reset");
      startCooldown();
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword({ email });
      setInfo(data.message || "A new code is on its way, if that email is registered.");
      startCooldown();
    } catch (err) {
      setError(err.message || "Couldn't resend code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify the code and set a new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) return setError("Enter the 6-digit code from your email");
    if (newPw.length < 6) return setError("Password must be at least 6 characters");
    if (newPw !== confirmPw) return setError("Passwords do not match");

    setLoading(true);
    try {
      await resetPassword({ email, otp: otp.trim(), newPassword: newPw });
      setStep("done");
    } catch (err) {
      setError(err.message || "Couldn't reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader text="Please wait..." />}
      <div className="auth-container">
        <div className="auth-bg-orb auth-bg-orb1" />
        <div className="auth-bg-orb auth-bg-orb2" />
        <div className="auth-bg-grid" />
        <div className="auth-shell auth-shell--single">
          <div className="auth-card">
            <Link to="/" className="auth-brand">
              <span className="logo-ai">AI</span>
              <span className="logo-interview">Interview</span>
            </Link>

            {step === "email" && (
              <>
                <h2>Forgot Password? 🔑</h2>
                <p>Enter your account email and we'll send you a reset code</p>
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleRequestCode}>
                  <div className="auth-field">
                    <span className="auth-field-icon">✉️</span>
                    <input type="email" placeholder="Email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoFocus />
                  </div>

                  <button className="auth-btn" disabled={loading}>
                    {loading ? "Sending code..." : "Send Reset Code"}
                  </button>
                </form>

                <span className="auth-footer">
                  Remembered your password? <Link to="/login">Login</Link>
                </span>
              </>
            )}

            {step === "reset" && (
              <>
                <button type="button" className="auth-back-link" onClick={() => setStep("email")}>
                  ← Back
                </button>
                <h2>Reset Password 🔐</h2>
                {info && <div className="auth-success">{info}</div>}
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleResetPassword}>
                  <p className="auth-otp-hint">
                    If <strong>{email}</strong> is registered, a 6-digit code was just sent to it. It expires in 10 minutes.
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
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <span className="auth-field-icon">🔒</span>
                    <input type={showPw ? "text" : "password"} placeholder="New Password (min 6 chars)"
                      value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
                    <button type="button" className="auth-field-toggle"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <div className="auth-field">
                    <span className="auth-field-icon">🔒</span>
                    <input type={showPw ? "text" : "password"} placeholder="Confirm New Password"
                      value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                  </div>

                  <button className="auth-btn" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
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

            {step === "done" && (
              <>
                <h2>Password Reset ✅</h2>
                <div className="auth-success">
                  Your password has been updated. You can now log in with your new password.
                </div>
                <button className="auth-btn" onClick={() => navigate("/login")}>
                  Go to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;