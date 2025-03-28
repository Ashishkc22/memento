const express = require("express");
const router = express.Router();
const FriendRequest = require("./models/friendRequest");
const { auth } = require("./middlewares");
const User = require("../models/User");

// Send a friend request
router.post("/send/:receiverId", auth, async (req, res) => {
  try {
    const { receiverId } = req.params;

    // Check if the friend request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    const friendRequest = new FriendRequest({
      sender: req.user.id,
      receiver: receiverId,
    });

    await friendRequest.save();
    res.status(201).json({ message: "Friend request sent.", friendRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept a friend request
router.post("/accept/:requestId", auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (friendRequest.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    res.json({ message: "Friend request accepted.", friendRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decline a friend request
router.post("/decline/:requestId", auth, async (req, res) => {
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
router.get("/requests", auth, async (req, res) => {
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
