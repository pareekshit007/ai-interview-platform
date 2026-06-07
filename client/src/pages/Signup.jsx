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
      navigate("/dashboard");
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
        <div className="auth-card glass-card">
          <h2>Create Account 🚀</h2>
          <p>Start practicing AI mock interviews today</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSignup}>
            <input type="text" name="name" placeholder="Full Name"
              value={form.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email"
              value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={handleChange} required />
            <input type="password" name="confirm" placeholder="Confirm Password"
              value={form.confirm} onChange={handleChange} required />
            <button className="auth-btn" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>
          <span className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </span>
        </div>
      </div>
    </>
  );
};

export default Signup;