const Settlement = require("../models/Settlement");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
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

const markSettlementAsPaid = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    const group = await Group.findById(settlement.group);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is either the payer or receiver
    const isBothUser =
      (settlement.from?.toString() === req.user._id.toString() ||
        settlement.to?.toString() === req.user._id.toString()) &&
      isUserInGroup(group, req.user._id);

    if (!isBothUser) {
      return res.status(401).json({ message: "Not authorized to mark this settlement" });
    }

    settlement.status = "settled";
    await settlement.save();

    res.json({
      message: "Settlement marked as paid",
      settlement: settlement,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGroupAnalytics = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isUserInGroup(group, req.user._id)) {
      return res.status(401).json({ message: "Not authorized to view this group" });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name")
      .populate("splitDetails.user", "name");

    // Calculate analytics
    const categoryTotals = {};
    const userTotals = {};
    let totalExpenses = 0;
    let totalAmount = 0;

    expenses.forEach((expense) => {
      totalExpenses += 1;
      totalAmount += Number(expense.amount || 0);

      // By category
      const category = expense.category || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount || 0);

      // By payer
      const payerName = expense.paidBy?.name || "Unknown";
      userTotals[payerName] = (userTotals[payerName] || 0) + Number(expense.amount || 0);
    });

    // Sort by amount descending
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 categories

    const sortedUsers = Object.entries(userTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 payers

    res.json({
      totalExpenses,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      averageExpense: totalExpenses > 0 ? parseFloat((totalAmount / totalExpenses).toFixed(2)) : 0,
      topCategories: sortedCategories.map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
      })),
      topPayers: sortedUsers.map(([name, amount]) => ({
        name,
        amount: parseFloat(amount.toFixed(2)),
      })),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  markSettlementAsPaid,
  getGroupAnalytics,
};
