const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

router.get("/stats", async (req, res) => {
  const totalTasks = await Task.countDocuments();
  const tasksByStatus = await Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  res.json({ totalTasks, tasksByStatus });
});

module.exports = router;
