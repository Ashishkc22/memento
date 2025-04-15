const User = require("./models/users");
const express = require("express");
const router = express.Router();

// ✅ Get Logged-in User's Profile
const getMyProfileDetails = async (req, res) => {
  try {
    const userId = req.user._id; // Extract user ID from JWT token

    const user = await User.findById(userId).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // user.profilePicture = user?.profilePicture
    //   ? `uploads/profileImages/${user.profilePicture}`
    //   : ""; // Set default profile picture if not set

    res.status(200).json({
      message: "Profile details fetched",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Following List from User's Profile
const getFriendsList = async (req, res) => {
  try {
    const userId = req.user._id; // Extract user ID from JWT token

    const user = await User.findById(userId)
      .select("following")
      .populate("following", "-password"); // Populate following list
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Following list fetched",
      following: user.following,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

router.get("/friends", getFriendsList);

router.get("/my-profile-details", getMyProfileDetails);
module.exports = router;
