// models/detalleCorteModel.js
const db = require('../config/db');

async function getAllDetallesCorte() {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_canal, id_tipo_corte, peso, cantidad
     FROM detalles_corte`
  );
  return rows;
}

async function getDetallesByDesposte(id_desposte) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_canal, id_tipo_corte, peso, cantidad
     FROM detalles_corte
     WHERE id_desposte = ?`,
    [id_desposte]
  );
  return rows;
}

async function getDetalleById(id) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_desposte, id_canal, id_tipo_corte, peso, cantidad
     FROM detalles_corte
     WHERE id_detalle = ?`,
    [id]
  );
  return rows[0];
}

async function createDetalleCorte({ id_desposte, id_canal, id_tipo_corte, peso, cantidad }) {
  const [result] = await db.query(
    `INSERT INTO detalles_corte (id_desposte, id_canal, id_tipo_corte, peso, cantidad)
     VALUES (?, ?, ?, ?, ?)`,
    [id_desposte, id_canal, id_tipo_corte, peso, cantidad]
  );
  return { id: result.insertId };
}

module.exports = {
  getAllDetallesCorte,
  getDetallesByDesposte,
  getDetalleById,
  createDetalleCorte
};
