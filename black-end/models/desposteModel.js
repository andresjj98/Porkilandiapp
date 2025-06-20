// models/desposteModel.js
const db = require('../config/db');
const { getDetallesByDesposte } = require('./detalleCorteModel');
const { getTipoCorteById } = require('./tipoCorteModel');
const { deleteInventarioByProductoOrigen } = require('./inventarioModel');

async function getAllDespostes() {
  const [rows] = await db.query(
    `SELECT id_desposte, id_factura, id_usuario, fecha
     FROM despostes`
  );
  return rows;
}

async function getDesposteById(id) {
  const [rows] = await db.query(
    `SELECT id_desposte, id_factura, id_usuario, fecha
     FROM despostes
     WHERE id_desposte = ?`,
    [id]
  );
  return rows[0];
}

async function createDesposte({ id_factura, id_usuario, fecha }) {
  const [result] = await db.query(
    `INSERT INTO despostes (id_factura, id_usuario, fecha)
     VALUES (?, ?, ?)`,
    [id_factura, id_usuario, fecha]
  );
  return { id: result.insertId };
}

// Elimina un desposte y limpia sus detalles e inventario asociado
async function deleteDesposte(id) {
  const detalles = await getDetallesByDesposte(id);
  for (const det of detalles) {
    const tipo = await getTipoCorteById(det.id_tipo_corte);
    if (tipo && tipo.id_producto) {
      await deleteInventarioByProductoOrigen(tipo.id_producto, `desposte:${id}`);
    }
  }
  await db.query('DELETE FROM detalles_corte WHERE id_desposte = ?', [id]);
  await db.query('DELETE FROM despostes WHERE id_desposte = ?', [id]);
  return { id };
}
module.exports = { getAllDespostes, getDesposteById, createDesposte, deleteDesposte };
