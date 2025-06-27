// models/tipoCarneModel.js
const db = require('../config/db');
async function getAllTiposCarne() {
  const [rows] = await db.query(
    'SELECT * FROM tipo_carne'
  );
  return rows;
}

async function getTipoCarneById(id) {
  const [rows] = await db.query(
    'SELECT * FROM tipo_carne WHERE id_tipo_carne = ?',
    [id]
  );
  return rows[0];
}

async function createTipoCarne({ nombre }) {
  const [result] = await db.query(
    'INSERT INTO tipo_carne (nombre) VALUES (?)',
    [nombre]
  );
  return { id: result.insertId };
}

async function updateTipoCarne(id, { nombre }) {
  await db.query(
    'UPDATE tipo_carne SET nombre = ? WHERE id_tipo_carne = ?',
    [nombre, id]
  );
  return { id };
}

async function deleteTipoCarne(id) {
  await db.query(
    'DELETE FROM tipo_carne WHERE id_tipo_carne = ?',
    [id]
  );
  return { id };
}

module.exports = {
  getAllTiposCarne,
  getTipoCarneById,
  createTipoCarne,
  updateTipoCarne,
  deleteTipoCarne
};
