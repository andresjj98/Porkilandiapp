// models/proveedorModel.js
const db = require('../config/db');

async function getAllProveedores() {
  const [rows] = await db.query(
    'SELECT id_proveedor, nombre, contacto FROM proveedores'
  );
  return rows;
}

async function getProveedorById(id) {
  const [rows] = await db.query(
    'SELECT id_proveedor, nombre, contacto FROM proveedores WHERE id_proveedor = ?',
    [id]
  );
  return rows[0];
}

async function createProveedor({ nombre, contacto }) {
  const [result] = await db.query(
    'INSERT INTO proveedores (nombre, contacto) VALUES (?, ?)',
    [nombre, contacto]
  );
  return { id: result.insertId };
}
// <-- Nueva función de borrado
async function deleteProveedor(id) {
  return db.query(
    'DELETE FROM proveedores WHERE id_proveedor = ?',
    [id]
  );
}
module.exports = { getAllProveedores, getProveedorById, createProveedor, deleteProveedor };
