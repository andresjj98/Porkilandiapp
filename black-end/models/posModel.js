const db = require('../config/db');

exports.getAllPos = () =>
  db.query('SELECT * FROM pos').then(([rows]) => rows);

exports.createPos = data =>
  db.query('INSERT INTO pos SET ?', data)
     .then(([r]) => ({ id: r.insertId }));

exports.updatePos = (id, data) =>
  db.query('UPDATE pos SET ? WHERE id_pos = ?', [data, id]);

exports.deletePos = id =>
  db.query('DELETE FROM pos WHERE id_pos = ?', [id]);
