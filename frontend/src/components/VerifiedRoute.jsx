import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const VerifiedRoute = ({ children }) => {
  const { isPendingVerification } = useUser();
  return isPendingVerification ? children : <Navigate to="/register" />;
};

export default VerifiedRoute;
