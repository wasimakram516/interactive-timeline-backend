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

// ✅ Accept multiple files under field name "files"
router.post("/", protect, adminOnly, upload.array("files", 5), createTimeline);
router.get("/", getTimelines);
router.get("/:id", getTimelineById);
router.put("/:id", protect, adminOnly, upload.array("files", 5), updateTimeline);
router.delete("/:id", protect, adminOnly, deleteTimeline);

module.exports = router;
