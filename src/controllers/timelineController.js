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

// ✅ Create a new timeline event
exports.createTimeline = asyncHandler(async (req, res) => {
  let { year, xPosition, yPosition, description } = req.body;

  if (!year || xPosition === undefined || yPosition === undefined) {
    return response(res, 400, "Year, xPosition, and yPosition are required.");
  }

  if (typeof description === "string") {
    try {
      description = JSON.parse(description); // Convert JSON string to array
    } catch (error) {
      return response(
        res,
        400,
        "Invalid description format. Must be an array of strings."
      );
    }
  }

  if (description && !Array.isArray(description)) {
    return response(res, 400, "Description must be an array of strings.");
  }

  if (await Timeline.exists({ year })) {
    return response(
      res,
      400,
      `A timeline event for the year ${year} already exists.`
    );
  }

  let media = null;
  let infographic = null;

 // ✅ Process media file (only one allowed)
if (req.files?.media) {
  const uploadedFile = await uploadToCloudinary(
    req.files.media[0].buffer,
    req.files.media[0].mimetype,
    "media" // ✅ Pass "media" for media uploads
  );
  media = {
    url: uploadedFile.secure_url,
    type: uploadedFile.resource_type,
  };
}

// ✅ Process infographic file (if uploaded)
if (req.files?.infographic) {
  const uploadedInfographic = await uploadToCloudinary(
    req.files.infographic[0].buffer,
    req.files.infographic[0].mimetype,
    "infographics" // ✅ Pass "infographic" for infographic uploads
  );
  infographic = { url: uploadedInfographic.secure_url };
}

  const timeline = await Timeline.create({
    year,
    xPosition,
    yPosition,
    description,
    media,
    infographic,
  });

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 201, "Timeline event created successfully.", timeline);
});

// ✅ Update timeline event
exports.updateTimeline = asyncHandler(async (req, res) => {
  const { year, xPosition, yPosition, description } = req.body;
  const timeline = await Timeline.findById(req.params.id);

  if (!timeline) {
    return response(res, 404, "Timeline event not found.");
  }

  if (typeof description === "string") {
    try {
      description = JSON.parse(description); // Convert JSON string to array
    } catch (error) {
      return response(
        res,
        400,
        "Invalid description format. Must be an array of strings."
      );
    }
  }

  let updatedMedia = timeline.media;
  let updatedInfographic = timeline.infographic;

  // ✅ Handle media update (if a new file is uploaded)
  if (req.files?.media) {
    if (timeline.media?.url && typeof timeline.media.url === "string") {
      await deleteImage(timeline.media.url);
    }

    const uploadedFile = await uploadToCloudinary(
      req.files.media[0].buffer,
      req.files.media[0].mimetype,
      "media"
    );
    updatedMedia = {
      url: uploadedFile.secure_url,
      type: uploadedFile.resource_type,
    };
  }

  // ✅ Handle infographic update (if a new infographic is uploaded)
  if (req.files?.infographic) {
    // ✅ Delete infographic from Cloudinary if exists
    if (
      timeline.infographic?.url &&
      typeof timeline.infographic.url === "string"
    ) {
      await deleteImage(timeline.infographic.url);
    }

    const uploadedInfographic = await uploadToCloudinary(
      req.files.infographic[0].buffer,
      req.files.infographic[0].mimetype,
      "infographics"
    );
    updatedInfographic = { url: uploadedInfographic.secure_url };
  }

  timeline.year = year ?? timeline.year;
  timeline.xPosition = xPosition ?? timeline.xPosition;
  timeline.yPosition = yPosition ?? timeline.yPosition;
  timeline.description = description ?? timeline.description;
  timeline.media = updatedMedia;
  timeline.infographic = updatedInfographic;

  await timeline.save();

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 200, "Timeline event updated successfully.", timeline);
});

// ✅ Get all timeline events
exports.getTimelines = asyncHandler(async (req, res) => {
  const timelines = await Timeline.find().sort({ year: 1 });

  if (!timelines.length) {
    return response(res, 200, "No timeline events found.");
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

  // ✅ Delete media from Cloudinary if exists
  if (timeline.media?.url && typeof timeline.media.url === "string") {
    await deleteImage(timeline.media.url);
  }

  // ✅ Delete infographic from Cloudinary if exists
  if (
    timeline.infographic?.url &&
    typeof timeline.infographic.url === "string"
  ) {
    await deleteImage(timeline.infographic.url);
  }

  await timeline.deleteOne();

  await emitTimelineUpdate(); // ✅ Emit updated timeline data

  return response(res, 200, "Timeline event deleted successfully.");
});
