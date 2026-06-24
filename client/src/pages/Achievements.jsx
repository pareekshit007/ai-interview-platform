import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import { fetchBadges, fetchLeaderboard, fetchAchievementStats, fetchCertificate } from "../services/achievementsService";
import { fetchHistory } from "../services/interviewService";
import "../styles/achievements.css";

const Achievements = () => {
  const navigate  = useNavigate();
  const [tab,     setTab]     = useState("badges");
  const [loading, setLoading] = useState(true);
  const [badges,      setBadges]      = useState([]);
  const [badgeStats,  setBadgeStats]  = useState({ earned: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [myEntry,     setMyEntry]     = useState(null);
  const [stats,       setStats]       = useState(null);
  const [history,     setHistory]     = useState([]);
  const [certData,    setCertData]    = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError,   setCertError]   = useState("");
  const certRef = useRef(null);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) { navigate("/login"); return; }
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [b, lb, s, h] = await Promise.all([
        fetchBadges(), fetchLeaderboard(), fetchAchievementStats(), fetchHistory(),
      ]);
      setBadges(b.badges || []);
      setBadgeStats({ earned: b.earned || 0, total: b.total || 0 });
      setLeaderboard(lb.leaderboard || []);
      setMyEntry(lb.currentUserEntry || null);
      setStats(s);
      setHistory((h || []).filter(iv => iv.completed && iv.totalScore >= 70));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFetchCertificate = async (interviewId) => {
    setCertLoading(true); setCertError(""); setCertData(null);
    try {
      const data = await fetchCertificate(interviewId);
      setCertData(data.certificate);
      setTimeout(() => certRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) { setCertError(err.message || "Could not load certificate"); }
    finally { setCertLoading(false); }
  };

  const handlePrintCert = () => {
    const printArea = document.getElementById("cert-print-area");
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>AcePrep Certificate</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
      body{margin:0;background:#fff;}</style></head><body>${printArea.innerHTML}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const tierOrder = { platinum:0, gold:1, silver:2, bronze:3 };
  const sortedBadges = [...badges].sort((a,b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return (tierOrder[a.tier]??9) - (tierOrder[b.tier]??9);
  });

  const getRankStyle = (rank) => {
    if (rank===1) return { color:"#f59e0b", icon:"🥇" };
    if (rank===2) return { color:"#94a3b8", icon:"🥈" };
    if (rank===3) return { color:"#f97316", icon:"🥉" };
    return { color:"#475569", icon:`#${rank}` };
  };

  const getScoreColor = (s) =>
    s >= 85 ? "#00f5a0" : s >= 70 ? "#3b82f6" : s >= 50 ? "#f59e0b" : "#ef4444";

  const tierColors = { platinum:"#ec4899", gold:"#f59e0b", silver:"#94a3b8", bronze:"#f97316" };

  return (
    <>
      {loading && <Loader text="Loading achievements…" />}
      <div className="ach-root">
        <div className="ach-bg">
          <div className="ach-orb ach-orb1"/><div className="ach-orb ach-orb2"/>
          <div className="ach-orb ach-orb3"/><div className="ach-grid"/>
        </div>

        <div className="ach-wrap">

          {/* HEADER */}
          <header className="ach-header">
            <div>
              <span className="ach-tag">ACHIEVEMENTS</span>
              <h1 className="ach-title">Your <span className="ach-title-grad">Hall of Fame</span></h1>
              <p className="ach-sub">Badges, certificates & leaderboard — keep pushing!</p>
            </div>
            {stats && (
              <div className="ach-header-stats">
                {[
                  { val: stats.totalSessions,       lbl:"Sessions",  color:"#00f5a0" },
                  { val: `${stats.avgScore}%`,       lbl:"Avg Score", color:"#3b82f6" },
                  { val: badgeStats.earned,           lbl:"Badges",   color:"#a78bfa" },
                  { val: stats.certificatesEarned,    lbl:"Certs",    color:"#f59e0b" },
                ].map(s => (
                  <div key={s.lbl} className="ach-hstat" style={{"--accent":s.color}}>
                    <span className="ach-hstat-val" style={{color:s.color}}>{s.val}</span>
                    <span className="ach-hstat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* TABS */}
          <div className="ach-tabs">
            {[
              { id:"badges",       label:"🏅 Badges",      count: badgeStats.earned },
              { id:"leaderboard",  label:"🏆 Leaderboard", count: null },
              { id:"certificates", label:"📜 Certificates",count: stats?.certificatesEarned },
            ].map(t => (
              <button key={t.id} className={`ach-tab ${tab===t.id?"ach-tab--active":""}`} onClick={()=>setTab(t.id)}>
                {t.label}
                {t.count != null && <span className="ach-tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* ── BADGES ── */}
          {tab === "badges" && (
            <div className="ach-section">
              <div className="ach-badge-progress">
                <div className="ach-bp-header">
                  <span className="ach-bp-label">Badge Collection</span>
                  <span className="ach-bp-count">
                    <span style={{color:"#00f5a0"}}>{badgeStats.earned}</span> / {badgeStats.total} earned
                  </span>
                </div>
                <div className="ach-bp-bar">
                  <div className="ach-bp-fill" style={{width:`${Math.round((badgeStats.earned/badgeStats.total||0)*100)}%`}}/>
                </div>
              </div>

              <div className="ach-badge-grid">
                {sortedBadges.map(badge => (
                  <div key={badge.id}
                    className={`ach-badge-card ${badge.earned?"ach-badge-earned":"ach-badge-locked"}`}
                    style={{"--badge-color":badge.color,"--tier-color":tierColors[badge.tier]}}
                  >
                    {badge.earned && <div className="ach-badge-glow"/>}
                    <div className="ach-badge-icon-wrap">
                      <span className="ach-badge-icon">{badge.earned ? badge.icon : "🔒"}</span>
                    </div>
                    <div className="ach-badge-tier" style={{color:tierColors[badge.tier]}}>{badge.tier?.toUpperCase()}</div>
                    <p className="ach-badge-name">{badge.name}</p>
                    <p className="ach-badge-desc">{badge.description}</p>
                    {badge.earned && <div className="ach-badge-earned-stamp">✓ Earned</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LEADERBOARD ── */}
          {tab === "leaderboard" && (
            <div className="ach-section">
              {leaderboard.length >= 3 && (
                <div className="ach-podium">
                  {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, pIdx) => {
                    const podiumRank = [2,1,3][pIdx];
                    const rs = getRankStyle(podiumRank);
                    const heights = ["130px","160px","110px"];
                    return (
                      <div key={user._id} className={`ach-podium-item ${user.isCurrentUser?"ach-podium-me":""}`}>
                        <div className="ach-podium-avatar">
                          {user.profilePic ? <img src={user.profilePic} alt={user.name}/> : <span>{user.name?.charAt(0).toUpperCase()}</span>}
                          <span className="ach-podium-medal">{rs.icon}</span>
                        </div>
                        <p className="ach-podium-name">{user.isCurrentUser?"You 🎯":user.name}</p>
                        <p className="ach-podium-score" style={{color:getScoreColor(user.avgScore)}}>{user.avgScore}%</p>
                        <div className="ach-podium-base" style={{height:heights[pIdx],background:`${rs.color}18`,borderColor:`${rs.color}40`}}>
                          <span className="ach-podium-rank" style={{color:rs.color}}>#{podiumRank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="ach-lb-table">
                <div className="ach-lb-thead">
                  <span>Rank</span><span>Candidate</span><span>Avg Score</span>
                  <span>Sessions</span><span>Best</span><span>Streak</span>
                </div>
                {leaderboard.map(user => {
                  const rs = getRankStyle(user.rank);
                  return (
                    <div key={user._id} className={`ach-lb-row ${user.isCurrentUser?"ach-lb-row--me":""}`}>
                      <span className="ach-lb-rank" style={{color:rs.color}}>{user.rank<=3?rs.icon:`#${user.rank}`}</span>
                      <div className="ach-lb-user">
                        <div className="ach-lb-avatar">
                          {user.profilePic?<img src={user.profilePic} alt={user.name}/>:<span>{user.name?.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className="ach-lb-name">{user.name}{user.isCurrentUser&&<span className="ach-you-tag">YOU</span>}</p>
                          <p className="ach-lb-college">{user.college||user.degree||"—"}</p>
                        </div>
                      </div>
                      <span className="ach-lb-score" style={{color:getScoreColor(user.avgScore)}}>{user.avgScore}%</span>
                      <span className="ach-lb-sessions">{user.totalSessions}</span>
                      <span className="ach-lb-best" style={{color:getScoreColor(user.bestScore)}}>{user.bestScore}%</span>
                      <span className="ach-lb-streak">{user.longestStreak>0?`🔥 ${user.longestStreak}d`:"—"}</span>
                    </div>
                  );
                })}
                {myEntry?.outsideTop20 && (
                  <>
                    <div className="ach-lb-separator">· · ·</div>
                    <div className="ach-lb-row ach-lb-row--me">
                      <span className="ach-lb-rank" style={{color:"#64748b"}}>#{myEntry.rank}</span>
                      <div className="ach-lb-user">
                        <div className="ach-lb-avatar"><span>{myEntry.name?.charAt(0).toUpperCase()}</span></div>
                        <div>
                          <p className="ach-lb-name">{myEntry.name}<span className="ach-you-tag">YOU</span></p>
                          <p className="ach-lb-college">{myEntry.college||"—"}</p>
                        </div>
                      </div>
                      <span className="ach-lb-score" style={{color:getScoreColor(myEntry.avgScore)}}>{myEntry.avgScore}%</span>
                      <span className="ach-lb-sessions">{myEntry.totalSessions}</span>
                      <span className="ach-lb-best">—</span>
                      <span className="ach-lb-streak">{myEntry.longestStreak>0?`🔥 ${myEntry.longestStreak}d`:"—"}</span>
                    </div>
                  </>
                )}
                {leaderboard.length===0 && (
                  <div className="ach-empty">
                    <span>🏆</span>
                    <p>No data yet — complete interviews to appear here!</p>
                    <button onClick={()=>navigate("/roles")}>Start an Interview →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CERTIFICATES ── */}
          {tab === "certificates" && (
            <div className="ach-section">
              <p className="ach-cert-intro">
                Earn a certificate for every interview where you score <strong>70% or above</strong>. Download and share your achievements!
              </p>
              {history.length === 0 ? (
                <div className="ach-empty">
                  <span>📜</span>
                  <p>No certificates yet — score 70%+ to earn one!</p>
                  <button onClick={()=>navigate("/roles")}>Start Practicing →</button>
                </div>
              ) : (
                <div className="ach-cert-list">
                  {history.map(iv => (
                    <div key={iv._id} className="ach-cert-row">
                      <div className="ach-cert-row-left">
                        <div className="ach-cert-score-ring" style={{"--score-color":getScoreColor(iv.totalScore)}}>
                          {iv.totalScore}%
                        </div>
                        <div>
                          <p className="ach-cert-role">{iv.role}</p>
                          <p className="ach-cert-meta">{iv.difficulty} · {new Date(iv.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                          <span className="ach-cert-verdict" style={{color:getScoreColor(iv.totalScore)}}>{iv.verdict}</span>
                        </div>
                      </div>
                      <button className="ach-cert-btn" onClick={()=>handleFetchCertificate(iv._id)} disabled={certLoading}>
                        {certLoading?"Loading…":"📜 View Certificate"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {certError && <p className="ach-cert-error">❌ {certError}</p>}

              {certData && (
                <div ref={certRef} className="ach-cert-display">
                  <div className="ach-cert-actions">
                    <button className="ach-cert-print-btn" onClick={handlePrintCert}>🖨️ Print / Download PDF</button>
                    <button className="ach-cert-close-btn" onClick={()=>setCertData(null)}>✕ Close</button>
                  </div>
                  <div id="cert-print-area">
                    <div className="ach-certificate">
                      <div className="ach-cert-border"/>
                      <div className="ach-cert-header">
                        <div className="ach-cert-logo">
                          <span className="ach-cert-logo-ai">Ace</span><span className="ach-cert-logo-rest">Prep</span>
                        </div>
                        <p className="ach-cert-presents">proudly presents</p>
                      </div>
                      <h2 className="ach-cert-of-completion">Certificate of Achievement</h2>
                      <p className="ach-cert-awarded-to">This is to certify that</p>
                      <h1 className="ach-cert-name">{certData.recipientName}</h1>
                      {certData.college && (
                        <p className="ach-cert-college">{certData.college}{certData.degree?` · ${certData.degree}`:""}</p>
                      )}
                      <p className="ach-cert-body">has successfully completed an AI-powered mock interview for the role of</p>
                      <div className="ach-cert-role-badge">
                        <span>{certData.role}</span>
                        <span className="ach-cert-role-diff">{certData.difficulty}</span>
                      </div>
                      <div className="ach-cert-score-display">
                        <div className="ach-cert-score-circle">
                          <span className="ach-cert-score-val">{certData.score}%</span>
                          <span className="ach-cert-score-lbl">Score</span>
                        </div>
                        <div className="ach-cert-verdict-block">
                          <span className="ach-cert-verdict-val" style={{color:getScoreColor(certData.score)}}>{certData.verdict}</span>
                          <span className="ach-cert-verdict-lbl">Performance</span>
                        </div>
                      </div>
                      <div className="ach-cert-footer">
                        <div className="ach-cert-footer-left">
                          <p className="ach-cert-date">{new Date(certData.completedAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p>
                          <p className="ach-cert-date-lbl">Date of Completion</p>
                        </div>
                        <div className="ach-cert-seal">
                          <div className="ach-cert-seal-inner"><span>✦</span><span className="ach-cert-seal-text">VERIFIED</span></div>
                        </div>
                        <div className="ach-cert-footer-right">
                          <p className="ach-cert-id">{certData.certificateId}</p>
                          <p className="ach-cert-id-lbl">Certificate ID</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Achievements;