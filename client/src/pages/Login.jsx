import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../services/authService";
import Loader from "../components/common/Loader";
import "../styles/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader text="Logging you in..." />}
      <div className="auth-container">
        <div className="auth-card glass-card">
          <h2>Welcome Back 👋</h2>
          <p>Login to continue your AI interview journey</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="email" name="email" placeholder="Email"
              value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password"
              value={form.password} onChange={handleChange} required />
            <button className="auth-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <span className="auth-footer">
            Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
          </span>
        </div>
      </div>
    </>
  );
};

export default Login;