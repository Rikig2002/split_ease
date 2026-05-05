const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 100,
    },
    usesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
    acceptedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        acceptedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
