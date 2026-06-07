import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Contact from "./pages/Contact";
import Roles from "./pages/Roles";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewRoom from "./pages/InterviewRoom";
import ScoreCard from "./pages/ScoreCard";
import Feedback from "./pages/Feedback";
import InterviewHistory from "./pages/InterviewHistory";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const isAuth = localStorage.getItem("isAuthenticated");
  return token && isAuth ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes — redirect to dashboard if already logged in */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute><Signup /></PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/roles" element={
          <ProtectedRoute><Roles /></ProtectedRoute>
        } />
        <Route path="/interview-setup/:role" element={
          <ProtectedRoute><InterviewSetup /></ProtectedRoute>
        } />
        <Route path="/interview-room/:role" element={
          <ProtectedRoute><InterviewRoom /></ProtectedRoute>
        } />
        <Route path="/interview-history" element={
          <ProtectedRoute><InterviewHistory /></ProtectedRoute>
        } />
        <Route path="/scorecard/:role" element={
          <ProtectedRoute><ScoreCard /></ProtectedRoute>
        } />
        <Route path="/feedback/:role" element={
          <ProtectedRoute><Feedback /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Catch all — redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;