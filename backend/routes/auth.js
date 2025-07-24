import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, verifyOTP ,login,resendOTP} from "../controllers/authController.js";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config();
// Existing routes
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login",login );
router.post("/resend-otp", resendOTP);
// 🔐 Google OAuth login route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 🔁 Google OAuth callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const userPayload = encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
      }));
  
      res.redirect(`${process.env.CLIENT_ORIGIN}/login?token=${token}&user=${userPayload}`);
    }
);

export default router;
