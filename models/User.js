const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, max: 255 },
    email: { type: String, required: true, unique: true, min: 6, max: 255 },
    password: { type: String, required: true, min: 6, max: 1024 },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invitation" }]
});

module.exports = mongoose.model("User", userSchema);
