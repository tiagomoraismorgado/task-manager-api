const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Accès refusé" });

  try {
    const decodedToken = jwt.decode(token); 
    console.log("Decoded Token:", decodedToken);

    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide", error: error.message });
  }
};
