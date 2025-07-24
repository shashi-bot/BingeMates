import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { sendOtp } from "../utils/sendOtp.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already registered." });
    }

    await PendingUser.deleteOne({ email }); // Clear stale entries
   
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = await sendOtp(email);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const pending = new PendingUser({
      fullName,
      email,
      password: hashedPassword,
      phone,
      otp,
      otpExpiresAt,
    });

    await pending.save();
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed." });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const pending = await PendingUser.findOne({ email });

    if (!pending) return res.status(400).json({ message: "No pending registration." });
    if (pending.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });
    if (pending.otpExpiresAt < new Date())
      return res.status(400).json({ message: "OTP expired." });

    const user = new User({
      fullName: pending.fullName,
      email: pending.email,
      password: pending.password,
      phone: pending.phone,
    });

    await user.save();
    await PendingUser.deleteOne({ email });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const { _id, fullName, email: verifiedEmail, phone } = user;
    res.status(200).json({
      token,
      user: { _id, fullName, email: verifiedEmail, phone },
      message: "Email verified. Logged in.",
    });
  } catch (err) {
    console.error("OTP Verification error:", err);
    res.status(500).json({ message: "OTP verification failed." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "No such user." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Incorrect password." });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

   const { _id, fullName, phone } = user;
    res.status(200).json({
      token,
      user: { _id, fullName, email, phone },
      message: "Login successful.",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed." });
  }
};
export const resendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required." });
  
      const pending = await PendingUser.findOne({ email });
      if (!pending) return res.status(400).json({ message: "No pending registration found." });
  
      const otp = await sendOtp(email); // same helper you already use
      pending.otp = otp;
      pending.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await pending.save();
  
      res.status(200).json({ message: "OTP resent to your email." });
    } catch (err) {
      console.error("Resend OTP error:", err);
      res.status(500).json({ message: "Could not resend OTP." });
    }
  };
