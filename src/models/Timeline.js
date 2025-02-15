const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  media: {
    type: {
      type: String, // "image" or "video"
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
}, { timestamps: true });

module.exports = mongoose.model("Timeline", TimelineSchema);
