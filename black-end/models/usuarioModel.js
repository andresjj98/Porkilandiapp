// models/usuarioModel.js
const db = require('../config/db');

/* ───────────── LISTAR TODOS ───────────── */
exports.getAllUsuarios = async () => {
  const [rows] = await db.query(
    `SELECT u.id_usuario AS id,
            u.nombre,
            u.numero_id,
            u.username,            
            u.correo,
            r.nombre      AS role
       FROM usuarios u
       JOIN roles    r ON r.id = u.rol_id`
  );
  return rows;
};

/* ───────────── UNO POR ID ─────────────── */
exports.getUsuarioById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id_usuario AS id,
            u.nombre,
            u.numero_id,
            u.username,    
            u.correo,
            r.nombre      AS role
       FROM usuarios u
       JOIN roles    r ON r.id = u.rol_id
      WHERE u.id_usuario = ?`,
    [id]
  );
  return rows[0];
};

/* ───────────── CREAR ──────────────────── */
/*  Espera un objeto con:
    { nombre, username, numero_id, correo, contraseña, rol_id }           */
exports.createUsuario = async (data) => {
  const [result] = await db.query('INSERT INTO usuarios SET ?', data);
  return { id: result.insertId };
};

/* ───────────── ACTUALIZAR ─────────────── */
exports.updateUsuario = (id, data) =>
  db.query('UPDATE usuarios SET ? WHERE id_usuario = ?', [data, id]);

/* ───────────── ELIMINAR ───────────────── */
exports.deleteUsuario = (id) =>
  db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
