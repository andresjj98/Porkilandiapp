// models/inventarioReservaModel.js
const db = require('../config/db');

async function crearReserva({ id_orden, id_producto, cantidad }) {
  const [result] = await db.query(
    `INSERT INTO inventario_reservas (id_orden, id_producto, cantidad)
     VALUES (?, ?, ?)`,
    [id_orden, id_producto, cantidad]
  );
  return { id: result.insertId };
}

async function eliminarReservasPorOrden(id_orden) {
  await db.query(
    'DELETE FROM inventario_reservas WHERE id_orden = ?',
    [id_orden]
  );
}

async function obtenerReservasPorOrden(id_orden) {
  const [rows] = await db.query(
    'SELECT id_reserva, id_orden, id_producto, cantidad FROM inventario_reservas WHERE id_orden = ?',
    [id_orden]
  );
  return rows;
}

module.exports = {
  crearReserva,
  eliminarReservasPorOrden,
  obtenerReservasPorOrden
};