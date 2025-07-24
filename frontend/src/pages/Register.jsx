import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Register = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { markPendingVerification } = useUser();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreedToTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      alert("You must agree to the terms to register.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }
     // Save data for OTP verification
localStorage.setItem("pendingUser", JSON.stringify(formData));


      // Mark user as pending verification
      markPendingVerification();
      navigate("/verify");
    } catch (err) {
      console.error("Registration error:", err.message);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-6" style={{ color: "#94AC02" }}>
          BingeMates
        </h1>
        <p className="text-center text-gray-400 mb-6">Create your account</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            required
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone (optional)"
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
          />

          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
              className="accent-[#94AC02]"
            />
            I agree to the{" "}
            <a href="/terms" className="text-[#94AC02] hover:underline">
              Terms & Privacy Policy
            </a>
          </label>

          <button
            type="submit"
            className="w-full bg-[#94AC02] hover:bg-[#7e9502] text-white py-3 rounded-lg font-semibold shadow-md transition duration-300"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#94AC02] hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
