const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: {type: String},
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Ongoing", "Completed", "Cancelled"], default: "Ongoing" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }]
});

module.exports = mongoose.model("Project", projectSchema);
