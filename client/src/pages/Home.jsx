import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();

  const [counters, setCounters] = useState({ interviews: 0, users: 0, questions: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters((prev) => ({
        interviews: prev.interviews < 1200 ? prev.interviews + 10 : 1200,
        users:      prev.users      < 500  ? prev.users      + 5  : 500,
        questions:  prev.questions  < 3000 ? prev.questions  + 25 : 3000,
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* ── HERO (unchanged) ── */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🚀 AI Powered</span>
          <h1>
            Crack Interviews with <span>AI Mock Interviews</span>
          </h1>
          <p>
            Practice real interview questions, get instant AI feedback,
            and boost your confidence for placements.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => navigate("/roles")}>
              Start Mock Interview
            </button>
            <button className="hero-btn secondary" onClick={scrollToFeatures}>
              View Features
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="AI Interview" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features" id="features">
        <div className="features-container">
          <p className="features-eyebrow">Why Us</p>
          <h2>Why Choose Our Platform?</h2>
          <p className="features-subtitle">Everything you need to ace interviews</p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Mock Interviews</h3>
              <p>Role-based interview questions personalised for your target company and experience level.</p>
              <span className="feature-tag">Personalised</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI Feedback</h3>
              <p>Smart evaluation of your answers with tone, clarity and content scores for faster growth.</p>
              <span className="feature-tag">Instant</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Performance Reports</h3>
              <p>Detailed insights, progress charts and metrics to track improvement over time.</p>
              <span className="feature-tag">Detailed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COUNTERS ── */}
      <section
        className="counters"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80')" }}
      >
        <div className="counter-card">
          <div className="counter-icon">🎤</div>
          <h3>{counters.interviews}+</h3>
          <p>Mock Interviews Conducted</p>
        </div>
        <div className="counter-card">
          <div className="counter-icon">👥</div>
          <h3>{counters.users}+</h3>
          <p>Active Users</p>
        </div>
        <div className="counter-card">
          <div className="counter-icon">❓</div>
          <h3>{counters.questions}+</h3>
          <p>Questions Available</p>
        </div>
      </section>

      {/* ── WAVEFORM ── */}
      <section className="waveform-section">
        <div className="waveform-container">
          <div className="waveform-left">
            <span className="wave-badge">🎙 Real-Time AI</span>
            <h2>Live Mic & Camera Feedback</h2>
            <p>Our AI listens, watches and guides you in real time — catching filler words, measuring eye contact, and timing your responses.</p>

            <div className="waveform-stats">
              <div>
                <h4>Voice Clarity</h4>
                <span>Excellent</span>
              </div>
              <div>
                <h4>Eye Contact</h4>
                <span>Good</span>
              </div>
              <div>
                <h4>Response Time</h4>
                <span>1.2s</span>
              </div>
            </div>
          </div>

          <div className="waveform-right">
            <div className="waveform-card">
              <p className="waveform-label">AI listening…</p>
              <div className="waveform-box">
                <span/><span/><span/><span/>
                <span/><span/><span/><span/>
              </div>
              <div className="waveform-pills">
                <span className="wpill good">✓ Clear speech</span>
                <span className="wpill warn">⚡ Speed up</span>
                <span className="wpill good">✓ Confident tone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        className="testimonials"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80')" }}
      >
        <p className="features-eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Students Love Us</p>
        <h2>What Students Say</h2>
        <div className="testimonial-grid">
          {[
            { quote: "AI interviews helped me practice confidently. I could track my mistakes and improve quickly!", name: "Priya S.", role: "SDE @ Infosys" },
            { quote: "The AI feedback is super accurate. I never felt more prepared for my placement interviews.", name: "Rahul K.", role: "SDE @ TCS" },
            { quote: "The performance reports gave me clear direction on what to improve. Highly recommend!", name: "Ananya R.", role: "SDE @ Wipro" },
          ].map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-stars">★★★★★</div>
              <p>{t.quote}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name[0]}</div>
                <div>
                  <h4>{t.name}</h4>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPANIES ── */}
      <section className="companies">
        <p className="features-eyebrow companies-eyebrow">Trusted By</p>
        <h2>Trusted by Candidates Preparing For</h2>
        <p className="companies-subtitle">Interviews at world-class tech companies</p>

        <div className="companies-slider">
          <div className="companies-track">
            {["Google","Microsoft","Amazon","Meta","Apple","Adobe","Netflix","Salesforce",
              "Google","Microsoft","Amazon","Meta","Apple","Adobe","Netflix","Salesforce"].map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="final-cta"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80')" }}
      >
        <span className="cta-badge">🎯 Start Today — It's Free</span>
        <h2>Ready to Boost Your Interview Skills?</h2>
        <p className="cta-sub">Join 500+ students who already landed their dream jobs using AI mock interviews.</p>
        <div className="cta-actions">
          <button className="hero-btn primary" onClick={() => navigate("/roles")}>
            Start Mock Interview
          </button>
          <button className="hero-btn secondary" onClick={() => navigate("/signup")}>
            Create Free Account
          </button>
        </div>
      </section>
    </>
  );
};

export default Home;