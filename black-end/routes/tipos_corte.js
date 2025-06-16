// routes/tipos_corte.js
const express = require('express');
const { body, param, query} = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
//const authorizeRoles = require('../middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllTiposCorte,
  getTipoCorteById,
  createTipoCorte,
  updateTipoCorte,
  getTiposByProducto, 
  deleteTipoCorte
} = require('../models/tipoCorteModel');

const router = express.Router();

// GET /api/tipos_corte (admin + operario)
router.get(
  '/',
  authorizeRoles('admin', 'operario'),
  query('producto').optional().isInt().withMessage('El ID de producto debe ser un entero'),
  async (req, res) => {
    try {
      const { producto } = req.query;
      let list;
      if (producto) {
        // Necesitamos un modelo que filtre por producto:
        list = await getTiposByProducto(producto);
      } else {
        list = await getAllTiposCorte();
      }
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener tipos de corte' });
    }
  }
);

// GET /api/tipos_corte/:id (admin + operario)
router.get(
  '/:id',
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de tipo de corte debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const item = await getTipoCorteById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Tipo de corte no encontrado' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener tipo de corte' });
    }
  }
);

// POST /api/tipos_corte (solo admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    body('nombre_corte')
      .notEmpty().withMessage('El nombre de corte es requerido')
      .isString().withMessage('El nombre de corte debe ser un texto'),
    body('id_producto')
      .notEmpty().withMessage('El ID de producto es requerido')
      .isInt().withMessage('El ID de producto debe ser un número entero')
  ],
  validateRequest,
  async (req, res) => {
    try {
     // 1) Extraemos del body
     const { nombre_corte, id_producto } = req.body;
     // 2) Lo creamos en BD
     const { id } = await createTipoCorte({ nombre_corte, id_producto });
     // 3) Respondemos con el nuevo id
     res.status(201).json({ message: 'Tipo de corte creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear tipo de corte' });
    }
  }
);

// PUT /api/tipos_corte/:id (solo admin)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('El ID de tipo de corte debe ser un número entero'),
    body('nombre_corte')
      .notEmpty().withMessage('El nombre de corte es requerido')
      .isString().withMessage('El nombre de corte debe ser un texto'),
    body('id_producto')
      .notEmpty().withMessage('El ID de producto es requerido')
      .isInt().withMessage('El ID de producto debe ser un número entero')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { nombre_corte, id_producto } = req.body;
      await updateTipoCorte(req.params.id, { nombre_corte, id_producto });
      res.json({ message: 'Tipo de corte actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar tipo de corte' });
    }
  }
);

// DELETE /api/tipos_corte/:id (solo admin)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  param('id').isInt().withMessage('El ID de tipo de corte debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteTipoCorte(req.params.id);
      res.json({ message: 'Tipo de corte eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar tipo de corte' });
    }
  }
);

module.exports = router;
