import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import Loader from "../components/common/Loader";
import "../styles/auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <>
      {loading && <Loader text="Creating your account..." />}

      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account 🚀</h2>
          <p>Start practicing AI mock interviews today</p>

          <form onSubmit={handleSignup}>
            <input type="text" placeholder="Full Name" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <button className="auth-btn">Sign Up</button>
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
