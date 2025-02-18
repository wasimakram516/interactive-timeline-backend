const express = require("express");
const {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} = require("../controllers/programController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// ✅ Accepts a single media file + optional infographic
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([{ name: "media", maxCount: 1 }, { name: "infographic", maxCount: 1 }]),
  createProgram
);
router.get("/", getPrograms);
router.get("/:id", getProgramById);
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([{ name: "media", maxCount: 1 }, { name: "infographic", maxCount: 1 }]),
  updateProgram
);
router.delete("/:id", protect, adminOnly, deleteProgram);

module.exports = router;
