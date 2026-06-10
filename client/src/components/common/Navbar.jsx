import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isAuth = !!localStorage.getItem("isAuthenticated");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Click outside closes dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const notifications = [
    { id: 1, icon: "🎯", text: "Your last interview scored 82%", time: "2h ago", unread: true },
    { id: 2, icon: "📋", text: "New Frontend Engineer role added", time: "1d ago", unread: true },
    { id: 3, icon: "✅", text: "Profile updated successfully", time: "3d ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        {/* Logo */}
        <div className="nav-logo">
          <Link to="/">
            <span className="logo-ai">AI</span>
            <span className="logo-interview">Interview</span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          {isAuth && <li><NavLink to="/roles">Roles</NavLink></li>}
          {isAuth && <li><NavLink to="/dashboard">Dashboard</NavLink></li>}
          {isAuth && <li><NavLink to="/interview-history">History</NavLink></li>}
          <li><NavLink to="/contact">Contact</NavLink></li>
        </ul>

        {/* Right actions */}
        <div className="nav-right">
          {/* Theme toggle */}
          <button
            className="nav-icon-btn theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            aria-label="Toggle theme"
          >
            <span className="theme-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          {isAuth ? (
            <>
              {/* Notifications */}
              <div className="nav-notif-wrap" ref={notifRef}>
                <button
                  className="nav-icon-btn notif-btn"
                  onClick={() => { setNotifOpen((p) => !p); setDropdownOpen(false); }}
                  aria-label="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      <span className="notif-count">{unreadCount} new</span>
                    </div>
                    <ul className="notif-list">
                      {notifications.map((n) => (
                        <li key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`}>
                          <span className="notif-icon">{n.icon}</span>
                          <div className="notif-body">
                            <p>{n.text}</p>
                            <span>{n.time}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link to="/dashboard" className="notif-footer">View all →</Link>
                  </div>
                )}
              </div>

              {/* User avatar dropdown */}
              <div className="nav-avatar-wrap" ref={dropdownRef}>
                <button
                  className="avatar-btn"
                  onClick={() => { setDropdownOpen((p) => !p); setNotifOpen(false); }}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  {userData.profilePic ? (
                    <img src={userData.profilePic} alt="avatar" className="avatar-img" />
                  ) : (
                    <span className="avatar-initials">{getInitials(userData.name)}</span>
                  )}
                  <svg
                    className={`avatar-chevron ${dropdownOpen ? "open" : ""}`}
                    width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="avatar-dropdown">
                    <div className="dropdown-header">
                      {userData.profilePic ? (
                        <img src={userData.profilePic} alt="avatar" className="dropdown-avatar-img" />
                      ) : (
                        <span className="dropdown-avatar-initials">{getInitials(userData.name)}</span>
                      )}
                      <div>
                        <p className="dropdown-name">{userData.name || "Candidate"}</p>
                        <p className="dropdown-email">{userData.email || ""}</p>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <ul className="dropdown-links">
                      <li>
                        <Link to="/profile">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link to="/dashboard">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/interview-history">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Interview History
                        </Link>
                      </li>
                    </ul>
                    <div className="dropdown-divider" />
                    <button className="dropdown-logout" onClick={handleLogout}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Get Started</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-logo">
            <span className="logo-ai">AI</span>
            <span className="logo-interview">Interview</span>
          </span>
          <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {isAuth && (
          <div className="drawer-user">
            <div className="drawer-avatar">
              {userData.profilePic
                ? <img src={userData.profilePic} alt="avatar" />
                : <span>{getInitials(userData.name)}</span>
              }
            </div>
            <div>
              <p className="drawer-user-name">{userData.name || "Candidate"}</p>
              <p className="drawer-user-email">{userData.email || ""}</p>
            </div>
          </div>
        )}

        <ul className="drawer-links">
          <li><NavLink to="/" end>🏠 Home</NavLink></li>
          {isAuth && <li><NavLink to="/roles">🎭 Roles</NavLink></li>}
          {isAuth && <li><NavLink to="/dashboard">📊 Dashboard</NavLink></li>}
          {isAuth && <li><NavLink to="/interview-history">📋 History</NavLink></li>}
          {isAuth && <li><NavLink to="/profile">👤 Profile</NavLink></li>}
          <li><NavLink to="/contact">📬 Contact</NavLink></li>
        </ul>

        <div className="drawer-footer">
          <button className="drawer-theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          {isAuth ? (
            <button className="drawer-logout" onClick={handleLogout}>Log out</button>
          ) : (
            <div className="drawer-auth">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;