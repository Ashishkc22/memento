const express = require("express");
const mongoose = require("mongoose");
const Post = require("./models/post");
const Comment = require("./models/comments");

const router = express.Router();

// **1. Like a Post**
router.post("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Toggle Like
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      await post.save();
      return res.json({ message: "Like removed", likes: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();
      return res.json({ message: "Post liked", likes: post.likes.length });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// **2. Like a Comment**
router.post("/comment/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Toggle Like
    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      await comment.save();
      return res.json({ message: "Like removed", likes: comment.likes.length });
    } else {
      comment.likes.push(userId);
      await comment.save();
      return res.json({
        message: "Comment liked",
        likes: comment.likes.length,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
