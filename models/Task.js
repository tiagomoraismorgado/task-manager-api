const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["Ongoing", "Completed", "Cancel"], default: "Ongoing" },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project"},

    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Task", taskSchema);
