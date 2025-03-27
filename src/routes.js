const router = require("express").Router();
const { upload, auth } = require("./middlewares");

router.use("/auth", auth, require("./auth"));
router.use("/post", auth, require("./post"));
router.use("/profile", auth, require("./profile"));
router.use("/search", auth, require("./search"));
router.use("/chat", auth, require("./chat"));
router.use("/message", auth, require("./chat"));

router.use("/upload/profile_pics", upload.single("profilePic"));
router.use("/upload/post_images", upload.single("postImage"));
module.exports = router;
