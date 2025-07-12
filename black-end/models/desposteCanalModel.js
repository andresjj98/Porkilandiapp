const db = require('../config/db');

async function getCanalIdsByDesposte(id_desposte) {
  const [rows] = await db.query(
    'SELECT id_canal FROM desposte_canales WHERE id_desposte = ?',
    [id_desposte]
  );
  return rows.map(r => r.id_canal);
}

async function createDesposteCanal({ id_desposte, id_canal }) {
  const [result] = await db.query(
    'INSERT INTO desposte_canales (id_desposte, id_canal) VALUES (?, ?)',
    [id_desposte, id_canal]
  );
  return { id: result.insertId };
}

async function deleteByDesposte(id_desposte) {
  await db.query('DELETE FROM desposte_canales WHERE id_desposte = ?', [id_desposte]);
}

module.exports = { getCanalIdsByDesposte, createDesposteCanal, deleteByDesposte };