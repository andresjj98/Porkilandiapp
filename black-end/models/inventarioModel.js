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

// Elimina registros de inventario por producto y origen
async function deleteInventarioByProductoOrigen(id_producto, origen) {
  await db.query(
    'DELETE FROM inventario WHERE id_producto = ? AND origen = ?',
    [id_producto, origen]
  );
}

// Descuenta inventario de un producto usando estrategia LIFO
// Resta cantidad y peso siguiendo el orden de ingreso más reciente
async function consumirInventarioLIFO(id_producto, cantidad, peso_total) {
  let restanteCant = cantidad;
  let restantePeso = parseFloat(peso_total);

  // Inventario disponible del producto ordenado por id_inventario DESC (LIFO)
  const [rows] = await db.query(
    `SELECT id_inventario, cantidad, peso_total
       FROM inventario
      WHERE id_producto = ? AND estado = 'disponible'
      ORDER BY id_inventario DESC`,
    [id_producto]
  );

  for (const item of rows) {
    if (restanteCant <= 0 || restantePeso <= 0) break;

    const pesoUnit = item.cantidad ? item.peso_total / item.cantidad : 0;
    const tomarCant = Math.min(item.cantidad, restanteCant);
    const tomarPeso = pesoUnit * tomarCant;

    const nuevaCant = item.cantidad - tomarCant;
    const nuevoPeso = item.peso_total - tomarPeso;

    if (nuevaCant <= 0) {
      await db.query(
        'DELETE FROM inventario WHERE id_inventario = ?',
        [item.id_inventario]
      );
    } else {
      await db.query(
        `UPDATE inventario SET cantidad = ?, peso_total = ? WHERE id_inventario = ?`,
        [nuevaCant, nuevoPeso, item.id_inventario]
      );
    }

    restanteCant -= tomarCant;
    restantePeso -= tomarPeso;
  }
   // Devuelve las cantidades restantes en caso de no poder consumir todo
  return { restanteCant, restantePeso };
}


  // Devuelve resumen agrupado por tipo de carne y tipo de corte
async function getInventarioResumen() {
  const [rows] = await db.query(
    `SELECT
       tc.nombre_corte AS tipos_corte,
       tcar.nombre     AS tipo_carne,
       SUM(i.cantidad)    AS total_piezas,
       SUM(i.peso_total)  AS total_kg
     FROM inventario i
     JOIN productos p    ON i.id_producto = p.id_producto
     JOIN tipos_corte tc  ON p.id_tipo_corte = tc.id_tipo_corte
     JOIN tipo_carne tcar ON p.id_tipo_carne = tcar.id_tipo_carne
     WHERE i.estado = 'disponible'
     GROUP BY tcar.nombre, tc.nombre_corte
     ORDER BY tcar.nombre, tc.nombre_corte`
  );
  return rows;
}

// Devuelve inventario con nombres legibles de corte y carne
async function getInventarioDetalles() {
  const [rows] = await db.query(
    `SELECT
       i.id_inventario,
       i.cantidad,
       i.peso_total,
       i.estado,
       i.origen,
       tc.nombre_corte AS tipos_corte,
       tcar.nombre     AS tipo_carne
     FROM inventario i
     JOIN productos p    ON i.id_producto = p.id_producto
     JOIN tipos_corte tc  ON p.id_tipo_corte = tc.id_tipo_corte
     JOIN tipo_carne tcar ON p.id_tipo_carne = tcar.id_tipo_carne
     WHERE i.estado = 'disponible'`
  );
  return rows;
}

module.exports = {
  getAllInventario,
  getInventarioById,
  createInventario,
  updateInventario,
  deleteInventario,
  deleteInventarioByProductoOrigen,
  consumirInventarioLIFO,
  getInventarioResumen,
  getInventarioDetalles
};
