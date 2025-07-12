// routes/desposte_canales.js
const express = require('express');
const { query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const { getCanalIdsByDesposte } = require('../models/desposteCanalModel');

const router = express.Router();

// GET /api/desposte_canales?desposte=ID
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  query('desposte').optional().isInt().withMessage('desposte debe ser entero'),
  validateRequest,
  async (req, res) => {
    try {
      if (req.query.desposte) {
        const list = await getCanalIdsByDesposte(req.query.desposte);
        return res.json(list);
      }
      // para simplificar no hay endpoint de todos
      res.json([]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener desposte_canales' });
    }
  }
);

module.exports = router;