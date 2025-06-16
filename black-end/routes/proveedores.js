// routes/proveedores.js
const express = require('express');
const { param, body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllProveedores,
  getProveedorById,
  createProveedor,
  deleteProveedor
} = require('../models/proveedorModel');

const router = express.Router();

// GET /api/proveedores (admin + operario)
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
    try {
      const proveedores = await getAllProveedores();
      res.json(proveedores);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  }
);

// GET /api/proveedores/:id (admin + operario)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de proveedor debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const proveedor = await getProveedorById(req.params.id);
      if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
      res.json(proveedor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener proveedor' });
    }
  }
);

// POST /api/proveedores (solo admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    body('nombre')
      .notEmpty().withMessage('El nombre del proveedor es requerido')
      .isString().withMessage('El nombre debe ser un texto'),
    body('contacto')
      .notEmpty().withMessage('El contacto es requerido')
      .isString().withMessage('El contacto debe ser un texto válido'),
  ],
  validateRequest,
  async (req, res) => {
    console.log('POST /proveedores:', req.body);
    try {
      const { nombre, contacto } = req.body;
      const { id } = await createProveedor({ nombre, contacto });
      res.status(201).json({ message: 'Proveedor creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear proveedor' });
    }
  }
);
// DELETE /api/proveedores/:id (solo admin)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt().withMessage('El ID de proveedor debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteProveedor(req.params.id);
      res.json({ message: 'Proveedor eliminado con éxito' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
);
module.exports = router;
