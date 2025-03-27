const express = require("express");
const router = express.Router();
const { auth } = require("./middlewares");
const Message = require("./models/message");

// ✅ Send a Message to a Private Chat or Group
router.post("/", auth, async (req, res) => {
  try {
    const { chatId, text } = req.body;

    const message = new Message({
      chatId,
      sender: req.user.id,
      text,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get Messages in a Private Chat or Group
router.get("/:chatId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort(
      "createdAt"
    );
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
