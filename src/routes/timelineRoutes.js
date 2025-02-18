const express = require("express");
const {
  createTimeline,
  getTimelines,
  getTimelineById,
  updateTimeline,
  deleteTimeline,
} = require("../controllers/timelineController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// ✅ Accepts a single media file + optional infographic
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([{ name: "media", maxCount: 1 }, { name: "infographic", maxCount: 1 }]),
  createTimeline
);
router.get("/", getTimelines);
router.get("/:id", getTimelineById);
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([{ name: "media", maxCount: 1 }, { name: "infographic", maxCount: 1 }]),
  updateTimeline
);
router.delete("/:id", protect, adminOnly, deleteTimeline);

module.exports = router;
