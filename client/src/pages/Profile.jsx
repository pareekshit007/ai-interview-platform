import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import "../styles/profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const skillOptions = [
    "HTML","CSS","JavaScript","React","Node.js","Express",
    "MongoDB","SQL","Java","Python","C++","Git","Docker",
    "REST API","Redux","Next.js","TypeScript","AWS","GraphQL","Vue.js"
  ];

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    degree: "",
    organization: "",
    linkedin: "",
    github: "",
    skills: [],
    profilePic: "",
    summary: "",
    experience: "",
    projectsText: "",
    certificationsText: "",
    offerLetters: [],
    certificates: [],
    projectRepos: [],
    // Resume upload
    resumeFile: null,  // { name, data } base64
  });

  const [skillInput, setSkillInput] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  // Computed: does the profile have AI context?
  const hasAIContext = !!(
    user.skills.length > 0 ||
    user.experience?.trim() ||
    user.certificationsText?.trim() ||
    user.projectsText?.trim() ||
    user.summary?.trim() ||
    user.resumeFile
  );

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!isAuth || !storedUser) { navigate("/login"); return; }
    setUser(prev => ({
      ...prev,
      ...storedUser,
      skills: storedUser.skills || [],
      offerLetters: storedUser.offerLetters || [],
      certificates: storedUser.certificates || [],
      projectRepos: storedUser.projectRepos || [],
      resumeFile: storedUser.resumeFile || null,
    }));
  }, [navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  /* ---------- PROFILE PIC ---------- */
  const handleProfilePic = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser(prev => ({ ...prev, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  /* ---------- RESUME UPLOAD ---------- */
  const handleResumeUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setUser(prev => ({ ...prev, resumeFile: { name: file.name, data: reader.result } }));
    reader.readAsDataURL(file);
  };

  const removeResume = () => setUser(prev => ({ ...prev, resumeFile: null }));

  /* ---------- FILE UPLOAD GENERIC ---------- */
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

  /* ---------- SKILLS ---------- */
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

  /* ---------- PROJECT REPOS ---------- */
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

  /* ---------- SAVE ---------- */
  const normalizeUrl = url => url && !url.startsWith("http") ? `https://${url}` : url;

  const handleSave = () => {
    setLoading(true);
    setSaveSuccess(false);
    const updated = {
      ...user,
      linkedin: normalizeUrl(user.linkedin),
      github: normalizeUrl(user.github),
      skills: user.skills.map(s => s.toLowerCase())
    };
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify(updated));
      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
  };

  const suggestedSkills = skillOptions.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !user.skills.includes(s.toLowerCase())
  );

  return (
    <>
      {loading && <Loader text="Saving profile..." />}

      <div className="profile-page">

        {/* HEADER */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="avatar-wrap">
              {user.profilePic
                ? <img src={user.profilePic} alt="profile"/>
                : <div className="avatar-placeholder">👤</div>}
              <label className="avatar-upload">
                Change
                <input hidden type="file" accept="image/*" onChange={handleProfilePic}/>
              </label>
            </div>
            <div>
              <h1>{user.name || "Your Name"}</h1>
              <p>{user.degree || "Your Title"}</p>
              <span>{user.email}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button className="save-btn" onClick={handleSave}>Save Profile</button>
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
                : "Fill in your skills, experience, or certifications below, and the AI will ask you targeted questions based on your profile."}
            </p>
          </div>
          {hasAIContext && (
            <div className="ai-context-pills">
              {user.skills.length > 0 && <span className="ai-pill">✓ Skills ({user.skills.length})</span>}
              {user.experience?.trim() && <span className="ai-pill">✓ Experience</span>}
              {user.certificationsText?.trim() && <span className="ai-pill">✓ Certifications</span>}
              {user.projectsText?.trim() && <span className="ai-pill">✓ Projects</span>}
              {user.resumeFile && <span className="ai-pill">✓ Resume</span>}
            </div>
          )}
        </div>

        <div className="profile-sections">

          {/* RESUME UPLOAD */}
          <Section title="📄 Resume" badge="AI Uses This">
            <p className="section-hint">
              Upload your resume so the AI can ask relevant questions about your background, skills, and experience.
            </p>
            {user.resumeFile ? (
              <div className="resume-uploaded">
                <div className="resume-file-info">
                  <span className="resume-icon">📑</span>
                  <div>
                    <strong>{user.resumeFile.name}</strong>
                    <span>Resume uploaded — AI will use this to personalise your interview</span>
                  </div>
                </div>
                <div className="resume-actions">
                  <a href={user.resumeFile.data} target="_blank" rel="noreferrer" className="btn-outline">View</a>
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

          {/* PERSONAL INFO */}
          <Section title="Personal Information">
            <div className="form-grid">
              <Field label="Full Name">
                <input name="name" value={user.name} onChange={handleChange} placeholder="John Doe"/>
              </Field>
              <Field label="Email">
                <input name="email" value={user.email} onChange={handleChange} placeholder="john@example.com"/>
              </Field>
              <Field label="Phone">
                <input name="phone" value={user.phone} onChange={handleChange} placeholder="+91 9876543210"/>
              </Field>
              <Field label="College / University">
                <input name="college" value={user.college} onChange={handleChange}/>
              </Field>
              <Field label="Degree / Title">
                <input name="degree" value={user.degree} onChange={handleChange} placeholder="B.Tech CSE"/>
              </Field>
              <Field label="Organization">
                <input name="organization" value={user.organization} onChange={handleChange}/>
              </Field>
              <Field label="LinkedIn">
                <input name="linkedin" value={user.linkedin} onChange={handleChange} placeholder="linkedin.com/in/..."/>
              </Field>
              <Field label="GitHub">
                <input name="github" value={user.github} onChange={handleChange} placeholder="github.com/..."/>
              </Field>
            </div>
          </Section>

          {/* PROFESSIONAL SUMMARY */}
          <Section title="Professional Summary" badge="AI Uses This">
            <p className="section-hint">A brief summary of your background helps the AI frame appropriate questions.</p>
            <textarea name="summary" rows={4} value={user.summary} onChange={handleChange}
              placeholder="e.g. Full-stack developer with 2 years experience building React/Node.js applications..."/>
          </Section>

          {/* SKILLS */}
          <Section title="Core Skills" badge="AI Uses This">
            <p className="section-hint">The AI will probe specific technologies you know.</p>
            <div className="skills-input">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter..."
              />
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
                  {skill}
                  <span onClick={() => removeSkill(skill)}>×</span>
                </div>
              ))}
            </div>
          </Section>

          {/* WORK EXPERIENCE */}
          <Section title="Work Experience" badge="AI Uses This">
            <p className="section-hint">The AI may ask you to dive deeper into roles and achievements you've listed.</p>
            <textarea
              name="experience"
              rows={5}
              value={user.experience}
              onChange={handleChange}
              placeholder="Senior Developer — Acme Corp — 2022–present — Built microservices reducing latency by 40%"
            />
            <label className="file-upload">
              📎 Upload Offer Letters
              <input hidden type="file" multiple onChange={e => readFiles(e.target.files, "offerLetters")}/>
            </label>
            <FileList files={user.offerLetters} onRemove={name => removeFile("offerLetters", name)}/>
          </Section>

          {/* PROJECTS */}
          <Section title="Key Projects" badge="AI Uses This">
            <p className="section-hint">Expect questions about your projects — the AI will probe your technical decisions.</p>
            <textarea
              name="projectsText"
              rows={5}
              value={user.projectsText}
              onChange={handleChange}
              placeholder="E-commerce App — React, Node.js, MongoDB — Processed 1000+ orders/day"
            />
            <div className="repo-input">
              <input placeholder="Project Name" value={repoName} onChange={e => setRepoName(e.target.value)}/>
              <input placeholder="GitHub URL" value={repoUrl} onChange={e => setRepoUrl(e.target.value)}/>
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

          {/* CERTIFICATIONS */}
          <Section title="Certifications" badge="AI Uses This">
            <p className="section-hint">If you hold certifications, the AI will ask targeted questions in those domains.</p>
            <textarea
              name="certificationsText"
              rows={3}
              value={user.certificationsText}
              onChange={handleChange}
              placeholder="AWS Solutions Architect — Associate (2023)&#10;Google Cloud Professional Data Engineer (2022)"
            />
            <label className="file-upload">
              🎓 Upload Certificates
              <input hidden type="file" multiple onChange={e => readFiles(e.target.files, "certificates")}/>
            </label>
            <FileList files={user.certificates} onRemove={name => removeFile("certificates", name)}/>
          </Section>

        </div>
      </div>
    </>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

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

const FileList = ({ files, onRemove }) => (
  <div className="file-list">
    {files.map(f => (
      <div key={f.name} className="file-item">
        <span>📄 {f.name}</span>
        <a href={f.data} target="_blank" rel="noreferrer">View</a>
        <button onClick={() => onRemove(f.name)}>Remove</button>
      </div>
    ))}
  </div>
);

export default Profile;