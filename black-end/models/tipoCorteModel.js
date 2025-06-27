// models/tipoCorteModel.js
const db = require('../config/db');

async function getAllTiposCorte() {
  const [rows] = await db.query(
     `SELECT id_tipo_corte, nombre_corte FROM tipos_corte`
  );
  return rows;
}

async function getTipoCorteById(id) {
  const [rows] = await db.query(
   'SELECT id_tipo_corte, nombre_corte FROM tipos_corte WHERE id_tipo_corte = ?',
    [id]
  );
  return rows[0];
}

async function createTipoCorte({ nombre_corte }) {
  const [result] = await db.query(
    'INSERT INTO tipos_corte (nombre_corte) VALUES (?)',
    [nombre_corte]
  );
  return { id: result.insertId };
}

async function updateTipoCorte(id, { nombre_corte }) {
  await db.query(
    'UPDATE tipos_corte SET nombre_corte = ? WHERE id_tipo_corte = ?',
    [nombre_corte, id]
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

// Devuelve tipos de corte filtrados por tipo de carne usando la tabla productos
async function getTiposByCarne(id_tipo_carne) {
  const [rows] = await db.query(
    `SELECT DISTINCT tc.id_tipo_corte, tc.nombre_corte
       FROM tipos_corte tc
       JOIN productos p ON p.id_tipo_corte = tc.id_tipo_corte
      WHERE p.id_tipo_carne = ?`,
    [id_tipo_carne]
  );
  return rows;
}

module.exports = {
  getAllTiposCorte,
  getTipoCorteById,
  createTipoCorte,
  updateTipoCorte,
  deleteTipoCorte,
  getTiposByCarne
};
