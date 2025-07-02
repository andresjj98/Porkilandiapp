// models/canalModel.js
const db = require('../config/db');

// Devuelve todos los canales
async function getAllCanales() {
  const [rows] = await db.query(
      `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso
     FROM canales`
  );
  return rows;
}

// Devuelve canales filtrados por ID de factura
async function getCanalesByFactura(id_factura) {
  const [rows] = await db.query(
    `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso
     FROM canales
     WHERE id_factura = ?`,
    [id_factura]
  );
  return rows;
}

// Devuelve un canal por su ID
async function getCanalById(id) {
  const [rows] = await db.query(
     `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso
     FROM canales
     WHERE id_canal = ?`,
    [id]
  );
  return rows[0];
}



// Crea un nuevo canal (carcasa)
async function createCanal({ codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso }) {
  const [result] = await db.query(
     `INSERT INTO canales (codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso)
     VALUES (?, ?, ?, ?, ?)`,
    [codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso]
  );
  return { id: result.insertId };
}
async function updateCanal({ id, codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso }) {
  await db.query(
    `UPDATE canales
       SET codigo_canal = ?,
           id_factura   = ?,
           id_tipo_carne  = ?,
           id_tipo_corte = ?,
           peso         = ?
     WHERE id_canal = ?`,
    [codigo_canal, id_factura, id_tipo_carne, id_tipo_corte, peso, id]
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
