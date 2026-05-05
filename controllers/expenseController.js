const Expense = require("../models/Expense");
const Group = require("../models/Group");
const { validationResult } = require("express-validator");

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

const getMemberIds = (group) => {
  return (Array.isArray(group?.members) ? group.members : [])
    .map((member) => {
      if (!member.user) {
        return null;
      }

      if (typeof member.user === "object" && member.user._id) {
        return member.user._id.toString();
      }

      return member.user.toString();
    })
    .filter(Boolean);
};

const canManageExpense = (expense, groupDoc, userId) => {
  const userIdValue = userId.toString();
  const createdBy = expense.createdBy?.toString?.();
  const paidBy = expense.paidBy?.toString?.();
  const groupCreator = groupDoc.createdBy?.toString?.();

  return [createdBy, paidBy, groupCreator].includes(userIdValue);
};

const buildSplitDetails = ({ amount, splitType, splitAmong, splitDetails }) => {
  if (splitType === "equal") {
    const n = splitAmong.length;
    const totalCents = Math.round(Number(amount) * 100);
    const base = Math.floor(totalCents / n);
    let remainder = totalCents - base * n;

    return splitAmong.map((userId) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      return {
        user: userId,
        amount: (base + extra) / 100,
      };
    });
  }

  if (!Array.isArray(splitDetails) || splitDetails.length === 0) {
    throw new Error("splitDetails are required when splitType is unequal");
  }

  // Validate splitDetails amounts sum to the amount
  const sum = splitDetails.reduce((s, sd) => s + Number(sd.amount || 0), 0);
  if (Math.round(sum * 100) !== Math.round(Number(amount) * 100)) {
    throw new Error("splitDetails amounts must sum to the total amount");
  }

  return splitDetails;
};

const addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const {
      group,
      description,
      amount,
      category,
      paidBy,
      splitAmong = [],
      splitType = "equal",
      splitDetails = [],
    } = req.body;

    const groupDoc = await Group.findById(group);

    if (!groupDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(groupDoc, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to add expenses to this group" });
    }

    if (!description || amount === undefined || amount === null || !paidBy) {
      return res.status(400).json({ message: "group, description, amount, and paidBy are required" });
    }

    if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
      return res.status(400).json({ message: "splitAmong must be a non-empty array" });
    }

    const groupMemberIds = groupDoc.members.map((member) => member.user.toString());

    if (!groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({ message: "paidBy must be a member of the group" });
    }

    const invalidSplitMembers = splitAmong.filter(
      (memberId) => !groupMemberIds.includes(memberId.toString())
    );

    if (invalidSplitMembers.length > 0) {
      return res.status(400).json({ message: "All splitAmong users must be members of the group" });
    }

    let finalSplitDetails = [];
    try {
      finalSplitDetails = buildSplitDetails({ amount, splitType, splitAmong, splitDetails });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const expense = await Expense.create({
      group,
      description,
      amount,
      category,
      paidBy,
      createdBy: req.user._id,
      splitAmong,
      splitType,
      splitDetails: finalSplitDetails,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { expenseId } = req.params;
    const { description, amount, category, paidBy, splitAmong = [], splitType = "equal", splitDetails = [] } = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const groupDoc = await Group.findById(expense.group);

    if (!groupDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(groupDoc, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to edit this expense" });
    }

    if (!canManageExpense(expense, groupDoc, req.user._id)) {
      return res.status(403).json({ message: "You can only edit expenses you added or paid for" });
    }

    if (!description || amount === undefined || amount === null || !paidBy) {
      return res.status(400).json({ message: "description, amount, and paidBy are required" });
    }

    const groupMemberIds = getMemberIds(groupDoc);

    if (!groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({ message: "paidBy must be a member of the group" });
    }

    const invalidSplitMembers = splitAmong.filter((memberId) => !groupMemberIds.includes(memberId.toString()));

    if (invalidSplitMembers.length > 0) {
      return res.status(400).json({ message: "All splitAmong users must be members of the group" });
    }

    if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
      return res.status(400).json({ message: "splitAmong must be a non-empty array" });
    }

    expense.description = description.trim();
    expense.amount = amount;
    expense.category = category;
    expense.paidBy = paidBy;
    expense.splitAmong = splitAmong;
    expense.splitType = splitType;
    try {
      expense.splitDetails = buildSplitDetails({ amount, splitType, splitAmong, splitDetails });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    await expense.save();

    const populated = await Expense.findById(expense._id).populate("paidBy", "name email avatar");

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const groupDoc = await Group.findById(expense.group);

    if (!groupDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(groupDoc, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to delete this expense" });
    }

    if (!canManageExpense(expense, groupDoc, req.user._id)) {
      return res.status(403).json({ message: "You can only delete expenses you added or paid for" });
    }

    await Expense.deleteOne({ _id: expenseId });

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGroupExpenses = async (req, res) => {
  try {
    const groupDoc = await Group.findById(req.params.groupId);

    if (!groupDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(groupDoc, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to view this group" });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .sort({ createdAt: -1 })
      .populate("paidBy", "name");

    res.json(expenses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  addExpense,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
};
