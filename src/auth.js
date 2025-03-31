const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth } = require("./middlewares"); // Assuming you have an auth middleware for authentication
const User = require("./models/users"); // Path to your user model
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const generateToken = (payload, expiresIn = "7d") => {
  const secret = process.env.JWT_SECRET; // Replace with your secret key (keep it safe!)
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

const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, filePath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found:", filePath);
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully:", filePath);
      }
    });
  });
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads/profileImages");
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${req.body.email}-${file.originalname}`;
    req.imageName = fileName; // Store the filename in req for later use
    cb(null, fileName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb("Only jpeg, jpg, png images allowed");
  },
});

// @route   POST /api/user/signup
// @desc    User Signup
// @access  Public
router.post(
  "/signup",
  upload.single("image"),
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
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      deleteFile(`uploads/posts/${req.imageName}`); // Delete the uploaded file if text is not provided
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
        profilePicture: req.file ? req.imageName : null,
      });

      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Signup Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
  // Use multer to handle image upload
);

// @route   PUT /api/user/update/:id
// @desc    Update User Profile (excluding password)
// @access  Private (Assuming you handle authentication middleware separately)
router.put(
  "/update/:id",
  auth,
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

const nodemailer = require("nodemailer");

// Email Transporter (NodeMailer)
const transporter = nodemailer.createTransport({
  service: process.env.NODE_MAILER_SERVICE,
  host: process.env.NODE_MAILER_HOST,
  port: process.env.NODE_MAILER_PORT,
  secure: false,
  auth: {
    user: process.env.NODE_MAILER_AUTH_USERNAME,
    pass: process.env.NODE_MAILER_AUTH_PASSWORD,
  },
});

// Generate Random OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// **1. Forgot Password - Send OTP**
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP & Expiration
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry

    // Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    });
    await user.save();

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// @route   POST /api/user/verify-otp
// @desc    Verify OTP and generate JWT token
// @access  Public
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate JWT token
    const token = generateToken(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      "1hr"
    );

    // Store the token in the user model
    user.token = token;
    user.otp = undefined; // Remove OTP after successful verification
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password using Token
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Find user by ID from token payload
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.token = undefined; // Clear token after password reset
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
