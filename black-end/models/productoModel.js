// models/productoModel.js
const db = require('../config/db');

async function getAllProductos() {
  const [rows] = await db.query(
    'SELECT id_producto, nombre FROM productos'
  );
  return rows;
}

async function getProductoById(id) {
  const [rows] = await db.query(
    'SELECT id_producto, nombre FROM productos WHERE id_producto = ?',
    [id]
  );
  return rows[0];
}

async function createProducto({ nombre }) {
  const [result] = await db.query(
    'INSERT INTO productos (nombre) VALUES (?)',
    [nombre]
  );
  return { id: result.insertId };
}

async function updateProducto(id, { nombre }) {
  await db.query(
    'UPDATE productos SET nombre = ? WHERE id_producto = ?',
    [nombre, id]
  );
  return { id };
}

async function deleteProducto(id) {
  await db.query(
    'DELETE FROM productos WHERE id_producto = ?',
    [id]
  );
  return { id };
}

// Devuelve un producto completo (o undefined) buscando por su nombre
async function getProductoByNombre(nombre) {
  const [rows] = await db.query(
    'SELECT id_producto, nombre FROM productos WHERE nombre = ?',
    [nombre]
  );
  return rows[0]; // si no existe, rows.length === 0 y devolvemos undefined
}

module.exports = {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getProductoByNombre
};
