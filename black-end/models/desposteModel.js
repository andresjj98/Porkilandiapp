// models/desposteModel.js
const db = require('../config/db');
const { deleteInventarioByOrigen } = require('./inventarioModel');

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

// Elimina un desposte y sus registros de inventario asociados
async function deleteDesposte(id) {
  // Obtener la factura relacionada para conocer el origen
 const [detRows] = await db.query(
    'SELECT DISTINCT id_canal FROM detalles_corte WHERE id_desposte = ?',
    [id]
  );
  for (const row of detRows) {
    await deleteInventarioByOrigen(`canal:${row.id_canal}`);
  }
  
  await db.query('DELETE FROM detalles_corte WHERE id_desposte = ?', [id]);
  await db.query('DELETE FROM despostes WHERE id_desposte = ?', [id]);
  return { id };
}
module.exports = { getAllDespostes, getDesposteById, createDesposte, deleteDesposte };
