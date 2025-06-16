// middleware/roleMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/* ─────────────────────────────────────────────────────────────
 * 1)  Autenticación: exige un JWT y lo guarda en req.user
 * ──────────────────────────────────────────────────────────── */
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const [bearer, token] = auth.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token faltante o malformado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;            // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/* ─────────────────────────────────────────────────────────────
 * 2)  Autorización: permite solo si el rol está en la lista
 * ──────────────────────────────────────────────────────────── */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase();   // ojo: role, no rol
    const ok   = allowedRoles.map(r => r.toLowerCase()).includes(role);

    if (!ok) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

/* ─────────────────────────────────────────────────────────────
 * 3)  Exportar las DOS funciones
 * ──────────────────────────────────────────────────────────── */
module.exports = { verifyToken, authorizeRoles };
