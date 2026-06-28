import { useEffect, useState } from "react";
import {
  getGlobalLeaderboard,
  getTopicLeaderboard,
  getMyRank,
} from "../services/leaderboardService.js";
import Loader from "../components/common/Loader.jsx";
import "../styles/leaderboard.css";

const TOPICS = [
  "All",
  "Frontend",
  "Backend",
  "Full Stack",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Android",
  "iOS",
  "System Design",
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRankData, setMyRankData] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── fetch leaderboard whenever topic changes ──────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [boardData, rankData] = await Promise.all([
          selectedTopic === "All"
            ? getGlobalLeaderboard()
            : getTopicLeaderboard(selectedTopic),
          getMyRank(),
        ]);

        setLeaderboard(boardData.data || []);
        setMyRankData(rankData);
      } catch (err) {
        console.error(err);
        setError("Failed to load leaderboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTopic]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const getInitials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="leaderboard-page">
      {/* ── header ── */}
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">
          <span className="trophy-icon">🏆</span> Leaderboard
        </h1>
        <p className="leaderboard-subtitle">
          See how you stack up against other candidates
        </p>
      </div>

      {/* ── my rank card ── */}
      {myRankData && myRankData.myRank && (
        <div className="my-rank-card">
          <div className="my-rank-left">
            <span className="my-rank-label">Your Global Rank</span>
            <span className="my-rank-number">#{myRankData.myRank}</span>
            <span className="my-rank-total">
              out of {myRankData.totalParticipants} participants
            </span>
          </div>
          <div className="my-rank-stats">
            <div className="rank-stat">
              <span className="rank-stat-value">{myRankData.me?.totalScore ?? 0}</span>
              <span className="rank-stat-label">Total Score</span>
            </div>
            <div className="rank-stat">
              <span className="rank-stat-value">{myRankData.me?.avgScore ?? 0}</span>
              <span className="rank-stat-label">Avg Score</span>
            </div>
            <div className="rank-stat">
              <span className="rank-stat-value">{myRankData.me?.interviewCount ?? 0}</span>
              <span className="rank-stat-label">Interviews</span>
            </div>
          </div>
        </div>
      )}

      {/* ── no rank yet ── */}
      {myRankData && !myRankData.myRank && (
        <div className="no-rank-card">
          <span>🎯</span>
          <p>Complete at least one interview to appear on the leaderboard!</p>
        </div>
      )}

      {/* ── topic filter ── */}
      <div className="topic-filter">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            className={`topic-btn ${selectedTopic === topic ? "active" : ""}`}
            onClick={() => setSelectedTopic(topic)}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* ── table ── */}
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="leaderboard-error">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          <p>No data yet for this topic. Be the first to complete an interview!</p>
        </div>
      ) : (
        <div className="leaderboard-table-wrapper">
          {/* ── podium (top 3) ── */}
          {leaderboard.length >= 3 && (
            <div className="podium">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map(
                (user, podiumPos) => {
                  const actualRank = podiumPos === 1 ? 1 : podiumPos === 0 ? 2 : 3;
                  const heightClass =
                    actualRank === 1
                      ? "podium-first"
                      : actualRank === 2
                      ? "podium-second"
                      : "podium-third";
                  return (
                    <div key={user.userId} className={`podium-item ${heightClass}`}>
                      <div className="podium-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <span>{getInitials(user.name)}</span>
                        )}
                        <span className="podium-medal">{MEDALS[actualRank - 1]}</span>
                      </div>
                      <p className="podium-name">{user.name}</p>
                      <p className="podium-score">{user.totalScore} pts</p>
                      <div className="podium-block" />
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* ── full table ── */}
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Total Score</th>
                <th>Avg Score</th>
                <th>Best Score</th>
                <th>Interviews</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr
                  key={user.userId}
                  className={
                    myRankData?.me?.userId === user.userId
                      ? "my-row"
                      : ""
                  }
                >
                  <td className="rank-cell">
                    {user.rank <= 3 ? (
                      <span className="medal">{MEDALS[user.rank - 1]}</span>
                    ) : (
                      <span className="rank-num">{user.rank}</span>
                    )}
                  </td>
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <span>{getInitials(user.name)}</span>
                        )}
                      </div>
                      <span className="user-name">{user.name}</span>
                      {myRankData?.me?.userId === user.userId && (
                        <span className="you-badge">You</span>
                      )}
                    </div>
                  </td>
                  <td className="score-cell">{user.totalScore}</td>
                  <td>{user.avgScore}</td>
                  <td>{user.bestScore}</td>
                  <td>{user.interviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}