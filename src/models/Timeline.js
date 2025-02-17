const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    description: {
      type: [String], 
      required: true,
    },
    media: [
      {
        type: {
          type: String, // "image" or "video"
          enum: ["image", "video"],
        },
        url: {
          type: String,
          required: true,
        },
      },
    ], 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timeline", TimelineSchema);
