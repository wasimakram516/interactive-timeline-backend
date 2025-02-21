const express = require("express");
const {
  createProgram,
  updateProgram,
  deleteProgram,
  addEntryToProgram,
  updateEntryInProgram,
  deleteEntryFromProgram,
  getPrograms,
  getProgramById,
} = require("../controllers/programController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

/**
 * ✅ **Program Routes**
 */
router.post("/", protect, adminOnly, createProgram); // Create a new program (no entries)
router.put("/:id", protect, adminOnly, updateProgram); // Update program (title, x/y positions)
router.delete("/:id", protect, adminOnly, deleteProgram); // Delete program (removes all entries)

/**
 * ✅ **Entries Routes (Under a Specific Program)**
 */
router.post(
  "/:id/entries",
  protect,
  adminOnly,
  upload.fields([
    { name: "media", maxCount: 5 }, // Upload up to 5 media files
    { name: "infographic", maxCount: 5 }, // Upload up to 5 infographic images
  ]),
  addEntryToProgram
); // Add a new entry under a program

router.put(
  "/:id/entries/:entryId", // Updated to use entryId
  protect,
  adminOnly,
  upload.fields([
    { name: "media", maxCount: 5 },
    { name: "infographic", maxCount: 5 },
  ]),
  updateEntryInProgram
); // Update an entry under a program

router.delete("/:id/entries/:entryId", protect, adminOnly, deleteEntryFromProgram); // Delete an entry under a program

/**
 * ✅ **Fetch Program Data**
 */
router.get("/", getPrograms); // Get all programs with entries
router.get("/:id", getProgramById); // Get a single program with its entries

module.exports = router;