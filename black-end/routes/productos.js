// routes/productos.js
const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} = require('../models/productoModel');

const router = express.Router();

// GET /api/productos (admin + operario)
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const productos = await getAllProductos();
      res.json(productos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  }
);

// GET /api/productos/:id (admin + operario)
router.get(
  '/:id',
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de producto debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const producto = await getProductoById(req.params.id);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(producto);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  }
);

// POST /api/productos (solo admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  body('nombre')
    .notEmpty().withMessage('El nombre del producto es requerido')
    .isString().withMessage('El nombre debe ser un texto'),
  validateRequest,
  async (req, res) => {
    try {
      const { nombre } = req.body;
      const { id } = await createProducto({ nombre });
      res.status(201).json({ message: 'Producto creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  }
);

// PUT /api/productos/:id (solo admin)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('El ID de producto debe ser un número entero'),
    body('nombre')
      .notEmpty().withMessage('El nombre del producto es requerido')
      .isString().withMessage('El nombre debe ser un texto'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { nombre } = req.body;
      await updateProducto(req.params.id, { nombre });
      res.json({ message: 'Producto actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  }
);

// DELETE /api/productos/:id (solo admin)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt().withMessage('El ID de producto debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteProducto(req.params.id);
      res.json({ message: 'Producto eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
);

module.exports = router;
