const express = require("express");
const router = express.Router();
const { auth } = require("./middlewares");
const Chat = require("./models/chat");

// ✅ Create or Get a Private Chat
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    let chat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
      isGroup: false,
    });

    if (!chat) {
      chat = new Chat({ members: [senderId, receiverId], isGroup: false });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Create a Group Chat
router.post("/group", auth, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || members.length < 2) {
      return res
        .status(400)
        .json({ message: "Group must have a name and at least 2 members" });
    }

    const chat = new Chat({
      name,
      members: [...members, req.user.id],
      isGroup: true,
      createdBy: req.user.id,
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get All User Chats (Private & Group)
router.get("/", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user.id }).populate(
      "members",
      "name email"
    );
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Add Members to a Group
router.put("/group/add", auth, async (req, res) => {
  try {
    const { chatId, newMembers } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.createdBy.toString() !== req.user.id) {
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
router.put("/group/remove", auth, async (req, res) => {
  try {
    const { chatId, memberId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (chat.createdBy.toString() !== req.user.id) {
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

module.exports = router;
