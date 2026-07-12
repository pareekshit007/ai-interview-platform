import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPublicStats } from "../services/statsService";
import { getTestimonials } from "../services/testimonialService";
import { formatStat } from "../utils/formatStat";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();

  // Real counts fetched from the server. Displayed counters animate up
  // to these once they arrive -- never to a hardcoded fake ceiling.
  const [rawStats, setRawStats] = useState({ users: 0, interviews: 0, questionsAnswered: 0 });
  const [counters, setCounters] = useState({ users: 0, interviews: 0, questionsAnswered: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);

  useEffect(() => {
    getPublicStats()
      .then((data) => { setRawStats(data); setStatsLoaded(true); })
      .catch(() => setStatsLoaded(true)); // fail quiet -- counters just stay at 0

    getTestimonials(6)
      .then((data) => setTestimonials(data))
      .catch(() => {})
      .finally(() => setTestimonialsLoaded(true));
  }, []);

  // Animate the visible counters up from 0 to the real (unrounded) counts
  // once they've loaded; the render below rounds them down for display.
  useEffect(() => {
    if (!statsLoaded) return;
    const target = rawStats;
    const steps = 40;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const progress = Math.min(step / steps, 1);
      setCounters({
        users:             Math.round(target.users * progress),
        interviews:        Math.round(target.interviews * progress),
        questionsAnswered: Math.round(target.questionsAnswered * progress),
      });
      if (progress === 1) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [statsLoaded, rawStats]);

  const scrollToFeatures = () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* -- HERO (unchanged) -- */}
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

      {/* -- FEATURES -- */}
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

      {/* -- COUNTERS (real platform data) -- */}
      <section
        className="counters"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80')" }}
      >
        <div className="counter-card">
          <div className="counter-icon">🎤</div>
          <h3>{formatStat(counters.interviews)}</h3>
          <p>Mock Interviews Conducted</p>
        </div>
        <div className="counter-card">
          <div className="counter-icon">👥</div>
          <h3>{formatStat(counters.users)}</h3>
          <p>Active Users</p>
        </div>
        <div className="counter-card">
          <div className="counter-icon">❓</div>
          <h3>{formatStat(counters.questionsAnswered)}</h3>
          <p>Questions Answered</p>
        </div>
      </section>

      {/* -- WAVEFORM -- */}
      <section className="waveform-section">
        <div className="waveform-container">
          <div className="waveform-left">
            <span className="wave-badge">🎙 Real-Time AI</span>
            <h2>Live Mic & Camera Feedback</h2>
            <p>Our AI listens, watches and guides you in real time -- catching filler words, measuring eye contact, and timing your responses.</p>

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

      {/* -- TESTIMONIALS (real user submissions only -- hidden if there are none yet) -- */}
      {testimonialsLoaded && testimonials.length > 0 && (
        <section
          className="testimonials"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80')" }}
        >
          <p className="features-eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Students Love Us</p>
          <h2>What Students Say</h2>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div className="testimonial-card" key={t._id}>
                <div className="testimonial-stars">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
                <p>{t.quote}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <h4>{t.name}</h4>
                    {t.role && <span className="testimonial-role">{t.role}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -- COMPANIES -- */}
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

      {/* -- FINAL CTA -- */}
      <section
        className="final-cta"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80')" }}
      >
        <span className="cta-badge">🎯 Start Today -- It's Free</span>
        <h2>Ready to Boost Your Interview Skills?</h2>
        <p className="cta-sub">
          {rawStats.users > 0
            ? `Join ${formatStat(rawStats.users)} students already practicing smarter with AI mock interviews.`
            : "Be one of the first to practice smarter with AI mock interviews."}
        </p>
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