const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settlement", settlementSchema);
