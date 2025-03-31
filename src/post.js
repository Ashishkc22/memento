const express = require("express");
const router = express.Router();
const Post = require("./models/post");
const User = require("./models/users");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, filePath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found:", filePath);
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully:", filePath);
      }
    });
  });
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads/posts/");
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${req.user._id}-${file.originalname}`;
    req.imageName = fileName; // Store the filename in req for later use
    cb(null, fileName);
  },
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
    const { text } = req.body;
    const userId = req.user._id; // Extract user ID from JWT token
    if (!text) {
      deleteFile(`uploads/posts/${req.imageName}`); // Delete the uploaded file if text is not provided
      return res.status(400).json({ message: "Text are required" });
    }
    const newPost = new Post({
      user: userId,
      text,
      image: req.file ? req.file.path : null,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    deleteFile(`uploads/posts/${req.imageName}`);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update Post (delete old image if new uploaded)
router.put("/update/:postId", async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id; // Extract user ID from JWT token
    const post = await Post.findOne({ _id: req.params.postId, user: userId });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (text) post.text = text;

    // if (req.file) {
    //   // Delete old image if exists
    //   if (post.image && fs.existsSync(post.image)) fs.unlinkSync(post.image);
    //   post.image = req.file.path;
    // }

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

// @route   GET /api/posts/my-posts
// @desc    Get all posts by the authenticated user
// @access  Private (Requires authentication)
router.get("/my-posts", async (req, res) => {
  try {
    const userId = req.user._id; // Assuming `auth` middleware sets `req.user`

    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/v1/posts/friends
// @desc    Get posts from the user and their friends sorted by likes and createdAt with pagination
// @access  Private
router.get("/get-posts", async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Get the current user and their friends list
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendsList = user.following; // Assuming following represents friends

    // Fetch posts from the user and their friends with pagination
    const posts = await Post.find({
      user: { $in: [userId, ...friendsList] },
    })
      .sort({ likes: -1, createdAt: -1 }) // Sort by likes descending, then createdAt descending
      .populate("user", "username fullName profilePicture") // Populate creator details
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res
      .status(200)
      .json({ page: parseInt(page), limit: parseInt(limit), posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
