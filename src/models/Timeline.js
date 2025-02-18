const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    xPosition: {
      type: Number, // Horizontal position percentage (0 - 100)
      required: true,
    },
    yPosition: {
      type: Number, // Vertical position percentage (0 - 100)
      required: true,
    },
    description: {
      type: [String],
      required: false,
    },
    media: {
      type: {
        type: String, 
        enum: ["image", "video"],
      },
      url: {
        type: String, 
        required: false, 
      },
    },
    infographic: {
      url: {
        type: String, 
        required: false, 
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timeline", TimelineSchema);
