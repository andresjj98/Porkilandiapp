// routes/canales.js
const express = require('express');
const { query, param, body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllCanales,
  getCanalesByFactura,
  getCanalById,
  createCanal
} = require('../models/canalModel');

const router = express.Router();

// GET /api/canales?factura=ID
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    query('factura')
      .optional()
      .isInt().withMessage('El ID de factura debe ser un número entero'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (req.query.factura) {
        const canales = await getCanalesByFactura(req.query.factura);
        return res.json(canales);
      }
      const canales = await getAllCanales();
      res.json(canales);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener canales' });
    }
  }
);

// GET /api/canales/:id
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    param('id')
      .isInt().withMessage('El ID de canal debe ser un número entero'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const canal = await getCanalById(req.params.id);
      if (!canal) return res.status(404).json({ error: 'Canal no encontrado' });
      res.json(canal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener canal' });
    }
  }
);

// POST /api/canales
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
    body('codigo_canal')
      .notEmpty().withMessage('El código del canal es requerido'),
    body('id_factura')
      .notEmpty().withMessage('El ID de factura es requerido')
      .isInt().withMessage('El ID de factura debe ser un número entero'),
    body('id_tipo_carne')
      .notEmpty().withMessage('El ID de tipo de carne es requerido')
      .isInt().withMessage('El ID de tipo de carne debe ser un número entero'),    
    body('peso')
      .notEmpty().withMessage('El peso es requerido')
      .isFloat({ gt: 0 }).withMessage('El peso debe ser un número mayor que 0'),
  ],
  validateRequest,
  async (req, res) => {
    try {
     const { codigo_canal, id_factura, id_tipo_carne, peso } = req.body;
      const { id } = await createCanal({ codigo_canal, id_factura, id_tipo_carne, peso });
      res.status(201).json({ message: 'Canal creado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear canal' });
    }
  }
);

module.exports = router;
