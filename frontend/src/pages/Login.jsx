import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUser();

  // ✅ Google OAuth handling
  useEffect(() => {
    const tokenFromURL = new URLSearchParams(window.location.search).get("token");
    const userFromURL = new URLSearchParams(window.location.search).get("user");

    if (tokenFromURL && userFromURL) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userFromURL));
        localStorage.setItem("token", tokenFromURL);
        localStorage.setItem("user", JSON.stringify(parsedUser));
        login(parsedUser, tokenFromURL);
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to parse user from URL", error);
      }
    }
  }, []);

  // ✅ Email/password login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { user, token } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      login(user, token);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data?.message || err.message);
      alert("Invalid credentials. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4 sm:px-6">
      <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-10">

        <h1 className="text-4xl font-bold text-center mb-4 sm:mb-6" style={{ color: "#94AC02" }}>
          BingeMates
        </h1>

        <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
          Sign in to continue
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 sm:py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 sm:py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />
          <button
            type="submit"
            className="w-full bg-[#94AC02] hover:bg-[#7e9502] text-white py-2.5 sm:py-3 rounded-lg font-semibold shadow-md transition duration-300"
          >
            Log In
          </button>
        </form>

        <div className="my-5 sm:my-6 text-center text-gray-500 text-sm">OR</div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-gray-200 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="h-5 w-5"
          />
          <span className="font-medium text-sm sm:text-base">
            Log in with Google
          </span>
        </button>

        <p className="text-xs sm:text-sm text-center text-gray-500 mt-6">
          Don’t have an account?{" "}
          <a href="/register" className="text-[#94AC02] hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
