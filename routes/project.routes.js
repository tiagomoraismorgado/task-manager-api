const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User"); 
const Invitation = require("../models/Invitation");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/new", authMiddleware, async (req, res) => {
  try {
      const { name, description, start_date, end_date, priority, status, collaborators } = req.body;

      // Create the new project (without collaborators initially)
      const newProject = new Project({
          name,
          description,
          start_date,
          end_date,
          priority,
          status,
          admin: req.user.id, // Set the admin to the logged-in user
          collaborators: [] // Start with an empty array
      });

      // Save the project to get its ID
      await newProject.save();

      // If there are collaborators, process them
      if (collaborators && collaborators.length > 0) {
          for (const email of collaborators) {
              // Find the user by email
              const user = await User.findOne({ email });

              if (user) {
                  // Add the user's ObjectId to the collaborators array
                  newProject.collaborators.push(user._id);

                  // Create an invitation for the collaborator
                  const newInvitation = new Invitation({
                      project: newProject._id,
                      inviterEmail: req.user.email, // Email of the admin
                      inviteeEmail: email // Email of the collaborator
                  });
                  await newInvitation.save();
              } else {
                  console.warn(`User with email ${email} not found. Skipping invitation.`);
              }
          }

          // Save the updated project with collaborators
          await newProject.save();
      }

      res.status(201).json({ message: "Project created successfully", project: newProject });
  } catch (error) {
      console.error("Error creating project:", error);
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


//view project details
router.post("/project/:id", authMiddleware, async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.render('projectDetails', { project: project }); // Rendre une vue avec les détails du projet
    } catch (error) {
      res.status(500).json({ message: "Error fetching project", error: error.message });
    }
  });

router.delete('/delete/:id', async (req, res) => {
  try {
      const { id } = req.params;
      console.log("Deleting project with ID:", id);

      const project = await Project.findByIdAndDelete(id);
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json({ message: 'Project deleted successfully', project });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});



module.exports = router;
