const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      dataUrl: {
        type: String,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        default: "",
      },
      size: {
        type: Number,
        default: 0,
      },
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
