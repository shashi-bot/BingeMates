import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";
import VerifyEmail from "./pages/VerifyEmail";
import PrivateRoute from "./components/PrivateRoute";
import VerifiedRoute from "./components/VerifiedRoute";
import { useUser } from "./context/UserContext";
import { Navigate } from "react-router-dom";

function App() {
  const { user } = useUser();
  return (
    <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/verify"
        element={
          <VerifiedRoute>
            <VerifyEmail />
          </VerifiedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
         <PrivateRoute>
            <Dashboard />
       </PrivateRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <PrivateRoute>
            <Room />
            </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
