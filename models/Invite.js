const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    inviterEmail: { type: String, required: true },
});

module.exports = mongoose.model("Invitation", invitationSchema);
