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

// Unique index on `title`
ProgramSchema.index({ title: 1 }, { unique: true });

module.exports = mongoose.model("Program", ProgramSchema);
