// routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
require('dotenv').config();

const router = express.Router();

/**
 * POST /api/auth/login
 * Body  ➜ { nombre_usuario | username, contraseña | password }
 * Res   ➜ { token, user : { id, username, role } }
 */
router.post('/login', async (req, res) => {
  /* -------------------------------------------------------------
   * 1) Normalizar campos que puedan llegar en castellano o inglés
   * ----------------------------------------------------------- */
  const username = req.body.username || req.body.username;
  const rawPwd   = req.body.contraseña      || req.body.password;

  if (!username || !rawPwd) {
    return res
      .status(400)
      .json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    /* -------------------------------------------------------------
     * 2) Traer usuario + rol (JOIN con tabla roles)
     * ----------------------------------------------------------- */
     const [rows] = await db.query(
      `SELECT  u.id_usuario    AS id,
               u.username      AS username,
               u.contraseña      AS hash,     /* ← aquí */
               r.nombre        AS role
         FROM  usuarios u
        JOIN  roles    r ON r.id = u.rol_id  /* ajusta el FK si tu columna de roles se llama distinto */
        WHERE  u.username = ?`,
      [username]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    /* -------------------------------------------------------------
     * 3) Comparar contraseña
     * ----------------------------------------------------------- */
    const ok = await bcrypt.compare(rawPwd, user.hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    /* -------------------------------------------------------------
     * 4) Firmar JWT
     * ----------------------------------------------------------- */
    const payload = { id: user.id, username: user.username, role: user.role };
    const token   = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    /* -------------------------------------------------------------
     * 5) Responder
     * ----------------------------------------------------------- */
    res.json({ token, user: payload });
  } catch (err) {
    console.error('[AUTH] /login →', err);
    res.status(500).json({ error: 'Error interno en autenticación' });
  }
});

module.exports = router;
