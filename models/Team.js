const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
    members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,  // made optional
      },
      project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false,  // made optional
      },
});

module.exports = mongoose.model("Team", teamSchema);