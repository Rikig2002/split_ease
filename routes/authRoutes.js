const express = require("express");
const { registerUser, loginUser, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
	res.json({ message: "SplitEase auth API is running" });
});
router.post("/register", registerUser);
router.post("/login", loginUser);
const { check } = require("express-validator");
router.get("/me", protect, getMe);
router.patch(
	"/me",
	protect,
	[check("name").optional().trim().isLength({ min: 1 }).withMessage("Name must not be empty"), check("email").optional().isEmail().withMessage("Valid email is required")],
	updateProfile
);

module.exports = router;
