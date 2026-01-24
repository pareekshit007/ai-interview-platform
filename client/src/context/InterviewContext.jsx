import { createContext, useContext, useState } from "react";

const InterviewContext = createContext();

const QUESTIONS = [
  "Tell me about yourself",
  "What are your strengths?",
  "Explain a challenging project you worked on",
  "Why should we hire you?",
];

export const InterviewProvider = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [finished, setFinished] = useState(false);

  const nextQuestion = (answer, score) => {
    setAnswers((a) => [...a, answer]);
    setScores((s) => [...s, score]);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  // 🔴 RESET FUNCTION (IMPORTANT)
  const resetInterview = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setScores([]);
    setFinished(false);
  };

  return (
    <InterviewContext.Provider
      value={{
        QUESTIONS,
        currentIndex,
        finished,
        nextQuestion,
        resetInterview, // ✅ expose reset
        answers,
        scores,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);
