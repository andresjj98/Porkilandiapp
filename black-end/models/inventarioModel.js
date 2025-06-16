// models/inventarioModel.js
const db = require('../config/db');

/**
 * Esquema de inventario según tu Script.sql:
 * id_inventario INT AUTO_INCREMENT PRIMARY KEY,
 * id_producto    INT NOT NULL,
 * cantidad       INT NOT NULL,
 * peso_total     DECIMAL(10,2) NOT NULL,
 * estado         ENUM('disponible','comprometido','despachado') DEFAULT 'disponible',
 * origen         VARCHAR(100),
 * FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
 * :contentReference[oaicite:0]{index=0}
 */

async function getAllInventario() {
  const [rows] = await db.query(
    'SELECT id_inventario, id_producto, cantidad, peso_total, estado, origen FROM inventario'
  );
  return rows;
}

async function getInventarioById(id) {
  const [rows] = await db.query(
    'SELECT id_inventario, id_producto, cantidad, peso_total, estado, origen FROM inventario WHERE id_inventario = ?',
    [id]
  );
  return rows[0];
}

async function createInventario({ id_producto, cantidad, peso_total, estado, origen }) {
  const [result] = await db.query(
    `INSERT INTO inventario
       (id_producto, cantidad, peso_total, estado, origen)
     VALUES (?, ?, ?, ?, ?)`,
    [id_producto, cantidad, peso_total, estado, origen || null]
  );
  return { id: result.insertId };
}

async function updateInventario(id, { id_producto, cantidad, peso_total, estado, origen }) {
  await db.query(
    `UPDATE inventario SET
       id_producto = ?, cantidad = ?, peso_total = ?, estado = ?, origen = ?
     WHERE id_inventario = ?`,
    [id_producto, cantidad, peso_total, estado, origen || null, id]
  );
  return { id };
}

async function deleteInventario(id) {
  await db.query(
    'DELETE FROM inventario WHERE id_inventario = ?',
    [id]
  );
  return { id };
}

module.exports = {
  getAllInventario,
  getInventarioById,
  createInventario,
  updateInventario,
  deleteInventario
};
