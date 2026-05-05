const express = require("express");
const { addExpense, getGroupExpenses, updateExpense, deleteExpense } = require("../controllers/expenseController");
const { protect } = require("../middleware/auth");
const { check } = require("express-validator");

const router = express.Router();

router.use(protect);

router.post(
	"/group/:groupId",
	[
		check("description").trim().isLength({ min: 1 }).withMessage("Description is required"),
		check("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
		check("paidBy").notEmpty().withMessage("paidBy is required"),
		check("splitAmong").isArray({ min: 1 }).withMessage("splitAmong must be a non-empty array"),
	],
	addExpense
);
router.get("/group/:groupId", getGroupExpenses);
router.patch(
	"/:expenseId",
	[
		check("description").trim().isLength({ min: 1 }).withMessage("Description is required"),
		check("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
		check("paidBy").notEmpty().withMessage("paidBy is required"),
		check("splitAmong").isArray({ min: 1 }).withMessage("splitAmong must be a non-empty array"),
	],
	updateExpense
);
router.delete("/:expenseId", deleteExpense);

module.exports = router;
