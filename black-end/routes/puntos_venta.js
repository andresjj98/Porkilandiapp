// routes/puntos_venta.js
const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
   getAllPos,
   getPosById,
   createPos,
   updatePos,
   deletePos
} = require('../models/puntoVentaModel');

const router = express.Router();

// GET /api/puntos_venta
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const list = await getAllPos();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener puntos de venta' });
    }
  }
);

// GET /api/puntos_venta/:id
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID debe ser numérico'),
  validateRequest,
  async (req, res) => {
    try {
      const pv = await getPosById(req.params.id);
      if (!pv) return res.status(404).json({ error: 'Punto de venta no encontrado' });
      res.json(pv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener punto de venta' });
    }
  }
);

// POST /api/puntos_venta
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('direccion').optional()
  ],
  validateRequest,
  async (req, res) => {
     async (req, res) => {
    console.log('POST /puntos_venta body:', req.body);
    const { nombre, direccion } = req.body;
    const { id } = await createPos({ nombre, direccion });
    res.status(201).json({ id });
  }
    try {
      const { nombre, direccion } = req.body;
      const { id } = await createPos({ nombre, direccion });
      res.status(201).json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear punto de venta' });
    }
  }
);

// PUT /api/puntos_venta/:id
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('El ID debe ser numérico'),
    body('nombre').optional().notEmpty(),
    body('direccion').optional()
  ],
  validateRequest,
  async (req, res) => {
    try {
      await updatePos(req.params.id, req.body);
      res.json({ message: 'Punto de venta actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar punto de venta' });
    }
  }
);

// DELETE /api/puntos_venta/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt().withMessage('El ID debe ser numérico'),
  validateRequest,
  async (req, res) => {
    try {
      await deletePos(req.params.id);
      res.json({ message: 'Punto de venta eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar punto de venta' });
    }
  }
);

module.exports = router;
