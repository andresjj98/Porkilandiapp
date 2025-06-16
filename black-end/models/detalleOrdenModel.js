// models/detalleOrdenModel.js
const db = require('../config/db');

async function getAllDetalleOrden() {
  const [rows] = await db.query(
    `SELECT d.id_detalle, d.id_orden, d.id_producto, d.cantidad, d.peso_total
     FROM detalle_orden d`
  );
  return rows;
}

async function getDetalleByOrden(id_orden) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_orden, id_producto, cantidad, peso_total
     FROM detalle_orden
     WHERE id_orden = ?`,
    [id_orden]
  );
  return rows;
}

async function getDetalleOrdenById(id) {
  const [rows] = await db.query(
    `SELECT id_detalle, id_orden, id_producto, cantidad, peso_total
     FROM detalle_orden
     WHERE id_detalle = ?`,
    [id]
  );
  return rows[0];
}

async function createDetalleOrden({ id_orden, id_producto, cantidad, peso_total }) {
  const [result] = await db.query(
    `INSERT INTO detalle_orden (id_orden, id_producto, cantidad, peso_total)
     VALUES (?, ?, ?, ?)`,
    [id_orden, id_producto, cantidad, peso_total]
  );
  return { id: result.insertId };
}

async function updateDetalleOrden(id, { id_orden, id_producto, cantidad, peso_total }) {
  await db.query(
    `UPDATE detalle_orden
     SET id_orden = ?, id_producto = ?, cantidad = ?, peso_total = ?
     WHERE id_detalle = ?`,
    [id_orden, id_producto, cantidad, peso_total, id]
  );
  return { id };
}

async function deleteDetalleOrden(id) {
  await db.query(
    `DELETE FROM detalle_orden WHERE id_detalle = ?`,
    [id]
  );
  return { id };
}

module.exports = {
  getAllDetalleOrden,
  getDetalleByOrden,
  getDetalleOrdenById,
  createDetalleOrden,
  updateDetalleOrden,
  deleteDetalleOrden
};
