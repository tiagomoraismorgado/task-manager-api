const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const userRoutes = require("./routes/user.routes"); 
const taskRoutes = require("./routes/task.routes");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const app = express();
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
app.get("/new_project", (req, res) => res.sendFile(path.join(__dirname, "views", "createProject.html")));
// Route pour afficher la page d'édition
app.get('/projects/edit/:id', (req, res) => {
 res.sendFile(path.join(__dirname, 'views', 'editProject.html'));
});
// Route pour afficher la page de détails project
app.get('/projects/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'projectDetails.html'));
});

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


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.error("Erreur de connexion à MongoDB:", err));


server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
