const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Accès non autorisé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;  // Ajoute l'ID de l'utilisateur à la requête
    next();
  } catch (error) {
    res.status(400).json({ error: "Token invalide" });
  }
};

module.exports = authMiddleware;
