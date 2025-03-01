const express = require("express");
const Project = require("../models/Project");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/new", authMiddleware, async (req, res) => {
  try {
    console.log("User:", req.user);  // Debugging authentication

    const { name, description, start_date, end_date, priority, status } = req.body;

    const newProject = new Project({
      name,
      description,
      start_date,
      end_date,
      priority,
      status,
      admin: req.user.id,  // req.user must exist!
    });

    await newProject.save();
    res.json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);  // Log error
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
});

router.get("/all", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ admin: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
});


router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.remove();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
});



module.exports = router;
