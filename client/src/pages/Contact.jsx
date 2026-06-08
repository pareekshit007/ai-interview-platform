import { useState } from "react";
import "../styles/contact.css";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate send
    setTimeout(() => setSent(true), 600);
  };

  const info = [
    { icon: "📍", label: "Address",  value: "AI Interview Solutions Pvt. Ltd.\nElectronic City, Bengaluru\nKarnataka – 560100", color: "#00f5a0" },
    { icon: "📞", label: "Call Us",  value: "+91 98765 43210\nMon – Fri, 9am – 6pm", color: "#3b82f6", href: "tel:+919876543210" },
    { icon: "📧", label: "Email Us", value: "support@aiinterview.com\nReply within 24 hours", color: "#a78bfa", href: "mailto:support@aiinterview.com" },
  ];

  return (
    <div className="ct-root">

      {/* Background */}
      <div className="ct-bg">
        <div className="ct-orb ct-orb1" />
        <div className="ct-orb ct-orb2" />
        <div className="ct-grid" />
      </div>

      <div className="ct-wrap">

        {/* Hero */}
        <div className="ct-hero">
          <span className="ct-badge">GET IN TOUCH</span>
          <h1 className="ct-title">
            We'd love to<br />
            <span className="ct-grad">hear from you</span>
          </h1>
          <p className="ct-sub">
            Have questions about the AI Interview Platform? Our team is here to help you.
          </p>
        </div>

        {/* Main layout */}
        <div className="ct-main">

          {/* LEFT — Info + Map */}
          <div className="ct-left">

            {/* Info cards */}
            <div className="ct-info-list">
              {info.map((item) => (
                <div key={item.label} className="ct-info-card" style={{ "--c": item.color }}>
                  <div className="ct-info-icon">{item.icon}</div>
                  <div className="ct-info-body">
                    <div className="ct-info-label">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} className="ct-info-val ct-link">
                        {item.value.split("\n").map((l, i) => <span key={i}>{l}</span>)}
                      </a>
                    ) : (
                      <div className="ct-info-val">
                        {item.value.split("\n").map((l, i) => <span key={i}>{l}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="ct-map">
              <iframe
                title="Office Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.273494041145!2d77.660206!3d12.839939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6c9f9f5a7a41%3A0x6bb2b5a15e0c6a28!2sElectronic%20City%2C%20Bengaluru!5e0!3m2!1sen!2sin!4v1700000000000"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* RIGHT — Contact Form */}
          <div className="ct-right">
            <div className="ct-form-card">
              <h2 className="ct-form-title">Send us a message</h2>
              <p className="ct-form-sub">Fill out the form and we'll get back to you within 24 hours.</p>

              {sent ? (
                <div className="ct-success">
                  <div className="ct-success-icon">✅</div>
                  <h3>Message Sent!</h3>
                  <p>Thanks for reaching out. We'll reply to your email shortly.</p>
                  <button onClick={() => { setSent(false); setForm({ name:"", email:"", subject:"", message:"" }); }}>
                    Send another
                  </button>
                </div>
              ) : (
                <form className="ct-form" onSubmit={handleSubmit}>
                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label>Your Name</label>
                      <input name="name" placeholder="Enter your name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="ct-field">
                      <label>Email Address</label>
                      <input type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="ct-field">
                    <label>Subject</label>
                    <input name="subject" placeholder="How can we help?" value={form.subject} onChange={handleChange} required />
                  </div>
                  <div className="ct-field">
                    <label>Message</label>
                    <textarea name="message" placeholder="Tell us more about your query..." rows={5} value={form.message} onChange={handleChange} required />
                  </div>
                  <button type="submit" className="ct-submit">
                    Send Message →
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="ct-strip">
          <span>🚀 Building your interview confidence with AI — one session at a time.</span>
        </div>

      </div>
    </div>
  );
};

export default Contact;