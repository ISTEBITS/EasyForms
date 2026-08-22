import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getCookieOptions, matchPassword } from "../utils/auth.utilities.js";
import Admin from "../models/Admin.js";
import { hashPassword } from "../utils/auth.utilities.js";
import TestUser from "../models/TestUser.js";
import TestUserActivity from "../models/TestUserActivity.js";
import { verifyGoogleIdentity } from "../utils/googleAuth.js";
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.NODE_ENV === 'production')
const isProduction = process.env.NODE_ENV === "production";


export async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.json({ message: "Username and password fields are required" });

    const admin = await Admin.findOne({ username: username });
    if(!admin) return res.status(401).json({success: false,message: 'Invalid Credentials'})
    const hashedPassword = admin.password;
    const isMatched = await matchPassword(password, hashedPassword);
    if (!isMatched)
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });

    const sessionId = crypto.randomUUID();
    admin.currentSessionId = sessionId;
    await admin.save();

    const token = jwt.sign(
      { sub: username, role: "admin", sessionId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );
    res.cookie("token", token, getCookieOptions());
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log("Error at Auth.js : ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export function handleVerify(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

export async function handleLogout(req, res) {
  try {
    if (req.user?.role === "admin" && req.user?.sub) {
      await Admin.updateOne({ username: req.user.sub }, { $set: { currentSessionId: null } });
    }
  } catch (err) {
    console.error("Error clearing admin session on logout:", err.message);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({ success: true });
}

export async function handleRegister(req, res) {
  try {
    const { username, password, registrationSecret } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and Password fields are required" });
    }

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      const secretHeader = req.headers['x-admin-register-secret'] || registrationSecret;
      const expectedSecret = process.env.ADMIN_REGISTER_SECRET;
      if (!expectedSecret || secretHeader !== expectedSecret) {
        return res.status(403).json({ message: "Admin registration is disabled." });
      }
    }

    const hashedPassword = await hashPassword(password);
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
    });
    await newAdmin.save();
    return res.status(201).json({ message: "Admin Created !" });
  } catch (error) {
    console.log("Error while Registering : ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function handleTestGoogleAuth(req, res) {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Google token is required" });
    }

    const identity = await verifyGoogleIdentity(idToken);
    if (!identity) {
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    const now = new Date();
    const testUser = await TestUser.findOneAndUpdate(
      { googleSub: identity.sub },
      {
        $set: {
          email: identity.email,
          name: identity.name || "",
          picture: identity.picture || "",
          lastLoginAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const token = jwt.sign(
      {
        sub: identity.email,
        role: "test_user",
        testUserId: String(testUser._id),
        email: identity.email,
        name: identity.name || "",
        picture: identity.picture || "",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.cookie("token", token, getCookieOptions());

    await TestUserActivity.create({
      testUserId: testUser._id,
      email: identity.email,
      action: "auth.login",
      metadata: {
        provider: "google",
      },
      createdAt: now,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while Google test login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
