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
  createTipoCorteVinculado,
  updateTipoCorte,
  getTiposByCarne,
  deleteTipoCorte
} = require('../models/tipoCorteModel');

const router = express.Router();

// GET /api/tipos_corte (admin + operario)
router.get(
  '/',
  authorizeRoles('admin', 'operario'),
  query('carne').optional().isInt().withMessage('El ID de tipo de carne debe ser un entero'),
  async (req, res) => {
    try {
      const { carne } = req.query;
      let list;
     if (carne) {
        list = await getTiposByCarne(carne);
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
      .isString().withMessage('El nombre de corte debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
     const { nombre_corte } = req.body;
     const { id } = await createTipoCorte({ nombre_corte });
     // 3) Respondemos con el nuevo id
     res.status(201).json({ message: 'Tipo de corte creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear tipo de corte' });
    }
  }
);
// POST /api/tipos_corte/crear - crea y vincula con tipo de carne
router.post(
  '/crear',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    body('id_tipo_carne')
      .notEmpty().withMessage('El tipo de carne es requerido')
      .isInt().withMessage('El tipo de carne debe ser numérico'),
    body('nombre_corte')
      .notEmpty().withMessage('El nombre de corte es requerido')
      .isString().withMessage('El nombre de corte debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id_tipo_carne, nombre_corte } = req.body;
      const { id_tipo_corte } = await createTipoCorteVinculado({ id_tipo_carne, nombre_corte });
      res.status(201).json({ message: 'Tipo de corte creado', id_tipo_corte });
    } catch (err) {
      if (err.code === 'DUPLICATE_COMBO') {
        return res.status(400).json({ error: 'La combinación carne y corte ya existe' });
      }
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
      .isString().withMessage('El nombre de corte debe ser un texto')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { nombre_corte } = req.body;
      await updateTipoCorte(req.params.id, { nombre_corte });
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
