// models/ordenModel.js
const db = require('../config/db');

async function getAllOrdenes() {
  const [rows] = await db.query(
    `SELECT o.id_orden, o.codigo_orden, o.fecha_orden, o.id_usuario, o.id_pos, o.estado
     FROM ordenes o`
  );
  return rows;
}

async function getOrdenById(id) {
  const [rows] = await db.query(
    `SELECT id_orden, codigo_orden, fecha_orden, id_usuario, id_pos, estado
     FROM ordenes
     WHERE id_orden = ?`,
    [id]
  );
  return rows[0];
}

async function createOrden({ codigo_orden, fecha_orden, id_usuario, id_pos, estado }) {
  const [result] = await db.query(
    `INSERT INTO ordenes (codigo_orden, fecha_orden, id_usuario, id_pos, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [codigo_orden, fecha_orden, id_usuario, id_pos || null, estado]
  );
  return { id: result.insertId };
}

async function updateOrden(id, { codigo_orden, fecha_orden, id_usuario, id_pos, estado }) {
  await db.query(
    `UPDATE ordenes
     SET codigo_orden = ?, fecha_orden = ?, id_usuario = ?, id_pos = ?, estado = ?
     WHERE id_orden = ?`,
    [codigo_orden, fecha_orden, id_usuario, id_pos || null, estado, id]
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
