import { useEffect, useRef, useState } from "react";

const Timer = ({ duration, questionIndex, onTimeUp }) => {
  const [time, setTime]     = useState(duration);
  const firedRef            = useRef(false);

  // Reset timer + fired-guard on every new question
  useEffect(() => {
    setTime(duration);
    firedRef.current = false;
  }, [questionIndex, duration]);

  useEffect(() => {
    if (time <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeUp();
      }
      return;
    }
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [time]);               // ← onTimeUp intentionally excluded to prevent re-fires

  const percentage = (time / duration) * 100;

  return (
    <div className="timer-card">
      <div className="timer-label">TIME LEFT</div>
      <div className={`timer-time ${time <= 10 ? "danger" : ""}`}>
        {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
      </div>
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${percentage}%` }} />
      </div>
      {time <= 10 && <span className="timer-warning">Hurry up!</span>}
    </div>
  );
};

export default Timer;