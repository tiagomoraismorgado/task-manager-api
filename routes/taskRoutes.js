const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user.userId });
  req.io.emit("taskAdded", task);
  res.status(201).json(task);
});

router.get("/", authMiddleware, async (req, res) => {
  const tasks = await Task.find({ user: req.user.userId });
  res.json(tasks);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.io.emit("taskUpdated", task);
  res.json(task);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  req.io.emit("taskDeleted", req.params.id);
  res.json({ message: "Tâche supprimée" });
});

module.exports = router;
