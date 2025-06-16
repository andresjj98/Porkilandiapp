// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token malformado' });
  }

  const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });
    // Adjuntamos datos del usuario al request
    req.user = {
      id: decoded.id_usuario,
      nombre_usuario: decoded.nombre_usuario,
      rol: decoded.rol
    };
    next();
  });
}

module.exports = verifyToken;
