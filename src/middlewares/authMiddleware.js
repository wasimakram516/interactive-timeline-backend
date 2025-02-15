const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { errorResponse } = require("../utils/response");

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return errorResponse(res, "Unauthorized - No token provided", {}, 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, "Unauthorized - Invalid token", {}, 401);
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return errorResponse(res, "Forbidden - Admins only", {}, 403);
  }
  next();
};
