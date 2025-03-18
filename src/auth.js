const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("./models/users"); // Path to your user model
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET; // Replace with your secret key (keep it safe!)
  const expiresIn = "7d"; // Token expiry duration

  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};
// @route   POST /api/user/login
// @desc    Login User
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // On success - You can generate a JWT here if needed
    return res.status(200).json({
      message: "Login successful",
      user: {
        token: generateToken({
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
        }),
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/user/signup
// @desc    User Signup
// @access  Public
router.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("fullName").notEmpty().withMessage("Full Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, fullName, email, password } = req.body;

    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "Email already registered" });

      // Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create User
      const newUser = new User({
        username,
        fullName,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Signup Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// @route   PUT /api/user/update/:id
// @desc    Update User Profile (excluding password)
// @access  Private (Assuming you handle authentication middleware separately)
router.put(
  "/update/:id",
  [
    body("username").optional().isString(),
    body("fullName").optional().isString(),
    body("bio").optional().isString().isLength({ max: 200 }),
    body("profilePicture").optional().isString(),
    body("coverPicture").optional().isString(),
    body("website")
      .optional()
      .isURL()
      .withMessage("Website must be a valid URL"),
    body("location").optional().isString(),
    body("dob").optional().isISO8601().toDate(),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("status").optional().isIn(["active", "inactive", "banned"]),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Prevent password update here
      if (updateData.password) delete updateData.password;

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
