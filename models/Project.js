const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Owner
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Invited users
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }] // Tasks related to this project
});

module.exports = mongoose.model("Project", projectSchema);
