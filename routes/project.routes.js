const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User"); 
const Invitation = require("../models/Invitation");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/new", authMiddleware, async (req, res) => {
  try {
      const { name, description, start_date, end_date, priority, status } = req.body;

      // Create the new project (without collaborators initially)
      const newProject = new Project({
          name,
          description,
          start_date,
          end_date,
          priority,
          status,
          admin: req.user.id,
      });

      await newProject.save();
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


// GET /api/projects/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("collaborators", "email") // Optionnel : Récupère les e-mails des collaborateurs
      .exec();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Vérifie que l'utilisateur est l'admin ou un collaborateur
    if (project.admin.toString() !== req.user.id && !project.collaborators.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not authorized to view this project" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ message: "Error fetching project details", error: error.message });
  }
});


  //edit project
  router.put("/edit/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params; // ID du projet à modifier
      const { name, description, start_date, end_date, priority, status, collaborators } = req.body;
  
      // Vérifier si le projet existe
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
  
      // Vérifier si l'utilisateur est l'admin du projet
      if (project.admin.toString() !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to edit this project" });
      }
  
      // Mettre à jour les champs du projet
      project.name = name || project.name;
      project.description = description || project.description;
      project.start_date = start_date || project.start_date;
      project.end_date = end_date || project.end_date;
      project.priority = priority || project.priority;
      project.status = status || project.status;
  
      // Gestion des collaborateurs
      if (collaborators && collaborators.length > 0) {
        const newCollaborators = [];
        for (const email of collaborators) {
          const user = await User.findOne({ email });
          if (user) {
            newCollaborators.push(user._id);
  
            // Vérifier si une invitation existe déjà pour cet utilisateur
            const existingInvitation = await Invitation.findOne({
              project: project._id,
              inviteeEmail: email,
            });
  
            if (!existingInvitation) {
              // Créer une nouvelle invitation
              const newInvitation = new Invitation({
                project: project._id,
                inviterEmail: req.user.email,
                inviteeEmail: email,
              });
              await newInvitation.save();
            }
          } else {
            console.warn(`User with email ${email} not found. Skipping invitation.`);
          }
        }
  
        // Mettre à jour la liste des collaborateurs
        project.collaborators = [...new Set([...project.collaborators, ...newCollaborators])];
      }
  
      // Sauvegarder les modifications
      await project.save();
  
      res.status(200).json({ message: "Project updated successfully", project });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Error updating project", error: error.message });
    }
  });

//delete project
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
