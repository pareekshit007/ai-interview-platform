import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import { getProfile, updateProfile, uploadResume } from "../services/userService";
import "../styles/profile.css";

const Profile = () => {
  const navigate  = useNavigate();
  const [loading,        setLoading]        = useState(false);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [resumeUploading,setResumeUploading]= useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [activeSection,  setActiveSection]  = useState("personal");

  const skillOptions = [
    "HTML","CSS","JavaScript","React","Node.js","Express",
    "MongoDB","SQL","Java","Python","C++","Git","Docker",
    "REST API","Redux","Next.js","TypeScript","AWS","GraphQL","Vue.js"
  ];

  const [user, setUser] = useState({
    name:"",email:"",phone:"",college:"",degree:"",
    organization:"",linkedin:"",github:"",skills:[],
    profilePic:"",summary:"",experience:"",projectsText:"",
    certificationsText:"",offerLetters:[],certificates:[],
    projectRepos:[],resumeUrl:"",
  });
  const [savedUser,   setSavedUser]   = useState(null);
  const [skillInput,  setSkillInput]  = useState("");
  const [repoName,    setRepoName]    = useState("");
  const [repoUrl,     setRepoUrl]     = useState("");

  // Email reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [reminderSaving,  setReminderSaving]  = useState(false);
  const [reminderTesting, setReminderTesting] = useState(false);
  const [reminderToast,   setReminderToast]   = useState(null);

  const showReminderToast = (msg, type = "success") => {
    setReminderToast({ msg, type });
    setTimeout(() => setReminderToast(null), 3500);
  };

  const hasAIContext = !!(
    user.skills.length > 0 || user.experience?.trim() ||
    user.certificationsText?.trim() || user.projectsText?.trim() ||
    user.summary?.trim() || user.resumeUrl
  );

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) { navigate("/login"); return; }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
       const merged = {
  name:"",email:"",phone:"",college:"",degree:"",
  organization:"",linkedin:"",github:"",
  profilePic:"",summary:"",experience:"",projectsText:"",
  certificationsText:"",
  skills:       data.skills       || [],
  offerLetters: data.offerLetters || [],
  certificates: data.certificates || [],
  projectRepos: data.projectRepos || [],
  resumeUrl:    data.resumeUrl    || "",
  ...data,
};
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
      } catch(err) {
        console.error(err);
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
      const next     = !reminderEnabled;
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token    = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/reminders/preference`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReminderEnabled(next);
      showReminderToast(data.message);
    } catch(err) {
      showReminderToast(err.message || "Failed to save", "error");
    } finally {
      setReminderSaving(false);
    }
  };

  const handleReminderTest = async () => {
    setReminderTesting(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL;
      const token    = localStorage.getItem("token");
      const res  = await fetch(`${BASE_URL}/reminders/test-me`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showReminderToast(data.message);
    } catch(err) {
      showReminderToast(err.message || "Failed to send", "error");
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
    } catch(err) {
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
        setUser(prev => ({ ...prev, [key]: [...prev[key], { name: file.name, data: reader.result }] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (key, name) =>
    setUser(prev => ({ ...prev, [key]: prev[key].filter(f => f.name !== name) }));

  const addSkill = skill => {
    const s = (skill || skillInput).trim();
    if (s && !user.skills.includes(s))
      setUser(prev => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = skill =>
    setUser(prev => ({ ...prev, skills: prev.skills.filter(x => x !== skill) }));

  const addRepo = () => {
    if (!repoName || !repoUrl) return;
    setUser(prev => ({ ...prev, projectRepos: [...prev.projectRepos, { name: repoName, url: repoUrl }] }));
    setRepoName(""); setRepoUrl("");
  };

  const removeRepo = name =>
    setUser(prev => ({ ...prev, projectRepos: prev.projectRepos.filter(r => r.name !== name) }));

  const normalizeUrl = url => url && !url.startsWith("http") ? `https://${url}` : url;

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const updated = {
        ...user,
        linkedin: normalizeUrl(user.linkedin),
        github:   normalizeUrl(user.github),
        skills:   user.skills.map(s => s.toLowerCase()),
      };
      const saved = await updateProfile(updated);
      localStorage.setItem("user", JSON.stringify(saved));
      setSavedUser(updated);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch(err) {
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUser(savedUser);
    setSkillInput(""); setRepoName(""); setRepoUrl("");
    setIsEditing(false);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
  };

  const suggestedSkills = skillOptions.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !user.skills.includes(s.toLowerCase())
  );

  const navSections = [
    { id:"personal",  label:"Personal",       icon:"👤" },
    { id:"ai",        label:"AI Context",      icon:"🤖" },
    { id:"projects",  label:"Projects",        icon:"🛠️" },
    { id:"reminders", label:"Reminders",       icon:"📧" },
  ];

  const completionItems = [
    { label:"Name",        done: !!user.name },
    { label:"Summary",     done: !!user.summary?.trim() },
    { label:"Skills",      done: user.skills.length > 0 },
    { label:"Experience",  done: !!user.experience?.trim() },
    { label:"Resume",      done: !!user.resumeUrl },
    { label:"Projects",    done: !!user.projectsText?.trim() },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  return (
    <>
      {loading && <Loader text="Loading..." />}

      <div className="pf-root">
        {/* Ambient background — same as dashboard */}
        <div className="pf-bg">
          <div className="pf-orb pf-orb1" />
          <div className="pf-orb pf-orb2" />
          <div className="pf-orb pf-orb3" />
          <div className="pf-grid" />
        </div>

        <div className="pf-wrap">

          {/* ── TOP HEADER CARD ── */}
          <div className="pf-hero">
            <div className="pf-hero-glow" />

            <div className="pf-hero-left">
              {/* Avatar */}
              <div className="pf-avatar-ring">
                <div className="pf-avatar">
                  {user.profilePic
                    ? <img src={user.profilePic} alt="profile" />
                    : <span className="pf-avatar-initials">
                        {user.name ? user.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "👤"}
                      </span>}
                </div>
                {isEditing && (
                  <label className="pf-avatar-change">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <input hidden type="file" accept="image/*" onChange={handleProfilePic}/>
                  </label>
                )}
              </div>

              {/* Name & meta */}
              <div className="pf-hero-info">
                <span className="pf-tag">PROFILE</span>
                <h1 className="pf-name">{user.name || "Your Name"}</h1>
                <p className="pf-role-title">{user.degree || "Add your title"}</p>
                <div className="pf-meta-row">
                  {user.email && <span className="pf-meta-chip">✉ {user.email}</span>}
                  {user.organization && <span className="pf-meta-chip">🏢 {user.organization}</span>}
                  {user.college && <span className="pf-meta-chip">🎓 {user.college}</span>}
                </div>
                <div className="pf-social-row">
                  {user.linkedin && <a href={user.linkedin} target="_blank" rel="noreferrer" className="pf-social-btn pf-social-li">in LinkedIn</a>}
                  {user.github   && <a href={user.github}   target="_blank" rel="noreferrer" className="pf-social-btn pf-social-gh">⌥ GitHub</a>}
                </div>
              </div>
            </div>

            {/* Right — completion + actions */}
            <div className="pf-hero-right">
              {/* Profile completion ring */}
              <div className="pf-completion">
                <svg viewBox="0 0 80 80" className="pf-ring-svg">
                  <circle cx="40" cy="40" r="32" className="pf-ring-bg" />
                  <circle
                    cx="40" cy="40" r="32"
                    className="pf-ring-fill"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 32}`,
                      strokeDashoffset: `${2 * Math.PI * 32 * (1 - completionPct / 100)}`,
                    }}
                  />
                </svg>
                <div className="pf-ring-inner">
                  <span className="pf-ring-val">{completionPct}%</span>
                  <span className="pf-ring-lbl">complete</span>
                </div>
              </div>

              {/* AI status badge */}
              <div className={`pf-ai-status ${hasAIContext ? "pf-ai-on" : "pf-ai-off"}`}>
                <span>{hasAIContext ? "🤖✨" : "🤖"}</span>
                <span>{hasAIContext ? "AI Active" : "AI Inactive"}</span>
              </div>

              {/* Action buttons */}
              {saveSuccess && <span className="pf-save-tick">✓ Saved!</span>}
              {!isEditing
                ? <button className="pf-btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
                : <div className="pf-btn-group">
                    <button className="pf-btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="pf-btn-save"   onClick={handleSave}>Save Changes</button>
                  </div>
              }
            </div>
          </div>

          {/* ── AI CONTEXT PILLS ── */}
          {hasAIContext && (
            <div className="pf-ai-banner">
              <span className="pf-ai-banner-label">AI PERSONALISATION ACTIVE</span>
              <div className="pf-ai-pills">
                {user.skills.length > 0      && <span className="pf-pill pf-pill-green">⚡ {user.skills.length} Skills</span>}
                {user.experience?.trim()     && <span className="pf-pill pf-pill-blue">◈ Experience</span>}
                {user.certificationsText?.trim()&&<span className="pf-pill pf-pill-purple">◆ Certifications</span>}
                {user.projectsText?.trim()   && <span className="pf-pill pf-pill-amber">◉ Projects</span>}
                {user.resumeUrl              && <span className="pf-pill pf-pill-green">📄 Resume</span>}
              </div>
            </div>
          )}

          {/* ── BODY: SIDEBAR NAV + CONTENT ── */}
          <div className="pf-body">

            {/* Sidebar nav */}
            <nav className="pf-sidebar">
              {navSections.map(s => (
                <button
                  key={s.id}
                  className={`pf-nav-item ${activeSection === s.id ? "pf-nav-item--active" : ""}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span className="pf-nav-icon">{s.icon}</span>
                  <span className="pf-nav-label">{s.label}</span>
                  {activeSection === s.id && <span className="pf-nav-bar" />}
                </button>
              ))}

              {/* Completion checklist in sidebar */}
              <div className="pf-checklist">
                <p className="pf-checklist-title">PROFILE STRENGTH</p>
                {completionItems.map(item => (
                  <div key={item.label} className={`pf-check-item ${item.done ? "done" : ""}`}>
                    <span className="pf-check-icon">{item.done ? "✓" : "○"}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </nav>

            {/* Main content panel */}
            <div className="pf-content">

              {/* ════════ PERSONAL ════════ */}
              {activeSection === "personal" && (
                <div className="pf-section-wrap">
                  <SectionHeader icon="👤" title="Personal Information"
                    sub={isEditing ? "Update your details below" : "Your profile information"} />

                  {/* Resume card — always shown in personal */}
                  <div className="pf-card pf-card--resume">
                    <div className="pf-card-label">📄 RESUME <span className="pf-ai-tag">AI USES THIS</span></div>
                    {resumeUploading && <p className="pf-uploading">⏳ Uploading…</p>}
                    {user.resumeUrl ? (
                      <div className="pf-resume-row">
                        <div className="pf-resume-info">
                          <span className="pf-resume-icon">📑</span>
                          <div>
                            <strong>Resume uploaded</strong>
                            <p>AI personalises questions from your resume</p>
                          </div>
                        </div>
                        <div className="pf-resume-actions">
                          <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="pf-btn-view">View</a>
                          {isEditing && <button className="pf-btn-remove" onClick={removeResume}>Remove</button>}
                        </div>
                      </div>
                    ) : isEditing ? (
                      <label className="pf-dropzone">
                        <span className="pf-dropzone-icon">⬆️</span>
                        <strong>Upload Resume</strong>
                        <span>PDF, DOC, DOCX</span>
                        <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload}/>
                      </label>
                    ) : (
                      <p className="pf-empty-hint">No resume uploaded. Click <strong>Edit Profile</strong> to add one.</p>
                    )}
                  </div>

                  {/* Personal fields */}
                  {isEditing ? (
                    <div className="pf-card">
                      <div className="pf-card-label">DETAILS</div>
                      <div className="pf-form-grid">
                        {[
                          { name:"name",         label:"Full Name",          placeholder:"John Doe" },
                          { name:"email",        label:"Email",              placeholder:"john@example.com" },
                          { name:"phone",        label:"Phone",              placeholder:"+91 9876543210" },
                          { name:"college",      label:"College",            placeholder:"IIT Delhi" },
                          { name:"degree",       label:"Degree / Title",     placeholder:"B.Tech CSE" },
                          { name:"organization", label:"Organization",       placeholder:"Acme Corp" },
                          { name:"linkedin",     label:"LinkedIn",           placeholder:"linkedin.com/in/..." },
                          { name:"github",       label:"GitHub",             placeholder:"github.com/..." },
                        ].map(f => (
                          <div key={f.name} className="pf-field">
                            <label>{f.label}</label>
                            <input name={f.name} value={user[f.name]} onChange={handleChange} placeholder={f.placeholder}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pf-card">
                      <div className="pf-card-label">DETAILS</div>
                      <div className="pf-view-grid">
                        {[
                          { label:"Full Name",    value: user.name },
                          { label:"Email",        value: user.email },
                          { label:"Phone",        value: user.phone },
                          { label:"College",      value: user.college },
                          { label:"Degree",       value: user.degree },
                          { label:"Organization", value: user.organization },
                          { label:"LinkedIn",     value: user.linkedin },
                          { label:"GitHub",       value: user.github },
                        ].map(f => (
                          <div key={f.label} className="pf-view-field">
                            <span className="pf-view-label">{f.label}</span>
                            <span className="pf-view-value">{f.value || <em>Not set</em>}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ AI CONTEXT ════════ */}
              {activeSection === "ai" && (
                <div className="pf-section-wrap">
                  <SectionHeader icon="🤖" title="AI Context"
                    sub="The AI uses this to generate personalised interview questions" />

                  {/* Summary */}
                  <div className="pf-card">
                    <div className="pf-card-label">PROFESSIONAL SUMMARY <span className="pf-ai-tag">AI USES THIS</span></div>
                    {isEditing
                      ? <textarea name="summary" rows={4} value={user.summary} onChange={handleChange}
                          placeholder="e.g. Full-stack developer with 2 years experience…"/>
                      : user.summary?.trim()
                          ? <p className="pf-view-text">{user.summary}</p>
                          : <p className="pf-empty-hint">No summary added. Click <strong>Edit Profile</strong> to add one.</p>
                    }
                  </div>

                  {/* Skills */}
                  <div className="pf-card">
                    <div className="pf-card-label">CORE SKILLS <span className="pf-ai-tag">AI USES THIS</span></div>
                    {isEditing && (
                      <>
                        <div className="pf-skill-input-row">
                          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={handleKeyDown} placeholder="Type a skill and press Enter…"/>
                          <button className="pf-btn-add" onClick={() => addSkill()}>Add</button>
                        </div>
                        {skillInput && suggestedSkills.length > 0 && (
                          <div className="pf-suggestions">
                            {suggestedSkills.slice(0,8).map(s => (
                              <span key={s} onClick={() => addSkill(s)}>{s}</span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {user.skills.length > 0
                      ? <div className="pf-tags">
                          {user.skills.map(skill => (
                            <div key={skill} className="pf-tag">
                              {skill}
                              {isEditing && <span onClick={() => removeSkill(skill)}>×</span>}
                            </div>
                          ))}
                        </div>
                      : <p className="pf-empty-hint">No skills added yet.</p>
                    }
                  </div>

                  {/* Work experience */}
                  <div className="pf-card">
                    <div className="pf-card-label">WORK EXPERIENCE <span className="pf-ai-tag">AI USES THIS</span></div>
                    {isEditing ? (
                      <>
                        <textarea name="experience" rows={5} value={user.experience} onChange={handleChange}
                          placeholder="Senior Developer — Acme Corp — 2022–present — Built microservices…"/>
                        <label className="pf-file-upload">
                          📎 Upload Offer Letters
                          <input hidden type="file" multiple onChange={e => readFiles(e.target.files,"offerLetters")}/>
                        </label>
                        <FileList files={user.offerLetters} onRemove={n => removeFile("offerLetters",n)}/>
                      </>
                    ) : (
                      <>
                        {user.experience?.trim()
                          ? <p className="pf-view-text">{user.experience}</p>
                          : <p className="pf-empty-hint">No experience added yet.</p>}
                        <FileList files={user.offerLetters} viewOnly/>
                      </>
                    )}
                  </div>

                  {/* Certifications */}
                  <div className="pf-card">
                    <div className="pf-card-label">CERTIFICATIONS <span className="pf-ai-tag">AI USES THIS</span></div>
                    {isEditing ? (
                      <>
                        <textarea name="certificationsText" rows={3} value={user.certificationsText} onChange={handleChange}
                          placeholder="AWS Solutions Architect — Associate (2023)"/>
                        <label className="pf-file-upload">
                          🎓 Upload Certificates
                          <input hidden type="file" multiple onChange={e => readFiles(e.target.files,"certificates")}/>
                        </label>
                        <FileList files={user.certificates} onRemove={n => removeFile("certificates",n)}/>
                      </>
                    ) : (
                      <>
                        {user.certificationsText?.trim()
                          ? <p className="pf-view-text">{user.certificationsText}</p>
                          : <p className="pf-empty-hint">No certifications added yet.</p>}
                        <FileList files={user.certificates} viewOnly/>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ════════ PROJECTS ════════ */}
              {activeSection === "projects" && (
                <div className="pf-section-wrap">
                  <SectionHeader icon="🛠️" title="Projects & Repos"
                    sub="The AI will probe your technical decisions in these projects" />

                  <div className="pf-card">
                    <div className="pf-card-label">PROJECT DESCRIPTIONS <span className="pf-ai-tag">AI USES THIS</span></div>
                    {isEditing ? (
                      <textarea name="projectsText" rows={6} value={user.projectsText} onChange={handleChange}
                        placeholder="E-commerce App — React, Node.js, MongoDB — Processed 1000+ orders/day&#10;Real-time chat — Socket.io, Redis — Served 500 concurrent users"/>
                    ) : (
                      user.projectsText?.trim()
                        ? <p className="pf-view-text">{user.projectsText}</p>
                        : <p className="pf-empty-hint">No projects added yet.</p>
                    )}
                  </div>

                  <div className="pf-card">
                    <div className="pf-card-label">GITHUB REPOS</div>
                    {isEditing && (
                      <div className="pf-repo-input">
                        <input placeholder="Project Name" value={repoName} onChange={e => setRepoName(e.target.value)}/>
                        <input placeholder="GitHub URL"   value={repoUrl}  onChange={e => setRepoUrl(e.target.value)}/>
                        <button className="pf-btn-add" onClick={addRepo}>Add</button>
                      </div>
                    )}
                    {user.projectRepos.length > 0 ? (
                      <div className="pf-repo-list">
                        {user.projectRepos.map(repo => (
                          <div key={repo.name} className="pf-repo-item">
                            <div className="pf-repo-left">
                              <span className="pf-repo-icon">⌥</span>
                              <span className="pf-repo-name">{repo.name}</span>
                            </div>
                            <div className="pf-repo-actions">
                              <a href={repo.url} target="_blank" rel="noreferrer" className="pf-btn-view">Open →</a>
                              {isEditing && <button className="pf-btn-remove" onClick={() => removeRepo(repo.name)}>Remove</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pf-empty-hint">No repos added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ════════ REMINDERS (view mode only) ════════ */}
              {activeSection === "reminders" && (
                <div className="pf-section-wrap">
                  <SectionHeader icon="📧" title="Weekly Practice Reminders"
                    sub="Get a personalised question every Monday targeting your weakest topic" />

                  {reminderLoading ? (
                    <div className="pf-card pf-loading-row">
                      <div className="pf-spinner"/> <span>Loading preference…</span>
                    </div>
                  ) : (
                    <>
                      {/* Toast */}
                      {reminderToast && (
                        <div className={`pf-toast pf-toast--${reminderToast.type}`}>
                          {reminderToast.type === "success" ? "✅" : "❌"} {reminderToast.msg}
                        </div>
                      )}

                      {/* Toggle card */}
                      <div className={`pf-card pf-reminder-toggle-card ${reminderEnabled ? "pf-reminder-on" : ""}`}>
                        <div className="pf-reminder-toggle-row">
                          <div className="pf-reminder-toggle-left">
                            <div className="pf-reminder-icon-wrap">
                              {reminderEnabled ? "🔔" : "🔕"}
                            </div>
                            <div>
                              <p className="pf-reminder-status-label">
                                {reminderEnabled ? "Weekly Reminders ON" : "Weekly Reminders OFF"}
                              </p>
                              <p className="pf-reminder-status-sub">
                                {reminderEnabled
                                  ? "Every Monday at 09:00 — a question targeting your weakest topic"
                                  : "Enable to receive weekly practice nudges in your inbox"}
                              </p>
                            </div>
                          </div>
                          <button
                            className={`pf-toggle ${reminderEnabled ? "pf-toggle--on" : ""}`}
                            onClick={handleReminderToggle}
                            disabled={reminderSaving}
                          >
                            <span className="pf-toggle-knob"/>
                          </button>
                        </div>
                      </div>

                      {/* What's in each email */}
                      {reminderEnabled && (
                        <>
                          <div className="pf-card pf-reminder-preview-card">
                            <div className="pf-card-label">📬 WHAT'S IN EACH EMAIL</div>
                            <div className="pf-reminder-features">
                              {[
                                { icon:"🎯", title:"Targeted Question",  sub:"AI picks your weakest interview topic" },
                                { icon:"📊", title:"Your Score Context", sub:"Shows your recent average on that topic" },
                                { icon:"💡", title:"Answer Tips",        sub:"Structure guidance for your response" },
                                { icon:"🚀", title:"Quick Start Link",   sub:"Jump straight into a full mock interview" },
                              ].map(f => (
                                <div key={f.title} className="pf-reminder-feature">
                                  <span className="pf-reminder-feature-icon">{f.icon}</span>
                                  <div>
                                    <p className="pf-reminder-feature-title">{f.title}</p>
                                    <p className="pf-reminder-feature-sub">{f.sub}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pf-card pf-reminder-test-card">
                            <div className="pf-card-label">TEST IT NOW</div>
                            <p className="pf-reminder-test-desc">
                              Send yourself a preview email right now — see exactly what your users will receive.
                            </p>
                            <button
                              className="pf-btn-test-email"
                              onClick={handleReminderTest}
                              disabled={reminderTesting}
                            >
                              {reminderTesting
                                ? <><span className="pf-spinner pf-spinner--sm"/> Sending…</>
                                : "📩 Send Me a Test Email"}
                            </button>
                          </div>
                        </>
                      )}

                      {/* Schedule info */}
                      <div className="pf-card pf-reminder-schedule-card">
                        <div className="pf-card-label">SCHEDULE</div>
                        <div className="pf-schedule-row">
                          <div className="pf-schedule-item">
                            <span className="pf-schedule-val">Monday</span>
                            <span className="pf-schedule-lbl">Day of week</span>
                          </div>
                          <div className="pf-schedule-divider"/>
                          <div className="pf-schedule-item">
                            <span className="pf-schedule-val">09:00</span>
                            <span className="pf-schedule-lbl">Time (server)</span>
                          </div>
                          <div className="pf-schedule-divider"/>
                          <div className="pf-schedule-item">
                            <span className="pf-schedule-val">Weekly</span>
                            <span className="pf-schedule-lbl">Frequency</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Bottom action bar (edit mode only) */}
              {isEditing && (
                <div className="pf-action-bar">
                  <button className="pf-btn-cancel" onClick={handleCancel}>Cancel</button>
                  <button className="pf-btn-save"   onClick={handleSave}>💾 Save Changes</button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SectionHeader = ({ icon, title, sub }) => (
  <div className="pf-section-header">
    <span className="pf-section-icon">{icon}</span>
    <div>
      <h2 className="pf-section-title">{title}</h2>
      <p className="pf-section-sub">{sub}</p>
    </div>
  </div>
);

const FileList = ({ files, onRemove, viewOnly }) => (
  <div className="pf-file-list">
    {files.map(f => (
      <div key={f.name} className="pf-file-item">
        <span>📄 {f.name}</span>
        <div style={{display:"flex",gap:"8px"}}>
          <a href={f.data} target="_blank" rel="noreferrer" className="pf-btn-view">View</a>
          {!viewOnly && <button className="pf-btn-remove" onClick={() => onRemove(f.name)}>Remove</button>}
        </div>
      </div>
    ))}
  </div>
);

export default Profile;