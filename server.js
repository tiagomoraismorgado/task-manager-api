const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const userRoutes = require("./routes/userRoutes"); 
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();
const server = require("http").createServer(app); 
const io = require("socket.io")(server, { cors: { origin: "*" } });  // Enable Socket.io

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); 
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/projects", require("./routes/projectRoutes"));
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sign-up.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sign-in.html')));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "views", "dashboard.html")));
app.get("/projects", (req, res) => res.sendFile(path.join(__dirname, "views", "projects.html")));
app.get("/new_project", (req, res) => res.sendFile(path.join(__dirname, "views", "createProject.html")));

// Socket.io Setup
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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.error("Erreur de connexion à MongoDB:", err));

// Start Server
server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
