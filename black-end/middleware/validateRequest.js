// middleware/validateRequest.js
const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Devuelve los primeros errores encontrados
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = validateRequest;
