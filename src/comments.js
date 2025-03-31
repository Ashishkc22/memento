const express = require("express");
const router = express.Router();
const Comment = require("./models/comments");
const Post = require("./models/post");

// ✅ Add a Comment
router.post("/add", async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user._id; // Assuming you have user authentication middleware
    if (!postId || !text) {
      return res
        .status(400)
        .json({ message: "userId, postId, and text are required" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = new Comment({
      user: userId,
      post: postId,
      text,
    });
    post.comments.push(newComment._id); // Add comment ID to post's comments array
    await post.save(); // Save the post with the new comment ID
    await newComment.save();

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update a Comment
router.put("/update/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      user: userId,
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.text = text;
    await comment.save();

    res.status(200).json({ message: "Comment updated", comment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Delete a Comment
router.delete("/delete/:commentId", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
