const Group = require("../models/Group");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Invite = require("../models/Invite");
const ChatMessage = require("../models/ChatMessage");
const { minimizeTransactions } = require("../utils/splitCalculator");

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

const normalizeGroupMembers = (group) => {
  if (!group || !Array.isArray(group.members)) {
    return false;
  }

  const seen = new Set();
  const normalizedMembers = [];

  for (const member of group.members) {
    const memberId = member?.user?._id ? member.user._id.toString() : member?.user?.toString?.();

    if (!memberId || seen.has(memberId)) {
      continue;
    }

    seen.add(memberId);
    normalizedMembers.push(member);
  }

  const changed = normalizedMembers.length !== group.members.length;
  if (changed) {
    group.members = normalizedMembers;
  }

  return changed;
};

const createGroup = async (req, res) => {
  try {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name } = req.body;

    const group = await Group.create({
      name: name.trim(),
      createdBy: req.user._id,
      members: [{ user: req.user._id }],
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "members.user",
      "name email"
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = isUserInGroup(group, req.user._id);

    if (!isMember) {
      return res.status(401).json({ message: "Not authorized to view this group" });
    }

    if (normalizeGroupMembers(group)) {
      await group.save();
      await group.populate("members.user", "name email");
    }

    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSettleUp = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = isUserInGroup(group, req.user._id);

    if (!isMember) {
      return res.status(401).json({ message: "Not authorized to view this group" });
    }

    const expenses = await Expense.find({ group: req.params.id })
      .populate("paidBy", "name email")
      .populate("splitDetails.user", "name email");

    const transactions = minimizeTransactions(expenses);

    // Remove any pending settlements for this group before creating fresh ones
    await Settlement.deleteMany({ group: req.params.id, status: "pending" });

    if (transactions.length > 0) {
      const docs = transactions.map((t) => ({
        group: req.params.id,
        from: t.from,
        to: t.to,
        amount: t.amount,
        status: "pending",
      }));

      await Settlement.insertMany(docs);
    }

    const settlements = await Settlement.find({ group: req.params.id })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = isUserInGroup(group, req.user._id);

    if (!isMember) {
      return res.status(401).json({ message: "Not authorized to modify this group" });
    }

    const User = require("../models/User");

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found. They must register first." });
    }

    // Check if already a member
    const already = group.members.some((m) => {
      if (!m.user) return false;
      return m.user.toString() === user._id.toString();
    });

    if (already) {
      return res.status(200).json({ message: "User is already a member", group });
    }

    group.members.push({ user: user._id });
    await group.save();

    const populated = await Group.findById(id).populate("members.user", "name email");

    res.status(200).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.createdBy || group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only the group creator can remove members" });
    }

    if (group.createdBy.toString() === memberId.toString()) {
      return res.status(400).json({ message: "Use delete group to remove the creator" });
    }

    const memberExists = group.members.some((member) => {
      const currentMemberId = member?.user?._id ? member.user._id.toString() : member?.user?.toString?.();
      return currentMemberId === memberId.toString();
    });

    if (!memberExists) {
      return res.status(404).json({ message: "Member not found in this group" });
    }

    group.members = group.members.filter((member) => {
      const currentMemberId = member?.user?._id ? member.user._id.toString() : member?.user?.toString?.();
      return currentMemberId !== memberId.toString();
    });

    await group.save();

    const populated = await Group.findById(id).populate("members.user", "name email");

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.createdBy || group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only the group creator can delete this group" });
    }

    await Promise.all([
      Expense.deleteMany({ group: id }),
      Settlement.deleteMany({ group: id }),
      Invite.deleteMany({ group: id }),
      ChatMessage.deleteMany({ group: id }),
      Group.deleteOne({ _id: id }),
    ]);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getSettleUp,
  addMember,
  removeMember,
  deleteGroup,
};
