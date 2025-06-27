// routes/detalle_orden.js
const express = require('express');
const { query, param, body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllDetalleOrden,
  getDetalleByOrden,
  getDetalleOrdenById,
  createDetalleOrden,
  updateDetalleOrden,
  deleteDetalleOrden
} = require('../models/detalleOrdenModel');

const router = express.Router();

// GET /api/detalle_orden?orden=ID (admin + operario)
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  query('orden')
    .optional()
    .isInt().withMessage('El ID de orden debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      if (req.query.orden) {
        const list = await getDetalleByOrden(req.query.orden);
        return res.json(list);
      }
      const list = await getAllDetalleOrden();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener detalles de orden' });
    }
  }
);

// GET /api/detalle_orden/:id (admin + operario)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de detalle debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const det = await getDetalleOrdenById(req.params.id);
      if (!det) return res.status(404).json({ error: 'Detalle no encontrado' });
      res.json(det);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener detalle de orden' });
    }
  }
);

// POST /api/detalle_orden (admin + operario)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    body('id_orden')
      .notEmpty().withMessage('El ID de orden es requerido')
      .isInt().withMessage('El ID de orden debe ser un número entero'),
    body('id_tipo_corte')
      .notEmpty().withMessage('El ID de tipo de corte es requerido')
      .isInt().withMessage('El ID de tipo de corte debe ser un número entero'),
    body('cantidad')
      .notEmpty().withMessage('La cantidad es requerida')
      .isInt({ gt: 0 }).withMessage('La cantidad debe ser un entero mayor que 0'),
    body('peso_total')
      .notEmpty().withMessage('El peso total es requerido')
      .isFloat({ gt: 0 }).withMessage('El peso total debe ser un número mayor que 0')
  ],
  validateRequest,
  async (req, res) => {
    try {
     const { id_orden, id_tipo_corte, cantidad, peso_total } = req.body;
      const { id } = await createDetalleOrden({ id_orden, id_tipo_corte, cantidad, peso_total });
      res.status(201).json({ message: 'Detalle de orden creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear detalle de orden' });
    }
  }
);

// PUT /api/detalle_orden/:id (admin + operario)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    param('id').isInt().withMessage('El ID de detalle debe ser un número entero'),
    body('id_orden').optional().isInt().withMessage('El ID de orden debe ser un número entero'),
    body('id_tipo_corte').optional().isInt().withMessage('El ID de tipo de corte debe ser un número entero'),
    body('cantidad').optional().isInt({ gt: 0 }).withMessage('La cantidad debe ser un entero mayor que 0'),
    body('peso_total').optional().isFloat({ gt: 0 }).withMessage('El peso total debe ser un número mayor que 0')
  ],
  validateRequest,
  async (req, res) => {
    try {
      await updateDetalleOrden(req.params.id, req.body);
      res.json({ message: 'Detalle de orden actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar detalle de orden' });
    }
  }
);

// DELETE /api/detalle_orden/:id (admin + operario)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de detalle debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteDetalleOrden(req.params.id);
      res.json({ message: 'Detalle de orden eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar detalle de orden' });
    }
  }
);

module.exports = router;
