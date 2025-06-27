// routes/tipo_carne.js
const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllTiposCarne,
  getTipoCarneById,
  createTipoCarne,
  updateTipoCarne,
  deleteTipoCarne
} = require('../models/tipoCarneModel');

const router = express.Router();

// GET /api/tipo_carne
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const tipos = await getAllTiposCarne();
      res.json(tipos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener tipos de carne' });
    }
  }
);

// GET /api/tipo_carne/:id
router.get(
  '/:id',
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de tipo de carne debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const tipo = await getTipoCarneById(req.params.id);
      if (!tipo) return res.status(404).json({ error: 'Tipo de carne no encontrado' });
      res.json(tipo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener tipo de carne' });
    }
  }
);

// POST /api/tipo_carne
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser un texto'),
  validateRequest,
  async (req, res) => {
    try {
      const { nombre } = req.body;
      const { id } = await createTipoCarne({ nombre });
      res.status(201).json({ message: 'Tipo de carne creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear tipo de carne' });
    }
  }
);

// PUT /api/tipo_carne/:id
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('El ID de tipo de carne debe ser un número entero'),
    body('nombre')
      .notEmpty().withMessage('El nombre es requerido')
      .isString().withMessage('El nombre debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { nombre } = req.body;
      await updateTipoCarne(req.params.id, { nombre });
      res.json({ message: 'Tipo de carne actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar tipo de carne' });
    }
  }
);

// DELETE /api/tipo_carne/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt().withMessage('El ID de tipo de carne debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteTipoCarne(req.params.id);
      res.json({ message: 'Tipo de carne eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar tipo de carne' });
    }
  }
);

module.exports = router;