const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    inviterEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Invitation", invitationSchema);
