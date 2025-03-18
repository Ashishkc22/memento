const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb("Only jpeg, jpg, png images allowed");
  },
});

// ✅ Create Post (text + optional image)
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId)
      return res.status(400).json({ message: "Text and userId are required" });

    const newPost = new Post({
      user: userId,
      text,
      image: req.file ? req.file.path : null,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update Post (delete old image if new uploaded)
router.put("/update/:postId", upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (text) post.text = text;

    if (req.file) {
      // Delete old image if exists
      if (post.image && fs.existsSync(post.image)) fs.unlinkSync(post.image);
      post.image = req.file.path;
    }

    await post.save();
    res.status(200).json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Delete Post (and remove image)
router.delete("/delete/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Delete image if exists
    if (post.image && fs.existsSync(post.image)) fs.unlinkSync(post.image);

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: "Post and image deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
