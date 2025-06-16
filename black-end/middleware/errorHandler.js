// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('ERROR GLOBAL:', err);
  // Si ya se envió respuesta, delega al manejador por defecto de Express
  if (res.headersSent) return next(err);
  res.status(500).json({ 
    error: 'Error interno del servidor', 
    message: err.message 
  });
}

module.exports = errorHandler;
