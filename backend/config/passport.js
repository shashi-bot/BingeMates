import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) return done(null, existingUser);

        const newUser = await User.create({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          password: "google", // not applicable
          phone: "",    // optional
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
