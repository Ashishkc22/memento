const express = require("express");
const router = express.Router();
const User = require("./models/users");

// ✅ Search for Users by Email or Name
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Please provide a search query" });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } }, // Case-insensitive email search
        { name: { $regex: query, $options: "i" } }, // Case-insensitive name search
      ],
    }).select("-password"); // Exclude password from response

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({ message: "Users found", users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
