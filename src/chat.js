const express = require("express");
const router = express.Router();
const { auth } = require("./middlewares");
const { Types } = require("mongoose");
const Chat = require("./models/chat");
const message = require("./models/message");

// ✅ Create or Get a Private Chat
router.post("/", async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    let chat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
      isGroup: false,
    });

    if (!chat) {
      chat = new Chat({
        members: [senderId, receiverId],
        isGroup: false,
      });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Create a Group Chat
router.post("/group", async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || members.length < 2) {
      return res
        .status(400)
        .json({ message: "Group must have a name and at least 2 members" });
    }

    const chat = new Chat({
      name,
      members: [...members, req.user._id],
      isGroup: true,
      createdBy: req.user._id,
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get All User Chats (Private & Group)
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id }).populate(
      "members",
      "name fullName email profilePicture socketId"
    );
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Add Members to a Group
router.put("/group/add", async (req, res) => {
  try {
    const { chatId, newMembers } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.createdBy.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "Only group creator can add members" });
    }

    chat.members.push(...newMembers);
    await chat.save();

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Remove Members from a Group
router.put("/group/remove", async (req, res) => {
  try {
    const { chatId, memberId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.createdBy.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "Only group creator can remove members" });
    }

    chat.members = chat.members.filter((id) => id.toString() !== memberId);
    await chat.save();

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/v1/chats/:receiverId
// @desc    Get chat history with a specific user
// @access  Private
router.get("/messages/:receiverId", auth, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({
      members: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(receiverId)],
      },
    });
    const messages = await message
      .find({
        chatId: chat._id,
        $or: [
          { sender: userId, receiverId },
          { sender: receiverId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 }) // Oldest messages first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "username fullName profilePicture")
      .populate("receiverId", "username fullName profilePicture")
      .lean();

    res
      .status(200)
      .json({ messages, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
