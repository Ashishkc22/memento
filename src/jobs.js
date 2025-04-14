// routes/jobsRoutes.js
const express = require("express");
const Job = require("./models/jobs");
const Tag = require("./models/tags");
const { auth } = require("./middlewares");
const { default: mongoose } = require("mongoose");

const router = express.Router();

// Create a new tag
router.post("/tags", async (req, res) => {
  try {
    const tag = new Tag({ name: req.body.name });
    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a job
router.post("/jobs", async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      createdBy: req.user._id,
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all jobs (with tag filter)
router.get("/jobs", async (req, res) => {
  try {
    let filter = {};

    // 1. Handle tag filtering with partial match
    if (req.query.tags) {
      const tagSearchTerms = req.query.tags.split(",").map((tag) => tag.trim());

      const tagRegexes = tagSearchTerms.map((tag) => ({
        name: { $regex: tag, $options: "i" }, // case-insensitive partial match
      }));

      const tagDocs = await Tag.find({ $or: tagRegexes });
      const tagIds = tagDocs.map((tag) => tag._id);

      if (tagIds.length > 0) {
        filter.tags = { $in: tagIds };
      }
    }

    // 2. Handle searching by username
    let createdByFilter = {};
    if (req.query.createdBy) {
      const user = await User.findOne({
        username: { $regex: req.query.createdBy, $options: "i" }, // partial + case-insensitive match
      });

      if (user) {
        createdByFilter = { createdBy: user._id };
      } else {
        // if no user found, return empty result early
        return res.json([]);
      }
    }

    const jobs = await Job.find({
      ...(req.query.search && {
        name: { $regex: req.query.search, $options: "i" },
      }),
      ...filter,
      ...createdByFilter,
    })
      .populate("createdBy", "username")
      .populate("tags", "name")
      .lean();

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/jobs/applied", async (req, res) => {
  try {
    const userId = req.user._id; // Ensure user is authenticated and middleware sets req.user

    const applications = await Job.find({ applicant: userId }).lean();

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/jobs/created", async (req, res) => {
  try {
    const userId = req.user._id; // Ensure authentication middleware

    const jobs = await Job.find({
      createdBy: new mongoose.Types.ObjectId(userId),
    })
      .populate("tags", "name")
      .lean();

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
router.get("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("tags", "name")
      .lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job
router.put("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!job)
      return res.status(404).json({ message: "Job not found or orized" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete job
router.delete("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!job)
      return res.status(404).json({ message: "Job not found or orized" });
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply to a job
router.post("/jobs/:id/apply", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.applicants.includes(req.user._id)) {
      job.applicants.push(req.user._id);
      await job.save();
    }
    res.json({ message: "Applied successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close job
router.patch("/jobs/:id/close", async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: "closed" },
      { new: true }
    );
    if (!job)
      return res.status(404).json({ message: "Job not found or orized" });
    res.json({ message: "Job closed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel job
router.patch("/jobs/:id/cancel", auth, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: "cancelled" },
      { new: true }
    );
    if (!job)
      return res.status(404).json({ message: "Job not found or unauthorized" });
    res.json({ message: "Job cancelled" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
