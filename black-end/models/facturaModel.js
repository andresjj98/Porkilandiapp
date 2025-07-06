// models/facturaModel.js
const db = require('../config/db');
const { deleteDesposte } = require('./desposteModel');
const { deleteCanal } = require('./canalModel');
const { deleteInventarioByOrigen } = require('./inventarioModel');

// Devuelve todas las facturas
async function getAllFacturas() {
  const [rows] = await db.query(
    `SELECT
     id_factura       AS id,
     numero_guia      AS number,
     fecha            AS date,
     fecha_sacrificio AS slaughterDate,
     id_proveedor     AS supplierId,
     id_usuario       AS operatorId
   FROM facturas`
  );
  // ahora por cada factura obtenemos también sus canales
  const facturas = [];
  for (const row of rows) {
    const [canales] = await db.query(
  `SELECT
     c.id_canal       AS id,
     c.codigo_canal   AS code,
     c.peso           AS weight,
     tc.nombre        AS type
   FROM canales c
   JOIN tipo_carne tc ON c.id_tipo_carne = tc.id_tipo_carne
   WHERE c.id_factura = ?`,
  [row.id]
    );
    facturas.push({
      ...row,
      channels: canales
    });
  }
 return facturas;
}

// Devuelve las facturas de un operario específico
async function getFacturasByUser(userId) {
  const [rows] = await db.query(
    `SELECT
       id_factura       AS id,
       numero_guia      AS number,
       fecha            AS date,
       fecha_sacrificio AS slaughterDate,
       id_proveedor     AS supplierId,
       id_usuario       AS operatorId
     FROM facturas
     WHERE id_usuario = ?`,
    [userId]
  );

  const facturas = [];
  for (const row of rows) {
    const [canales] = await db.query(
      `SELECT
         c.id_canal       AS id,
         c.codigo_canal   AS code,
         c.peso           AS weight,
          tc.nombre        AS type
       FROM canales c
       JOIN tipo_carne tc ON c.id_tipo_carne = tc.id_tipo_carne       
       WHERE c.id_factura = ?`,
      [row.id]
    );
    facturas.push({
      ...row,
      channels: canales
    });
  }
  return facturas;
}


// Devuelve una factura por ID
async function getFacturaById(id) {
  const [rows] = await db.query(
    `SELECT
       id_factura       AS id,
       numero_guia      AS number,
       fecha            AS date,
       fecha_sacrificio AS slaughterDate,
       id_proveedor     AS supplierId,
       id_usuario       AS operatorId
     FROM facturas
     WHERE id_factura = ?`,
    [id]
  );
  if (!rows.length) return null;
  // ahora traemos también los canales de esta factura
  const factura = rows[0];
  const [canales] = await db.query(
    `SELECT
       c.id_canal       AS id,
       c.codigo_canal   AS code,
       c.peso           AS weight,
       tc.nombre        AS type          
     FROM canales c
     JOIN tipo_carne tc ON c.id_tipo_carne = tc.id_tipo_carne     
     WHERE c.id_factura = ?`,
    [factura.id]
  );
  return {
    ...factura,
    channels: canales
  };
}

// Crea una nueva factura
async function createFactura({ numero_guia, fecha, fecha_sacrificio, id_proveedor, id_usuario }) {
  const [result] = await db.query(
    `INSERT INTO facturas (numero_guia, fecha, fecha_sacrificio, id_proveedor, id_usuario) 
     VALUES (?, ?, ?, ?,?)`,
    [numero_guia, fecha, fecha_sacrificio, id_proveedor, id_usuario]
  );
  return { id: result.insertId };
}


// models/facturaModel.js editar factura
async function updateFactura(id, { numero_guia, fecha, fecha_sacrificio, id_proveedor, id_usuario }) {
  await db.query(
    `UPDATE facturas 
       SET numero_guia      = ?,
           fecha            = ?,
           fecha_sacrificio = ?,   -- campo nuevo
           id_proveedor     = ?,
           id_usuario       = ?
     WHERE id_factura = ?`,
    [numero_guia, fecha, fecha_sacrificio, id_proveedor, id_usuario, id]
  );
}
// Borra una factura, sus despostes, canales e inventario relacionado
async function deleteFactura(id) {
  // Obtener la factura para conocer el número de guía
  const [factRows] = await db.query(
    `SELECT numero_guia AS number FROM facturas WHERE id_factura = ?`,
    [id]
  );
  const facturaNumber = factRows[0] ? factRows[0].number : null;

  if (facturaNumber) {
    await deleteInventarioByOrigen(facturaNumber);
  }

  // Eliminar despostes asociados (esto también limpia detalles e inventario)
  const [desRows] = await db.query(
    `SELECT id_desposte FROM despostes WHERE id_factura = ?`,
    [id]
  );
  for (const d of desRows) {
    await deleteDesposte(d.id_desposte);
  }

  // Eliminar canales ligados a la factura
  const [canRows] = await db.query(
    `SELECT id_canal FROM canales WHERE id_factura = ?`,
    [id]
  );
  for (const c of canRows) {
    await deleteCanal(c.id_canal);
  }

  // Finalmente borra la factura
  await db.query(`DELETE FROM facturas WHERE id_factura = ?`, [id]);
}
module.exports = {
  getAllFacturas,
  getFacturasByUser,
  getFacturaById,
  createFactura,
  updateFactura,
  deleteFactura   // ← agrégala aquí
};
