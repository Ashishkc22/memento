const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer token
  if (!token)
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded; // You can now access req.user.id
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile_pics/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = {
  auth,
  upload,
};
