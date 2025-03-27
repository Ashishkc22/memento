const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    name: { type: String }, // Group Name (only for groups)
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false }, // Identify group chats
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin for groups
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
