const router = require("express").Router();
const { upload, auth } = require("./middlewares");

router.use("/auth", auth, require("./auth"));
// router.use("/upload", upload);
module.exports = router;
