import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useUser();

    if (loading) return <div className="text-white">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
