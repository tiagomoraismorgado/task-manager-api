const express = require("express");
const router = express.Router();
const Task = require("../models/Task");// Assure-toi que ce chemin est correct

const app = express();
app.use(express.json()); // Pour parser le JSON

// 📌 Créer une nouvelle tâche
router.post("/new", async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la création de la tâche", error });
    }
});

// 📌 Récupérer toutes les tâches
router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find().populate("project assigned_to");
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des tâches", error });
    }
});

// 📌 Récupérer une tâche par ID
router.get("/:id", async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate("project assigned_to");
        if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la tâche", error });
    }
});

// 📌 Mettre à jour une tâche
router.put("/update/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la mise à jour de la tâche", error });
    }
});

// 📌 Supprimer une tâche
router.delete("/delete/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
        res.json({ message: "Tâche supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression de la tâche", error });
    }
});

module.exports = router;
