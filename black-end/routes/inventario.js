// routes/inventario.js
const express = require('express');
const { param, body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllInventario,
  getInventarioById,
  createInventario,
  updateInventario,
  deleteInventario,
  getInventarioResumen,
  getInventarioDetalles
} = require('../models/inventarioModel');

const router = express.Router();

// GET /api/inventario  (admin + operario)
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const list = await getAllInventario();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  }
);

// GET /api/inventario/resumen
router.get(
  '/resumen',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const data = await getInventarioResumen();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener resumen de inventario' });
    }
  }
);

// GET /api/inventario/detalles
router.get(
  '/detalles',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const data = await getInventarioDetalles();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener detalles de inventario' });
    }
  }
);

// GET /api/inventario/:id  (admin + operario)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de inventario debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const item = await getInventarioById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Inventario no encontrado' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  }
);

// POST /api/inventario  (admin + operario)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    body('id_producto')
      .notEmpty().withMessage('El ID de producto es requerido')
      .isInt().withMessage('El ID de producto debe ser un número entero'),
    body('cantidad')
      .notEmpty().withMessage('La cantidad es requerida')
      .isInt({ gt: 0 }).withMessage('La cantidad debe ser un entero mayor que 0'),
    body('peso_total')
      .notEmpty().withMessage('El peso total es requerido')
      .isFloat({ gt: 0 }).withMessage('El peso total debe ser un número mayor que 0'),
    body('estado')
      .optional()
      .isIn(['disponible', 'comprometido', 'despachado'])
      .withMessage('Estado no válido'),
    body('origen')
      .optional()
      .isString().withMessage('El origen debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id_producto, cantidad, peso_total, estado, origen } = req.body;
      const { id } = await createInventario({ id_producto, cantidad, peso_total, estado, origen });
      res.status(201).json({ message: 'Inventario creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear inventario' });
    }
  }
);

// PUT /api/inventario/:id  (admin + operario)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    param('id').isInt().withMessage('El ID de inventario debe ser un número entero'),
    body('id_producto').optional().isInt().withMessage('El ID de producto debe ser un entero'),
    body('cantidad').optional().isInt({ gt: 0 }).withMessage('La cantidad debe ser un entero mayor que 0'),
    body('peso_total').optional().isFloat({ gt: 0 }).withMessage('El peso total debe ser un número mayor que 0'),
    body('estado').optional().isIn(['disponible','comprometido','despachado'])
      .withMessage('Estado no válido'),
    body('origen').optional().isString().withMessage('El origen debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
      await updateInventario(req.params.id, req.body);
      res.json({ message: 'Inventario actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar inventario' });
    }
  }
);

// DELETE /api/inventario/:id  (admin + operario)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de inventario debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteInventario(req.params.id);
      res.json({ message: 'Inventario eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar inventario' });
    }
  }
);

module.exports = router;
