// routes/ordenes.js
const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  deleteOrden
} = require('../models/ordenModel');
const { getDetalleByOrden } = require('../models/detalleOrdenModel');

const { comprometerInventario, despacharInventario, devolverInventario } = require('../models/inventarioModel');
const router = express.Router();

// GET /api/ordenes  (admin + operario)
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  async (req, res) => {
    try {
      const list = await getAllOrdenes();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener órdenes' });
    }
  }
);

// GET /api/ordenes/:id  (admin + operario)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de orden debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const ord = await getOrdenById(req.params.id);
      if (!ord) return res.status(404).json({ error: 'Orden no encontrada' });
      res.json(ord);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener orden' });
    }
  }
);

// POST /api/ordenes  (admin + operario)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    body('codigo_orden')
      .notEmpty().withMessage('El código de orden es requerido'),
    body('fecha_orden')
      .notEmpty().withMessage('La fecha de orden es requerida')
      .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
    body('id_usuario')
      .notEmpty().withMessage('El ID de usuario es requerido')
      .isInt().withMessage('El ID de usuario debe ser un número entero'),
    body('id_pos')
      .optional()
      .isInt().withMessage('El ID de punto de venta debe ser un número entero'),
    body('estado')
      .optional()
      .isIn(['pendiente','enviada','entregada'])
      .withMessage('Estado no válido')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { codigo_orden, fecha_orden, id_usuario, id_pos, estado } = req.body;
      const { id } = await createOrden({ codigo_orden, fecha_orden, id_usuario, id_pos, estado });
      res.status(201).json({ message: 'Orden creada', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear orden' });
    }
  }
);

// PUT /api/ordenes/:id  (admin + operario)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    param('id').isInt().withMessage('El ID de orden debe ser un número entero'),
    body('codigo_orden')
      .optional(),
    body('fecha_orden')
      .optional()
      .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
    body('id_usuario')
      .optional()
      .isInt().withMessage('El ID de usuario debe ser un número entero'),
    body('id_pos')
      .optional()
      .isInt().withMessage('El ID de punto de venta debe ser un número entero'),
    body('estado')
      .optional()
      .isIn(['pendiente','enviada','entregada'])
      .withMessage('Estado no válido')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const prev = await getOrdenById(req.params.id);
      await updateOrden(req.params.id, req.body);
     if (req.body.estado && req.body.estado !== prev.estado) {
        const detalles = await getDetalleByOrden(req.params.id);
        const origen = `orden:${req.params.id}`;

        if (['pendiente','enviada'].includes(req.body.estado)) {
          for (const det of detalles) {
            if (prev.estado === 'entregada') {
              await devolverInventario(det.id_producto, det.cantidad, det.peso_total, null);
            } else {
              await comprometerInventario(det.id_producto, det.cantidad, det.peso_total, origen);
            }
          }
        }

        if (req.body.estado === 'entregada') {
          for (const det of detalles) {
            await despacharInventario(det.id_producto, det.cantidad, det.peso_total, origen);
          }
        }
      }
      
      res.json({ message: 'Orden actualizada' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar orden' });
    }
  }
);

// DELETE /api/ordenes/:id  (admin + operario)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de orden debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {      
      await deleteOrden(req.params.id);
      res.json({ message: 'Orden eliminada' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar orden' });
    }
  }
);

module.exports = router;
