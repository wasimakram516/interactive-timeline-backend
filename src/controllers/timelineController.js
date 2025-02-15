const Timeline = require("../models/Timeline");
const { successResponse, errorResponse } = require("../utils/response");

// Create a new timeline event
exports.createTimeline = async (req, res) => {
  try {
    const timeline = new Timeline(req.body);
    await timeline.save();
    return successResponse(res, "Timeline event created successfully", timeline, 201);
  } catch (error) {
    return errorResponse(res, "Error creating timeline event", error, 500);
  }
};

// Get all timeline events
exports.getTimelines = async (req, res) => {
  try {
    const timelines = await Timeline.find().sort({ year: 1 });
    if (!timelines.length) {
      return errorResponse(res, "No timeline events found", {}, 404);
    }
    return successResponse(res, "Timeline events fetched successfully", timelines);
  } catch (error) {
    return errorResponse(res, "Error fetching timeline events", error, 500);
  }
};

// Get a single timeline event
exports.getTimelineById = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) {
      return errorResponse(res, "Timeline event not found", {}, 404);
    }
    return successResponse(res, "Timeline event retrieved successfully", timeline);
  } catch (error) {
    return errorResponse(res, "Error fetching timeline event", error, 500);
  }
};

// Update a timeline event
exports.updateTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timeline) {
      return errorResponse(res, "Timeline event not found", {}, 404);
    }
    return successResponse(res, "Timeline event updated successfully", timeline);
  } catch (error) {
    return errorResponse(res, "Error updating timeline event", error, 500);
  }
};

// Delete a timeline event
exports.deleteTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndDelete(req.params.id);
    if (!timeline) {
      return errorResponse(res, "Timeline event not found", {}, 404);
    }
    return successResponse(res, "Timeline event deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting timeline event", error, 500);
  }
};
