const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    xPosition: {
      type: Number, // Year-level horizontal position (0 - 100)
      required: true,
    },
    yPosition: {
      type: Number, // Year-level vertical position (0 - 100)
      required: true,
    },
    entries: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: [String], // Allow multiple descriptions or a single string
          default: undefined, // Allows storing a string OR an array
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
              enum: ["image", "video"], // Renamed from `type` to `mediaType`
              required: true,
            },
            url: {
              type: String,
              required: true,
            },
            xPosition: {
              type: Number, // Media-level horizontal position (0 - 100)
            },
            yPosition: {
              type: Number, // Media-level vertical position (0 - 100)
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
              default: 50, // Optional, default to center
            },
            yPosition: {
              type: Number, // Infographic-level vertical position (0 - 100)
              default: 50, // Optional, default to center
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timeline", TimelineSchema);
