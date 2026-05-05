const express = require("express");
const { check } = require("express-validator");
const { createGroup, getUserGroups, getGroupDetails, getSettleUp, addMember, removeMember, deleteGroup } = require("../controllers/groupController");
const { createInvite, listInvites, revokeInvite } = require("../controllers/inviteController");
const { getGroupMessages, sendGroupMessage, editGroupMessage } = require("../controllers/chatController");
const { markSettlementAsPaid, getGroupAnalytics } = require("../controllers/settlementController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", [check("name").trim().isLength({ min: 1 }).withMessage("Group name is required")], createGroup);
router.get("/", getUserGroups);
router.delete("/:id", deleteGroup);
router.post("/:id/members", [check("email").isEmail().withMessage("Valid email is required")], addMember);
router.delete("/:id/members/:memberId", removeMember);
router.post(
	"/:id/invite",
	[
		check("email").optional().isEmail().withMessage("If provided, email must be valid"),
		check("expiresHours").optional().isInt({ min: 1, max: 168 }).withMessage("expiresHours must be 1-168 hours"),
		check("maxUses").optional().isInt({ min: 1, max: 100 }).withMessage("maxUses must be 1-100"),
	],
	createInvite
);
router.get("/:id/invites", listInvites);
router.delete("/:id/invite/:inviteId", revokeInvite);
router.get("/:id/messages", getGroupMessages);
router.post("/:id/messages", sendGroupMessage);
router.patch("/:id/messages/:messageId", editGroupMessage);
router.get("/:id/settle-up", getSettleUp);
router.get("/:id/analytics", getGroupAnalytics);
router.patch("/settlement/:settlementId/mark-paid", markSettlementAsPaid);
router.get("/:id", getGroupDetails);

module.exports = router;
