const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Authentication Middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract Bearer token
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// ✅ Authentication Socket Middleware
const socketAuth = (req, res, next) => {
  const token = socket.handshake.auth?.token?.split(" ")[1]; // Extract Bearer token
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// ✅ Function to create directory if it doesn't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ✅ Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others/"; // Default directory

    if (req.baseUrl.includes("users")) {
      folder = "uploads/profile_pics/"; // Profile images
    } else if (req.baseUrl.includes("posts")) {
      folder = "uploads/post_images/"; // Post images
    }

    ensureDir(folder); // Ensure directory exists
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "_"
    )}`;
    cb(null, uniqueName);
  },
});

// ✅ File Filter (Only allow images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Multer Upload Middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = {
  auth,
  upload,
};
