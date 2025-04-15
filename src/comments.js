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

// @route   GET /api/comments/:postId
// @desc    Get all comments for a post with pagination
// @access  Public (or Private if needed)
router.get("/get-comments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    let { page = 1, limit = 50 } = req.query;

    // Convert page and limit to numbers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const skip = (page - 1) * limit;

    // Find comments for the given postId with pagination
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 }) // Newest comments first
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName profilePicture"); // Populate user details

    // Get total count of comments for pagination metadata
    const totalComments = await Comment.countDocuments({ postId });

    res.json({
      success: true,
      page,
      limit,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
