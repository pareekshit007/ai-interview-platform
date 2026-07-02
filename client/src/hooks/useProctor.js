import { useCallback, useEffect, useRef, useState } from "react";

const MAX_VIOLATIONS = 3;

/**
 * Strict proctoring for the resume-based interview:
 * - Enforces fullscreen; exiting counts as a violation and re-prompts
 * - Detects tab switches / window blur (visibilitychange + blur)
 * - Blocks copy, cut, paste, and right-click context menu
 * - After MAX_VIOLATIONS violations, calls onTerminate() once (auto-submit + flag)
 *
 * active: set true only once the candidate has entered fullscreen and the
 * interview has actually started — avoids false violations on the setup screen.
 */
const useProctor = ({ active, onTerminate }) => {
  const [violations, setViolations] = useState(0);
  const [log, setLog] = useState([]);
  const [warning, setWarning] = useState(null); // { reason } | null
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminatedRef = useRef(false);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  const recordViolation = useCallback((reason) => {
    if (!activeRef.current || terminatedRef.current) return;
    setViolations((v) => {
      const next = v + 1;
      setLog((l) => [...l, `${new Date().toLocaleTimeString()} — ${reason}`]);
      setWarning({ reason, count: next });
      if (next >= MAX_VIOLATIONS && !terminatedRef.current) {
        terminatedRef.current = true;
        onTerminate?.({ violations: next, reason: "Too many proctoring violations" });
      }
      return next;
    });
  }, [onTerminate]);

  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      // Some browsers/environments block this silently — non-fatal
    }
  }, []);

  const dismissWarning = useCallback(() => setWarning(null), []);

  useEffect(() => {
    const onFsChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && activeRef.current) recordViolation("Exited fullscreen mode");
    };
    const onVisibility = () => {
      if (document.hidden && activeRef.current) recordViolation("Switched away from the interview tab");
    };
    const onBlur = () => {
      if (activeRef.current) recordViolation("Window lost focus");
    };
    const blockEvent = (label) => (e) => {
      if (!activeRef.current) return;
      e.preventDefault();
      recordViolation(label);
    };
    const onCopy       = blockEvent("Attempted to copy content");
    const onCut         = blockEvent("Attempted to cut content");
    const onPaste       = blockEvent("Attempted to paste content");
    const onContextMenu = blockEvent("Attempted to open right-click menu");

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [recordViolation]);

  // Leave fullscreen automatically when proctoring stops (interview ends)
  useEffect(() => {
    if (!active && (document.fullscreenElement || document.webkitFullscreenElement)) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [active]);

  return {
    violations, log, warning, isFullscreen,
    maxViolations: MAX_VIOLATIONS,
    requestFullscreen, dismissWarning,
  };
};

export default useProctor;