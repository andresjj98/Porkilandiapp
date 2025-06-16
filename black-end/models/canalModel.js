// models/canalModel.js
const db = require('../config/db');

// Devuelve todos los canales
async function getAllCanales() {
  const [rows] = await db.query(
    `SELECT id_canal, codigo_canal, id_factura, id_producto, peso 
     FROM canales`
  );
  return rows;
}

// Devuelve canales filtrados por ID de factura
async function getCanalesByFactura(id_factura) {
  const [rows] = await db.query(
    `SELECT id_canal, codigo_canal, id_factura, id_producto, peso 
     FROM canales 
     WHERE id_factura = ?`,
    [id_factura]
  );
  return rows;
}

// Devuelve un canal por su ID
async function getCanalById(id) {
  const [rows] = await db.query(
    `SELECT id_canal, codigo_canal, id_factura, id_producto, peso 
     FROM canales 
     WHERE id_canal = ?`,
    [id]
  );
  return rows[0];
}


async function updateCanal({id, codigo_canal, id_factura, id_producto, peso, origen}) { /* UPDATE canales SET … WHERE id_canal = id */ }
async function deleteCanal(id) { /* DELETE FROM canales WHERE id_canal = ? */ }


/* Asegúrate de pasar producto.id_producto, no producto.nombre.
const nuevoCanal = await createCanal({
  codigo_canal: code,
  id_factura:   nuevaFacturaId,
  id_producto:  producto.id_producto,
  peso:         weight
});*/

// Crea un nuevo canal (carcasa)
async function createCanal({ codigo_canal, id_factura, id_producto, peso }) {
  const [result] = await db.query(
    `INSERT INTO canales (codigo_canal, id_factura, id_producto, peso) 
     VALUES (?, ?, ?, ?)`,
    [codigo_canal, id_factura, id_producto, peso]
  );
  return { id: result.insertId };
}
async function updateCanal({ id, codigo_canal, id_factura, id_producto, peso }) {
  await db.query(
    `UPDATE canales 
       SET codigo_canal = ?,
           id_factura   = ?,
           id_producto  = ?,
           peso         = ?
     WHERE id_canal = ?`,
    [codigo_canal, id_factura, id_producto, peso, id]
  );
}

// Elimina un canal
async function deleteCanal(id) {
  // 1) Borrar detalles de corte asociados
  await db.query(
    `DELETE FROM detalles_corte WHERE id_canal = ?`,
    [id]
  );
  // 2) Borrar el canal
  await db.query(
    `DELETE FROM canales WHERE id_canal = ?`,
    [id]
  );
}

module.exports = {
  getAllCanales,
  getCanalById,
  getCanalesByFactura,
  createCanal,
  updateCanal,    // <— ahora lo exportas
  deleteCanal     // <— y esto también
};
