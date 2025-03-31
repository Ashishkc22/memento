const express = require("express");
const router = express.Router();
const FriendRequest = require("./models/friendRequest");
const User = require("./models/users");

//user A - send following request to user B
//user B - accept following request from user A

// Send a friend request
router.post("/send/:receiverId", async (req, res) => {
  try {
    const { receiverId } = req.params;

    const user = await User.findById(receiverId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the friend request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: req.user._id,
      receiver: receiverId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    const friendRequest = new FriendRequest({
      sender: req.user._id,
      receiver: receiverId,
    });

    await friendRequest.save();
    res.status(201).json({ message: "Friend request sent.", friendRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept a friend request
router.post("/accept/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }
    if (friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Friend request already processed." });
    }
    if (friendRequest.receiver.toString() !== req.user._id) {
      return res.status(403).json({ message: "Unauthorized action." });
    }
    const user = await User.findById(req.user._id);
    const senderUser = await User.findById(friendRequest.sender);
    friendRequest.status = "accepted";
    user.followers.push(friendRequest.sender);
    senderUser.following.push(req.user._id);
    await senderUser.save();
    await user.save();
    await friendRequest.save({ update: true });

    res.json({ message: "Friend request accepted.", friendRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decline a friend request
router.post("/decline/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (friendRequest.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    friendRequest.status = "declined";
    await friendRequest.save();

    res.json({ message: "Friend request declined.", friendRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get friend requests (sent and received)
router.get("/requests", async (req, res) => {
  try {
    const sentRequests = await FriendRequest.find({
      sender: req.user.id,
    }).populate("receiver", "name email");
    const receivedRequests = await FriendRequest.find({
      receiver: req.user.id,
    }).populate("sender", "name email");

    res.json({ sentRequests, receivedRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
