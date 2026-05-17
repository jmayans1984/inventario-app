// ================================================================
// API BACKEND - INVENTARIO CON AUTENTICACIÓN (MODULAR)
// Node.js + Express + PostgreSQL (Aiven)
// Versión 2.0 - Arquitectura Modular
// ================================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors({
    origin: [
        'https://jmayans1984.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar límite para soportar imágenes base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ================================================================
// IMPORTAR RUTAS MODULARES
// ================================================================

const authRoutes = require('./ROUTES/auth');
const centrosCostoRoutes = require('./ROUTES/centrosCosto');
const inventarioRoutes = require('./ROUTES/inventario');
const movimientosRoutes = require('./ROUTES/movimientos'); // ALIAS TEMPORAL
const tesoreriaRoutes = require('./ROUTES/tesoreria');
const gastosRoutes = require('./ROUTES/gastos');
const ordenesRoutes = require('./ROUTES/ordenes');

// ================================================================
// USAR RUTAS
// ================================================================

// Autenticación
app.use('/api/auth', authRoutes);

// Centros de costo y empresas
app.use('/api/ccostos', centrosCostoRoutes);
app.use('/api/empresa', centrosCostoRoutes);
app.use('/api/empresas', centrosCostoRoutes);

// Inventario
app.use('/api/inventario', inventarioRoutes);

// Movimientos (ALIAS TEMPORAL para compatibilidad con frontend viejo)
app.use('/api/movimientos', movimientosRoutes);

// Tesorería (bancos, facturas, pagos)
app.use('/api', tesoreriaRoutes);

// Gastos
app.use('/api/gastos', gastosRoutes);

// Órdenes de compra y recepción
app.use('/api', ordenesRoutes);

// ================================================================
// HEALTH CHECK
// ================================================================

const pool = require('./config/database');

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: 'Connected',
            architecture: 'Modular v2.0'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            error: error.message,
            database: 'Disconnected'
        });
    }
});

// ================================================================
// RUTAS - RAÍZ
// ================================================================

app.get('/', (req, res) => {
    res.json({
        message: 'API de Inventario con Autenticación (Modular)',
        version: '2.0',
        architecture: 'Modular - Separación por dominios',
        modules: {
            auth: '/api/auth/*',
            ccostos: '/api/ccostos/*, /api/empresa/*',
            inventario: '/api/inventario/*',
            movimientos: '/api/movimientos/* (alias temporal)',
            tesoreria: '/api/cuentas-bancarias, /api/movimientos-bancarios, /api/facturas-compra, /api/soporte-pago',
            gastos: '/api/gastos/*',
            ordenes: '/api/ordenes-compra/*, /api/soportes-entrega/*'
        },
        endpoints: {
            health: '/health',
            login: 'POST /api/auth/login',
            inventario: 'GET /api/inventario?empresa=X&ccosto=Y',
            gastos: 'POST /api/gastos/crear',
            ordenes: 'GET /api/ordenes-compra?empresa=X'
        }
    });
});

// ================================================================
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor MODULAR corriendo en puerto ${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Arquitectura: Modular v2.0`);
    console.log(`📂 Módulos cargados: auth, ccostos, inventario, movimientos, tesoreria, gastos, ordenes\n`);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
