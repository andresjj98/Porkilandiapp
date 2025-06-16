const express = require('express');
const { body, param } = require('express-validator');
//const validate = require('../middleware/validateRequest');
const validate = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getAllPos, createPos, updatePos, deletePos
} = require('../models/posModel');

const router = express.Router();

// GET /api/pos
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),   // o solo 'admin' si prefieres
  async (req, res, next) => {
  try {
    res.json(await getAllPos());
  } catch (err) { next(err); }
});

// POST /api/pos
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  body('nombre').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { nombre, direccion, telefono } = req.body;
      const { id } = await createPos({ nombre, direccion, telefono });
      res.status(201).json({ message: 'POS creado', id });
    } catch (err) { next(err); }
  }
);

// PUT /api/pos/:id
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt(),
  body('nombre').optional().notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      await updatePos(req.params.id, req.body);
      res.json({ message: 'POS actualizado' });
    } catch (err) { next(err); }
  }
);

// DELETE /api/pos/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt(),
  validate,
  async (req, res, next) => {
    try {
      await deletePos(req.params.id);
      res.json({ message: 'POS eliminado' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
