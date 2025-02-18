const Program = require("../models/Program");
const response = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const asyncHandler = require("../middlewares/asyncHandler");
let io; // ✅ Declare `io` globally but initialize it later

// ✅ Function to initialize WebSocket (called from server.js)
exports.setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// ✅ Function to emit updated program data
const emitProgramUpdate = async () => {
  try {
    if (!io) throw new Error("WebSocket instance (io) is not initialized.");

    const programs = await Program.find().sort({ year: 1 });
    io.emit("programUpdate", programs);
  } catch (error) {
    console.error("❌ Failed to emit program update:", error.message);
  }
};

// ✅ Create a new program
exports.createProgram = asyncHandler(async (req, res) => {
  let { title, xPosition, yPosition, description } = req.body;

  if (!title || xPosition === undefined || yPosition === undefined) {
    return response(res, 400, "Title, xPosition, and yPosition are required.");
  }

  // ✅ Ensure the title is unique
  const existingProgram = await Program.findOne({ title });
  if (existingProgram) {
    return response(res, 400, "A program with this title already exists.");
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

  let media = null;
  let infographic = null;

  // ✅ Process media file (only one allowed)
  if (req.files?.media) {
    const uploadedFile = await uploadToCloudinary(
      req.files.media[0].buffer,
      req.files.media[0].mimetype,
      "media"
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
      "infographics"
    );
    infographic = { url: uploadedInfographic.secure_url };
  }

  // ✅ Create the new program
  const program = await Program.create({
    title,
    xPosition,
    yPosition,
    description,
    media,
    infographic,
  });

  await emitProgramUpdate();

  return response(res, 201, "Program created successfully.", program);
});

// ✅ Update program
exports.updateProgram = asyncHandler(async (req, res) => {
  const { title, xPosition, yPosition, description } = req.body;
  const program = await Program.findById(req.params.id);

  if (!program) {
    return response(res, 404, "Program not found.");
  }

  // ✅ Check if the new title is already in use by another program
  if (title && title !== program.title) {
    const existingProgram = await Program.findOne({ title });
    if (existingProgram) {
      return response(res, 400, "A program with this title already exists.");
    }
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

  let updatedMedia = program.media;
  let updatedInfographic = program.infographic;

  // ✅ Handle media update (if a new file is uploaded)
  if (req.files?.media) {
    if (program.media?.url && typeof program.media.url === "string") {
      await deleteImage(program.media.url);
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
    // ✅ Delete old infographic from Cloudinary if exists
    if (
      program.infographic?.url &&
      typeof program.infographic.url === "string"
    ) {
      await deleteImage(program.infographic.url);
    }

    const uploadedInfographic = await uploadToCloudinary(
      req.files.infographic[0].buffer,
      req.files.infographic[0].mimetype,
      "infographics"
    );
    updatedInfographic = { url: uploadedInfographic.secure_url };
  }

  program.title = title ?? program.title;
  program.xPosition = xPosition ?? program.xPosition;
  program.yPosition = yPosition ?? program.yPosition;
  program.description = description ?? program.description;
  program.media = updatedMedia;
  program.infographic = updatedInfographic;

  await program.save();

  await emitProgramUpdate(); // ✅ Emit updated program data

  return response(res, 200, "Program updated successfully.", program);
});

// ✅ Get all programs
exports.getPrograms = asyncHandler(async (req, res) => {
  const programs = await Program.find().sort({ title: 1 });

  if (!programs.length) {
    return response(res, 200, "No programs found.");
  }

  return response(res, 200, "Programs fetched successfully.", programs);
});

// ✅ Get a single program
exports.getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  return response(res, 200, "Program retrieved successfully.", program);
});

// ✅ Delete a program
exports.deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return response(res, 404, "Program not found.");
  }

  // ✅ Delete media from Cloudinary if exists
  if (program.media?.url && typeof program.media.url === "string") {
    await deleteImage(program.media.url);
  }

  // ✅ Delete infographic from Cloudinary if exists
  if (program.infographic?.url && typeof program.infographic.url === "string") {
    await deleteImage(program.infographic.url);
  }

  await program.deleteOne();

  await emitProgramUpdate(); 

  return response(res, 200, "Program deleted successfully.");
});
