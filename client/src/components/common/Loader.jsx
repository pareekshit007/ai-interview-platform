import "../../styles/loader.css";

const Loader = ({ text = "AI is thinking..." }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-card">
        <div className="ai-spinner"></div>
        <p className="loader-text">{text}</p>
      </div>
    </div>
  );
};

export default Loader;
