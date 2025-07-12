// models/desposteModel.js
const db = require('../config/db');
const { deleteInventarioByOrigen } = require('./inventarioModel');
const { deleteByDesposte } = require('./desposteCanalModel');

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

// ────────────────────────────────────────────────────────────
// Editar desposte
// ────────────────────────────────────────────────────────────
async function updateDesposte(id, { id_factura, id_usuario, fecha }) {
  await db.query(
    `UPDATE despostes
       SET id_factura = ?,
           id_usuario = ?,
           fecha      = ?
     WHERE id_desposte = ?`,
    [id_factura, id_usuario, fecha, id]
  );
  return { id };
}


// Elimina un desposte y sus registros de inventario asociados
async function deleteDesposte(id) {
  const [detRows] = await db.query(
    'SELECT id_detalle FROM detalles_corte WHERE id_desposte = ?',
    [id]
  );
  for (const row of detRows) {
    await deleteInventarioByOrigen(`desposte:${id}`);
  }
  
  await db.query('DELETE FROM detalles_corte WHERE id_desposte = ?', [id]);
  await deleteByDesposte(id);
  await db.query('DELETE FROM despostes WHERE id_desposte = ?', [id]);
  return { id };
}
module.exports = {
  getAllDespostes,
  getDesposteById,
  createDesposte,
  updateDesposte,
  deleteDesposte
};