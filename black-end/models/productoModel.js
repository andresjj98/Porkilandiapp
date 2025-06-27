// models/productoModel.js
const db = require('../config/db');

// Devuelve todos los productos junto con los nombres legibles de carne y corte
async function getAllProductos() {
  const [rows] = await db.query(
    `SELECT
       p.id_producto,
       p.id_tipo_carne,
       p.id_tipo_corte,
       tc.nombre       AS tipo_carne,
       tco.nombre_corte AS tipo_corte
     FROM productos p
     JOIN tipo_carne tc   ON p.id_tipo_carne = tc.id_tipo_carne
     JOIN tipos_corte tco ON p.id_tipo_corte = tco.id_tipo_corte`
  );
  return rows;
}

// Devuelve un producto por su ID con los nombres de carne y corte
async function getProductoById(id) {
  const [rows] = await db.query(
     `SELECT
       p.id_producto,
       p.id_tipo_carne,
       p.id_tipo_corte,
       tc.nombre       AS tipo_carne,
       tco.nombre_corte AS tipo_corte
     FROM productos p
     JOIN tipo_carne tc   ON p.id_tipo_carne = tc.id_tipo_carne
     JOIN tipos_corte tco ON p.id_tipo_corte = tco.id_tipo_corte
     WHERE p.id_producto = ?`,
    [id]
  );
  return rows[0];
}

// Crea un producto a partir de los IDs de carne y corte
async function createProducto({ id_tipo_carne, id_tipo_corte }) {
  const [result] = await db.query(
    'INSERT INTO productos (id_tipo_carne, id_tipo_corte) VALUES (?, ?)',
    [id_tipo_carne, id_tipo_corte]
  );
  return { id: result.insertId };
}

// Actualiza un producto (carne y corte)
async function updateProducto(id, { id_tipo_carne, id_tipo_corte }) {
  await db.query(
    'UPDATE productos SET id_tipo_carne = ?, id_tipo_corte = ? WHERE id_producto = ?',
    [id_tipo_carne, id_tipo_corte, id]
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
// Devuelve un producto buscando por el nombre del tipo de carne
async function getProductoByNombre(nombre) {
  const [rows] = await db.query(
   `SELECT p.id_producto, p.id_tipo_carne, p.id_tipo_corte
       FROM productos p
       JOIN tipo_carne tc ON p.id_tipo_carne = tc.id_tipo_carne
      WHERE tc.nombre = ?
      LIMIT 1`,
    [nombre]
  );
  return rows[0]; // si no existe, rows.length === 0 y devolvemos undefined
}
// Busca un producto por los IDs de carne y corte (útil para nuevas consultas)
async function getProductoByTipos(id_tipo_carne, id_tipo_corte) {
  const [rows] = await db.query(
    'SELECT id_producto, id_tipo_carne, id_tipo_corte FROM productos WHERE id_tipo_carne = ? AND id_tipo_corte = ?',
    [id_tipo_carne, id_tipo_corte]
  );
  return rows[0];
}

module.exports = {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getProductoByNombre,
  getProductoByTipos
};
