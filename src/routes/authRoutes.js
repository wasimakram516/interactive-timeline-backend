const express = require("express");
const {
  registerAdmin,
  login,
  refreshToken
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerAdmin); // Admin Registration
router.post("/login", login); // Login & Issue Tokens
router.get("/refresh-token", refreshToken); // Refresh Access Token

module.exports = router;
