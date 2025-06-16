// models/puntoVentaModel.js
const db = require('../config/db');

/**
 * Devuelve todos los puntos de venta
 */
exports.getAllPos = async () => {
  const [rows] = await db.query(
    `SELECT 
       id_punto_venta    AS id,
       nombre    AS name,
       direccion AS location
     FROM puntos_venta`
  );
  return rows;
};

/**
 * Devuelve un punto de venta por ID
 */
exports.getPosById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
       id_punto_venta    AS id,
       nombre    AS name,
       direccion AS location
     FROM puntos_venta
     WHERE id_punto_venta = ?`,
    [id]
  );
  return rows[0];
};

/**
 * Crea un nuevo punto de venta
 * @param {{ nombre: string, direccion: string }} data
 */
exports.createPos = async ({ nombre, direccion }) => {
  const [result] = await db.query(
    'INSERT INTO puntos_venta SET ?',
    { nombre, direccion }
  );
  return { id: result.insertId };
};
/**
 * Actualiza un punto de venta
 * @param {number} id 
 * @param {{ nombre?: string, direccion?: string }} data
 */
exports.updatePos = async (id, { nombre, direccion }) => {
  const payload = {};
  if (nombre    !== undefined) payload.nombre    = nombre;
  if (direccion !== undefined) payload.direccion = direccion;
  return db.query(
    'UPDATE puntos_venta SET ? WHERE id_punto_venta = ?',
    [payload, id]
  );
};

/**
 * Elimina un punto de venta
 */
exports.deletePos = async (id) =>
  db.query('DELETE FROM puntos_venta WHERE id_punto_venta = ?', [id]);
