const express = require("express");
const {
  createTimeline,
  getTimelines,
  getTimelineById,
  updateTimeline,
  deleteTimeline,
} = require("../controllers/timelineController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createTimeline);    // Admin Only
router.get("/", getTimelines);                          // Public (View Timeline)
router.get("/:id", getTimelineById);                    // Public (View Single Event)
router.put("/:id", protect, adminOnly, updateTimeline); // Admin Only
router.delete("/:id", protect, adminOnly, deleteTimeline); // Admin Only

module.exports = router;
