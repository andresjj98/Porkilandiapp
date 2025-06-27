// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
//const verifyToken = require('./middleware/authMiddleware');
//const authorizeRoles = require('./middleware/roleMiddleware');
const { verifyToken, authorizeRoles } = require('./middleware/roleMiddleware');
const posRouter = require('./routes/pos');
const puntosVentaRouter = require('./routes/puntos_venta');

// Routers
const authRouter          = require('./routes/auth');
const usuariosRouter      = require('./routes/usuarios');
const proveedoresRouter   = require('./routes/proveedores');
const facturasRouter      = require('./routes/facturas');
const canalesRouter       = require('./routes/canales');
const despostesRouter     = require('./routes/despostes');
const detallesCorteRouter = require('./routes/detalles_corte');
const productosRouter   = require('./routes/productos');
const tiposCorteRouter  = require('./routes/tipos_corte');
const tiposCarneRouter  = require('./routes/tipo_carne');
const ordenesRouter     = require('./routes/ordenes');
const detalleOrdenRouter = require('./routes/detalle_orden');
const inventarioRouter = require('./routes/inventario');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001']}));
app.use(express.json());

// --- Log de configuración de BD ---
console.log('DB_HOST:    ', process.env.DB_HOST);
console.log('DB_USER:    ', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(vacío)');
console.log('DB_NAME:    ', process.env.DB_NAME);
console.log('DB_PORT:    ', process.env.DB_PORT);

// --- Rutas públicas ---
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT VERSION() AS version');
    res.json({ message: 'API funcionando', mysqlVersion: rows[0].version });
  } catch (err) {
    console.error('Error en ruta raíz:', err);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos', details: err.message });
  }
});
app.use('/api/auth', authRouter);

// --- Rutas protegidas y control de acceso por rol ---
app.use(
  '/api/usuarios',
  verifyToken,
  authorizeRoles('admin','operario','punto_venta'),
  usuariosRouter
);
app.use(
  '/api/pos', 
  verifyToken, 
  authorizeRoles('admin','operario'), 
  posRouter
);
app.use(
  '/api/proveedores',
  verifyToken,
  authorizeRoles('admin'),
  proveedoresRouter
);
app.use(
  '/api/facturas',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  facturasRouter
);
app.use(
  '/api/canales',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  canalesRouter
);
app.use(
  '/api/despostes',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  despostesRouter
);
app.use(
  '/api/detalles_corte',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  detallesCorteRouter
);
app.use(
  '/api/productos',
  verifyToken,
  productosRouter
);
app.use(
  '/api/puntos_venta',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  puntosVentaRouter
);
// Tipos de corte
app.use(
  '/api/tipos_corte',
  verifyToken,
  tiposCorteRouter
);
app.use(
  '/api/tipo_carne',
  verifyToken,
  tiposCarneRouter
);
app.use(
  '/api/ordenes',
  verifyToken,
  authorizeRoles('admin','operario'),
  ordenesRouter
);

app.use(
  '/api/detalle_orden',
  verifyToken,
  authorizeRoles('admin','operario'),
  detalleOrdenRouter
);

app.use(
  '/api/inventario',
  verifyToken,
  authorizeRoles('admin', 'operario'),
  inventarioRouter
);

app.use(errorHandler);

// --- Inicio del servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

/*app.use('/api/desposte', despostesRouter);

app.use('/api/puntos_venta', require('./routes/puntos_venta'));*/