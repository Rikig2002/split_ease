const express = require("express");
const { acceptInvite } = require("../controllers/inviteController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/:token/accept", protect, acceptInvite);

module.exports = router;
