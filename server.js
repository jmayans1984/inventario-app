// ================================================================
// API BACKEND - INVENTARIO, ÓRDENES DE COMPRA Y FACTURAS
// Node.js + Express + PostgreSQL
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
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tu_base_datos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tu_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Verificar conexión
pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en PostgreSQL:', err);
});

// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors());
app.use(express.json());

// Logger simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ================================================================
// RUTAS - INVENTARIO
// ================================================================

// GET /api/inventario - Lista de inventario
app.get('/api/inventario', async (req, res) => {
    const { empresa = '1', busqueda, grupo, estado } = req.query;
    
    try {
        let query = `
            SELECT 
                p.codigo,
                p.nombre,
                p.und as unidad,
                gp.nombre as grupo_nombre,
                COALESCE(i.valor, 0) as stock_actual,
                p.stock_minimo,
                COALESCE(i.ccosto, 0) as costo_promedio,
                COALESCE(i.valor * i.ccosto, 0) as valor_inventario,
                CASE 
                    WHEN COALESCE(i.valor, 0) = 0 THEN 'SIN_STOCK'
                    WHEN COALESCE(i.valor, 0) <= p.stock_minimo THEN 'CRITICO'
                    WHEN COALESCE(i.valor, 0) <= p.stock_minimo * 1.5 THEN 'BAJO'
                    ELSE 'NORMAL'
                END as nivel_stock
            FROM productos p
            LEFT JOIN inventario i ON p.codigo = i.periodo
            LEFT JOIN grupo_productos gp ON p.grupo = gp.codigo
            WHERE p.empresa = $1
        `;
        
        const params = [empresa];
        let paramCount = 1;
        
        // Filtro por búsqueda
        if (busqueda) {
            paramCount++;
            query += ` AND (LOWER(p.nombre) LIKE LOWER($${paramCount}) OR LOWER(p.codigo) LIKE LOWER($${paramCount}))`;
            params.push(`%${busqueda}%`);
        }
        
        // Filtro por grupo
        if (grupo) {
            paramCount++;
            query += ` AND p.grupo = $${paramCount}`;
            params.push(grupo);
        }
        
        // Filtro por estado de stock
        if (estado === 'bajo') {
            query += ` AND COALESCE(i.valor, 0) <= p.stock_minimo`;
        } else if (estado === 'sin_stock') {
            query += ` AND COALESCE(i.valor, 0) = 0`;
        }
        
        query += ` ORDER BY p.nombre LIMIT 200`;
        
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

// GET /api/inventario/:codigo - Detalle de producto
app.get('/api/inventario/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa = '1' } = req.query;
    
    try {
        const query = `
            SELECT 
                p.*,
                gp.nombre as grupo_nombre,
                COALESCE(i.valor, 0) as stock_actual,
                COALESCE(i.ccosto, 0) as costo_promedio,
                COALESCE(i.valor * i.ccosto, 0) as valor_inventario
            FROM productos p
            LEFT JOIN inventario i ON p.codigo = i.periodo
            LEFT JOIN grupo_productos gp ON p.grupo = gp.codigo
            WHERE p.codigo = $1 AND p.empresa = $2
        `;
        
        const result = await pool.query(query, [codigo, empresa]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error en /api/inventario/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle del producto',
            details: error.message
        });
    }
});

// GET /api/inventario/stats - Estadísticas de inventario
app.get('/api/inventario/stats', async (req, res) => {
    const { empresa = '1' } = req.query;
    
    try {
        const query = `
            SELECT 
                COUNT(*) as total_productos,
                COUNT(CASE WHEN COALESCE(i.valor, 0) <= p.stock_minimo THEN 1 END) as productos_stock_bajo,
                COUNT(CASE WHEN COALESCE(i.valor, 0) = 0 THEN 1 END) as productos_sin_stock,
                COALESCE(SUM(i.valor * i.ccosto), 0) as valor_total_inventario
            FROM productos p
            LEFT JOIN inventario i ON p.codigo = i.periodo
            WHERE p.empresa = $1
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

// ================================================================
// RUTAS - ÓRDENES DE COMPRA
// ================================================================

// GET /api/ordenes - Lista de órdenes de compra
app.get('/api/ordenes', async (req, res) => {
    const { empresa = '1', estado, limit = 50 } = req.query;
    
    try {
        let query = `
            SELECT 
                oc.codigo,
                oc.fecha,
                oc.fecha_entrega,
                oc.fecha_vencimiento,
                oc.cliente,
                oc.estado,
                oc.total,
                oc.observaciones,
                emp.nombre as empresa_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas emp ON oc.empresa = emp.codigo
            WHERE oc.empresa = $1
        `;
        
        const params = [empresa];
        
        if (estado) {
            params.push(estado);
            query += ` AND oc.estado = $2`;
        }
        
        query += ` ORDER BY oc.fecha DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/ordenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener órdenes de compra',
            details: error.message
        });
    }
});

// GET /api/ordenes/:codigo - Detalle de orden de compra
app.get('/api/ordenes/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa = '1' } = req.query;
    
    try {
        // Obtener cabecera de la orden
        const headerQuery = `
            SELECT 
                oc.*,
                emp.nombre as empresa_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas emp ON oc.empresa = emp.codigo
            WHERE oc.codigo = $1 AND oc.empresa = $2
        `;
        
        const headerResult = await pool.query(headerQuery, [codigo, empresa]);
        
        if (headerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Orden de compra no encontrada'
            });
        }
        
        // Obtener detalle de la orden
        const detailQuery = `
            SELECT 
                doc.*,
                pv.nombre as producto_nombre
            FROM detalle_ordenes doc
            LEFT JOIN productos_venta pv ON doc.producto_venta = pv.codigo
            WHERE doc.orden = $1
            ORDER BY doc.id
        `;
        
        const detailResult = await pool.query(detailQuery, [codigo]);
        
        res.json({
            success: true,
            data: {
                ...headerResult.rows[0],
                detalles: detailResult.rows
            }
        });
        
    } catch (error) {
        console.error('Error en /api/ordenes/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle de orden',
            details: error.message
        });
    }
});

// ================================================================
// RUTAS - FACTURAS / VENTAS
// ================================================================

// GET /api/facturas - Lista de facturas
app.get('/api/facturas', async (req, res) => {
    const { empresa = '1', limit = 50, desde, hasta } = req.query;
    
    try {
        let query = `
            SELECT 
                fv.codigo,
                v.fecha,
                v.cliente,
                v.total,
                v.tipo_pago,
                v.estado,
                emp.nombre as empresa_nombre
            FROM factura_venta fv
            INNER JOIN ventas v ON fv.codigo = v.codigo AND fv.empresa = v.empresa
            LEFT JOIN empresas emp ON fv.empresa = emp.codigo
            WHERE fv.empresa = $1
        `;
        
        const params = [empresa];
        let paramCount = 1;
        
        if (desde) {
            paramCount++;
            query += ` AND v.fecha >= $${paramCount}`;
            params.push(desde);
        }
        
        if (hasta) {
            paramCount++;
            query += ` AND v.fecha <= $${paramCount}`;
            params.push(hasta);
        }
        
        query += ` ORDER BY v.fecha DESC LIMIT $${paramCount + 1}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/facturas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener facturas',
            details: error.message
        });
    }
});

// GET /api/facturas/:codigo - Detalle de factura
app.get('/api/facturas/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa = '1' } = req.query;
    
    try {
        // Cabecera
        const headerQuery = `
            SELECT 
                fv.*,
                v.fecha,
                v.cliente,
                v.total,
                v.tipo_pago,
                v.estado
            FROM factura_venta fv
            INNER JOIN ventas v ON fv.codigo = v.codigo
            WHERE fv.codigo = $1 AND fv.empresa = $2
        `;
        
        const headerResult = await pool.query(headerQuery, [codigo, empresa]);
        
        if (headerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }
        
        // Detalle
        const detailQuery = `
            SELECT 
                dfv.*,
                pv.nombre as producto_nombre
            FROM detalle_factura_venta dfv
            LEFT JOIN productos_venta pv ON dfv.codigo = pv.codigo
            WHERE dfv.codigo = $1
            ORDER BY dfv.id
        `;
        
        const detailResult = await pool.query(detailQuery, [codigo]);
        
        res.json({
            success: true,
            data: {
                ...headerResult.rows[0],
                detalles: detailResult.rows
            }
        });
        
    } catch (error) {
        console.error('Error en /api/facturas/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle de factura',
            details: error.message
        });
    }
});

// ================================================================
// RUTAS - DASHBOARD Y REPORTES
// ================================================================

// GET /api/dashboard - Resumen general
app.get('/api/dashboard', async (req, res) => {
    const { empresa = '1' } = req.query;
    
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM productos WHERE empresa = $1) as total_productos,
                (SELECT COUNT(*) FROM productos p 
                 LEFT JOIN inventario i ON p.codigo = i.periodo 
                 WHERE p.empresa = $1 AND COALESCE(i.valor, 0) <= p.stock_minimo) as productos_stock_bajo,
                (SELECT COALESCE(SUM(i.valor * i.ccosto), 0) FROM inventario i 
                 INNER JOIN productos p ON i.periodo = p.codigo 
                 WHERE p.empresa = $1) as valor_total_inventario,
                (SELECT COUNT(*) FROM ordenes_compra 
                 WHERE empresa = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days') as ordenes_mes_actual,
                (SELECT COALESCE(SUM(total), 0) FROM ordenes_compra 
                 WHERE empresa = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days') as total_ordenes_mes,
                (SELECT COUNT(*) FROM ventas 
                 WHERE empresa = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days') as ventas_mes_actual,
                (SELECT COALESCE(SUM(total), 0) FROM ventas 
                 WHERE empresa = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days') as total_ventas_mes
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error en /api/dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener dashboard',
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
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', error: error.message });
    }
});

// ================================================================
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
