const User = require("../models/User");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { successResponse, errorResponse } = require("../utils/response");

// Generate Access & Refresh Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign({ id: user._id }, env.jwt.secret, {
    expiresIn: env.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
};

// Register Admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return errorResponse(res, "User already exists", {}, 400);

    user = new User({ name, email, password, role: "admin" });
    await user.save();

    return successResponse(res, "Admin registered successfully", { user });
  } catch (error) {
    return errorResponse(res, "Error registering admin", error, 500);
  }
};

// Login & Set Refresh Token in Cookie
exports.login = async (req, res) => {
    try {
      const email = req.body.email.toLowerCase(); // Normalize email
      const password = req.body.password;
      
      const user = await User.findOne({ email });
  
      if (!user || !(await user.comparePassword(password))) {
        return errorResponse(res, "Invalid credentials", {}, 401);
      }
  
      const { accessToken, refreshToken } = generateTokens(user);
  
      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.node_env === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
  
      return successResponse(res, "Login successful", { accessToken, user });
    } catch (error) {
      return errorResponse(res, "Error logging in", error, 500);
    }
  };
  
// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return errorResponse(res, "No refresh token provided", {}, 401);

    jwt.verify(refreshToken, env.jwt.secret, (err, decoded) => {
      if (err) return errorResponse(res, "Invalid refresh token", {}, 403);

      const newAccessToken = jwt.sign({ id: decoded.id }, env.jwt.secret, {
        expiresIn: env.jwt.accessExpiry,
      });

      return successResponse(res, "Token refreshed", { accessToken: newAccessToken });
    });
  } catch (error) {
    return errorResponse(res, "Error refreshing token", error, 500);
  }
};
