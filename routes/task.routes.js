const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware'); // Your authentication middleware
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');


router.get('/members', authenticate, async (req, res) => {
    try {
        const team = await Team.findOne({ createdBy: req.userId }).populate('members');
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found for this user' });
        }
        res.json(team.members);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/new', authenticate, async (req, res) => {
    const { title, priority, dueDate, description, assigned_to, projectId } = req.body;
    try {
        if (!title || !priority || !dueDate || !description || !assigned_to || !projectId) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const user = await User.findById(assigned_to);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const team = await Team.findOne({ createdBy: req.userId });
        if (!team || !team.members.includes(assigned_to)) {
            return res.status(400).json({ success: false, message: 'Assigned user is not a member of your team' });
        }
        const newTask = new Task({
            title,
            priority,
            dueDate,
            description,
            assigned_to,
            project: projectId,
            status: "ToDo",
        });
        await newTask.save();
        res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
    }
});

router.get('/project/:projectId', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const team = await Team.findOne({ createdBy: req.userId }).populate('members');
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found for this user' });
        }

        // Extract member IDs from the team
        const memberIds = team.members.map(member => member._id);

        const tasks = await Task.find({
            project: projectId,
            assigned_to: { $in: memberIds }, // Filter tasks where assigned_to is a member of the team
        })
            .populate('assigned_to', 'username') // Populate the User document's username
            .lean();

        console.log('Fetched tasks with assigned_to:', tasks);

        const groupedTasks = {
            ToDo: tasks.filter(task => task.status === 'ToDo'),
            Progress: tasks.filter(task => task.status === 'Progress'), // Updated to match schema
            Review: tasks.filter(task => task.status === 'Review'),    // Updated to match schema
            Done: tasks.filter(task => task.status === 'Done'),
        };

        res.json({ success: true, tasks: groupedTasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});
router.patch('/update-status/:taskId', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        const validStatuses = ['ToDo', 'Progress', 'Review', 'Done'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const team = await Team.findOne({ createdBy: req.userId });
        if (!team || !team.members.includes(task.assigned_to)) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update this task' });
        }

        task.status = status;
        await task.save();

        res.json({ success: true, message: 'Task status updated successfully', task });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});
// Get task details
router.get('/:taskId', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Use req.userId or fallback to req.user.id
        const userId = req.userId || (req.user && req.user.id);
        if (!userId) {
            console.log('No user ID in request');
            return res.status(401).json({ success: false, message: 'No user ID found in token' });
        }
        console.log('Logged-in User ID:', userId);

        const task = await Task.findById(taskId)
            .populate('assigned_to', 'username')
            .populate('project');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        console.log('Task Assigned To:', task.assigned_to._id.toString());

        // Fetch the project and its admin
        const project = await Project.findById(task.project).populate('admin');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        console.log('Project Admin:', project.admin._id.toString());

        // Check if the logged-in user is the project admin or the assigned user
        const isAdmin = project.admin._id.toString() === userId;
        const isAssigned = task.assigned_to._id.toString() === userId;

        console.log('Is Admin:', isAdmin, 'Is Assigned:', isAssigned);

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are neither the project admin nor the assigned user' });
        }

        // Update the project tasks array if not already present
        if (!project.tasks.includes(task._id)) {
            project.tasks.push(task._id);
            await project.save();
            console.log(`Added task ${task._id} to project ${project._id} tasks array`);
        }

        res.json({ success: true, task });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update task (edit)
router.patch('/:taskId', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, priority, dueDate, description, assigned_to } = req.body;

        // Use req.userId or fallback to req.user.id
        const userId = req.userId || (req.user && req.user.id);
        if (!userId) {
            console.log('No user ID in request');
            return res.status(401).json({ success: false, message: 'No user ID found in token' });
        }
        console.log('Logged-in User ID:', userId);

        const task = await Task.findById(taskId)
            .populate('assigned_to', 'username')
            .populate('project');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        console.log('Task Assigned To:', task.assigned_to._id.toString());

        // Fetch the project and its admin
        const project = await Project.findById(task.project).populate('admin');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        console.log('Project Admin:', project.admin._id.toString());

        // Check if the logged-in user is the project admin or the assigned user
        const isAdmin = project.admin._id.toString() === userId;
        const isAssigned = task.assigned_to._id.toString() === userId;

        console.log('Is Admin:', isAdmin, 'Is Assigned:', isAssigned);

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are neither the project admin nor the assigned user' });
        }

        // Update task fields if provided
        if (title) task.title = title;
        if (priority) task.priority = priority;
        if (dueDate) task.dueDate = new Date(dueDate);
        if (description) task.description = description;
        if (assigned_to) task.assigned_to = assigned_to;

        await task.save();

        res.json({ success: true, message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Delete task
router.delete('/:taskId', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Use req.userId or fallback to req.user.id
        const userId = req.userId || (req.user && req.user.id);
        if (!userId) {
            console.log('No user ID in request');
            return res.status(401).json({ success: false, message: 'No user ID found in token' });
        }
        console.log('Logged-in User ID:', userId);

        const task = await Task.findById(taskId)
            .populate('assigned_to', 'username')
            .populate('project');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        console.log('Task Assigned To:', task.assigned_to._id.toString());

        // Fetch the project and its admin
        const project = await Project.findById(task.project).populate('admin');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        console.log('Project Admin:', project.admin._id.toString());

        // Check if the logged-in user is the project admin or the assigned user
        const isAdmin = project.admin._id.toString() === userId;
        const isAssigned = task.assigned_to._id.toString() === userId;

        console.log('Is Admin:', isAdmin, 'Is Assigned:', isAssigned);

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are neither the project admin nor the assigned user' });
        }

        await Task.deleteOne({ _id: taskId });

        // Remove task from project tasks array
        if (project.tasks.includes(task._id)) {
            project.tasks.pull(task._id);
            await project.save();
            console.log(`Removed task ${task._id} from project ${project._id} tasks array`);
        }

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update task status and project status
router.patch('/update-status/:taskId', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        // Use req.userId or fallback to req.user.id
        const userId = req.userId || (req.user && req.user.id);
        if (!userId) {
            console.log('No user ID in request');
            return res.status(401).json({ success: false, message: 'No user ID found in token' });
        }
        console.log('Logged-in User ID:', userId);

        const validStatuses = ['ToDo', 'Progress', 'Review', 'Done'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const task = await Task.findById(taskId)
            .populate('assigned_to', 'username')
            .populate('project');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        console.log('Task Assigned To:', task.assigned_to._id.toString());

        // Fetch the project and its admin
        const project = await Project.findById(task.project).populate('admin');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        console.log('Project Admin:', project.admin._id.toString());

        // Check if the logged-in user is the project admin or the assigned user
        const isAdmin = project.admin._id.toString() === userId;
        const isAssigned = task.assigned_to._id.toString() === userId;

        console.log('Is Admin:', isAdmin, 'Is Assigned:', isAssigned);

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are neither the project admin nor the assigned user' });
        }

        // Update task status
        task.status = status;
        await task.save();

        // Update project tasks array if not already present
        if (!project.tasks.includes(task._id)) {
            project.tasks.push(task._id);
            await project.save();
            console.log(`Added task ${task._id} to project ${project._id} tasks array`);
        }

        // Update project status
        const tasks = await Task.find({ project: project._id });
        if (tasks.length === 0) {
            return res.json({ success: true, message: 'Task status updated, but no tasks to determine project status', task });
        }

        const allDone = tasks.every(t => t.status === 'Done');
        const hasProgressOrReview = tasks.some(t => t.status === 'Progress' || t.status === 'Review');

        let newProjectStatus = 'Ongoing';
        if (allDone) {
            newProjectStatus = 'Completed';
        } else if (hasProgressOrReview) {
            newProjectStatus = 'Ongoing';
        }

        if (project.status !== newProjectStatus) {
            project.status = newProjectStatus;
            await project.save();
            console.log(`Project ${project._id} status updated to ${newProjectStatus}`);
        }

        res.json({ success: true, message: 'Task status updated successfully', task, projectStatus: newProjectStatus });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;