// ================================================================
// API BACKEND SIMPLE - SOLO INVENTARIO
// Node.js + Express + PostgreSQL (Aiven)
// ================================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================================
// CONFIGURACIÓN DE BASE DE DATOS
// ================================================================

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL (Aiven)');
});

pool.on('error', (err) => {
    console.error('❌ Error en PostgreSQL:', err);
});

// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ================================================================
// RUTAS - INVENTARIO
// ================================================================

// GET /api/ccostos - Centros de costo
app.get('/api/ccostos', async (req, res) => {
    const { empresa } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        const query = `
            SELECT codigo, nombre
            FROM ccostos
            WHERE empresa = $1
            ORDER BY nombre
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/ccostos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener centros de costo',
            details: error.message
        });
    }
});

// GET /api/inventario - Inventario calculado desde detalle_inventario
app.get('/api/inventario', async (req, res) => {
    const { empresa, ccosto } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        let query = `
            SELECT 
                p.codigo,
                p.nombre,
                p.und as unidad,
                SUM(COALESCE(di.entrada, 0)) as total_entradas,
                SUM(COALESCE(di.salida, 0)) as total_salidas,
                SUM(COALESCE(di.entrada, 0)) - SUM(COALESCE(di.salida, 0)) as stock_actual,
                COUNT(*) as movimientos
            FROM detalle_inventario di
            INNER JOIN productos p ON di.codigo = p.codigo
            WHERE di.empresa = $1
        `;
        
        const params = [empresa];
        
        if (ccosto) {
            params.push(ccosto);
            query += ` AND di.ccosto = $2`;
        }
        
        query += `
            GROUP BY p.codigo, p.nombre, p.und
            HAVING SUM(COALESCE(di.entrada, 0)) - SUM(COALESCE(di.salida, 0)) <> 0
            ORDER BY p.nombre
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/inventario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener inventario',
            details: error.message
        });
    }
});

// GET /api/inventario/stats - Estadísticas básicas
app.get('/api/inventario/stats', async (req, res) => {
    const { empresa } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        const query = `
            SELECT 
                COUNT(DISTINCT p.codigo) as total_productos,
                SUM(COALESCE(di.entrada, 0)) as total_entradas_global,
                SUM(COALESCE(di.salida, 0)) as total_salidas_global,
                COUNT(*) as total_movimientos
            FROM detalle_inventario di
            INNER JOIN productos p ON di.codigo = p.codigo
            WHERE di.empresa = $1
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error en /api/inventario/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            details: error.message
        });
    }
});

// GET /api/inventario/movimientos/:codigo - Movimientos de un producto
app.get('/api/inventario/movimientos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        const query = `
            SELECT 
                di.fecha,
                di.ccosto as centro_costo,
                di.entrada,
                di.salida,
                di.tipo,
                di.observaciones,
                p.nombre as producto_nombre
            FROM detalle_inventario di
            INNER JOIN productos p ON di.codigo = p.codigo
            WHERE di.codigo = $1 AND di.empresa = $2
            ORDER BY di.fecha DESC
            LIMIT 100
        `;
        
        const result = await pool.query(query, [codigo, empresa]);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/inventario/movimientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener movimientos',
            details: error.message
        });
    }
});

// ================================================================
// HEALTH CHECK
// ================================================================

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            error: error.message,
            database: 'Disconnected'
        });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de Inventario - Simple',
        endpoints: {
            health: '/health',
            inventario: '/api/inventario?empresa=123456789',
            stats: '/api/inventario/stats?empresa=123456789',
            movimientos: '/api/inventario/movimientos/:codigo?empresa=123456789'
        }
    });
});

// ================================================================
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
