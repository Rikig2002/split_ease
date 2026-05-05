const ChatMessage = require("../models/ChatMessage");
const Group = require("../models/Group");

const isUserInGroup = (group, userId) => {
  return group.members.some((member) => {
    if (!member.user) {
      return false;
    }

    if (typeof member.user === "object" && member.user._id) {
      return member.user._id.toString() === userId.toString();
    }

    return member.user.toString() === userId.toString();
  });
};

const getGroupMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(group, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to view this chat" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const messages = await ChatMessage.find({ group: req.params.id })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const sendGroupMessage = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(group, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to send chat messages" });
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const imageDataUrl = typeof req.body.imageDataUrl === "string" ? req.body.imageDataUrl.trim() : "";
    const imageName = typeof req.body.imageName === "string" ? req.body.imageName.trim() : "";
    const imageType = typeof req.body.imageType === "string" ? req.body.imageType.trim() : "";
    const imageSize = Number(req.body.imageSize || 0);

    if (!text && !imageDataUrl) {
      return res.status(400).json({ message: "Enter a message or attach an image" });
    }

    if (imageDataUrl && imageDataUrl.length > 7500000) {
      return res.status(413).json({ message: "Image is too large. Please send a smaller file." });
    }

    const message = await ChatMessage.create({
      group: req.params.id,
      sender: req.user._id,
      text,
      image: imageDataUrl
        ? {
            dataUrl: imageDataUrl,
            name: imageName,
            mimeType: imageType,
            size: Number.isFinite(imageSize) ? imageSize : 0,
          }
        : undefined,
    });

    const populated = await ChatMessage.findById(message._id).populate("sender", "name email avatar");

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const editGroupMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(group, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to edit chat messages" });
    }

    const message = await ChatMessage.findOne({ _id: messageId, group: id });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    const editableUntil = new Date(message.createdAt.getTime() + 60 * 1000);

    if (new Date() > editableUntil) {
      return res.status(400).json({ message: "Message can only be edited within 1 minute" });
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text && !message.image?.dataUrl) {
      return res.status(400).json({ message: "Enter a message to save" });
    }

    message.text = text;
    message.editedAt = new Date();
    await message.save();

    const populated = await ChatMessage.findById(message._id).populate("sender", "name email avatar");

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getGroupMessages,
  sendGroupMessage,
  editGroupMessage,
};
