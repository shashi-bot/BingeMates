import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const VerifyEmail = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useUser();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        const pendingUser = JSON.parse(localStorage.getItem("pendingUser"));
        const email = pendingUser?.email;
        // set during registration
      if (!email) {
        setError("Missing email. Please register again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Verification failed");
        localStorage.removeItem("pendingUser");
        return;
      }
       
      localStorage.setItem("token", data.token);
      localStorage.removeItem("pendingUser"); // Clear pending user data after verification
      const { user, token } = data;
   
      login(user, token);
       
      navigate("/dashboard");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setError("");

    try {
      const email = localStorage.getItem("pendingEmail");
      if (!email) {
        setError("Missing email. Please register again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not resend OTP");
        return;
      }

      setResendMsg("OTP resent to your email.");
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#94AC02" }}>
          Verify Your Email
        </h2>
        <p className="text-sm text-center text-gray-400 mb-6">
          Please enter the OTP sent to your email.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#94AC02] hover:bg-[#7e9502] text-white py-3 rounded-lg font-semibold shadow-md transition duration-300"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Didn’t receive the code?{" "}
          <button
            type="button"
            className="text-[#94AC02] hover:underline"
            onClick={handleResend}
          >
            Resend OTP
          </button>
        </p>
        {resendMsg && <p className="text-sm text-green-400 text-center mt-2">{resendMsg}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
