const Program = require("../models/Program");
const response = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const asyncHandler = require("../middlewares/asyncHandler");

let io;

// ✅ Initialize WebSocket
exports.setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// ✅ Emit updated program data
const emitProgramUpdate = async () => {
  try {
    if (!io) throw new Error("WebSocket instance (io) is not initialized.");
    const programs = await Program.find().sort({ title: 1 });
    io.emit("programUpdate", programs);
  } catch (error) {
    console.error("❌ Failed to emit program update:", error.message);
  }
};

// ✅ Get all programs (Handles Empty Case)
exports.getPrograms = asyncHandler(async (req, res) => {
  const programs = await Program.find().sort({ title: 1 });

  return response(
    res,
    200,
    programs.length ? "Programs fetched successfully." : "No programs found.",
    programs
  );
});

// ✅ Get a single program
exports.getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  return response(res, 200, "Program retrieved successfully.", program);
});

// ✅ Create a new program (without entries)
exports.createProgram = asyncHandler(async (req, res) => {
  let { title, xPosition, yPosition } = req.body;

  if (!title || xPosition === undefined || yPosition === undefined) {
    return response(res, 400, "Title, xPosition, and yPosition are required.");
  }

  if (await Program.exists({ title })) {
    return response(res, 400, "A program with this title already exists.");
  }

  const program = await Program.create({
    title,
    xPosition,
    yPosition,
    entries: [],
  });
  await emitProgramUpdate();
  return response(res, 201, "Program created successfully.", program);
});

// ✅ Update program (title, x/y positions)
exports.updateProgram = asyncHandler(async (req, res) => {
  const { title, xPosition, yPosition } = req.body;
  const program = await Program.findById(req.params.id);

  if (!program) {
    return response(res, 404, "Program not found.");
  }

  if (title !== undefined) program.title = title;
  if (xPosition !== undefined) program.xPosition = xPosition;
  if (yPosition !== undefined) program.yPosition = yPosition;

  await program.save();
  await emitProgramUpdate();
  return response(res, 200, "Program updated successfully.", program);
});

// ✅ Delete an entire program (removes all entries)
exports.deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  // ✅ Delete all media & infographics before removing the program
  for (const entry of program.entries) {
    for (const media of entry.media) {
      await deleteImage(media.url);
    }
    for (const infographic of entry.infographics) {
      await deleteImage(infographic.url);
    }
  }

  await program.deleteOne();
  await emitProgramUpdate();
  return response(res, 200, "Program deleted successfully.");
});

// ✅ Add an entry to a program
exports.addEntryToProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  let {
    title = "", // ✅ Default to empty string if not provided
    description = "[]", // ✅ Default to empty array in string format
    xPosition = 0, // ✅ Default to 0 if not provided
    yPosition = 0,
    mediaXPositions,
    mediaYPositions,
    infographicXPositions,
    infographicYPositions,
  } = req.body;

  // ✅ Parse description only if it has a valid value
  let parsedDescription = [];
  if (description && description !== "[]") {
    try {
      parsedDescription = JSON.parse(description);
      if (!Array.isArray(parsedDescription)) {
        return response(res, 400, "Description must be an array.");
      }
    } catch (error) {
      return response(res, 400, "Invalid description format.");
    }
  }

  let media = [];
  let infographics = [];

  // ✅ Handle Media Upload
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
        mediaType: uploadedFile.resource_type,
        xPosition: mediaXPositions[index],
        yPosition: mediaYPositions[index],
      });
    }
  }

  // ✅ Handle Infographics Upload
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
    title, // ✅ Now optional
    description: parsedDescription, // ✅ Now optional
    xPosition,
    yPosition,
    media,
    infographics,
  };
  
  program.entries.push(newEntry);
  await program.save();
  await emitProgramUpdate();
  return response(res, 201, "Entry added successfully.", program);
});

// ✅ Update an entry in a program using entry ID
exports.updateEntryInProgram = asyncHandler(async (req, res) => {
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

  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  const entry = program.entries.id(req.params.entryId);
  if (!entry) {
    return response(res, 404, "Entry not found.");
  }

  if (title) {
    entry.title = title;
  }

  console.log("Description", description);

  if (description !== undefined && description !== null && description !== "null") {
    console.log("checking description...");

    if (typeof description === "string") {
      try {
        description = JSON.parse(description); // Ensure it's an array
      } catch (error) {
        return response(res, 400, "Invalid description format");
      }
    }

    if (!Array.isArray(description)) {
      return response(res, 400, "Description must be an array.");
    }

    // Trim and filter empty lines
    entry.description = description
      .map((line) => (typeof line === "string" ? line.trim() : ""))
      .filter((line) => line.length > 0);

    if (entry.description.length === 0) {
      entry.description = []; // Ensure it's an empty array if no valid content
    }
  } else {
    console.log("Skipping description update");
  }

  // Update entry position (if provided)
  if (xPosition !== undefined) {
    entry.xPosition = xPosition === "null" ? null : Number(xPosition);
  }
  if (yPosition !== undefined) {
    entry.yPosition = yPosition === "null" ? null : Number(yPosition);
  }

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
      return response(
        res,
        400,
        "Each media file must have corresponding xPosition and yPosition."
      );
    }

    // Upload new media and assign positions
    for (let index = 0; index < req.files.media.length; index++) {
      const file = req.files.media[index];
      const uploadedFile = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        "media"
      );
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
      return response(
        res,
        400,
        "Each infographic must have corresponding xPosition and yPosition."
      );
    }

    // Upload new infographics and assign positions
    for (let index = 0; index < req.files.infographic.length; index++) {
      const file = req.files.infographic[index];
      const uploadedInfographic = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        "infographics"
      );
      entry.infographics.push({
        url: uploadedInfographic.secure_url,
        xPosition: Number(infographicXPositions[index]),
        yPosition: Number(infographicYPositions[index]),
      });
    }
  }

  await program.save();
  await emitProgramUpdate();
  return response(res, 200, "Entry updated successfully.", program);
});

// ✅ Delete an entry from a program using entry ID
exports.deleteEntryFromProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  const entry = program.entries.id(req.params.entryId);
  if (!entry) {
    return response(res, 404, "Entry not found.");
  }

  for (const media of entry.media) {
    await deleteImage(media.url);
  }
  for (const infographic of entry.infographics) {
    await deleteImage(infographic.url);
  }

  program.entries.pull(req.params.entryId);

  await program.save();
  await emitProgramUpdate();
  return response(res, 200, "Entry deleted successfully.", program);
});
