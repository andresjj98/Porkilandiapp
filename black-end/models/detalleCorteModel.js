// models/detalleCorteModel.js
const db = require('../config/db');
const { getTipoCorteById } = require('./tipoCorteModel');
const { createInventario } = require('./inventarioModel');
const { getProductoByTipos, createProducto } = require('./productoModel');

async function getAllDetallesCorte() {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_tipo_corte, peso, cantidad
     FROM detalles_corte`
  );
  return rows;
}

async function getDetallesByDesposte(id_desposte) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_tipo_corte, peso, cantidad
     FROM detalles_corte
     WHERE id_desposte = ?`,
    [id_desposte]
  );
  return rows;
}

async function getDetalleById(id) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_tipo_corte, peso, cantidad
     FROM detalles_corte
     WHERE id_detalle = ?`,
    [id]
  );
  return rows[0];
}

async function createDetalleCorte({ id_desposte, id_tipo_corte, peso, cantidad, id_tipo_carne }) {
  const [result] = await db.query(
   `INSERT INTO detalles_corte (id_desposte, id_tipo_corte, peso, cantidad)
     VALUES (?, ?, ?, ?)`,
    [id_desposte, id_tipo_corte, peso, cantidad]
  );
  const inserted = { id: result.insertId };

  try {
     let producto = await getProductoByTipos(id_tipo_carne, id_tipo_corte);
    if (!producto) {
      const nuevo = await createProducto({
        id_tipo_carne,
        id_tipo_corte
      });
      producto = { id_producto: nuevo.id };
    }

      if (producto) {
      await createInventario({
        id_producto: producto.id_producto,
        cantidad,
        peso_total: peso,
        estado: 'disponible',
        origen: `desposte:${id_desposte}`
      });
    }
  } catch (err) {
    console.error('Error creando inventario desde detalle de corte:', err);
  }

  return inserted;
}

module.exports = {
  getAllDetallesCorte,
  getDetallesByDesposte,
  getDetalleById,
  createDetalleCorte
};