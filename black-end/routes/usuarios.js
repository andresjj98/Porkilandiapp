// routes/usuarios.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const { body, param } = require('express-validator');
const db      = require('../config/db');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
} = require('../models/usuarioModel');

const router = express.Router();

/* -----------------------------------------------------------
   LISTAR TODOS
----------------------------------------------------------- */
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const usuarios = await getAllUsuarios();
      res.json(usuarios);
    } catch (err) {
      console.error('ERROR al listar usuarios:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }
);

/* -----------------------------------------------------------
   OBTENER UNO
----------------------------------------------------------- */
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID debe ser numérico'),
  validateRequest,
  async (req, res) => {
    try {
      const usuario = await getUsuarioById(req.params.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(usuario);
    } catch (err) {
      console.error('ERROR al obtener usuario:', err);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  }
);

/* -----------------------------------------------------------
   CREAR
----------------------------------------------------------- */
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  [
    body('nombre').notEmpty(),
    body('numero_id').notEmpty(),
    body('username').notEmpty(),
    body('correo').notEmpty(),
    body('password').isLength({ min: 6 }),
    body('rol').isIn(['admin', 'operario', 'punto_venta'])   
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { nombre, numero_id, username, correo, password, rol} = req.body;
      /* ---------- 2. Obtener rol_id a partir del nombre de rol ---------- */
    const [rRows] = await db.query(
      'SELECT id FROM roles WHERE nombre = ?',
      [rol.toLowerCase()]                             // 'admin' | 'operario' | ...
    );
    if (!rRows.length) {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    const rol_id = rRows[0].id;

    /* ---------- 3. Hashear la contraseña ---------- */
    const hash = await bcrypt.hash(password, 10);

    /* ---------- 4. Insertar usuario ---------- */
    const { id } = await createUsuario({
      nombre,
      numero_id,
      username,
      correo,
      contraseña: hash,
      rol_id               // <─ NUEVO nombre de columna    
    });

    /* ---------- 5. Responder ---------- */
    return res.status(201).json({
      id,
      nombre,
      role: rol
    });
      
    } catch (err) {
      console.error('ERROR al crear usuario:', err);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
);

/* -----------------------------------------------------------
   ACTUALIZAR
----------------------------------------------------------- */
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  [
    param('id').isInt(),
    body('nombre').optional().notEmpty(),
    body('numero_id').optional().notEmpty(),
    body('username').optional().notEmpty(),
    body('correo').optional().notEmpty(),
    body('password').optional().isLength({ min: 6 }),
    body('rol').optional().isIn(['admin', 'operario', 'punto_venta'])    
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { password, rol, ...rest } = req.body;
      /* ---- 1. Si viene rol, buscar su rol_id ---- */
    if (rol) {
      const [rRows] = await db.query(
        'SELECT id FROM roles WHERE nombre = ?',
        [rol.toLowerCase()]
      );
      if (!rRows.length) {
        return res.status(400).json({ error: 'Rol no válido' });
      }
      rest.rol_id = rRows[0].id;
    }

    /* ---- 2. Si viene password, generar hash ---- */
    if (password) {
      rest.password_hash = await bcrypt.hash(password, 10);
    }

    /* ---- 3. Actualizar usuario ---- */
    await updateUsuario(req.params.id, rest);
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error('ERROR al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
  }
);

/* -----------------------------------------------------------
   ELIMINAR
----------------------------------------------------------- */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt(),
  validateRequest,
  async (req, res) => {
    try {
      await deleteUsuario(req.params.id);
      res.json({ message: 'Usuario eliminado' });
    } catch (err) {
      console.error('ERROR al eliminar usuario:', err);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
);

module.exports = router;
