import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const isProduction = process.env.NODE_ENV === "production";

export async function checkCookies(req, res, next) {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Enforce single active concurrent session for admin users
    if (decoded.role === "admin") {
      const admin = await Admin.findOne({ username: decoded.sub });
      if (!admin || !admin.currentSessionId || admin.currentSessionId !== decoded.sessionId) {
        res.clearCookie("token", {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
        });
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Your session has ended because this admin account was logged in from another browser or device."
        });
      }
    }

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  return next();
}


