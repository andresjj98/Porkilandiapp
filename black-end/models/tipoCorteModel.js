// models/tipoCorteModel.js
const db = require('../config/db');

async function getAllTiposCorte() {
  const [rows] = await db.query(
    `SELECT 
       t.id_tipo_corte, 
       t.nombre_corte, 
       t.id_producto, 
       p.nombre AS producto 
     FROM tipos_corte t
     JOIN productos p ON t.id_producto = p.id_producto`
  );
  return rows;
}

async function getTipoCorteById(id) {
  const [rows] = await db.query(
    'SELECT id_tipo_corte, nombre_corte, id_producto FROM tipos_corte WHERE id_tipo_corte = ?',
    [id]
  );
  return rows[0];
}

async function createTipoCorte({ nombre_corte, id_producto }) {
  const [result] = await db.query(
    'INSERT INTO tipos_corte (nombre_corte, id_producto) VALUES (?, ?)',
    [nombre_corte, id_producto]
  );
  return { id: result.insertId };
}

async function updateTipoCorte(id, { nombre_corte, id_producto }) {
  await db.query(
    'UPDATE tipos_corte SET nombre_corte = ?, id_producto = ? WHERE id_tipo_corte = ?',
    [nombre_corte, id_producto, id]
  );
  return { id };
}

async function deleteTipoCorte(id) {
  await db.query(
    'DELETE FROM tipos_corte WHERE id_tipo_corte = ?',
    [id]
  );
  return { id };
}

// Devuelve tipos de corte según producto
async function getTiposByProducto(id_producto) {
  const [rows] = await db.query(
    `SELECT id_tipo_corte, nombre_corte, id_producto
       FROM tipos_corte
      WHERE id_producto = ?`,
    [id_producto]
  );
  return rows;
}

module.exports = {
  getAllTiposCorte,
  getTipoCorteById,
  createTipoCorte,
  updateTipoCorte,
  deleteTipoCorte,
  getTiposByProducto
};
