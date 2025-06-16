// models/desposteModel.js
const db = require('../config/db');

async function getAllDespostes() {
  const [rows] = await db.query(
    `SELECT id_desposte, id_factura, id_usuario, fecha
     FROM despostes`
  );
  return rows;
}

async function getDesposteById(id) {
  const [rows] = await db.query(
    `SELECT id_desposte, id_factura, id_usuario, fecha
     FROM despostes
     WHERE id_desposte = ?`,
    [id]
  );
  return rows[0];
}

async function createDesposte({ id_factura, id_usuario, fecha }) {
  const [result] = await db.query(
    `INSERT INTO despostes (id_factura, id_usuario, fecha)
     VALUES (?, ?, ?)`,
    [id_factura, id_usuario, fecha]
  );
  return { id: result.insertId };
}

module.exports = { getAllDespostes, getDesposteById, createDesposte };
