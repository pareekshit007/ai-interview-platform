import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import { getProfile, updateProfile, uploadResume } from "../services/userService";
import "../styles/profile.css";
import "../styles/emailReminderSettings.css";

const EMPTY_USER = {
  name: "", email: "", phone: "", college: "", degree: "",
  organization: "", linkedin: "", github: "", skills: [],
  profilePic: "", summary: "", experience: "", projectsText: "",
  certificationsText: "", offerLetters: [], certificates: [],
  projectRepos: [], resumeUrl: "",
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const skillOptions = [
    "HTML","CSS","JavaScript","React","Node.js","Express",
    "MongoDB","SQL","Java","Python","C++","Git","Docker",
    "REST API","Redux","Next.js","TypeScript","AWS","GraphQL","Vue.js"
  ];

  const [user, setUser] = useState({ ...EMPTY_USER });
  const [savedUser, setSavedUser] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  // Email reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [reminderSaving,  setReminderSaving]  = useState(false);
  const [reminderTesting, setReminderTesting] = useState(false);
  const [reminderToast,   setReminderToast]   = useState(null);

  const showReminderToast = (msg, type = "success") => {
    setReminderToast({ msg, type });
    setTimeout(() => setReminderToast(null), 3000);
  };

  const hasAIContext = !!(
    user.skills.length > 0 || user.experience?.trim() ||
    user.certificationsText?.trim() || user.projectsText?.trim() ||
    user.summary?.trim() || user.resumeUrl
  );

  const mergeWithDefaults = (data) => ({
    ...EMPTY_USER,
    ...data,
    skills:       Array.isArray(data.skills)       ? data.skills       : [],
    offerLetters: Array.isArray(data.offerLetters) ? data.offerLetters : [],
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    projectRepos: Array.isArray(data.projectRepos) ? data.projectRepos : [],
    resumeUrl:    data.resumeUrl    || "",
    profilePic:   data.profilePic   || "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) { navigate("/login"); return; }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        const merged = mergeWithDefaults(data);
        setUser(merged);
        setSavedUser(merged);

        const BASE_URL = import.meta.env.VITE_API_URL;
        const token    = localStorage.getItem("token");
        const rRes = await fetch(`${BASE_URL}/reminders/preference`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rRes.ok) {
          const rData = await rRes.json();
          setReminderEnabled(rData.emailReminders ?? false);
        }
        setReminderLoading(false);
      } catch (err) {
        console.error("Failed to load profile", err);
        setReminderLoading(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleReminderToggle = async () => {
    setReminderSaving(true);
    try {
      const next = !reminderEnabled;
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token    = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/reminders/preference`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReminderEnabled(next);
      showReminderToast(data.message);
    } catch (err) {
      showReminderToast(err.message || "Failed to save preference", "error");
    } finally {
      setReminderSaving(false);
    }
  };

  const handleReminderTest = async () => {
    setReminderTesting(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token    = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/reminders/test-me`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showReminderToast(data.message);
    } catch (err) {
      showReminderToast(err.message || "Failed to send test email", "error");
    } finally {
      setReminderTesting(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePic = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser(prev => ({ ...prev, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setResumeUploading(true);
      const data = await uploadResume(file);
      setUser(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
    } catch (err) {
      alert("Resume upload failed: " + err.message);
    } finally {
      setResumeUploading(false);
    }
  };

  const removeResume = () => setUser(prev => ({ ...prev, resumeUrl: "" }));

  const readFiles = (files, key) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setUser(prev => ({
          ...prev,
          [key]: [...prev[key], { name: file.name, data: reader.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (key, name) => {
    setUser(prev => ({ ...prev, [key]: prev[key].filter(f => f.name !== name) }));
  };

  const addSkill = skill => {
    const s = (skill || skillInput).trim();
    if (s && !user.skills.includes(s)) {
      setUser(prev => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput("");
  };

  const removeSkill = skill => {
    setUser(prev => ({ ...prev, skills: prev.skills.filter(x => x !== skill) }));
  };

  const addRepo = () => {
    if (!repoName || !repoUrl) return;
    setUser(prev => ({
      ...prev,
      projectRepos: [...prev.projectRepos, { name: repoName, url: repoUrl }]
    }));
    setRepoName(""); setRepoUrl("");
  };

  const removeRepo = name => {
    setUser(prev => ({ ...prev, projectRepos: prev.projectRepos.filter(r => r.name !== name) }));
  };

  const normalizeUrl = url => url && !url.startsWith("http") ? `https://${url}` : url;

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const updated = {
        ...user,
        linkedin: normalizeUrl(user.linkedin),
        github: normalizeUrl(user.github),
        skills: user.skills.map(s => s.toLowerCase()),
      };
      const saved = await updateProfile(updated);
      localStorage.setItem("user", JSON.stringify(saved));
      setSavedUser(updated);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUser(savedUser);
    setSkillInput("");
    setRepoName("");
    setRepoUrl("");
    setIsEditing(false);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
  };

  const suggestedSkills = skillOptions.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !user.skills.includes(s.toLowerCase())
  );

  const ViewField = ({ label, value }) => (
    <div className="view-field">
      <span className="view-label">{label}</span>
      <span className="view-value">{value || <em className="view-empty">Not set</em>}</span>
    </div>
  );

  return (
    <>
      {loading && <Loader text="Loading..." />}

      <div className="profile-page">

        {/* HEADER */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="avatar-wrap">
              {user.profilePic
                ? <img src={user.profilePic} alt="profile"/>
                : <div className="avatar-placeholder">👤</div>}
              {isEditing && (
                <label className="avatar-upload">
                  Change
                  <input hidden type="file" accept="image/*" onChange={handleProfilePic}/>
                </label>
              )}
            </div>
            <div>
              <h1>{user.name || "Your Name"}</h1>
              <p>{user.degree || "Your Title"}</p>
              <span>{user.email}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {!isEditing ? (
              <button className="save-btn" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            )}
            {saveSuccess && (
              <span style={{ color: "var(--success)", fontSize: "13px", fontWeight: 500 }}>
                ✓ Profile saved!
              </span>
            )}
          </div>
        </div>

        {/* AI CONTEXT BANNER */}
        <div className={`ai-context-banner ${hasAIContext ? "active" : "inactive"}`}>
          <span className="ai-context-icon">{hasAIContext ? "🤖✨" : "🤖"}</span>
          <div>
            <strong>{hasAIContext ? "AI-Personalised Interviews Active" : "AI Personalisation Not Yet Set Up"}</strong>
            <p>
              {hasAIContext
                ? "Your interview questions will be tailored to your skills, experience, and certifications listed below."
                : "Click Edit Profile to fill in your skills, experience, or certifications so the AI can ask targeted questions."}
            </p>
          </div>
          {hasAIContext && (
            <div className="ai-context-pills">
              {user.skills.length > 0 && <span className="ai-pill">✓ Skills ({user.skills.length})</span>}
              {user.experience?.trim() && <span className="ai-pill">✓ Experience</span>}
              {user.certificationsText?.trim() && <span className="ai-pill">✓ Certifications</span>}
              {user.projectsText?.trim() && <span className="ai-pill">✓ Projects</span>}
              {user.resumeUrl && <span className="ai-pill">✓ Resume</span>}
            </div>
          )}
        </div>

        <div className="profile-sections">

          {/* ════ VIEW MODE ════ */}
          {!isEditing && (
            <>
              <Section title="📄 Resume" badge="AI Uses This">
                {user.resumeUrl ? (
                  <div className="resume-uploaded">
                    <div className="resume-file-info">
                      <span className="resume-icon">📑</span>
                      <div>
                        <strong>Resume uploaded</strong>
                        <span>AI will use this to personalise your interview</span>
                      </div>
                    </div>
                    <div className="resume-actions">
                      <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="btn-outline">View</a>
                    </div>
                  </div>
                ) : (
                  <p className="view-empty-hint">No resume uploaded. Click <strong>Edit Profile</strong> to add one.</p>
                )}
              </Section>

              <Section title="Personal Information">
                <div className="view-grid">
                  <ViewField label="Full Name"      value={user.name} />
                  <ViewField label="Email"          value={user.email} />
                  <ViewField label="Phone"          value={user.phone} />
                  <ViewField label="College"        value={user.college} />
                  <ViewField label="Degree / Title" value={user.degree} />
                  <ViewField label="Organization"   value={user.organization} />
                  <ViewField label="LinkedIn"       value={user.linkedin} />
                  <ViewField label="GitHub"         value={user.github} />
                </div>
              </Section>

              <Section title="Professional Summary" badge="AI Uses This">
                {user.summary?.trim()
                  ? <p className="view-text">{user.summary}</p>
                  : <p className="view-empty-hint">No summary added yet.</p>}
              </Section>

              <Section title="Core Skills" badge="AI Uses This">
                {user.skills.length > 0
                  ? <div className="tags">{user.skills.map(s => <div key={s} className="tag">{s}</div>)}</div>
                  : <p className="view-empty-hint">No skills added yet.</p>}
              </Section>

              <Section title="Work Experience" badge="AI Uses This">
                {user.experience?.trim()
                  ? <p className="view-text">{user.experience}</p>
                  : <p className="view-empty-hint">No experience added yet.</p>}
                <FileList files={user.offerLetters} viewOnly />
              </Section>

              <Section title="Key Projects" badge="AI Uses This">
                {user.projectsText?.trim()
                  ? <p className="view-text">{user.projectsText}</p>
                  : <p className="view-empty-hint">No projects added yet.</p>}
                {user.projectRepos.map(repo => (
                  <div key={repo.name} className="repo-item">
                    <span>🔗 {repo.name}</span>
                    <a href={repo.url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))}
              </Section>

              <Section title="Certifications" badge="AI Uses This">
                {user.certificationsText?.trim()
                  ? <p className="view-text">{user.certificationsText}</p>
                  : <p className="view-empty-hint">No certifications added yet.</p>}
                <FileList files={user.certificates} viewOnly />
              </Section>

              {/* WEEKLY REMINDERS */}
              <Section title="📧 Weekly Practice Reminders">
                <p className="section-hint">
                  Get a personalised interview question every Monday, targeting your weakest topic.
                </p>
                {reminderLoading ? (
                  <div className="reminder-loading">
                    <div className="reminder-spinner"/> <span>Loading preference…</span>
                  </div>
                ) : (
                  <div className="reminder-card">
                    {reminderToast && (
                      <div className={`reminder-toast reminder-toast--${reminderToast.type}`}>
                        {reminderToast.type === "success" ? "✅" : "❌"} {reminderToast.msg}
                      </div>
                    )}
                    <div className="reminder-toggle-row">
                      <div className="reminder-toggle-info">
                        <span className="reminder-toggle-label">
                          {reminderEnabled ? "🔔 Reminders ON" : "🔕 Reminders OFF"}
                        </span>
                        <span className="reminder-toggle-desc">
                          {reminderEnabled
                            ? "You'll receive an email every Monday at 09:00."
                            : "Enable to get weekly practice nudges in your inbox."}
                        </span>
                      </div>
                      <button
                        className={`reminder-toggle-btn ${reminderEnabled ? "reminder-toggle-btn--on" : ""}`}
                        onClick={handleReminderToggle}
                        disabled={reminderSaving}
                        aria-pressed={reminderEnabled}
                      >
                        <span className="reminder-toggle-knob"/>
                      </button>
                    </div>
                    {reminderEnabled && (
                      <>
                        <div className="reminder-preview">
                          <p className="reminder-preview-title">📬 What's in each email?</p>
                          <ul className="reminder-preview-list">
                            <li>🎯 One question targeting your weakest interview topic</li>
                            <li>📊 Your recent average score for that topic</li>
                            <li>💡 Tips on structuring a great answer</li>
                            <li>🔗 A direct link to start a full mock interview</li>
                          </ul>
                        </div>
                        <button
                          className="reminder-test-btn"
                          onClick={handleReminderTest}
                          disabled={reminderTesting}
                        >
                          {reminderTesting
                            ? <><span className="reminder-spinner reminder-spinner--sm"/> Sending…</>
                            : "📩 Send me a test email now"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ════ EDIT MODE ════ */}
          {isEditing && (
            <>
              <Section title="📄 Resume" badge="AI Uses This">
                <p className="section-hint">Upload your resume so the AI can ask relevant questions.</p>
                {resumeUploading && <p style={{color:"var(--accent)"}}>⏳ Uploading resume...</p>}
                {user.resumeUrl ? (
                  <div className="resume-uploaded">
                    <div className="resume-file-info">
                      <span className="resume-icon">📑</span>
                      <div>
                        <strong>Resume uploaded</strong>
                        <span>AI will use this to personalise your interview</span>
                      </div>
                    </div>
                    <div className="resume-actions">
                      <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="btn-outline">View</a>
                      <button className="btn-remove" onClick={removeResume}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="resume-dropzone">
                    <span className="dropzone-icon">⬆️</span>
                    <strong>Upload Resume</strong>
                    <span>PDF, DOC, DOCX supported</span>
                    <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload}/>
                  </label>
                )}
              </Section>

              <Section title="Personal Information">
                <div className="form-grid">
                  <Field label="Full Name"><input name="name" value={user.name} onChange={handleChange} placeholder="John Doe"/></Field>
                  <Field label="Email"><input name="email" value={user.email} onChange={handleChange} placeholder="john@example.com"/></Field>
                  <Field label="Phone"><input name="phone" value={user.phone} onChange={handleChange} placeholder="+91 9876543210"/></Field>
                  <Field label="College / University"><input name="college" value={user.college} onChange={handleChange}/></Field>
                  <Field label="Degree / Title"><input name="degree" value={user.degree} onChange={handleChange} placeholder="B.Tech CSE"/></Field>
                  <Field label="Organization"><input name="organization" value={user.organization} onChange={handleChange}/></Field>
                  <Field label="LinkedIn"><input name="linkedin" value={user.linkedin} onChange={handleChange} placeholder="linkedin.com/in/..."/></Field>
                  <Field label="GitHub"><input name="github" value={user.github} onChange={handleChange} placeholder="github.com/..."/></Field>
                </div>
              </Section>

              <Section title="Professional Summary" badge="AI Uses This">
                <p className="section-hint">A brief summary helps the AI frame appropriate questions.</p>
                <textarea name="summary" rows={4} value={user.summary} onChange={handleChange}
                  placeholder="e.g. Full-stack developer with 2 years experience..."/>
              </Section>

              <Section title="Core Skills" badge="AI Uses This">
                <p className="section-hint">The AI will probe specific technologies you know.</p>
                <div className="skills-input">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown} placeholder="Type a skill and press Enter..."/>
                  <button onClick={() => addSkill()}>Add</button>
                </div>
                {skillInput && suggestedSkills.length > 0 && (
                  <div className="suggestions">
                    {suggestedSkills.slice(0, 8).map(s => (
                      <span key={s} onClick={() => addSkill(s)}>{s}</span>
                    ))}
                  </div>
                )}
                <div className="tags">
                  {user.skills.map(skill => (
                    <div key={skill} className="tag">
                      {skill}<span onClick={() => removeSkill(skill)}>×</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Work Experience" badge="AI Uses This">
                <p className="section-hint">The AI may ask deeper questions about your roles.</p>
                <textarea name="experience" rows={5} value={user.experience} onChange={handleChange}
                  placeholder="Senior Developer — Acme Corp — 2022–present"/>
                <label className="file-upload">
                  📎 Upload Offer Letters
                  <input hidden type="file" multiple onChange={e => readFiles(e.target.files, "offerLetters")}/>
                </label>
                <FileList files={user.offerLetters} onRemove={name => removeFile("offerLetters", name)}/>
              </Section>

              <Section title="Key Projects" badge="AI Uses This">
                <p className="section-hint">The AI will probe your technical decisions.</p>
                <textarea name="projectsText" rows={5} value={user.projectsText} onChange={handleChange}
                  placeholder="E-commerce App — React, Node.js, MongoDB"/>
                <div className="repo-input">
                  <input placeholder="Project Name" value={repoName} onChange={e => setRepoName(e.target.value)}/>
                  <input placeholder="GitHub URL"   value={repoUrl}  onChange={e => setRepoUrl(e.target.value)}/>
                  <button onClick={addRepo}>Add Repo</button>
                </div>
                {user.projectRepos.map(repo => (
                  <div key={repo.name} className="repo-item">
                    <span>🔗 {repo.name}</span>
                    <a href={repo.url} target="_blank" rel="noreferrer">Open</a>
                    <button onClick={() => removeRepo(repo.name)}>Remove</button>
                  </div>
                ))}
              </Section>

              <Section title="Certifications" badge="AI Uses This">
                <p className="section-hint">The AI will ask targeted questions in certified domains.</p>
                <textarea name="certificationsText" rows={3} value={user.certificationsText} onChange={handleChange}
                  placeholder="AWS Solutions Architect — Associate (2023)"/>
                <label className="file-upload">
                  🎓 Upload Certificates
                  <input hidden type="file" multiple onChange={e => readFiles(e.target.files, "certificates")}/>
                </label>
                <FileList files={user.certificates} onRemove={name => removeFile("certificates", name)}/>
              </Section>

              <div className="edit-action-bar">
                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button className="save-btn"   onClick={handleSave}>Save Changes</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

const Section = ({ title, badge, children }) => (
  <section className="profile-section">
    <div className="section-title-row">
      <h2>{title}</h2>
      {badge && <span className="ai-badge">{badge}</span>}
    </div>
    {children}
  </section>
);

const Field = ({ label, children }) => (
  <div className="form-field">
    <label>{label}</label>
    {children}
  </div>
);

const FileList = ({ files, onRemove, viewOnly }) => (
  <div className="file-list">
    {files.map(f => (
      <div key={f.name} className="file-item">
        <span>📄 {f.name}</span>
        <a href={f.data} target="_blank" rel="noreferrer">View</a>
        {!viewOnly && <button onClick={() => onRemove(f.name)}>Remove</button>}
      </div>
    ))}
  </div>
);

export default Profile;