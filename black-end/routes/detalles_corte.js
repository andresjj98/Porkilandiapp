// routes/detalles_corte.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getAllDetallesCorte,
  getDetallesByDesposte,
  getDetalleById,
  createDetalleCorte
} = require('../models/detalleCorteModel');

// GET /api/detalles_corte
// Soporta filtrado por ?desposte=ID
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
  try {
    if (req.query.desposte) {
      const list = await getDetallesByDesposte(req.query.desposte);
      return res.json(list);
    }
    const list = await getAllDetallesCorte();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener detalles de corte' });
  }
});

// GET /api/detalles_corte/:id
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
  try {
    const det = await getDetalleById(req.params.id);
    if (!det) return res.status(404).json({ error: 'Detalle no encontrado' });
    res.json(det);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
});

// POST /api/detalles_corte
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
  try {
    const { id_desposte, id_tipo_corte, peso, cantidad, id_tipo_carne } = req.body;
    const { id } = await createDetalleCorte({ id_desposte, id_tipo_corte, peso, cantidad, id_tipo_carne });
    res.status(201).json({ message: 'Detalle de corte creado', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear detalle de corte' });
  }
});

module.exports = router;
