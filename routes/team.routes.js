const express = require('express');
const jwt = require('jsonwebtoken'); // To verify the JWT token
const Team = require('../models/Team');
const User = require('../models/User');

const router = express.Router();

// Middleware to check for the token and decode it
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from the Authorization header

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.id; // Store the user ID from the token
    next(); // Allow the request to proceed to the next handler
  });
};

// Apply the authentication middleware to the /getUsers route
router.get('/getUsers', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }); // Exclude the logged-in user
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
router.post('/add-member', authenticate, async (req, res) => {
  try {
      console.log('Request body:', req.body);
      const { memberId } = req.body;
      if (!memberId) {
          return res.status(400).json({ success: false, message: 'Member ID is required' });
      }

      // Check if the user exists
      const user = await User.findById(memberId);
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Find or create a team for the logged-in user
      let team = await Team.findOne({ createdBy: req.userId });
      if (!team) {
          team = new Team({
              createdBy: req.userId,
              members: [],
          });
      }

      // Add the member if not already present
      if (!team.members.includes(memberId)) {
          team.members.push(memberId);
          await team.save();
          res.status(200).json({ success: true, message: 'Member added successfully', team });
      } else {
          res.status(400).json({ success: false, message: 'Member already exists in the team' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error adding member to the team' });
  }
});

router.get('/members', authenticate, async (req, res) => {
  try {
    const team = await Team.findOne({ owner: req.userId }).populate('members');

    if (!team) {
      return res.json([]); // No team found
    }

    res.json(team.members); // Return team members
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});




module.exports = router;
