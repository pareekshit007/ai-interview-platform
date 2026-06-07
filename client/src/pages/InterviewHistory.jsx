import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHistory } from "../services/interviewService";
import Loader from "../components/common/Loader";
import "../styles/interviewHistory.css";

const InterviewHistory = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [stats, setStats] = useState({ total:0, avgScore:0, bestRole:"—", lastDate:"—" });

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setInterviews(data);
        if (!data.length) return;
        const total = data.length;
        const avgScore = Math.round(data.reduce((s,i)=>s+i.totalScore,0)/total);
        const roleMap = {};
        data.forEach(i=>{ roleMap[i.role]=roleMap[i.role]||[]; roleMap[i.role].push(i.totalScore); });
        let bestRole="—", bestAvg=0;
        Object.keys(roleMap).forEach(r=>{ const avg=roleMap[r].reduce((a,b)=>a+b,0)/roleMap[r].length; if(avg>bestAvg){bestAvg=avg;bestRole=r;} });
        const lastDate = new Date(data[0].createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
        setStats({ total, avgScore, bestRole, lastDate });
      })
      .catch(err=>setError(err.message||"Failed to load history"))
      .finally(()=>setLoading(false));
  }, []);

  return (
    <div className="history-page">
      {loading&&<Loader text="Loading history..."/>}
      <div className="history-hero"><h1>Interview History</h1><p>Track all your previous attempts</p></div>
      <div className="history-stats-cards">
        {[{label:"Total Interviews",value:stats.total,icon:"📝"},{label:"Average Score",value:`${stats.avgScore}%`,icon:"📊"},
          {label:"Best Role",value:stats.bestRole,icon:"🎯"},{label:"Last Interview",value:stats.lastDate,icon:"📅"}]
          .map((s,i)=>(
            <div key={i} className="dashboard-card primary stat-card">
              <div className="stat-icon">{s.icon}</div><h2>{s.value}</h2><p>{s.label}</p>
            </div>
          ))}
      </div>
      <div className="history-card glass-card">
        <div className="history-table-head">
          <span>Role</span><span>Difficulty</span><span>Date</span><span>Score</span><span>Verdict</span><span>Action</span>
        </div>
        {error&&<p className="error-state">{error}</p>}
        {!loading&&!interviews.length&&!error&&<p className="empty-state">No interviews yet — start your first AI interview 🚀</p>}
        {interviews.map(item=>(
          <div key={item._id} className="history-table-row">
            <span>{item.role}</span>
            <span>{item.difficulty}</span>
            <span>{new Date(item.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
            <span className="score">{item.totalScore}%</span>
            <span className={`verdict ${item.verdict?.toLowerCase().replace(" ","-")||""}`}>{item.verdict}</span>
            <button onClick={()=>navigate(`/interview/${item._id}`)}>View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewHistory;