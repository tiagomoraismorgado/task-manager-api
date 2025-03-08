const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const userRoutes = require("./routes/user.routes"); 
const taskRoutes = require("./routes/task.routes");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const app = express();

const Task = require('./models/Task');
const server = require("http").createServer(app); 
const io = require("socket.io")(server, { cors: { origin: "*" } });  // socket.io
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/projects", projectRoutes);
app.use(express.static(path.join(__dirname, 'public')));


app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sign-up.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sign-in.html')));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "views", "dashboard.html")));
app.get("/projects", (req, res) => res.sendFile(path.join(__dirname, "views", "projects.html")));
app.get("/tasks", (req, res) => res.sendFile(path.join(__dirname, "views", "tasks.html")));
app.get("/myTasks", (req, res) => res.sendFile(path.join(__dirname, "views", "myTasks.html")));
app.get("/new_project", (req, res) => res.sendFile(path.join(__dirname, "views", "createProject.html")));

// Route pour afficher la page d'édition
app.get('/projects/edit/:id', (req, res) => {
 res.sendFile(path.join(__dirname, 'views', 'editProject.html'));
});
// Route pour afficher la page de détails project
app.get('/projects/details/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'projectDetails.html'));
});

app.get("/new", (req, res) => res.sendFile(path.join(__dirname, "views", "tasks.html")));
app.get("/delete", (req, res) => res.sendFile(path.join(__dirname, "views", "tasks.html")));
app.get("/update", (req, res) => res.sendFile(path.join(__dirname, "views", "tasks.html")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "views", "tasks.html")));


// socket.io Setup
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Listen for task updates
  socket.on("updateTask", (taskData) => {
    io.emit("taskUpdated", taskData); // Send update to all users
  });

  // Listen for new invitations
  socket.on("sendInvite", (inviteData) => {
    io.emit("newInvite", inviteData);
  });

  // Listen for notifications
  socket.on("sendNotification", (notificationData) => {
    io.emit("newNotification", notificationData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


app.get('/projects/:projectId/tasks', async (req, res) => {
  try {
      const projectId = req.params.projectId;
      const tasks = await Task.find({ project: projectId }).exec();  // Trouver toutes les tâches liées au projet
      res.json(tasks);  // Retourner les tâches sous forme de JSON
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la récupération des tâches.' });
  }
});






mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.error("Erreur de connexion à MongoDB:", err));


server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
