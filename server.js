const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");
const app = express();
const userRoutes = require("./routes/userRoutes"); 
const PORT = process.env.PORT || 3000
app.use(express.json()); 
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.post('/test', (req, res) => {
  console.log(req.body); 
  res.send(req.body); 
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sign-up.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sign-in.html'));
});
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.error(" Erreur de connexion à MongoDB :", err));



  app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

