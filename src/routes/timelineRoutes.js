const express = require("express");
const {
  createTimeline,
  updateTimelineYear,
  deleteTimeline,
  addEntryToTimeline,
  updateEntryInTimeline,
  deleteEntryFromTimeline,
  getTimelines,
  getTimelineById,
} = require("../controllers/timelineController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

/**
 * ✅ **Timeline Year Routes**
 */
router.post("/", protect, adminOnly, createTimeline); // Create a new year (no entries)
router.put("/:id", protect, adminOnly, updateTimelineYear); // Update year (change year, x/y positions)
router.delete("/:id", protect, adminOnly, deleteTimeline); // Delete year (removes all entries)

/**
 * ✅ **Entries Routes (Under a Specific Year)**
 */
router.post(
  "/:id/entries",
  protect,
  adminOnly,
  upload.fields([
    { name: "media", maxCount: 5 }, // Upload up to 5 media files
    { name: "infographic", maxCount: 5 }, // Upload up to 5 infographic images
  ]),
  addEntryToTimeline
); // Add a new entry under a year

router.put(
  "/:id/entries/:entryId",
  protect,
  adminOnly,
  upload.fields([
    { name: "media", maxCount: 5 },
    { name: "infographic", maxCount: 5 },
  ]),
  updateEntryInTimeline
); // Update an entry under a year

router.delete("/:id/entries/:entryId", protect, adminOnly, deleteEntryFromTimeline); // Delete an entry under a year

/**
 * ✅ **Fetch Timeline Data**
 */
router.get("/", getTimelines); // Get all years with entries
router.get("/:id", getTimelineById); // Get a single year with its entries

module.exports = router;
