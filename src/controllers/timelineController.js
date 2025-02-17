const Timeline = require("../models/Timeline");
const response = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const asyncHandler = require("../middlewares/asyncHandler");

let io; // ✅ Declare `io` globally but initialize it later

// ✅ Function to initialize WebSocket (called from server.js)
exports.setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// ✅ Function to emit updated timeline data
const emitTimelineUpdate = async () => {
  try {
    if (!io) throw new Error("WebSocket instance (io) is not initialized.");
    
    const timelines = await Timeline.find().sort({ year: 1 });
    io.emit("timelineUpdate", timelines);
  } catch (error) {
    console.error("❌ Failed to emit timeline update:", error.message);
  }
};

// ✅ Create a new timeline event with multiple media
exports.createTimeline = asyncHandler(async (req, res) => {
  let { year, description } = req.body;

  if (!year || !description) {
    return response(res, 400, "Year and description are required.");
  }

  if (typeof description === "string") {
    try {
      description = JSON.parse(description); // Convert JSON string to array
    } catch (error) {
      return response(res, 400, "Invalid description format. Must be an array of strings.");
    }
  }
  
  if (!Array.isArray(description)) {
    return response(res, 400, "Description must be an array of strings.");
  }

  if (await Timeline.exists({ year })) {
    return response(res, 400, `A timeline event for the year ${year} already exists.`);
  }

  let media = [];

  // ✅ Process multiple media files
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(async (file) => {
      const uploadedFile = await uploadToCloudinary(file.buffer, file.mimetype);
      return {
        url: uploadedFile.secure_url,
        type: uploadedFile.resource_type,
      };
    });

    media = await Promise.all(uploadPromises);
  }

  const timeline = await Timeline.create({
    year,
    description,
    media, // ✅ Stores multiple media files
  });

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 201, "Timeline event created successfully.", timeline);
});

// ✅ Update timeline event with multiple media
exports.updateTimeline = asyncHandler(async (req, res) => {
  const { year, description } = req.body;
  const timeline = await Timeline.findById(req.params.id);

  if (!timeline) {
    return response(res, 404, "Timeline event not found.");
  }

  if (typeof description === "string") {
    try {
      description = JSON.parse(description); // Convert JSON string to array
    } catch (error) {
      return response(res, 400, "Invalid description format. Must be an array of strings.");
    }
  }
  

  if (req.files && req.files.length > 0) {
    // ✅ Delete old media before updating
    for (const mediaItem of timeline.media) {
      await deleteImage(mediaItem.url);
    }

    // ✅ Upload new media
    const uploadPromises = req.files.map(async (file) => {
      const uploadedFile = await uploadToCloudinary(file.buffer, file.mimetype);
      return {
        url: uploadedFile.secure_url,
        type: uploadedFile.resource_type,
      };
    });

    timeline.media = await Promise.all(uploadPromises);
  }

  timeline.year = year ?? timeline.year;
  timeline.description = description ?? timeline.description;
  await timeline.save();

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 200, "Timeline event updated successfully.", timeline);
});

// ✅ Get all timeline events
exports.getTimelines = asyncHandler(async (req, res) => {
  const timelines = await Timeline.find().sort({ year: 1 });

  if (!timelines.length) {
    return response(res, 404, "No timeline events found.");
  }

  return response(res, 200, "Timeline events fetched successfully.", timelines);
});

// ✅ Get a single timeline event
exports.getTimelineById = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline event not found.");
  }

  return response(res, 200, "Timeline event retrieved successfully.", timeline);
});

// ✅ Delete a timeline event
exports.deleteTimeline = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline event not found.");
  }

  if (timeline.media?.url) {
    await deleteImage(timeline.media.url);
  }

  await timeline.deleteOne();

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 200, "Timeline event deleted successfully.");
});
