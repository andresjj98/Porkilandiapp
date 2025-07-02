// routes/facturas.js
const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { verifyToken, authorizeRoles } = require('../middleware/roleMiddleware');
const {
   createCanal,
   updateCanal,
   deleteCanal,
   getCanalesByFactura
} = require('../models/canalModel');


const {
   getAllFacturas,
   getFacturasByUser,
   getFacturaById,
   createFactura,
   updateFactura,
   deleteFactura
} = require('../models/facturaModel');
// ─── NUEVO: importar la función que inserta un canal ────────────


// ─── Utilidad para obtener IDs desde nombres de carne y corte ────────────────
const { getProductoByNombre } = require('../models/productoModel');


const router = express.Router();

// GET /api/facturas
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  async (req, res) => {
    try {
      let facturas;
      if (String(req.user.role).toLowerCase() === 'operario') {
        facturas = await getFacturasByUser(req.user.id);
      } else {
        facturas = await getAllFacturas();
      }
      res.json(facturas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener facturas' });
    }
  }
);

// GET /api/facturas/:id
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de la factura debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    try {
      const factura = await getFacturaById(req.params.id);
      if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
      res.json(factura);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener factura' });
    }
  }
);

// POST /api/facturas
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    body('number')
      .notEmpty().withMessage('El número de factura es requerido')
      .isString().withMessage('El número debe ser un texto'),
    body('date')
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),
    body('supplierId')
      .notEmpty().withMessage('El ID de proveedor es requerido')
      .isInt().withMessage('El ID de proveedor debe ser un número entero'),
    body('operatorId')
      .notEmpty().withMessage('El ID de operario es requerido')
      .isInt().withMessage('El ID de operario debe ser un número entero'),
    // Si ya guardaste “slaughterDate” en tu tabla, puedes validarlo igual:
    body('slaughterDate')
      .optional() // o notEmpty() si es obligatorio
      .isISO8601().withMessage('La fecha de sacrificio debe tener formato ISO 8601'),
      body('channels').optional().isArray().withMessage('channels debe ser un arreglo'),
    body('channels.*.id_tipo_carne').optional().isInt().withMessage('id_tipo_carne debe ser entero'),
    body('channels.*.id_tipo_corte').optional().isInt().withMessage('id_tipo_corte debe ser entero'),
  ],
  validateRequest,
  async (req, res) => {
    console.log('-------> req.body (POST /api/facturas):', req.body);
    try {
      const {
        number,        // ← viene del frontend
        date,          // ← viene del frontend
        supplierId,    // ← viene del frontend
        operatorId,    // ← viene del frontend
        slaughterDate, // ← viene del frontend (o undefined si no lo mandas)
        channels       // Array de objetos { code, weight, id_tipo_carne, id_tipo_corte, origin }
      } = req.body;

      // Mapeo de nombres front → nombres de columnas en BD
      const payloadFactura = {
        numero_guia:    number,
        fecha:          date,
        fecha_sacrificio: slaughterDate,
        id_proveedor:   supplierId,
        id_usuario:     parseInt(operatorId, 10)
        // si tu tabla ya incluye “fecha_sacrificio”, descomenta:
        // fecha_sacrificio: slaughterDate
      };
      // 1) Inserto la factura
      const { id: facturaId } = await createFactura(payloadFactura);

      // 2) Ahora recorro channels y creo cada canal
      for (const chan of channels) {
        let id_tipo_carne = chan.id_tipo_carne;
        let id_tipo_corte = chan.id_tipo_corte;
        if (!id_tipo_carne || !id_tipo_corte) {
          // Compatibilidad con versiones antiguas del front-end que envían el nombre
          const producto = await getProductoByNombre(chan.type);
          if (!producto) {
            return res.status(400).json({ error: 'El tipo de carne o corte no existe en BD' });
          }
          id_tipo_carne = producto.id_tipo_carne;
          id_tipo_corte = producto.id_tipo_corte;
        }
        await createCanal({
          codigo_canal: chan.code,
          id_factura:   facturaId,
          id_tipo_carne: chan.id_tipo_carne,
          id_tipo_corte: chan.id_tipo_corte,
          peso:         chan.weight
        });
      }

      // 3) Respondo al front con ID de la factura recién creada
       return res.status(201).json({
        success: true,
        id_factura: facturaId,
        message: 'Factura creada correctamente'
      });
    } catch (err) {
      console.error('Error en POST /api/facturas →', err);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// PUT /api/facturas/:id
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  [
    param('id').isInt().withMessage('El ID de la factura debe ser un número entero'),
    // valida aquí cualquier campo de factura que quieras
    body('channels').optional().isArray().withMessage('channels debe ser un arreglo'),
    body('channels.*.id_tipo_carne').optional().isInt().withMessage('id_tipo_carne debe ser entero'),
    body('channels.*.id_tipo_corte').optional().isInt().withMessage('id_tipo_corte debe ser entero')
  ],
  validateRequest,
  async (req, res) => {
    const facturaId = parseInt(req.params.id, 10);
    const {
      number,
      date,
      supplierId,
      operatorId,
      slaughterDate,
      channels = []      // ⇐ array de { id?, code, weight, id_tipo_carne, id_tipo_corte, origin }
    } = req.body;

    try {
      // 1) Actualiza campos de la factura
      await updateFactura(facturaId, {
        numero_guia: number,
        fecha: date,
        fecha_sacrificio: slaughterDate,
        id_proveedor: supplierId,
        id_usuario: operatorId
      });

      // 2) Gestiona canales:
      // 2a) Trae los canales actuales
      const existentes = await getCanalesByFactura(facturaId);
      const actualesIds = existentes.map(c => c.id_canal);

      // 2b) Elimina los que no estén en el nuevo arreglo
      for (const old of existentes) {
        if (!channels.find(c => c.id === old.id_canal)) {
          await deleteCanal(old.id_canal);
        }
      }

      // 2c) Inserta o actualiza
      for (const chan of channels) {
       let id_tipo_carne = chan.id_tipo_carne;
        let id_tipo_corte = chan.id_tipo_corte;
        if (!id_tipo_carne || !id_tipo_corte) {
          const producto = await getProductoByNombre(chan.type);
          if (!producto) continue; // o manda error
          id_tipo_carne = producto.id_tipo_carne;
          id_tipo_corte = producto.id_tipo_corte;
        }
        if (chan.id) {
          // UPDATE
          await updateCanal({
            id: chan.id,
            codigo_canal: chan.code,
            id_factura: facturaId,
           id_tipo_carne: producto.id_tipo_carne,
            id_tipo_corte: producto.id_tipo_corte,
            peso: chan.weight
          });
        } else {
          // INSERT
          await createCanal({
            codigo_canal: chan.code,
            id_factura: facturaId,
           id_tipo_carne: producto.id_tipo_carne,
            id_tipo_corte: producto.id_tipo_corte,
            peso: chan.weight
          });
        }
      }

      // 3) Devuelve la factura con sus canales
      const fact = await getFacturaById(facturaId);
      res.json(fact);

    } catch (err) {
      console.error('Error en PUT /api/facturas/:id →', err);
      res.status(500).json({ error: 'No se pudo actualizar factura y canales' });
    }
  }
);
// DELETE /api/facturas/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin','operario'),
  param('id').isInt().withMessage('El ID de la factura debe ser un número entero'),
  validateRequest,
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      await deleteFactura(id);
      return res.json({ message: 'Factura eliminada con éxito' });
    } catch (err) {
      console.error('Error en DELETE /api/facturas/:id →', err);
      return res.status(500).json({ error: 'No se pudo eliminar la factura' });
    }
  }
);
module.exports = router;
