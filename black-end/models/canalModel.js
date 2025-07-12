// models/canalModel.js
const db = require('../config/db');
const { deleteInventarioByOrigen } = require('./inventarioModel');

// Devuelve todos los canales
async function getAllCanales() {
  const [rows] = await db.query(
       `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne,  peso
     FROM canales`
  );
  return rows;
}

// Devuelve canales filtrados por ID de factura
async function getCanalesByFactura(id_factura) {
  const [rows] = await db.query(
     `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne,  peso
     FROM canales
     WHERE id_factura = ?`,
    [id_factura]
  );
  return rows;
}

// Devuelve un canal por su ID
async function getCanalById(id) {
  const [rows] = await db.query(
      `SELECT id_canal, codigo_canal, id_factura, id_tipo_carne,  peso
     FROM canales
     WHERE id_canal = ?`,
    [id]
  );
  return rows[0];
}



// Crea un nuevo canal (carcasa)
async function createCanal({ codigo_canal, id_factura, id_tipo_carne, peso }) {
  const [result] = await db.query(
     `INSERT INTO canales (codigo_canal, id_factura, id_tipo_carne, peso)
     VALUES (?, ?, ?, ?)`,
    [codigo_canal, id_factura, id_tipo_carne, peso]
  );
  return { id: result.insertId };
}
async function updateCanal({ id, codigo_canal, id_factura, id_tipo_carne, peso }) {
  await db.query(
    `UPDATE canales
       SET codigo_canal = ?,
           id_factura   = ?,
           id_tipo_carne  = ?,        
           peso         = ?
     WHERE id_canal = ?`,
    [codigo_canal, id_factura, id_tipo_carne, peso, id]
  );
}

// Elimina un canal junto con su desposte e inventario
async function deleteCanal(id) {
  const { deleteDesposte } = require('./desposteModel');
 // Obtener información del canal
  const canal = await getCanalById(id);
  if (!canal) return;

    // Inventario generado desde este canal
  await deleteInventarioByOrigen(`canal:${id}`);

  // Buscar despostes vinculados a este canal
  const [desRows] = await db.query(
    'SELECT id_desposte FROM desposte_canales WHERE id_canal = ?',
    [id]
  );
  // Eliminar cada desposte encontrado (también borra detalles e inventario)
  for (const d of desRows) {
    await deleteDesposte(d.id_desposte);
  }

    // Finalmente borra el canal
  await db.query('DELETE FROM canales WHERE id_canal = ?', [id]);
}

module.exports = {
  getAllCanales,
  getCanalById,
  getCanalesByFactura,
  createCanal,
  updateCanal,    // <— ahora lo exportas
  deleteCanal     // <— y esto también
};
