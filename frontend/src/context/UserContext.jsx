// UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [user, setUser] = useState(null); // ✅ add this
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("recentRooms");
  };

  const markPendingVerification = () => {
    setIsAuthenticated(false);
    setIsPendingVerification(true);
  };

  return (
    <UserContext.Provider
      value={{
        isAuthenticated,
        isPendingVerification,
        login,
        logout,
        markPendingVerification,
        user, // ✅ expose this
        loading, // ✅ add this
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
