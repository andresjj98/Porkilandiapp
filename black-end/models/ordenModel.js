// models/ordenModel.js
const db = require('../config/db');

async function getAllOrdenes() {
  const [rows] = await db.query(
    `SELECT o.id_orden, o.fecha_orden, o.id_usuario, o.id_pos, o.estado
     FROM ordenes o`
  );
  return rows;
}

async function getOrdenById(id) {
  const [rows] = await db.query(
    `SELECT id_orden, fecha_orden, id_usuario, id_pos, estado
     FROM ordenes
     WHERE id_orden = ?`,
    [id]
  );
  return rows[0];
}

async function createOrden({ fecha_orden, id_usuario, id_pos, estado }) {
  const [result] = await db.query(
    `INSERT INTO ordenes (fecha_orden, id_usuario, id_pos, estado)
     VALUES (?, ?, ?, ?)`,
    [fecha_orden, id_usuario, id_pos || null, estado]
  );
  return { id: result.insertId };
}

async function updateOrden(id, { fecha_orden, id_usuario, id_pos, estado }) {
  await db.query(
    `UPDATE ordenes
     SET fecha_orden = ?, id_usuario = ?, id_pos = ?, estado = ?
     WHERE id_orden = ?`,
    [fecha_orden, id_usuario, id_pos || null, estado, id]
  );
  return { id };
}

async function deleteOrden(id) {
  await db.query(
    `DELETE FROM detalle_orden WHERE id_orden = ?`,
    [id]
  );
  await db.query(
    `DELETE FROM ordenes WHERE id_orden = ?`,
    [id]
  );
  return { id };
}

module.exports = {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  deleteOrden
};
