const Timeline = require("../models/Timeline");
const response = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const asyncHandler = require("../middlewares/asyncHandler");

let io;

// ✅ Initialize WebSocket
exports.setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// ✅ Emit updated timeline data
const emitTimelineUpdate = async () => {
  try {
    if (!io) throw new Error("WebSocket instance (io) is not initialized.");
    const timelines = await Timeline.find().sort({ year: 1 });
    io.emit("timelineUpdate", timelines);
  } catch (error) {
    console.error("❌ Failed to emit timeline update:", error.message);
  }
};

// ✅ Get all timeline events (Handles Empty Case)
exports.getTimelines = asyncHandler(async (req, res) => {
  const timelines = await Timeline.find().sort({ year: 1 });

  return response(
    res,
    200,
    timelines.length
      ? "Timeline events fetched successfully."
      : "No timeline events found.",
    timelines
  );
});

// ✅ Get a single timeline event
exports.getTimelineById = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline event not found.");
  }

  return response(res, 200, "Timeline event retrieved successfully.", timeline);
});

// ✅ Create a new timeline year (without entries)
exports.createTimeline = asyncHandler(async (req, res) => {
  let { year, xPosition, yPosition } = req.body;

  if (!year || xPosition === undefined || yPosition === undefined) {
    return response(res, 400, "Year, xPosition, and yPosition are required.");
  }

  if (await Timeline.exists({ year })) {
    return response(
      res,
      400,
      `A timeline event for the year ${year} already exists.`
    );
  }

  const timeline = await Timeline.create({
    year,
    xPosition,
    yPosition,
    entries: [],
  });
  await emitTimelineUpdate();
  return response(res, 201, "Timeline year created successfully.", timeline);
});

// ✅ Update timeline year (year, xPosition, yPosition)
exports.updateTimelineYear = asyncHandler(async (req, res) => {
  const { year, xPosition, yPosition } = req.body;
  const timeline = await Timeline.findById(req.params.id);

  if (!timeline) {
    return response(res, 404, "Timeline year not found.");
  }

  if (year !== undefined) timeline.year = year;
  if (xPosition !== undefined) timeline.xPosition = xPosition;
  if (yPosition !== undefined) timeline.yPosition = yPosition;

  await timeline.save();
  await emitTimelineUpdate();
  return response(res, 200, "Timeline year updated successfully.", timeline);
});

// ✅ Delete an entire timeline year (removes all entries)
exports.deleteTimeline = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline year not found.");
  }

  // ✅ Delete all media & infographics before removing the timeline event
  for (const entry of timeline.entries) {
    for (const media of entry.media) {
      await deleteImage(media.url);
    }
    for (const infographic of entry.infographics) {
      await deleteImage(infographic.url);
    }
  }

  await timeline.deleteOne();
  await emitTimelineUpdate();
  return response(res, 200, "Timeline year deleted successfully.");
});

// ✅ Add an entry to an existing year
exports.addEntryToTimeline = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline year not found.");
  }

  let {
    title,
    description,
    xPosition,
    yPosition,
    mediaXPositions,
    mediaYPositions,
    infographicXPositions,
    infographicYPositions,
  } = req.body;

  if (!title || xPosition === undefined || yPosition === undefined) {
    return response(
      res,
      400,
      "Entry must have a title, xPosition, and yPosition."
    );
  }

  try {
    description = JSON.parse(description);
  } catch (error) {
    return response(res, 400, "Invalid description format");
  }
  
  // Validate it's an array of non-empty strings
  if (!Array.isArray(description) || description.length === 0) {
    return response(res, 400, "Description must be a non-empty array");
  }

  let media = [];
  let infographics = [];

  if (req.files?.media) {
    if (
      !Array.isArray(mediaXPositions) ||
      !Array.isArray(mediaYPositions) ||
      mediaXPositions.length !== req.files.media.length
    ) {
      return response(
        res,
        400,
        "Each media file must have corresponding xPosition and yPosition."
      );
    }

    for (let index = 0; index < req.files.media.length; index++) {
      const file = req.files.media[index];
      const uploadedFile = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        "media"
      );
      media.push({
        url: uploadedFile.secure_url,
        mediaType: uploadedFile.resource_type, // Renamed from `type` to `mediaType`
        xPosition: mediaXPositions[index],
        yPosition: mediaYPositions[index],
      });
    }
  }

  if (req.files?.infographic) {
    if (
      !Array.isArray(infographicXPositions) ||
      !Array.isArray(infographicYPositions) ||
      infographicXPositions.length !== req.files.infographic.length
    ) {
      return response(
        res,
        400,
        "Each infographic must have corresponding xPosition and yPosition."
      );
    }

    for (let index = 0; index < req.files.infographic.length; index++) {
      const file = req.files.infographic[index];
      const uploadedInfographic = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        "infographics"
      );
      infographics.push({
        url: uploadedInfographic.secure_url,
        xPosition: infographicXPositions[index],
        yPosition: infographicYPositions[index],
      });
    }
  }

  const newEntry = {
    title,
    description,
    xPosition,
    yPosition,
    media,
    infographics,
  };
  timeline.entries.push(newEntry);
  await timeline.save();
  await emitTimelineUpdate();
  return response(res, 201, "Entry added successfully.", timeline);
});

// ✅ Update entry in a timeline using entry ID
exports.updateEntryInTimeline = asyncHandler(async (req, res) => {
  let {
    title,
    description,
    xPosition,
    yPosition,
    mediaXPositions,
    mediaYPositions,
    infographicXPositions,
    infographicYPositions,
  } = req.body;

  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline year not found.");
  }

  const entry = timeline.entries.id(req.params.entryId);
  if (!entry) {
    return response(res, 404, "Entry not found.");
  }

  if (title){
    entry.title = title;
  }
  
  if (description) {
    try {
      description = JSON.parse(description); // Parse JSON string to array
    } catch (error) {
      return response(res, 400, "Invalid description format");
    }

    // Validate it's an array of non-empty strings
    if (!Array.isArray(description) || description.length === 0) {
      return response(res, 400, "Description must be a non-empty array");
    }

    // Trim and filter empty lines
    entry.description = description
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // Update entry position (if provided)
  if (xPosition !== undefined) entry.xPosition = xPosition;
  if (yPosition !== undefined) entry.yPosition = yPosition;

  // ✅ Update Media Positions (if no new files are provided)
  if (!req.files?.media && mediaXPositions && mediaYPositions) {
    if (
      Array.isArray(mediaXPositions) &&
      Array.isArray(mediaYPositions) &&
      mediaXPositions.length === entry.media.length &&
      mediaYPositions.length === entry.media.length
    ) {
      entry.media.forEach((media, index) => {
        media.xPosition = Number(mediaXPositions[index]);
        media.yPosition = Number(mediaYPositions[index]);
      });
    } else {
      return response(res, 400, "Invalid media positions provided.");
    }
  }

  // ✅ Update Infographic Positions (if no new files are provided)
  if (!req.files?.infographic && infographicXPositions && infographicYPositions) {
    if (
      Array.isArray(infographicXPositions) &&
      Array.isArray(infographicYPositions) &&
      infographicXPositions.length === entry.infographics.length &&
      infographicYPositions.length === entry.infographics.length
    ) {
      entry.infographics.forEach((infographic, index) => {
        infographic.xPosition = Number(infographicXPositions[index]);
        infographic.yPosition = Number(infographicYPositions[index]);
      });
    } else {
      return response(res, 400, "Invalid infographic positions provided.");
    }
  }

  // ✅ Handle New Media Files (if provided)
  if (req.files?.media) {
    // Delete old media
    for (const media of entry.media) {
      await deleteImage(media.url);
    }

    // Clear existing media
    entry.media = [];

    // Check if positions are provided correctly
    if (
      !Array.isArray(mediaXPositions) ||
      !Array.isArray(mediaYPositions) ||
      mediaXPositions.length !== req.files.media.length ||
      mediaYPositions.length !== req.files.media.length
    ) {
      return response(res, 400, "Each media file must have a corresponding xPosition and yPosition.");
    }

    // Upload new media and assign positions
    for (let index = 0; index < req.files.media.length; index++) {
      const file = req.files.media[index];
      const uploadedFile = await uploadToCloudinary(file.buffer, file.mimetype, "media");

      entry.media.push({
        url: uploadedFile.secure_url,
        mediaType: uploadedFile.resource_type,
        xPosition: Number(mediaXPositions[index]),
        yPosition: Number(mediaYPositions[index]),
      });
    }
  }

  // ✅ Handle New Infographic Files (if provided)
  if (req.files?.infographic) {
    // Delete old infographics
    for (const infographic of entry.infographics) {
      await deleteImage(infographic.url);
    }

    // Clear existing infographics
    entry.infographics = [];

    // Check if positions are provided correctly
    if (
      !Array.isArray(infographicXPositions) ||
      !Array.isArray(infographicYPositions) ||
      infographicXPositions.length !== req.files.infographic.length ||
      infographicYPositions.length !== req.files.infographic.length
    ) {
      return response(res, 400, "Each infographic must have a corresponding xPosition and yPosition.");
    }

    // Upload new infographics and assign positions
    for (let index = 0; index < req.files.infographic.length; index++) {
      const file = req.files.infographic[index];
      const uploadedInfographic = await uploadToCloudinary(file.buffer, file.mimetype, "infographics");

      entry.infographics.push({
        url: uploadedInfographic.secure_url,
        xPosition: Number(infographicXPositions[index]),
        yPosition: Number(infographicYPositions[index]),
      });
    }
  }

  await timeline.save();
  await emitTimelineUpdate();
  return response(res, 200, "Entry updated successfully.", timeline);
});

// ✅ Delete a specific entry using entry ID
exports.deleteEntryFromTimeline = asyncHandler(async (req, res) => {
  const timeline = await Timeline.findById(req.params.id);
  if (!timeline) {
    return response(res, 404, "Timeline year not found.");
  }

  const entry = timeline.entries.id(req.params.entryId);
  if (!entry) {
    return response(res, 404, "Entry not found.");
  }

  for (const media of entry.media) {
    await deleteImage(media.url);
  }
  for (const infographic of entry.infographics) {
    await deleteImage(infographic.url);
  }

  timeline.entries.pull(req.params.entryId); 
  await timeline.save();
  await emitTimelineUpdate();
  return response(res, 200, "Entry deleted successfully.", timeline);
});