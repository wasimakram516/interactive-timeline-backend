const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    xPosition: {
      type: Number, // Overall horizontal position (0 - 100)
      required: true,
    },
    yPosition: {
      type: Number, // Overall vertical position (0 - 100)
      required: true,
    },
    entries: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: [String], // Supports both string and array formats
          default: undefined, // Allows single or multiple descriptions
        },
        xPosition: {
          type: Number, // Entry-level horizontal position (0 - 100)
          required: true,
        },
        yPosition: {
          type: Number, // Entry-level vertical position (0 - 100)
          required: true,
        },
        media: [
          {
            mediaType: {
              type: String,
              enum: ["image", "video"], // Renamed from `type` to `mediaType` (avoiding conflicts)
              required: true,
            },
            url: {
              type: String,
              required: true,
            },
            xPosition: {
              type: Number, // Media-level horizontal position (0 - 100)
              default: 50, // Optional, default to center if missing
            },
            yPosition: {
              type: Number, // Media-level vertical position (0 - 100)
              default: 50, // Optional, default to center if missing
            },
          },
        ],
        infographics: [
          {
            url: {
              type: String,
              required: true,
            },
            xPosition: {
              type: Number, // Infographic-level horizontal position (0 - 100)
            },
            yPosition: {
              type: Number, // Infographic-level vertical position (0 - 100)
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", ProgramSchema);
