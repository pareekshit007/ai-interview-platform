import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token  = localStorage.getItem("token");
  const isAuth = localStorage.getItem("isAuthenticated");
  return token && isAuth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;