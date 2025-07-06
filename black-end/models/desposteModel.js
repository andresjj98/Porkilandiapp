// models/desposteModel.js
const db = require('../config/db');
const { getDetallesByDesposte } = require('./detalleCorteModel');
const { getTipoCorteById } = require('./tipoCorteModel');
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
  const [desRows] = await db.query(
    'SELECT id_factura FROM despostes WHERE id_desposte = ?',
    [id]
  );
  const id_factura = desRows[0] ? desRows[0].id_factura : null;

  if (id_factura) {
    const [facRows] = await db.query(
      'SELECT numero_guia AS number FROM facturas WHERE id_factura = ?',
      [id_factura]
    );
    const facturaNumber = facRows[0] ? facRows[0].number : null;
    if (facturaNumber) {
      await deleteInventarioByOrigen(facturaNumber);
    }
  }
  
  await db.query('DELETE FROM detalles_corte WHERE id_desposte = ?', [id]);
  await db.query('DELETE FROM despostes WHERE id_desposte = ?', [id]);
  return { id };
}
module.exports = { getAllDespostes, getDesposteById, createDesposte, deleteDesposte };
