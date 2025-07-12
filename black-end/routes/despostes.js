// routes/despostes.js
const express = require('express');
const { param, body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllDespostes,
  getDesposteById,
  createDesposte,
  deleteDesposte
} = require('../models/desposteModel');
const { createDetalleCorte } = require('../models/detalleCorteModel');
const { createDesposteCanal } = require('../models/desposteCanalModel');
const { getCanalById } = require('../models/canalModel');

const router = express.Router();

// GET /api/despostes
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  async (req, res) => {
  try {
    const despostes = await getAllDespostes();
    res.json(despostes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener despostes' });
  }
});

// GET /api/despostes/:id
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id')
    .isInt().withMessage('El ID de desposte debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const d = await getDesposteById(req.params.id);
      if (!d) return res.status(404).json({ error: 'Desposte no encontrado' });
      res.json(d);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener desposte' });
    }
  }
);

// POST /api/despostes
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  [
   body('id_factura')
      .notEmpty().withMessage('El ID de factura es requerido')
      .isInt().withMessage('El ID de factura debe ser un número entero'),
    body('id_usuario')
      .notEmpty().withMessage('El ID de usuario es requerido')
      .isInt().withMessage('El ID de usuario debe ser un número entero'),
    body('channelIds')
      .isArray({ min: 1 }).withMessage('Debe venir un arreglo de canales'),
    body('channelIds.*')
      .isInt().withMessage('Cada id de canal debe ser entero'),
    body('cuts')
      .isArray({ min: 1 }).withMessage('Debe venir un arreglo de cortes'),    
    body('cuts.*.cutTypeId')
      .notEmpty().withMessage('Cada corte necesita cutTypeId')
      .isInt().withMessage('cutTypeId debe ser entero'),
    body('cuts.*.weight')
      .notEmpty().withMessage('Cada corte necesita peso')
      .isFloat({ gt: 0 }).withMessage('Peso debe ser mayor que 0'),
    body('cuts.*.quantity')
      .notEmpty().withMessage('Cada corte necesita cantidad')
      .isInt({ gt: 0 }).withMessage('Cantidad debe ser entero mayor que 0'),
  ],
  validateRequest,
  async (req, res) => {
    const { id_factura, id_usuario, channelIds, cuts } = req.body;
    // Generamos fecha automáticamente:
    const fecha = new Date().toISOString().split('T')[0];

    try {
      // 1) Creamos el desposte
      const { id: desposteId } = await createDesposte({ id_factura, id_usuario, fecha });

     // 2) Asociar canales
      const canalesInfo = [];
      for (const cid of channelIds) {
        const canal = await getCanalById(cid);
        if (canal) {
          canalesInfo.push(canal);
          await createDesposteCanal({ id_desposte: desposteId, id_canal: cid });
        }
      }
      const id_tipo_carne = canalesInfo.length > 0 ? canalesInfo[0].id_tipo_carne : null;

      // 3) Creamos cada detalle de corte
      for (const c of cuts) {
        await createDetalleCorte({
          id_desposte:   desposteId,          
          id_tipo_corte: c.cutTypeId,
          peso:          c.weight,
          cantidad:      c.quantity,
          id_tipo_carne
        });
      }

      return res.status(201).json({ message: 'Desposte registrado', id: desposteId });
    } catch (err) {
      console.error('Error al crear desposte:', err);
      return res.status(500).json({ error: 'Error al crear desposte y sus detalles' });
    }
  }
);
// DELETE /api/despostes/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  param('id').isInt().withMessage('El ID de desposte debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      await deleteDesposte(req.params.id);
      res.json({ message: 'Desposte eliminado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar desposte' });
    }
  }
);
module.exports = router;
