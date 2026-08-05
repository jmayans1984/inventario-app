// ================================================================
// API BACKEND - INVENTARIO CON AUTENTICACIÓN (MODULAR v2.0)
// Node.js + Express + PostgreSQL (Aiven)
// Todo en un solo archivo - organizado por secciones
// ================================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;
// v1.10.0 - Predicción de Agotamiento

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
    max: 5,
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

app.use(cors({
    origin: [
        'https://jmayans1984.github.io',
        'https://heartfelt-moxie-a79307.netlify.app',
        'https://inventario-app.juan-donado84.workers.dev',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // x-dispositivo-token: identifica el celular enrolado en el marcaje de
    // asistencia. Sin él en esta lista el navegador bloquea el preflight y
    // /asistencia/estado y /asistencia/marcar nunca llegan al servidor.
    allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa', 'x-dispositivo-token']
}));

// Aumentar límite para soportar imágenes base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ================================================================
// MÓDULO 1: AUTENTICACIÓN
// ================================================================

// POST /api/auth/login - Login de usuario
app.post('/api/auth/login', async (req, res) => {
    const { usuario, clave } = req.body;
    
    if (!usuario || !clave) {
        return res.status(400).json({
            success: false,
            error: 'Usuario y contraseña requeridos'
        });
    }
    
    try {
        const query = `
            SELECT codigo, usuario, nombre, clave, nivel, empresa
            FROM usuarios
            WHERE UPPER(usuario) = UPPER($1)
            AND clave = $2
        `;
        
        const result = await pool.query(query, [usuario, clave]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario o contraseña incorrectos'
            });
        }
        
        const empresasQuery = `
            SELECT DISTINCT u.empresa, e.nombre as empresa_nombre, COALESCE(e.tipo_empresa, '') as tipo
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa = e.codigo
            WHERE UPPER(u.usuario) = UPPER($1)
            ORDER BY e.nombre
        `;
        
        const empresasResult = await pool.query(empresasQuery, [usuario]);
        const userData = result.rows[0];
        
        res.json({
            success: true,
            data: {
                codigo: userData.codigo,
                usuario: userData.usuario,
                nombre: userData.nombre,
                nivel: userData.nivel,
                empresas: empresasResult.rows,
                requiere_seleccion: empresasResult.rows.length > 1
            }
        });
        
    } catch (error) {
        console.error('Error en /api/auth/login:', error);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor',
            details: error.message
        });
    }
});

// ================================================================
// MÓDULO 2: CENTROS DE COSTO Y EMPRESAS
// ================================================================

// GET /api/ccostos - Obtener centros de costo
app.get('/api/ccostos', async (req, res) => {
    const { empresa, todos } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        // Por defecto solo centros de costo ACTIVOS (todos=1 para incluir inactivos)
        const query = `
            SELECT codigo, nombre
            FROM ccostos
            WHERE empresa = $1
            ${todos === '1' ? '' : `AND COALESCE(activo, 'SI') <> 'NO'`}
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

// GET /api/empresa/tipo - Obtener tipo de empresa
app.get('/api/empresa/tipo', async (req, res) => {
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
            FROM empresas
            WHERE codigo = $1
        `;
        
        const result = await pool.query(query, [empresa]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Empresa no encontrada'
            });
        }
        
        let tipo = 'CLIENTE';
        try {
            const tipoQuery = `
                SELECT tipo_empresa
                FROM empresas
                WHERE codigo = $1
            `;
            const tipoResult = await pool.query(tipoQuery, [empresa]);
            if (tipoResult.rows.length > 0 && tipoResult.rows[0].tipo_empresa) {
                tipo = tipoResult.rows[0].tipo_empresa;
            }
        } catch (e) {
            console.log('Campo tipo_empresa no existe, usando CLIENTE por defecto');
        }
        
        res.json({
            success: true,
            tipo: tipo,
            data: {
                codigo: result.rows[0].codigo,
                nombre: result.rows[0].nombre,
                tipo: tipo
            }
        });
        
    } catch (error) {
        console.error('Error en /api/empresa/tipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener tipo de empresa',
            details: error.message
        });
    }
});

// GET /api/empresa/info - Info completa de la empresa activa
app.get('/api/empresa/info', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const result = await pool.query('SELECT * FROM empresas WHERE codigo = $1', [empresa]);
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error /api/empresa/info:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/empresas/all - Obtener todas las empresas
app.get('/api/empresas/all', async (req, res) => {
    try {
        const query = `
            SELECT codigo, nombre, tipo_empresa
            FROM empresas
            ORDER BY nombre
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Error en /api/empresas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener empresas',
            details: error.message
        });
    }
});

// ================================================================
// MÓDULO 3: INVENTARIO
// ================================================================

// ── GESTIÓN DE PRODUCTOS (CRUD) ──────────────────────────────────

// GET /api/almacen/grupo-productos — lista de grupos para CBB
app.get('/api/almacen/grupo-productos', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT codigo, nombre, COALESCE(activo,'SI') AS activo FROM grupo_productos ORDER BY nombre`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/grupo-productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/grupo-productos/proximo-codigo — siguiente código numérico disponible
app.get('/api/almacen/grupo-productos/proximo-codigo', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT codigo FROM grupo_productos WHERE codigo ~ '^[0-9]+$' ORDER BY CAST(codigo AS INTEGER) DESC LIMIT 1`
        );
        const ultimo = result.rows[0]?.codigo ? parseInt(result.rows[0].codigo) : 0;
        res.json({ success: true, codigo: String(ultimo + 1).padStart(3, '0') });
    } catch (error) {
        console.error('Error GET /api/almacen/grupo-productos/proximo-codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/almacen/grupo-productos — crear grupo
app.post('/api/almacen/grupo-productos', async (req, res) => {
    try {
        const { codigo, nombre, activo } = req.body;
        if (!codigo || !nombre) {
            return res.status(400).json({ success: false, error: 'Código y nombre son requeridos' });
        }
        await pool.query(
            `INSERT INTO grupo_productos (codigo, nombre, activo) VALUES ($1, $2, $3)`,
            [codigo, nombre, activo || 'SI']
        );
        const result = await pool.query(
            `SELECT codigo, nombre, COALESCE(activo,'SI') AS activo FROM grupo_productos WHERE codigo = $1`,
            [codigo]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/almacen/grupo-productos:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, error: 'Ya existe un grupo con ese código' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/almacen/grupo-productos/:codigo — editar grupo
app.put('/api/almacen/grupo-productos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre, activo } = req.body;
        await pool.query(
            `UPDATE grupo_productos SET nombre = $1, activo = COALESCE($2, activo) WHERE codigo = $3`,
            [nombre, activo, codigo]
        );
        const result = await pool.query(
            `SELECT codigo, nombre, COALESCE(activo,'SI') AS activo FROM grupo_productos WHERE codigo = $1`,
            [codigo]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/almacen/grupo-productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/almacen/grupo-productos/:codigo — eliminar grupo (solo si no tiene productos asociados)
app.delete('/api/almacen/grupo-productos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const enUso = await pool.query(`SELECT 1 FROM productos WHERE grupo = $1 LIMIT 1`, [codigo]);
        if (enUso.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'No se puede eliminar: hay productos asociados a este grupo' });
        }
        await pool.query(`DELETE FROM grupo_productos WHERE codigo = $1`, [codigo]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/almacen/grupo-productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/productos/proximo-codigo — siguiente código disponible
app.get('/api/almacen/productos/proximo-codigo', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COALESCE(MAX(CAST(codigo AS INTEGER)), 0) + 1 AS siguiente FROM productos`
        );
        const sig = parseInt(result.rows[0].siguiente);
        res.json({ success: true, codigo: String(sig).padStart(3, '0') });
    } catch (error) {
        console.error('Error GET /api/almacen/productos/proximo-codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/productos — listado completo con nombre del grupo
app.get('/api/almacen/productos', async (req, res) => {
    try {
        const { search } = req.query;
        const empresaCod = req.query.empresa || req.headers['x-empresa'];

        // Obtener tipo_empresa para verificar que es CLIENTE
        let tipoEmpresa = 'PROVEEDOR'; // default
        if (empresaCod) {
            const empResult = await pool.query(
                `SELECT tipo_empresa FROM empresas WHERE codigo = $1`,
                [empresaCod]
            );
            if (empResult.rows.length > 0) {
                tipoEmpresa = empResult.rows[0].tipo_empresa || 'PROVEEDOR';
            }
        }

        let query = `
            SELECT p.codigo, p.nombre, p.und, p.grupo,
                   g.nombre AS grupo_nombre, p.control, p.para_venta, p.visible_operacional,
                   COALESCE(p.precio_costo, 0) AS precio_costo,
                   COALESCE(p.precio_venta1, 0) AS precio_venta1,
                   COALESCE(p.precio_venta2, 0) AS precio_venta2,
                   COALESCE(p.precio_venta3, 0) AS precio_venta3,
                   COALESCE(p.stock_minimo, 0) AS stock_minimo,
                   p.descripcion, p.ubicacion
            FROM productos p
            LEFT JOIN grupo_productos g ON g.codigo = p.grupo
        `;
        const params = [];
        let whereClause = [];

        if (tipoEmpresa === 'CLIENTE') {
            whereClause.push(`p.para_venta = 'SI'`);
        }

        // Búsqueda
        if (search) {
            params.push(`%${search.toUpperCase()}%`);
            whereClause.push(`(UPPER(p.nombre) LIKE $${params.length} OR p.codigo LIKE $${params.length})`);
        }

        if (whereClause.length > 0) {
            query += ` WHERE ` + whereClause.join(` AND `);
        }

        query += ` ORDER BY g.codigo NULLS LAST, p.nombre`;

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/productos-precios — todos los productos con sus precios (sin filtro de flags)
app.get('/api/almacen/productos-precios', async (req, res) => {
    try {
        const { search } = req.query;
        const params = [];
        let where = '';
        if (search) {
            params.push(`%${search.toUpperCase()}%`);
            where = `WHERE (UPPER(p.nombre) LIKE $1 OR p.codigo LIKE $1)`;
        }
        const result = await pool.query(
            `SELECT p.codigo, p.nombre, p.und, p.grupo, g.nombre AS grupo_nombre,
                    COALESCE(p.precio_costo,  0) AS precio_costo,
                    COALESCE(p.precio_venta1, 0) AS precio_venta1,
                    COALESCE(p.precio_venta2, 0) AS precio_venta2,
                    COALESCE(p.precio_venta3, 0) AS precio_venta3,
                    p.descripcion
             FROM productos p
             LEFT JOIN grupo_productos g ON g.codigo = p.grupo
             ${where}
             ORDER BY g.codigo NULLS LAST, p.nombre`,
            params
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/productos-precios:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/stock-bodega-maestra — stock actual de todos los productos en bodega maestra
app.get('/api/almacen/stock-bodega-maestra', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });
        const empResult = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [empresaCod]
        );
        if (!empResult.rows.length || !empResult.rows[0].bodega_maestra) {
            return res.json({ success: true, data: {}, bodega: null });
        }
        const bodega  = empResult.rows[0].bodega_maestra;
        const empInt  = parseInt(empresaCod);
        const empParam = isNaN(empInt) ? empresaCod : empInt;
        const result = await pool.query(`
            SELECT p.codigo,
                ROUND((COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0))::numeric, 4) AS stock_actual
            FROM productos p
            LEFT JOIN detalle_inventario di
                   ON p.codigo = di.codigo AND di.ccosto = $1 AND di.empresa = $2
            WHERE p.control = 'SI' AND p.para_venta = 'SI'
            GROUP BY p.codigo
        `, [bodega, empParam]);
        const data = {};
        result.rows.forEach(r => { data[r.codigo] = parseFloat(r.stock_actual) || 0 });
        res.json({ success: true, data, bodega });
    } catch (error) {
        console.error('Error GET /api/almacen/stock-bodega-maestra:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/kardex-consolidado — stock actual por producto por CC
app.get('/api/almacen/kardex-consolidado', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerido' });
    const emp = parseInt(empresa);
    try {
        const ccRes = await pool.query(
            `SELECT codigo, nombre FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO' ORDER BY nombre`,
            [emp]
        );

        // Bodega maestra de la empresa
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo = $1`,
            [emp]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;

        // Productos que tienen movimientos en esta empresa
        const prodRes = await pool.query(
            `SELECT DISTINCT p.codigo, p.nombre, COALESCE(p.descripcion,'') AS descripcion, p.und,
                    COALESCE(p.grupo,'') AS grupo,
                    COALESCE(gp.nombre,'Sin Grupo') AS grupo_nombre,
                    COALESCE(gp.codigo,'999') AS grupo_codigo,
                    COALESCE(p.visible_operacional,'NO') AS visible_operacional,
                    COALESCE(p.control,'NO') AS control,
                    COALESCE(p.stock_minimo, 0) AS stock_minimo
             FROM productos p
             INNER JOIN detalle_inventario di ON di.codigo = p.codigo AND di.empresa = $1
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE p.control = 'SI' OR p.visible_operacional = 'SI'
             ORDER BY COALESCE(gp.codigo,'999'), p.nombre`,
            [emp]
        );

        const stockRes = await pool.query(
            `SELECT di.codigo, di.ccosto,
                    ROUND((COALESCE(SUM(di.entrada),0) - COALESCE(SUM(di.salida),0))::numeric, 4) AS stock
             FROM detalle_inventario di
             WHERE di.empresa = $1
             GROUP BY di.codigo, di.ccosto`,
            [emp]
        );

        const stockMap = {};
        for (const row of stockRes.rows) {
            if (!stockMap[row.codigo]) stockMap[row.codigo] = {};
            stockMap[row.codigo][row.ccosto] = parseFloat(row.stock);
        }

        const productos = prodRes.rows.map(p => ({
            ...p,
            stocks: stockMap[p.codigo] || {}
        }));

        // Ventas del día anterior por CC
        const ventasRes = await pool.query(
            `SELECT ccosto, COALESCE(SUM(efectivo), 0) AS total
             FROM ventas
             WHERE fecha = CURRENT_DATE - INTERVAL '1 day' AND empresa = $1
             GROUP BY ccosto`,
            [emp]
        );
        const ventasMap = {};
        for (const row of ventasRes.rows) {
            ventasMap[String(row.ccosto)] = parseFloat(row.total);
        }
        const ccostos = ccRes.rows.map(cc => ({
            ...cc,
            venta_ayer: ventasMap[String(cc.codigo)] || 0
        }));

        res.json({ success: true, ccostos, productos, bodegaMaestra });
    } catch (error) {
        console.error('Error GET /api/almacen/kardex-consolidado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/reporte-alertas-stock — productos bajo stock mínimo en la bodega maestra
app.get('/api/almacen/reporte-alertas-stock', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        // Obtener bodega_maestra de la empresa
        const empResult = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [empresaCod]
        );
        if (!empResult.rows.length || !empResult.rows[0].bodega_maestra) {
            return res.json({ success: true, data: [], advertencia: 'La empresa no tiene bodega maestra configurada' });
        }
        const bodega = empResult.rows[0].bodega_maestra;
        const empInt  = parseInt(empresaCod);
        const empParam = isNaN(empInt) ? empresaCod : empInt;

        const result = await pool.query(`
            SELECT
                p.codigo,
                p.nombre,
                p.descripcion,
                p.und,
                COALESCE(p.stock_minimo, 0)                                                                    AS stock_minimo,
                ROUND((COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0))::numeric, 4)              AS stock_actual,
                ROUND((COALESCE(p.stock_minimo, 0) -
                    (COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0)))::numeric, 4)               AS faltante,
                COALESCE(g.nombre, 'Sin Grupo')                                      AS grupo_nombre,
                COALESCE(g.codigo, '0')                                              AS grupo_codigo
            FROM productos p
            LEFT JOIN grupo_productos g ON g.codigo = p.grupo
            LEFT JOIN detalle_inventario di
                   ON p.codigo = di.codigo
                  AND di.ccosto  = $1
                  AND di.empresa = $2
            WHERE p.control = 'SI'
            GROUP BY p.codigo, p.nombre, p.descripcion, p.und, p.stock_minimo, g.codigo, g.nombre
            HAVING COALESCE(p.stock_minimo, 0) > 0
               AND ROUND((COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0))::numeric, 4) < COALESCE(p.stock_minimo, 0)
            ORDER BY g.codigo NULLS LAST, p.nombre
        `, [bodega, empParam]);

        res.json({ success: true, data: result.rows, bodega });
    } catch (error) {
        console.error('Error GET /api/almacen/reporte-alertas-stock:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/control-stock — obtener productos con stock actual por centro de costo (bodega maestra)
app.get('/api/almacen/control-stock', async (req, res) => {
    try {
        const { ccosto } = req.query;
        const empresaCod = req.query.empresa || req.headers['x-empresa'];

        if (!empresaCod) {
            return res.status(400).json({ success: false, error: 'Empresa requerida' });
        }

        if (!ccosto) {
            return res.status(400).json({ success: false, error: 'Centro de costo (ccosto) requerido' });
        }

        // Obtener tipo_empresa para filtrar por para_venta si es CLIENTE
        let tipoEmpresa = 'PROVEEDOR';
        const empResult = await pool.query(
            `SELECT tipo_empresa FROM empresas WHERE codigo = $1`,
            [empresaCod]
        );
        if (empResult.rows.length > 0) {
            tipoEmpresa = empResult.rows[0].tipo_empresa || 'PROVEEDOR';
        }

        // Determinar tipo de empresa para el JOIN (detalle_inventario.empresa puede ser INTEGER)
        const empInt = parseInt(empresaCod);
        const empParam = isNaN(empInt) ? empresaCod : empInt;

        let query = `
            SELECT p.codigo, p.nombre, p.und, p.grupo, g.nombre AS grupo_nombre,
                   p.stock_minimo, p.descripcion,
                   COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0) AS stock_actual
            FROM productos p
            LEFT JOIN grupo_productos g ON g.codigo = p.grupo
            LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.ccosto = $1 AND di.empresa = $2
        `;

        const params = [ccosto, empParam];
        const whereClause = [];

        // Si es CLIENTE, solo mostrar productos con para_venta='SI'
        if (tipoEmpresa === 'CLIENTE') {
            whereClause.push(`p.para_venta = 'SI'`);
        }

        // Mostrar solo productos con control = 'SI'
        whereClause.push(`p.control = 'SI'`);

        if (whereClause.length > 0) {
            query += ` WHERE ` + whereClause.join(` AND `);
        }

        query += `
            GROUP BY p.codigo, p.nombre, p.und, p.grupo, g.codigo, g.nombre, p.stock_minimo, p.descripcion
            ORDER BY g.codigo NULLS LAST, p.nombre
        `;

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/control-stock:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/almacen/productos — crear producto
app.post('/api/almacen/productos', async (req, res) => {
    const { codigo, nombre, und, grupo, control, para_venta, visible_operacional, precio_costo, descripcion } = req.body;
    if (!codigo || !nombre || !und) {
        return res.status(400).json({ success: false, error: 'Campos obligatorios: codigo, nombre, und' });
    }
    try {
        const existe = await pool.query(`SELECT codigo FROM productos WHERE codigo = $1`, [codigo]);
        if (existe.rows.length > 0) {
            return res.status(409).json({ success: false, error: `El código ${codigo} ya existe` });
        }

        const pc = parseFloat(precio_costo) || 0;

        // Obtener márgenes de config_listas_precios para calcular precios automáticamente
        const cfgRes = await pool.query(
            `SELECT margen_venta1, margen_venta2, margen_venta3 FROM config_listas_precios LIMIT 1`
        );
        let pv1 = 0, pv2 = 0, pv3 = 0;
        if (cfgRes.rows.length > 0 && pc > 0) {
            const cfg = cfgRes.rows[0];
            const m1 = parseFloat(cfg.margen_venta1) || 0;
            const m2 = parseFloat(cfg.margen_venta2) || 0;
            const m3 = parseFloat(cfg.margen_venta3) || 0;
            if (m1 > 0 && m1 < 1) pv1 = Math.round(pc / (1 - m1) * 100) / 100;
            if (m2 > 0 && m2 < 1) pv2 = Math.round(pc / (1 - m2) * 100) / 100;
            if (m3 > 0 && m3 < 1) pv3 = Math.round(pc / (1 - m3) * 100) / 100;
        }

        await pool.query(
            `INSERT INTO productos (codigo, nombre, und, grupo, control, para_venta, visible_operacional, precio_costo, precio_venta1, precio_venta2, precio_venta3, stock_minimo, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                codigo,
                nombre.trim(),
                und.trim(),
                grupo || null,
                control || 'NO',
                para_venta || 'NO',
                visible_operacional || 'SI',
                pc,
                pv1,
                pv2,
                pv3,
                0,
                descripcion || null
            ]
        );
        const nuevo = await pool.query(
            `SELECT p.codigo, p.nombre, p.und, p.grupo, g.nombre AS grupo_nombre, p.control, p.para_venta, p.visible_operacional,
                    COALESCE(p.precio_costo, 0) AS precio_costo,
                    COALESCE(p.precio_venta1, 0) AS precio_venta1,
                    COALESCE(p.precio_venta2, 0) AS precio_venta2,
                    COALESCE(p.precio_venta3, 0) AS precio_venta3,
                    COALESCE(p.stock_minimo, 0) AS stock_minimo,
                    p.descripcion
             FROM productos p LEFT JOIN grupo_productos g ON g.codigo = p.grupo
             WHERE p.codigo = $1`, [codigo]
        );
        res.json({ success: true, data: nuevo.rows[0] });
    } catch (error) {
        console.error('Error POST /api/almacen/productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/almacen/productos/:codigo — actualizar producto
app.put('/api/almacen/productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, und, grupo, control, para_venta, visible_operacional, precio_costo, stock_minimo, descripcion } = req.body;
    if (!nombre || !und) {
        return res.status(400).json({ success: false, error: 'Campos obligatorios: nombre, und' });
    }
    try {
        const pc = Math.round((parseFloat(precio_costo) || 0) * 100) / 100;
        const sm = Math.round((parseFloat(stock_minimo) || 0) * 100) / 100;

        // Obtener márgenes para calcular precios automáticamente
        const cfgRes = await pool.query(
            `SELECT margen_venta1, margen_venta2, margen_venta3 FROM config_listas_precios LIMIT 1`
        );
        let pv1 = 0, pv2 = 0, pv3 = 0;
        if (cfgRes.rows.length > 0 && pc > 0) {
            const cfg = cfgRes.rows[0];
            const m1 = parseFloat(cfg.margen_venta1) || 0;
            const m2 = parseFloat(cfg.margen_venta2) || 0;
            const m3 = parseFloat(cfg.margen_venta3) || 0;
            if (m1 > 0 && m1 < 1) pv1 = Math.round(pc / (1 - m1) * 100) / 100;
            if (m2 > 0 && m2 < 1) pv2 = Math.round(pc / (1 - m2) * 100) / 100;
            if (m3 > 0 && m3 < 1) pv3 = Math.round(pc / (1 - m3) * 100) / 100;
        }

        const result = await pool.query(
            `UPDATE productos
             SET nombre=$1, und=$2, grupo=$3,
                 control             = COALESCE($4, control),
                 para_venta          = COALESCE($5, para_venta),
                 visible_operacional = COALESCE($6, visible_operacional),
                 precio_costo=$7, precio_venta1=$8, precio_venta2=$9, precio_venta3=$10, stock_minimo=$11, descripcion=$12
             WHERE codigo=$13`,
            [
                nombre.trim(),
                und.trim(),
                grupo || null,
                control || null,
                para_venta || null,
                visible_operacional || null,
                pc,
                pv1,
                pv2,
                pv3,
                sm,
                descripcion || null,
                codigo
            ]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        const actualizado = await pool.query(
            `SELECT p.codigo, p.nombre, p.und, p.grupo, g.nombre AS grupo_nombre, p.control, p.para_venta, p.visible_operacional,
                    COALESCE(p.precio_costo, 0) AS precio_costo,
                    COALESCE(p.precio_venta1, 0) AS precio_venta1,
                    COALESCE(p.precio_venta2, 0) AS precio_venta2,
                    COALESCE(p.precio_venta3, 0) AS precio_venta3,
                    COALESCE(p.stock_minimo, 0) AS stock_minimo,
                    p.descripcion
             FROM productos p LEFT JOIN grupo_productos g ON g.codigo = p.grupo
             WHERE p.codigo = $1`, [codigo]
        );
        res.json({ success: true, data: actualizado.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/almacen/productos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── COSTOS DE PRODUCTOS (actualización manual, ruteada por empresa) ───────────
// PRINCIPAL (tipo_empresa = PROVEEDOR) → costo BASE en productos.precio_costo
// CLIENTE                              → su capa producto_costo_empresa
// (mismo criterio que la actualización de costo desde gastos, línea ~9491)

// GET /api/almacen/costos-productos?empresa=
app.get('/api/almacen/costos-productos', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const teRes = await pool.query(`SELECT tipo_empresa FROM empresas WHERE codigo = $1`, [empresa]);
        const esPrincipal = (teRes.rows[0]?.tipo_empresa || 'PROVEEDOR') === 'PROVEEDOR';

        const result = await pool.query(
            `SELECT p.codigo, p.nombre, COALESCE(p.descripcion, '') AS descripcion, p.und,
                    COALESCE(p.grupo, '__sin__')      AS grupo,
                    COALESCE(gp.nombre, 'Sin Grupo')  AS grupo_nombre,
                    COALESCE(p.precio_costo, 0)       AS costo_base,
                    pce.precio_costo                  AS costo_empresa,
                    COALESCE(pce.precio_costo, p.precio_costo, 0) AS precio_costo,
                    p.receta_vinculada,
                    r.nombre                          AS receta_nombre
             FROM productos p
             LEFT JOIN producto_costo_empresa pce
                    ON pce.codigo = p.codigo AND TRIM(pce.empresa) = TRIM($1::text)
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             LEFT JOIN recetas r ON r.codigo = p.receta_vinculada
             ORDER BY COALESCE(gp.nombre, 'Sin Grupo'), p.nombre`,
            [String(empresa)]
        );

        res.json({ success: true, esPrincipal, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/costos-productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/almacen/costos-productos/:codigo   body: { empresa, precio_costo, receta_vinculada? }
app.put('/api/almacen/costos-productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa, precio_costo, receta_vinculada } = req.body;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const costo = Math.round((parseFloat(precio_costo) || 0) * 100) / 100;
    if (costo < 0) return res.status(400).json({ success: false, error: 'El costo no puede ser negativo' });

    try {
        const existe = await pool.query(`SELECT 1 FROM productos WHERE codigo = $1`, [codigo]);
        if (!existe.rowCount) return res.status(404).json({ success: false, error: 'Producto no encontrado' });

        const teRes = await pool.query(`SELECT tipo_empresa FROM empresas WHERE codigo = $1`, [empresa]);
        const esPrincipal = (teRes.rows[0]?.tipo_empresa || 'PROVEEDOR') === 'PROVEEDOR';

        if (esPrincipal) {
            await pool.query(`UPDATE productos SET precio_costo = $1 WHERE codigo = $2`, [costo, codigo]);
        } else {
            await pool.query(
                `INSERT INTO producto_costo_empresa (empresa, codigo, precio_costo)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (empresa, codigo) DO UPDATE SET precio_costo = EXCLUDED.precio_costo`,
                [String(empresa), String(codigo).trim(), costo]
            );
        }

        // receta_vinculada es un vínculo global (no por empresa) — se guarda siempre en productos
        if (receta_vinculada !== undefined) {
            const rv = receta_vinculada?.trim() || null;
            await pool.query(
                `UPDATE productos SET receta_vinculada = $1 WHERE codigo = $2`,
                [rv, codigo]
            );
        }

        res.json({ success: true, data: { codigo, precio_costo: costo, esPrincipal } });
    } catch (error) {
        console.error('Error PUT /api/almacen/costos-productos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/almacen/costos-productos/sincronizar   body: { empresa }
// Copia el costo actual de cada receta vinculada a su producto (sin recalcular recetas).
app.post('/api/almacen/costos-productos/sincronizar', async (req, res) => {
    const empresa = req.body?.empresa || req.query.empresa;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    try {
        const teRes = await pool.query(`SELECT tipo_empresa FROM empresas WHERE codigo = $1`, [empresa]);
        const esPrincipal = (teRes.rows[0]?.tipo_empresa || 'PROVEEDOR') === 'PROVEEDOR';

        // Lee productos vinculados con el costo actual de su receta (COALESCE empresa/base)
        const vinculadosRes = await pool.query(`
            SELECT p.codigo AS producto_codigo,
                   COALESCE(rce.valor, r.valor, 0) AS costo_receta
            FROM productos p
            JOIN recetas r ON r.codigo = p.receta_vinculada
            LEFT JOIN receta_costo_empresa rce
                   ON rce.codigo = r.codigo AND TRIM(rce.empresa) = TRIM($1)
            WHERE p.receta_vinculada IS NOT NULL
        `, [empresa]);

        if (vinculadosRes.rows.length === 0) {
            return res.json({ success: true, sincronizados: 0, esPrincipal });
        }

        // Construye un UPDATE/UPSERT en batch
        let sincronizados = 0;
        for (const row of vinculadosRes.rows) {
            const costo = Math.round((parseFloat(row.costo_receta) || 0) * 100) / 100;
            if (esPrincipal) {
                await pool.query(
                    `UPDATE productos SET precio_costo = $1 WHERE codigo = $2`,
                    [costo, row.producto_codigo]
                );
            } else {
                await pool.query(
                    `INSERT INTO producto_costo_empresa (empresa, codigo, precio_costo)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (empresa, codigo) DO UPDATE SET precio_costo = EXCLUDED.precio_costo`,
                    [empresa, row.producto_codigo, costo]
                );
            }
            sincronizados++;
        }

        res.json({ success: true, sincronizados, esPrincipal });
    } catch (error) {
        console.error('Error POST /api/almacen/costos-productos/sincronizar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN COSTOS DE PRODUCTOS ───────────────────────────────────────────────────

// ── BARCODES ──────────────────────────────────────────────────────────────────

// GET /api/almacen/productos/:codigo/barcodes
app.get('/api/almacen/productos/:codigo/barcodes', async (req, res) => {
    const { codigo } = req.params;
    const empresa = req.query.empresa || req.headers['x-empresa'];
    try {
        const result = await pool.query(
            `SELECT id, barcode, descripcion, es_principal, factor, creado_en
             FROM producto_barcodes
             WHERE empresa=$1 AND producto_codigo=$2
             ORDER BY es_principal DESC, creado_en ASC`,
            [empresa, codigo]
        );
        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/almacen/productos/:codigo/barcodes
app.post('/api/almacen/productos/:codigo/barcodes', async (req, res) => {
    const { codigo } = req.params;
    const empresa = req.body.empresa || req.headers['x-empresa'];
    const { barcode, descripcion, es_principal, factor } = req.body;
    if (!barcode) return res.status(400).json({ success: false, error: 'Barcode requerido' });
    const factorNum = parseFloat(factor) > 0 ? parseFloat(factor) : 1;
    try {
        // Si es_principal, quitar principal anterior
        if (es_principal) {
            await pool.query(
                `UPDATE producto_barcodes SET es_principal=FALSE WHERE empresa=$1 AND producto_codigo=$2`,
                [empresa, codigo]
            );
        }
        const result = await pool.query(
            `INSERT INTO producto_barcodes (empresa, producto_codigo, barcode, descripcion, es_principal, factor)
             VALUES ($1,$2,$3,$4,$5,$6)
             RETURNING *`,
            [empresa, codigo, barcode.trim(), (descripcion || '').trim() || null, !!es_principal, factorNum]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, error: 'Este código de barra ya está registrado para otra empresa/producto' });
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/almacen/barcodes/:id
app.delete('/api/almacen/barcodes/:id', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    try {
        const result = await pool.query(
            `DELETE FROM producto_barcodes WHERE id=$1 AND empresa=$2 RETURNING id`,
            [req.params.id, empresa]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/almacen/barcodes-all?empresa=xxx
// Devuelve TODOS los barcodes de la empresa para precargar en el scanner (local-first)
app.get('/api/almacen/barcodes-all', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const r = await pool.query(
            `SELECT pb.barcode, pb.producto_codigo, p.nombre, pb.factor
             FROM producto_barcodes pb
             JOIN productos p ON p.codigo = pb.producto_codigo
             WHERE pb.empresa=$1`,
            [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/almacen/barcode-lookup?barcode=xxx&empresa=xxx
// Busca el producto asociado a un código de barra (usado por el scanner)
app.get('/api/almacen/barcode-lookup', async (req, res) => {
    const { barcode, empresa } = req.query;
    if (!barcode) return res.status(400).json({ success: false, error: 'barcode requerido' });
    try {
        // Primero buscar en tabla de barcodes
        const r = await pool.query(
            `SELECT pb.producto_codigo, p.nombre, p.und, pb.descripcion AS barcode_desc, pb.factor
             FROM producto_barcodes pb
             JOIN productos p ON p.codigo = pb.producto_codigo
             WHERE pb.barcode=$1 AND pb.empresa=$2`,
            [barcode.trim(), empresa]
        );
        if (r.rows.length > 0) {
            return res.json({ success: true, found: true, data: r.rows[0] });
        }
        // Fallback: buscar por código interno del producto
        const r2 = await pool.query(
            `SELECT codigo AS producto_codigo, nombre, und FROM productos WHERE codigo=$1`,
            [barcode.trim()]
        );
        if (r2.rows.length > 0) {
            return res.json({ success: true, found: true, data: { ...r2.rows[0], factor: 1 } });
        }
        res.json({ success: true, found: false });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── DESPACHOS DE BODEGA ───────────────────────────────────────────────────────

// GET /api/almacen/despachos?empresa=&fecha=&estado=&cc_destino=
// GET /api/almacen/promedio-ventas-dia-semana — promedio de ventas del mismo día de la semana
// (últimos 5 días con venta, mismo weekday que `fecha`, en el cc_destino) + % imprevisto configurado
app.get('/api/almacen/promedio-ventas-dia-semana', async (req, res) => {
    const { empresa, ccosto, fecha } = req.query;
    if (!empresa || !ccosto || !fecha) {
        return res.status(400).json({ success: false, error: 'empresa, ccosto y fecha son requeridos' });
    }
    try {
        // % de imprevisto configurado por la empresa
        const empRes = await pool.query(
            `SELECT COALESCE(pct_imprevisto_despachos, 0) AS pct FROM empresas WHERE codigo = $1`,
            [parseInt(empresa)]
        );
        const pctImprevisto = parseFloat(empRes.rows[0]?.pct || 0);

        // Últimos 5 días (mismo día de la semana que `fecha`, estrictamente anteriores) con al menos una venta
        const diasRes = await pool.query(
            `SELECT DISTINCT fecha FROM detalle_inventario
             WHERE empresa::text = $1 AND ccosto = $2 AND tipo LIKE 'SALIDA POR VENTA%'
               AND fecha < $3::date
               AND EXTRACT(DOW FROM fecha) = EXTRACT(DOW FROM $3::date)
             ORDER BY fecha DESC
             LIMIT 5`,
            [String(empresa), ccosto, fecha]
        );
        const dias = diasRes.rows.map(r => r.fecha);

        let porProducto = {};
        if (dias.length > 0) {
            const ventasRes = await pool.query(
                `SELECT codigo, fecha, SUM(salida) AS cantidad
                 FROM detalle_inventario
                 WHERE empresa::text = $1 AND ccosto = $2 AND tipo LIKE 'SALIDA POR VENTA%'
                   AND fecha = ANY($3::date[])
                 GROUP BY codigo, fecha`,
                [String(empresa), ccosto, dias]
            );
            for (const r of ventasRes.rows) {
                if (!porProducto[r.codigo]) porProducto[r.codigo] = { total: 0, detalle: [] };
                const cant = parseFloat(r.cantidad) || 0;
                porProducto[r.codigo].total += cant;
                porProducto[r.codigo].detalle.push({ fecha: r.fecha, cantidad: cant });
            }
            for (const codigo of Object.keys(porProducto)) {
                const p = porProducto[codigo];
                p.detalle.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                const promedioBase = p.total / dias.length;
                p.promedio_base = promedioBase;
                p.promedio = promedioBase * (1 + pctImprevisto / 100);
                delete p.total;
            }
        }

        res.json({ success: true, data: { dias, pct_imprevisto: pctImprevisto, productos: porProducto } });
    } catch (e) {
        console.error('Error GET /api/almacen/promedio-ventas-dia-semana:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/almacen/despachos', async (req, res) => {
    const { empresa, fecha, estado, cc_destino } = req.query;
    try {
        const conds = ['od.empresa=$1::integer'];
        const params = [empresa];
        if (fecha)      { params.push(fecha);      conds.push(`od.fecha=$${params.length}`); }
        if (estado)     { params.push(estado);     conds.push(`od.estado=$${params.length}`); }
        if (cc_destino) { params.push(cc_destino); conds.push(`od.cc_destino=$${params.length}`); }

        const result = await pool.query(`
            SELECT od.*,
                   co.nombre AS cc_origen_nombre,
                   cd.nombre AS cc_destino_nombre,
                   ec.nombre AS cliente_nombre,
                   CASE WHEN od.tipo = 'VENTA'
                        THEN COALESCE(ec.nombre, od.orden_compra)
                        ELSE cd.nombre END AS destino_nombre,
                   (SELECT COUNT(*) FROM ordenes_despacho_detalle WHERE orden_id=od.id) AS total_items,
                   (SELECT COALESCE(SUM(cant_requerida),0) FROM ordenes_despacho_detalle WHERE orden_id=od.id) AS total_unidades
            FROM ordenes_despacho od
            LEFT JOIN ccostos co ON co.codigo=od.cc_origen AND co.empresa=od.empresa
            LEFT JOIN ccostos cd ON cd.codigo=od.cc_destino AND cd.empresa=od.empresa
            LEFT JOIN ordenes_compra oc ON oc.codigo = od.orden_compra
            LEFT JOIN empresas ec ON oc.cliente::text = ec.codigo::text
            WHERE ${conds.join(' AND ')}
            ORDER BY od.fecha DESC, od.id DESC
        `, params);

        // Si se solicita el detalle, agrégalo a cada orden
        if (req.query.include_detalle === '1' && result.rows.length > 0) {
            for (const orden of result.rows) {
                const detRes = await pool.query(`
                    SELECT odd.*, p.nombre AS producto_nombre, p.und, p.descripcion,
                           p.grupo AS grupo_codigo, g.nombre AS grupo_nombre
                    FROM ordenes_despacho_detalle odd
                    JOIN productos p ON p.codigo=odd.producto_codigo
                    LEFT JOIN grupo_productos g ON g.codigo=p.grupo
                    WHERE odd.orden_id=$1
                    ORDER BY g.codigo NULLS LAST, p.nombre
                `, [orden.id]);
                orden.detalle = detRes.rows;
            }
        }

        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/almacen/despachos/:id  — detalle completo con líneas
app.get('/api/almacen/despachos/:id', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    try {
        const [rOrden, rDetalle] = await Promise.all([
            pool.query(`
                SELECT od.*,
                       co.nombre AS cc_origen_nombre,
                       cd.nombre AS cc_destino_nombre,
                       ec.nombre AS cliente_nombre,
                       CASE WHEN od.tipo = 'VENTA'
                            THEN COALESCE(ec.nombre, od.orden_compra)
                            ELSE cd.nombre END AS destino_nombre
                FROM ordenes_despacho od
                LEFT JOIN ccostos co ON co.codigo=od.cc_origen AND co.empresa=od.empresa
                LEFT JOIN ccostos cd ON cd.codigo=od.cc_destino AND cd.empresa=od.empresa
                LEFT JOIN ordenes_compra oc ON oc.codigo = od.orden_compra
                LEFT JOIN empresas ec ON oc.cliente::text = ec.codigo::text
                WHERE od.id=$1 AND od.empresa=$2::integer
            `, [req.params.id, empresa]),
            pool.query(`
                SELECT odd.*, p.nombre AS producto_nombre, p.und, p.descripcion,
                       p.grupo AS grupo_codigo, g.nombre AS grupo_nombre, p.ubicacion
                FROM ordenes_despacho_detalle odd
                JOIN productos p ON p.codigo=odd.producto_codigo
                LEFT JOIN grupo_productos g ON g.codigo=p.grupo
                WHERE odd.orden_id=$1
                ORDER BY g.codigo NULLS LAST, p.nombre
            `, [req.params.id]),
        ]);
        if (rOrden.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, data: { ...rOrden.rows[0], detalle: rDetalle.rows } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/almacen/despachos  — crear orden
app.post('/api/almacen/despachos', async (req, res) => {
    const { empresa, fecha, cc_origen, cc_destino, observaciones, creado_por, detalle } = req.body;
    if (!fecha || !cc_origen || !cc_destino)
        return res.status(400).json({ success: false, error: 'fecha, cc_origen y cc_destino son requeridos' });
    if (!detalle || detalle.length === 0)
        return res.status(400).json({ success: false, error: 'La orden debe tener al menos un producto' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const rOrden = await client.query(`
            INSERT INTO ordenes_despacho (empresa, fecha, cc_origen, cc_destino, observaciones, creado_por)
            VALUES ($1::integer,$2,$3,$4,$5,$6) RETURNING id
        `, [empresa, fecha, cc_origen, cc_destino, observaciones || null, creado_por || null]);
        const ordenId = rOrden.rows[0].id;
        for (const item of detalle) {
            await client.query(`
                INSERT INTO ordenes_despacho_detalle (orden_id, producto_codigo, cant_requerida)
                VALUES ($1,$2,$3)
            `, [ordenId, item.producto_codigo, parseFloat(item.cant_requerida) || 0]);
        }

        // Crear notificación de despacho creado
        try {
            // Obtener preferencias de notificación para DESPACHO_BODEGA
            const prefRes = await client.query(
                `SELECT usuarios_receptores FROM preferencias_notificaciones
                 WHERE empresa = $1 AND tipo = 'DESPACHO_BODEGA' AND activa = 'SI'`,
                [empresa]
            );

            if (prefRes.rows.length > 0) {
                const usuarios = JSON.parse(prefRes.rows[0].usuarios_receptores || '[]');

                if (usuarios.length > 0) {
                    const notifResult = await client.query(
                        `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, fecha_creacion)
                         VALUES ($1, $2, $3, 'DESPACHO_BODEGA', NOW())
                         RETURNING id`,
                        [empresa, 'Nuevo Despacho', `Despacho #${ordenId} creado. Origen: ${cc_origen} → Destino: ${cc_destino}`]
                    );

                    const notif_id = notifResult.rows[0].id;

                    for (const usr of usuarios) {
                        await client.query(
                            `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                             VALUES ($1, $2, 'NO')`,
                            [notif_id, usr]
                        ).catch(() => {});
                    }
                }
            }
        } catch (notifError) {
            console.error('Error creando notificación de despacho:', notifError);
        }

        await client.query('COMMIT');
        res.json({ success: true, id: ordenId });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// PUT /api/almacen/despachos/:id  — editar orden (solo si está PENDIENTE)
app.put('/api/almacen/despachos/:id', async (req, res) => {
    const empresa = req.body.empresa || req.headers['x-empresa'];
    const { fecha, cc_destino, observaciones, detalle } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const rCheck = await client.query(
            `SELECT estado FROM ordenes_despacho WHERE id=$1 AND empresa=$2::integer`, [req.params.id, empresa]
        );
        if (rCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'No encontrado' }); }
        if (rCheck.rows[0].estado !== 'PENDIENTE') { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'Solo se pueden editar órdenes en estado PENDIENTE' }); }

        await client.query(
            `UPDATE ordenes_despacho SET fecha=$1, cc_destino=$2, observaciones=$3 WHERE id=$4`,
            [fecha, cc_destino, observaciones || null, req.params.id]
        );
        // Reemplazar detalle completo
        await client.query(`DELETE FROM ordenes_despacho_detalle WHERE orden_id=$1`, [req.params.id]);
        for (const item of (detalle || [])) {
            await client.query(`
                INSERT INTO ordenes_despacho_detalle (orden_id, producto_codigo, cant_requerida)
                VALUES ($1,$2,$3)
            `, [req.params.id, item.producto_codigo, parseFloat(item.cant_requerida) || 0]);
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// PATCH /api/almacen/despachos/:id/estado  — cambiar estado
app.patch('/api/almacen/despachos/:id/estado', async (req, res) => {
    const empresa = req.body.empresa || req.headers['x-empresa'];
    const { estado } = req.body;
    const ESTADOS = ['PENDIENTE','EN_PICKING','EN_PACKING','COMPLETADO','CANCELADO'];
    if (!ESTADOS.includes(estado)) return res.status(400).json({ success: false, error: 'Estado inválido' });
    try {
        const extra = estado === 'COMPLETADO' ? ', fecha_completado=NOW()' : '';
        const result = await pool.query(
            `UPDATE ordenes_despacho SET estado=$1${extra} WHERE id=$2 AND empresa=$3::integer RETURNING *`,
            [estado, req.params.id, empresa]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/almacen/despachos/:id  — cancelar/eliminar (solo PENDIENTE)
app.delete('/api/almacen/despachos/:id', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    try {
        const rCheck = await pool.query(
            `SELECT estado FROM ordenes_despacho WHERE id=$1 AND empresa=$2::integer`, [req.params.id, empresa]
        );
        if (rCheck.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        if (rCheck.rows[0].estado !== 'PENDIENTE') return res.status(409).json({ success: false, error: 'Solo se pueden eliminar órdenes en estado PENDIENTE' });
        await pool.query(`DELETE FROM ordenes_despacho WHERE id=$1 AND empresa=$2::integer`, [req.params.id, empresa]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PATCH /api/almacen/despachos/:id/scan — registrar un escaneo (picking o packing)
// Body: { empresa, producto_codigo, tipo: 'picking'|'packing', delta: 1|-1 }
app.patch('/api/almacen/despachos/:id/scan', async (req, res) => {
    const { empresa, producto_codigo, tipo, delta } = req.body;
    if (!['picking','packing'].includes(tipo)) return res.status(400).json({ success: false, error: 'tipo debe ser picking o packing' });
    const col = tipo === 'picking' ? 'cant_picking' : 'cant_packing';
    const d   = parseFloat(delta) || 1;
    try {
        // Intentar actualizar la línea existente
        let result = await pool.query(`
            UPDATE ordenes_despacho_detalle
            SET ${col} = GREATEST(0, ${col} + $1)
            WHERE orden_id=$2 AND producto_codigo=$3
            RETURNING *
        `, [d, req.params.id, producto_codigo]);

        // Si el producto no estaba en la orden, agregarlo automáticamente (cant_requerida=0)
        if (result.rowCount === 0) {
            // Verificar que el producto exista en el catálogo antes de insertar (evita FK)
            const rProd = await pool.query(`SELECT 1 FROM productos WHERE codigo=$1`, [producto_codigo]);
            if (rProd.rowCount === 0) return res.status(404).json({ success: false, error: 'Producto no existe en el catálogo' });
            result = await pool.query(`
                INSERT INTO ordenes_despacho_detalle (orden_id, producto_codigo, cant_requerida, ${col})
                VALUES ($1, $2, 0, GREATEST(0, $3))
                RETURNING *
            `, [req.params.id, producto_codigo, d]);
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/almacen/despachos/:id/confirmar — genera movimientos en inventario y cierra la orden
app.post('/api/almacen/despachos/:id/confirmar', async (req, res) => {
    const empresa = req.body.empresa || req.headers['x-empresa'];
    const client  = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cargar orden + detalle
        const rOrden = await client.query(
            `SELECT od.*, co.nombre AS nom_origen, cd.nombre AS nom_destino
             FROM ordenes_despacho od
             LEFT JOIN ccostos co ON co.codigo=od.cc_origen  AND co.empresa=od.empresa
             LEFT JOIN ccostos cd ON cd.codigo=od.cc_destino AND cd.empresa=od.empresa
             WHERE od.id=$1 AND od.empresa=$2::integer`,
            [req.params.id, empresa]
        );
        if (rOrden.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'No encontrado' }); }
        const orden = rOrden.rows[0];
        if (orden.estado === 'COMPLETADO') { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'Ya está completada' }); }

        const rDetalle = await client.query(
            `SELECT * FROM ordenes_despacho_detalle WHERE orden_id=$1`, [req.params.id]
        );

        const fecha         = orden.fecha instanceof Date ? orden.fecha.toISOString().split('T')[0] : String(orden.fecha).split('T')[0];
        const esVenta       = orden.tipo === 'VENTA' && orden.orden_compra;
        const nombreOrigen  = (orden.nom_origen  || orden.cc_origen).toUpperCase();
        const nombreDestino = esVenta ? '' : (orden.nom_destino || orden.cc_destino || '').toUpperCase();

        const cantidadesDespachadas = {}; // por producto (para actualizar la orden de compra)

        for (const item of rDetalle.rows) {
            // Usar cant_packing si > 0, sino cant_picking.
            // En despachos por VENTA sin escaneos, usar la cantidad requerida de la orden.
            const cant = parseFloat(item.cant_packing) > 0
                ? parseFloat(item.cant_packing)
                : parseFloat(item.cant_picking) > 0
                    ? parseFloat(item.cant_picking)
                    : (esVenta ? parseFloat(item.cant_requerida) || 0 : 0);
            if (!cant || cant <= 0) continue;

            if (esVenta) {
                // SALIDA POR VENTA desde bodega maestra (no es traslado entre ccostos)
                cantidadesDespachadas[item.producto_codigo] = cant;
                await client.query(`
                    INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,despacho_id)
                    VALUES ($1,$2,$3,0,$4,'SALIDA POR VENTA',$5,$6,$7)
                `, [fecha, orden.cc_origen, item.producto_codigo, cant, empresa,
                    `Despacho #${orden.id} — Orden de Compra ${orden.orden_compra}`, orden.id]);
                continue;
            }

            // SALIDA POR TRASLADO en cc_origen
            await client.query(`
                INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion,despacho_id)
                VALUES ($1,$2,$3,0,$4,'SALIDA POR TRASLADO',$5,$6,$7,$8)
            `, [fecha, orden.cc_origen, item.producto_codigo, cant, empresa,
                `Despacho #${orden.id} → ${nombreDestino}`, orden.cc_destino, orden.id]);

            // ENTRADA POR TRASLADO en cc_destino
            await client.query(`
                INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion,despacho_id)
                VALUES ($1,$2,$3,$4,0,'ENTRADA POR TRASLADO',$5,$6,$7,$8)
            `, [fecha, orden.cc_destino, item.producto_codigo, cant, empresa,
                `Despacho #${orden.id} desde ${nombreOrigen}`, orden.cc_origen, orden.id]);
        }

        // Despacho de VENTA: ajustar la orden de compra a lo realmente despachado
        // y pasarla a EN REPARTO
        if (esVenta) {
            const ocRes = await client.query(
                `SELECT estado FROM ordenes_compra WHERE codigo = $1 FOR UPDATE`,
                [orden.orden_compra]
            );
            if (ocRes.rows.length > 0 && ocRes.rows[0].estado === 'PENDIENTE') {
                const detOC = await client.query(
                    `SELECT producto_venta, precio_unitario FROM detalle_ordenes WHERE orden = $1`,
                    [orden.orden_compra]
                );
                let nuevoTotal = 0;
                for (const d of detOC.rows) {
                    const cant = cantidadesDespachadas[d.producto_venta] || 0;
                    const subtotal = cant * (parseFloat(d.precio_unitario) || 0);
                    nuevoTotal += subtotal;
                    if (cant > 0) {
                        await client.query(
                            `UPDATE detalle_ordenes SET cantidad = $1, subtotal = $2
                             WHERE orden = $3 AND producto_venta = $4`,
                            [cant, subtotal, orden.orden_compra, d.producto_venta]
                        );
                    } else {
                        await client.query(
                            `DELETE FROM detalle_ordenes WHERE orden = $1 AND producto_venta = $2`,
                            [orden.orden_compra, d.producto_venta]
                        );
                    }
                }
                await client.query(
                    `UPDATE ordenes_compra SET estado = 'EN REPARTO', total = $1 WHERE codigo = $2`,
                    [nuevoTotal, orden.orden_compra]
                );
            }
        }

        // Marcar orden como COMPLETADO
        await client.query(
            `UPDATE ordenes_despacho SET estado='COMPLETADO', fecha_completado=NOW() WHERE id=$1`,
            [req.params.id]
        );

        // Crear notificación de despacho completado
        try {
            // Obtener preferencias de notificación para DESPACHO_BODEGA
            const prefRes = await client.query(
                `SELECT usuarios_receptores FROM preferencias_notificaciones
                 WHERE empresa = $1 AND tipo = 'DESPACHO_BODEGA' AND activa = 'SI'`,
                [empresa]
            );

            if (prefRes.rows.length > 0) {
                const usuarios = JSON.parse(prefRes.rows[0].usuarios_receptores || '[]');

                if (usuarios.length > 0) {
                    const notifResult = await client.query(
                        `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, fecha_creacion)
                         VALUES ($1, $2, $3, 'DESPACHO_BODEGA', NOW())
                         RETURNING id`,
                        [empresa, 'Despacho Completado',
                         esVenta
                            ? `Despacho #${orden.id} completado — Orden de Compra ${orden.orden_compra} (salida por venta desde ${nombreOrigen})`
                            : `Despacho #${orden.id} completado. De ${nombreOrigen} a ${nombreDestino}`]
                    );

                    const notif_id = notifResult.rows[0].id;

                    for (const usr of usuarios) {
                        await client.query(
                            `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                             VALUES ($1, $2, 'NO')`,
                            [notif_id, usr]
                        ).catch(() => {});
                    }
                }
            }
        } catch (notifError) {
            console.error('Error creando notificación de despacho completado:', notifError);
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// POST /api/almacen/despachos/:id/revertir — deshace una orden COMPLETADA
//
// Elimina los movimientos de detalle_inventario que generó el despacho y
// regresa la orden a EN_PACKING (picking/packing quedan intactos: el despacho
// vuelve a quedar listo para confirmarse de nuevo, no hay que rehacer el
// conteo). No borra la orden ni su detalle.
//
// Las filas a borrar se ubican por despacho_id cuando existe (despachos
// confirmados después de que se agregó esa columna). Para despachos anteriores,
// que no tienen despacho_id, se ubican por el texto exacto que `confirmar`
// escribe en observaciones ("Despacho #<id> " seguido de espacio) — es
// determinístico porque el id nunca se reutiliza y el separador es fijo.
//
// Solo soportado para despachos de TRASLADO (el caso normal entre centros de
// costo). Los de tipo VENTA quedan fuera: confirmarlos también deja la orden
// de compra en EN REPARTO y sobrescribe sus cantidades, y no hay forma de
// recuperar los valores previos para revertir eso de forma segura.
app.post('/api/almacen/despachos/:id/revertir', async (req, res) => {
    const empresa = req.body.empresa || req.headers['x-empresa'];
    const client  = await pool.connect();
    try {
        await client.query('BEGIN');

        const rOrden = await client.query(
            `SELECT * FROM ordenes_despacho WHERE id=$1 AND empresa=$2::integer FOR UPDATE`,
            [req.params.id, empresa]
        );
        if (rOrden.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'No encontrado' });
        }
        const orden = rOrden.rows[0];

        if (orden.estado !== 'COMPLETADO') {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'Solo se pueden reversar órdenes en estado COMPLETADO' });
        }
        if (orden.tipo === 'VENTA' && orden.orden_compra) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Los despachos de VENTA no se pueden reversar automáticamente porque también afectan la Orden de Compra asociada'
            });
        }

        const delRes = await client.query(
            `DELETE FROM detalle_inventario
              WHERE empresa = $1::integer
                AND (despacho_id = $2::integer
                     OR (despacho_id IS NULL AND observaciones LIKE ('Despacho #' || $2::text || ' %')))`,
            [empresa, req.params.id]
        );

        await client.query(
            `UPDATE ordenes_despacho SET estado='EN_PACKING', fecha_completado=NULL WHERE id=$1`,
            [req.params.id]
        );

        await client.query('COMMIT');
        res.json({ success: true, movimientos_eliminados: delRes.rowCount });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/almacen/despachos/:id/revertir:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// PATCH /api/almacen/productos/:codigo/toggle-control — alternar SI/NO
app.patch('/api/almacen/productos/:codigo/toggle-control', async (req, res) => {
    const { codigo } = req.params;
    try {
        const actual = await pool.query(`SELECT control, visible_operacional, para_venta FROM productos WHERE codigo = $1`, [codigo]);
        if (actual.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        const nuevoControl = actual.rows[0].control === 'SI' ? 'NO' : 'SI';

        // Si desactiva (control = NO), también desactivar los otros campos
        const nuevoOperacional = nuevoControl === 'NO' ? 'NO' : actual.rows[0].visible_operacional;
        const nuevoParaVenta = nuevoControl === 'NO' ? 'NO' : actual.rows[0].para_venta;

        await pool.query(
            `UPDATE productos SET control = $1, visible_operacional = $2, para_venta = $3 WHERE codigo = $4`,
            [nuevoControl, nuevoOperacional, nuevoParaVenta, codigo]
        );
        res.json({
            success: true,
            control: nuevoControl,
            visible_operacional: nuevoOperacional,
            para_venta: nuevoParaVenta
        });
    } catch (error) {
        console.error('Error PATCH /api/almacen/productos/:codigo/toggle-control:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/almacen/productos/:codigo/toggle-para-venta — alternar SI/NO para franquicia
app.patch('/api/almacen/productos/:codigo/toggle-para-venta', async (req, res) => {
    const { codigo } = req.params;
    try {
        const actual = await pool.query(`SELECT para_venta FROM productos WHERE codigo = $1`, [codigo]);
        if (actual.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        const nuevoParaVenta = actual.rows[0].para_venta === 'SI' ? 'NO' : 'SI';
        await pool.query(`UPDATE productos SET para_venta = $1 WHERE codigo = $2`, [nuevoParaVenta, codigo]);
        res.json({ success: true, para_venta: nuevoParaVenta });
    } catch (error) {
        console.error('Error PATCH /api/almacen/productos/:codigo/toggle-para-venta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/almacen/productos/:codigo/toggle-visible-operacional — alternar SI/NO visible operacional
app.patch('/api/almacen/productos/:codigo/toggle-visible-operacional', async (req, res) => {
    const { codigo } = req.params;
    try {
        const actual = await pool.query(`SELECT visible_operacional FROM productos WHERE codigo = $1`, [codigo]);
        if (actual.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        const nuevoVisible = actual.rows[0].visible_operacional === 'SI' ? 'NO' : 'SI';
        await pool.query(`UPDATE productos SET visible_operacional = $1 WHERE codigo = $2`, [nuevoVisible, codigo]);
        res.json({ success: true, visible_operacional: nuevoVisible });
    } catch (error) {
        console.error('Error PATCH /api/almacen/productos/:codigo/toggle-visible-operacional:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/almacen/productos/:codigo/ubicacion — guardar ubicación física en bodega
app.patch('/api/almacen/productos/:codigo/ubicacion', async (req, res) => {
    const { codigo } = req.params;
    const { ubicacion } = req.body;
    try {
        const r = await pool.query(
            `UPDATE productos SET ubicacion = $1 WHERE codigo = $2`,
            [ubicacion ? ubicacion.trim() : null, codigo]
        );
        if (r.rowCount === 0) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        res.json({ success: true, ubicacion: ubicacion ? ubicacion.trim() : null });
    } catch (e) {
        console.error('Error PATCH /api/almacen/productos/:codigo/ubicacion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── FIN GESTIÓN DE PRODUCTOS ─────────────────────────────────────

// GET /api/inventario - Obtener productos con control = SI y stock por ccosto y empresa
app.get('/api/inventario', async (req, res) => {
    const { ccosto, filtro } = req.query;
    const empresa = req.query.empresa || req.headers['x-empresa'];

    try {
        // filtro='bodega' → control='SI' | filtro='punto_venta' → visible_operacional='SI'
        const filtroProductos = filtro === 'punto_venta'
            ? `p.visible_operacional = 'SI'`
            : `UPPER(p.control) = 'SI'`;

        let query = `
            SELECT
                p.codigo,
                p.nombre,
                p.und,
                p.grupo,
                g.nombre as grupo_nombre,
                COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0) as stock_actual
            FROM productos p
            LEFT JOIN grupo_productos g ON p.grupo = g.codigo
        `;

        const params = [];

        if (ccosto && empresa) {
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.ccosto = $1 AND di.empresa::text = $2`;
            params.push(ccosto, String(empresa));
        } else if (ccosto) {
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.ccosto = $1`;
            params.push(ccosto);
        } else {
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo`;
        }

        query += `
            WHERE ${filtroProductos}
            GROUP BY p.codigo, p.nombre, p.und, p.grupo, g.nombre
            ORDER BY p.grupo, p.nombre
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
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

// GET /api/inventario/stats - Estadísticas de inventario
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
                COALESCE(SUM(d.entrada), 0) as total_entradas,
                COALESCE(SUM(d.salida), 0) as total_salidas
            FROM productos p
            LEFT JOIN detalle_inventario d ON p.codigo = d.codigo AND d.empresa = $1
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

// ── GESTIÓN DE INVENTARIO ────────────────────────────────────────

// Mapa: código frontend → valor(es) real(es) en detalle_inventario.tipo
// TRASLADO genera DOS tipos distintos (origen/destino)
const TIPO_DB = {
    ENTRADA:  { origen: 'ENTRADA DE ALMACEN' },
    SALIDA:   { origen: 'SALIDA DE ALMACEN'  },
    BAJA:     { origen: 'SALIDA POR BAJA'    },
    TRASLADO: { origen: 'SALIDA POR TRASLADO', destino: 'ENTRADA POR TRASLADO' },
};

// POST /api/almacen/gestion-inventario — guardar movimiento de inventario
app.post('/api/almacen/gestion-inventario', async (req, res) => {
    const { empresa, fecha, tipo, ccOrigen, ccOrigenNombre, ccDestino, ccDestinoNombre, observaciones, productos, mode } = req.body;
    // tipo (frontend): ENTRADA | SALIDA | BAJA | TRASLADO
    // mode: 'new' (detecta conflicto) | 'replace' (borra previos) | 'add' (suma)

    if (!empresa || !fecha || !tipo || !ccOrigen || !productos || productos.length === 0) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios' });
    }
    if (tipo === 'TRASLADO' && !ccDestino) {
        return res.status(400).json({ success: false, error: 'Se requiere Centro de Costo Destino para traslados' });
    }
    const mapa = TIPO_DB[tipo];
    if (!mapa) {
        return res.status(400).json({ success: false, error: `Tipo de operación desconocido: ${tipo}` });
    }

    const emp = parseInt(empresa);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── Detectar conflicto (solo en modo 'new') ───────────────
        if (!mode || mode === 'new') {
            // Para TRASLADO verificamos origen+destino específico (cc_relacion = ccDestino)
            // así un traslado previo a otro CC diferente no genera falsa alarma
            const dupRes = await client.query(
                `SELECT COUNT(*) AS cnt FROM detalle_inventario
                 WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4 AND cc_relacion=$5`,
                [fecha, ccOrigen, emp, mapa.origen, ccDestino]
            );
            const cnt = parseInt(dupRes.rows[0].cnt);
            if (cnt > 0) {
                await client.query('ROLLBACK');
                return res.json({ success: false, conflict: true, count: cnt });
            }
        }

        // ── Eliminar previos si modo 'replace' ────────────────────
        if (mode === 'replace') {
            await client.query(
                `DELETE FROM detalle_inventario WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4`,
                [fecha, ccOrigen, emp, mapa.origen]
            );
            if (tipo === 'TRASLADO' && ccDestino && mapa.destino) {
                await client.query(
                    `DELETE FROM detalle_inventario WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4`,
                    [fecha, ccDestino, emp, mapa.destino]
                );
            }
        }

        // ── Insertar registros ────────────────────────────────────
        let registrosCreados = 0;
        const obs = (observaciones || '').trim();

        for (const prod of productos) {
            const cant = parseFloat(prod.cantidad);
            if (!cant || cant === 0) continue;   // permite negativos, rechaza solo 0/NaN

            if (tipo === 'ENTRADA') {
                // entrada = cant, salida = 0
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones)
                     VALUES ($1,$2,$3,$4,0,$5,$6,$7)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp, obs]
                );
                registrosCreados++;

            } else if (tipo === 'SALIDA' || tipo === 'BAJA') {
                // entrada = 0, salida = cant
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones)
                     VALUES ($1,$2,$3,0,$4,$5,$6,$7)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp, obs]
                );
                registrosCreados++;

            } else if (tipo === 'TRASLADO') {
                // Consultar nombres de CC en la DB filtrando también por empresa
                const [resOrigen, resDestino] = await Promise.all([
                    client.query(`SELECT nombre FROM ccostos WHERE codigo=$1 AND empresa=$2`, [ccOrigen, emp]),
                    client.query(`SELECT nombre FROM ccostos WHERE codigo=$1 AND empresa=$2`, [ccDestino, emp]),
                ]);
                const nombreOrigen  = (resOrigen.rows[0]?.nombre  || ccOrigen).toUpperCase();
                const nombreDestino = (resDestino.rows[0]?.nombre || ccDestino).toUpperCase();

                // Registro en CC Origen: SALIDA POR TRASLADO PARA [DESTINO] (entrada=0, salida=cant)
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion)
                     VALUES ($1,$2,$3,0,$4,$5,$6,$7,$8)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp,
                     obs || `Traslado a ${nombreDestino}`, ccDestino]
                );
                // Registro en CC Destino: ENTRADA POR TRASLADO DESDE [ORIGEN] (entrada=cant, salida=0)
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion)
                     VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8)`,
                    [fecha, ccDestino, prod.codigo, cant, mapa.destino, emp,
                     obs || `Traslado desde ${nombreOrigen}`, ccOrigen]
                );
                registrosCreados += 2;
            }
        }

        await client.query('COMMIT');

        // Generar notificaciones de stock para cada producto actualizado
        for (const prod of productos) {
            if (prod.codigo) {
                // Verificar stock en origen
                await verificarYGenerarNotificacionesStock(prod.codigo, ccOrigen, empresa);

                // Si es traslado, verificar también en destino
                if (tipo === 'TRASLADO' && ccDestino) {
                    await verificarYGenerarNotificacionesStock(prod.codigo, ccDestino, empresa);
                }
            }
        }

        res.json({ success: true, registros: registrosCreados });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/almacen/gestion-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/almacen/movimientos-recientes?empresa=&ccosto=&dias=60
// Devuelve lotes de movimientos editables (agrupados por fecha+cc+tipo+obs)
app.get('/api/almacen/movimientos-recientes', async (req, res) => {
    const { empresa, ccosto, dias = 60 } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa es requerido' });

    // Map DB tipo → frontend tipo
    const TIPO_FE = {
        'ENTRADA DE ALMACEN':   'ENTRADA',
        'SALIDA DE ALMACEN':    'SALIDA',
        'SALIDA POR BAJA':      'BAJA',
        'SALIDA POR TRASLADO':  'TRASLADO',
    };

    try {
        const params = [parseInt(empresa), parseInt(dias) || 60];
        let ccFilt = '';
        if (ccosto) { params.push(ccosto); ccFilt = `AND di.ccosto = $${params.length}`; }

        const result = await pool.query(`
            SELECT
                di.fecha,
                di.ccosto,
                c.nombre  AS ccosto_nombre,
                di.tipo   AS tipo_db,
                COALESCE(di.cc_relacion, '') AS cc_relacion,
                cr.nombre AS cc_relacion_nombre,
                COALESCE(di.observaciones, '') AS observaciones,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'codigo',   di.codigo,
                        'nombre',   COALESCE(p.nombre, di.codigo),
                        'und',      COALESCE(p.und, ''),
                        'cantidad', CASE WHEN di.entrada > 0 THEN di.entrada ELSE di.salida END
                    ) ORDER BY COALESCE(p.nombre, di.codigo)
                ) AS productos
            FROM detalle_inventario di
            LEFT JOIN ccostos  c  ON c.codigo  = di.ccosto      AND c.empresa  = di.empresa
            LEFT JOIN productos p  ON p.codigo  = di.codigo
            LEFT JOIN ccostos  cr ON cr.codigo  = di.cc_relacion AND cr.empresa = di.empresa
            WHERE di.empresa = $1
              AND di.fecha >= CURRENT_DATE - ($2 * INTERVAL '1 day')
              AND di.tipo IN (
                  'ENTRADA DE ALMACEN',
                  'SALIDA DE ALMACEN',
                  'SALIDA POR BAJA',
                  'SALIDA POR TRASLADO'
              )
              ${ccFilt}
            GROUP BY di.fecha, di.ccosto, c.nombre, di.tipo, di.cc_relacion, cr.nombre, di.observaciones
            ORDER BY di.fecha DESC, di.ccosto, di.tipo
        `, params);

        const data = result.rows.map(r => ({
            ...r,
            tipo_fe: TIPO_FE[r.tipo_db] || r.tipo_db,
        }));

        res.json({ success: true, data });
    } catch (e) {
        console.error('Error GET /api/almacen/movimientos-recientes:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/almacen/prediccion-agotamiento — predicción de agotamiento de inventario
// Analiza consumo de la ventana (?dias=, default 30) por producto y día de semana,
// y simula día a día con estacionalidad semanal para predecir la fecha de agotamiento.
app.get('/api/almacen/prediccion-agotamiento', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ error: 'empresa requerida' });

    try {
        // 1. Obtener bodega_maestra de esta empresa
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo = $1`,
            [empresa]
        );
        if (!bodegaRes.rows[0] || !bodegaRes.rows[0].bodega_maestra) {
            return res.status(404).json({ error: 'Bodega maestra no configurada para esta empresa' });
        }
        const bodegaCodigo = bodegaRes.rows[0].bodega_maestra;

        // 2. Ventana de análisis configurable (default 30 días, soporta 15/30/60)
        //    La ventana son los N días COMPLETOS anteriores a hoy (hoy se excluye
        //    porque es un día parcial y distorsionaría los promedios).
        //    Ej: hoy 1-jul con 30 días → analiza del 1-jun al 30-jun.
        const ventanaDias = Math.min(Math.max(parseInt(req.query.dias) || 30, 7), 90);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hastaAyer = new Date(hoy);
        hastaAyer.setDate(hastaAyer.getDate() - 1);
        const desde = new Date(hoy);
        desde.setDate(desde.getDate() - ventanaDias);
        const fechaDesde = desde.toISOString().split('T')[0];
        const fechaHoy   = hoy.toISOString().split('T')[0];

        // 3. Consumo por producto y día de semana en la ventana (agrupado en SQL)
        //    EXTRACT(DOW): 0=domingo ... 5=viernes, 6=sábado
        const movimientosRes = await pool.query(
            `SELECT
                codigo,
                EXTRACT(DOW FROM fecha)::int AS dow,
                SUM(salida)               AS total_salida
            FROM detalle_inventario
            WHERE empresa = $1 AND ccosto = $2 AND fecha >= $3 AND fecha < $4 AND salida > 0
            GROUP BY codigo, EXTRACT(DOW FROM fecha)::int`,
            [empresa, bodegaCodigo, fechaDesde, fechaHoy]
        );

        // 3b. Primera fecha real con datos (para no subestimar el consumo si hay menos historia)
        const primeraRes = await pool.query(
            `SELECT MIN(fecha)::date AS primera
             FROM detalle_inventario
             WHERE empresa = $1 AND ccosto = $2 AND fecha >= $3 AND fecha < $4 AND salida > 0`,
            [empresa, bodegaCodigo, fechaDesde, fechaHoy]
        );
        // Span real analizado: desde la primera fecha con datos (o el inicio de la ventana) hasta ayer
        let inicioReal = desde;
        if (primeraRes.rows[0] && primeraRes.rows[0].primera) {
            const pr = new Date(primeraRes.rows[0].primera);
            pr.setHours(0, 0, 0, 0);
            if (pr > desde) inicioReal = pr;
        }
        const spanDias = Math.max(1, Math.round((hastaAyer - inicioReal) / 86400000) + 1);

        // 4. Ocurrencias de cada día de semana dentro del span real (hasta ayer)
        const ocurrenciasDia = [0, 0, 0, 0, 0, 0, 0];
        for (let d = new Date(inicioReal); d <= hastaAyer; d.setDate(d.getDate() + 1)) {
            ocurrenciasDia[d.getDay()]++;
        }

        // 5. Mapas: consumo promedio por (producto, día de semana) y total por producto
        //    avgDia[codigo][dow] = total consumido ese día de semana / nº de veces que ocurrió ese día
        //    Es auto-consistente: Σ(avgDia[d] * ocurrencias[d]) == consumo total del producto
        const avgDia = {};            // promedio esperado por día de semana
        const consumoTotalProd = {};  // total en la ventana

        for (const row of movimientosRes.rows) {
            const cod = row.codigo;
            const dow = row.dow;
            const total = parseFloat(row.total_salida);

            if (!avgDia[cod]) avgDia[cod] = [0, 0, 0, 0, 0, 0, 0];
            avgDia[cod][dow] = ocurrenciasDia[dow] > 0 ? total / ocurrenciasDia[dow] : 0;

            consumoTotalProd[cod] = (consumoTotalProd[cod] || 0) + total;
        }

        // 6. Stock actual por producto en la bodega maestra
        const stockRes = await pool.query(
            `SELECT
                p.codigo,
                p.nombre,
                p.descripcion,
                p.und,
                COALESCE(g.nombre, 'Sin Grupo') as grupo_nombre,
                COALESCE(SUM(di.entrada - di.salida), 0) as stock_actual
            FROM productos p
            LEFT JOIN grupo_productos g ON p.grupo = g.codigo
            LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.empresa = $1 AND di.ccosto = $2
            GROUP BY p.codigo, p.nombre, p.descripcion, p.und, g.nombre
            HAVING COALESCE(SUM(di.entrada - di.salida), 0) > 0
            ORDER BY p.codigo`,
            [empresa, bodegaCodigo]
        );

        // 7. Para cada producto: simular día a día (con estacionalidad semanal) hasta agotar
        const resultados = [];

        for (const prod of stockRes.rows) {
            const stock = parseFloat(prod.stock_actual);
            const totalProd = consumoTotalProd[prod.codigo] || 0;
            const consumoDiarioProm = totalProd / spanDias;     // promedio diario plano (referencia)
            const perfilDia = avgDia[prod.codigo] || [0, 0, 0, 0, 0, 0, 0];

            let fechaAgotamiento = null;
            let diasRestantes = null;

            if (totalProd > 0) {
                let stockSim = stock;
                let dia = new Date(hoy);
                let contador = 0;

                // Arranca HOY y simula día a día con ESTACIONALIDAD SEMANAL:
                // a cada fecha le resta el consumo promedio de SU día de semana
                // (si hoy es miércoles: resta el promedio de los miércoles, luego
                // el de los jueves, viernes, etc.) hasta que el stock llega a 0.
                // dias_restantes = nº de días desde hoy hasta el agotamiento.
                while (stockSim > 0 && contador < 365) {
                    stockSim -= perfilDia[dia.getDay()];

                    if (stockSim <= 0) {
                        fechaAgotamiento = dia.toISOString().split('T')[0];
                        diasRestantes = contador;
                        break;
                    }
                    dia.setDate(dia.getDate() + 1);
                    contador++;
                }
            }

            resultados.push({
                codigo: prod.codigo,
                nombre: prod.nombre,
                descripcion: prod.descripcion || '—',
                und: prod.und,
                grupo_nombre: prod.grupo_nombre,
                stock_actual: stock.toFixed(2),
                consumo_diario_estimado: consumoDiarioProm.toFixed(2),
                // desglose por día de semana [dom,lun,mar,mié,jue,vie,sáb] para verificación
                consumo_por_dia: perfilDia.map(v => +v.toFixed(2)),
                fecha_agotamiento: fechaAgotamiento,
                dias_restantes: diasRestantes,
                alerta: diasRestantes !== null && diasRestantes <= 7 ? 'PELIGRO'
                      : (diasRestantes !== null && diasRestantes <= 14 ? 'ALERTA' : 'OK')
            });
        }

        // 8. Ordenar por fecha de agotamiento (más próximos primero; sin fecha al final)
        resultados.sort((a, b) => {
            if (a.fecha_agotamiento === null) return 1;
            if (b.fecha_agotamiento === null) return -1;
            return new Date(a.fecha_agotamiento) - new Date(b.fecha_agotamiento);
        });

        res.json({
            success: true,
            data: resultados,
            meta: { ventana_dias: ventanaDias, dias_analizados: spanDias, ocurrencias_dia: ocurrenciasDia }
        });
    } catch (error) {
        console.error('Error GET /api/almacen/prediccion-agotamiento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/prediccion-agotamiento/detalle — salidas diarias de un producto
// en la bodega maestra durante la ventana solicitada (default 30 días), para
// mostrar el detalle día a día + gráfico de barras en el popup del reporte.
app.get('/api/almacen/prediccion-agotamiento/detalle', async (req, res) => {
    const { empresa, codigo } = req.query;
    if (!empresa || !codigo) return res.status(400).json({ error: 'empresa y codigo requeridos' });

    try {
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo = $1`,
            [empresa]
        );
        if (!bodegaRes.rows[0] || !bodegaRes.rows[0].bodega_maestra) {
            return res.status(404).json({ error: 'Bodega maestra no configurada para esta empresa' });
        }
        const bodegaCodigo = bodegaRes.rows[0].bodega_maestra;

        const ventanaDias = Math.min(Math.max(parseInt(req.query.dias) || 30, 7), 90);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const desde = new Date(hoy);
        desde.setDate(desde.getDate() - ventanaDias);
        const fechaDesde = desde.toISOString().split('T')[0];
        const fechaHoy   = hoy.toISOString().split('T')[0];

        const salidasRes = await pool.query(
            `SELECT fecha::date AS fecha, SUM(salida) AS salida
             FROM detalle_inventario
             WHERE empresa = $1 AND ccosto = $2 AND codigo = $3 AND fecha >= $4 AND fecha < $5 AND salida > 0
             GROUP BY fecha::date
             ORDER BY fecha::date`,
            [empresa, bodegaCodigo, codigo, fechaDesde, fechaHoy]
        );

        // Rellenar todos los días de la ventana (incluso los de salida 0) para el gráfico
        const mapaSalidas = {};
        for (const row of salidasRes.rows) {
            mapaSalidas[row.fecha.toISOString().split('T')[0]] = parseFloat(row.salida);
        }
        const dias = [];
        for (let d = new Date(desde); d < hoy; d.setDate(d.getDate() + 1)) {
            const f = d.toISOString().split('T')[0];
            dias.push({ fecha: f, salida: mapaSalidas[f] || 0 });
        }

        res.json({ success: true, data: dias, meta: { ventana_dias: ventanaDias } });
    } catch (error) {
        console.error('Error GET /api/almacen/prediccion-agotamiento/detalle:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/entradas-almacen — reporte de todas las entradas de almacén
app.get('/api/almacen/entradas-almacen', async (req, res) => {
    try {
        const { empresa, desde, hasta } = req.query;
        if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        let conditions = [`ea.empresa::text = $1`];
        let params = [String(empresa)];
        let idx = 2;

        if (desde) { conditions.push(`ea.fecha >= $${idx}::date`); params.push(desde); idx++; }
        if (hasta) { conditions.push(`ea.fecha <= $${idx}::date`); params.push(hasta); idx++; }

        const rows = await pool.query(
            `SELECT ea.codigo AS entrada_codigo,
                    ea.fecha::date AS fecha,
                    ea.gasto,
                    ea.proveedor,
                    COALESCE(prov.nombre, ea.proveedor) AS proveedor_nombre,
                    ea.total AS total_entrada,
                    dea.articulo AS producto_codigo,
                    COALESCE(p.nombre, dea.articulo) AS producto_nombre,
                    p.und,
                    dea.cantidad,
                    dea.vr_unitario AS precio_unitario,
                    dea.subtotal
             FROM entrada_almacen ea
             JOIN detalle_entrada_almacen dea ON dea.codigo = ea.codigo
             LEFT JOIN productos p ON p.codigo = dea.articulo
             LEFT JOIN proveedores prov ON prov.codigo = ea.proveedor AND prov.empresa::text = $1
             WHERE ${conditions.join(' AND ')}
             ORDER BY ea.fecha DESC, ea.codigo, p.nombre`,
            params
        );
        res.json({ success: true, data: rows.rows, total: rows.rowCount });
    } catch (error) {
        console.error('Error GET /api/almacen/entradas-almacen:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/gastos-con-entradas — lista de códigos de gastos que tienen al menos una entrada de almacén
app.get('/api/almacen/gastos-con-entradas', async (req, res) => {
    try {
        const { empresa } = req.query;
        if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
        const r = await pool.query(
            `SELECT DISTINCT gasto AS codigo FROM entrada_almacen WHERE empresa::text = $1 AND gasto IS NOT NULL`,
            [String(empresa)]
        );
        const codigos = r.rows.map(row => row.codigo).filter(Boolean);
        res.json({ success: true, data: codigos });
    } catch (error) {
        console.error('Error GET /api/almacen/gastos-con-entradas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/almacen/entradas-por-gasto/:codigo — entradas vinculadas a un gasto específico
app.get('/api/almacen/entradas-por-gasto/:codigo', async (req, res) => {
    try {
        const { empresa } = req.query;
        const { codigo } = req.params;
        if (!empresa || !codigo) return res.status(400).json({ success: false, error: 'Empresa y código requeridos' });

        const rows = await pool.query(
            `SELECT ea.codigo AS entrada_codigo,
                    ea.fecha::date AS fecha,
                    ea.total AS total_entrada,
                    dea.articulo AS producto_codigo,
                    COALESCE(p.nombre, p.descripcion, a.nombre, dea.articulo) AS producto_nombre,
                    COALESCE(p.und, a.und, '-') AS und,
                    dea.cantidad,
                    dea.vr_unitario AS precio_unitario,
                    dea.subtotal
             FROM entrada_almacen ea
             JOIN detalle_entrada_almacen dea ON dea.codigo = ea.codigo
             LEFT JOIN productos p ON p.codigo::text = dea.articulo::text
             LEFT JOIN articulos a ON TRIM(a.codigo) = TRIM(dea.articulo)
             WHERE ea.empresa::text = $1
               AND ea.gasto = $2
             ORDER BY ea.fecha DESC, COALESCE(p.nombre, p.descripcion, a.nombre, dea.articulo)`,
            [String(empresa), codigo]
        );
        res.json({ success: true, data: rows.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/entradas-por-gasto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/almacen/gestion-inventario — editar movimiento existente
// Identifica el lote original por (fecha+ccosto+tipo_db+cc_relacion+observaciones),
// lo borra y re-inserta con los nuevos valores.
app.put('/api/almacen/gestion-inventario', async (req, res) => {
    const {
        empresa,
        // Llave original (para identificar qué borrar)
        orig_fecha, orig_ccosto, orig_tipo_db, orig_cc_relacion, orig_observaciones,
        // Nuevos valores
        fecha, tipo, ccOrigen, ccOrigenNombre, ccDestino, ccDestinoNombre, observaciones, productos,
    } = req.body;

    if (!empresa || !orig_fecha || !orig_ccosto || !orig_tipo_db)
        return res.status(400).json({ success: false, error: 'Faltan parámetros originales para identificar el movimiento' });
    if (!fecha || !tipo || !ccOrigen || !productos || productos.length === 0)
        return res.status(400).json({ success: false, error: 'Faltan parámetros del movimiento nuevo' });
    if (tipo === 'TRASLADO' && !ccDestino)
        return res.status(400).json({ success: false, error: 'Se requiere CC Destino para traslados' });

    const mapa = TIPO_DB[tipo];
    if (!mapa) return res.status(400).json({ success: false, error: `Tipo desconocido: ${tipo}` });

    const emp      = parseInt(empresa);
    const origObs  = orig_observaciones || '';
    const origCcRel = orig_cc_relacion  || '';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── 1. Borrar lote original ───────────────────────────────────
        if (orig_tipo_db === 'SALIDA POR TRASLADO') {
            // Borrar lado origen (SALIDA POR TRASLADO con cc_relacion=destino)
            await client.query(
                `DELETE FROM detalle_inventario
                 WHERE fecha=$1 AND ccosto=$2 AND empresa=$3
                   AND tipo='SALIDA POR TRASLADO'
                   AND COALESCE(cc_relacion,'') = $4`,
                [orig_fecha, orig_ccosto, emp, origCcRel]
            );
            // Borrar lado destino (ENTRADA POR TRASLADO con cc_relacion=origen)
            if (origCcRel) {
                await client.query(
                    `DELETE FROM detalle_inventario
                     WHERE fecha=$1 AND ccosto=$2 AND empresa=$3
                       AND tipo='ENTRADA POR TRASLADO'
                       AND COALESCE(cc_relacion,'') = $4`,
                    [orig_fecha, origCcRel, emp, orig_ccosto]
                );
            }
        } else {
            // ENTRADA / SALIDA / BAJA: borrar por fecha+ccosto+tipo+obs
            await client.query(
                `DELETE FROM detalle_inventario
                 WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4
                   AND COALESCE(observaciones,'') = $5`,
                [orig_fecha, orig_ccosto, emp, orig_tipo_db, origObs]
            );
        }

        // ── 2. Re-insertar con nuevos valores (misma lógica que POST) ─
        const obs = (observaciones || '').trim();
        let registrosCreados = 0;

        for (const prod of productos) {
            const cant = parseFloat(prod.cantidad);
            if (!cant || cant === 0) continue;

            if (tipo === 'ENTRADA') {
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones)
                     VALUES ($1,$2,$3,$4,0,$5,$6,$7)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp, obs]
                );
                registrosCreados++;
            } else if (tipo === 'SALIDA' || tipo === 'BAJA') {
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones)
                     VALUES ($1,$2,$3,0,$4,$5,$6,$7)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp, obs]
                );
                registrosCreados++;
            } else if (tipo === 'TRASLADO') {
                const [resOrigen, resDestino] = await Promise.all([
                    client.query(`SELECT nombre FROM ccostos WHERE codigo=$1 AND empresa=$2`, [ccOrigen, emp]),
                    client.query(`SELECT nombre FROM ccostos WHERE codigo=$1 AND empresa=$2`, [ccDestino, emp]),
                ]);
                const nombreOrigen  = (resOrigen.rows[0]?.nombre  || ccOrigen).toUpperCase();
                const nombreDestino = (resDestino.rows[0]?.nombre || ccDestino).toUpperCase();

                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion)
                     VALUES ($1,$2,$3,0,$4,$5,$6,$7,$8)`,
                    [fecha, ccOrigen, prod.codigo, cant, mapa.origen, emp,
                     obs || `Traslado a ${nombreDestino}`, ccDestino]
                );
                await client.query(
                    `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones,cc_relacion)
                     VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8)`,
                    [fecha, ccDestino, prod.codigo, cant, mapa.destino, emp,
                     obs || `Traslado desde ${nombreOrigen}`, ccOrigen]
                );
                registrosCreados += 2;
            }
        }

        await client.query('COMMIT');

        // Notificaciones de stock
        for (const prod of productos) {
            if (prod.codigo) {
                await verificarYGenerarNotificacionesStock(prod.codigo, ccOrigen, empresa);
                if (tipo === 'TRASLADO' && ccDestino)
                    await verificarYGenerarNotificacionesStock(prod.codigo, ccDestino, empresa);
            }
        }

        res.json({ success: true, registros: registrosCreados });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error PUT /api/almacen/gestion-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ── FIN GESTIÓN DE INVENTARIO ─────────────────────────────────────

// GET /api/almacen/verificar-inventario?empresa=&ccosto=&fecha=
// Verifica si existen movimientos 'SALIDA POR VENTA' para el ccosto y fecha dados
app.get('/api/almacen/verificar-inventario', async (req, res) => {
    const { empresa, ccosto, fecha } = req.query;
    if (!empresa || !ccosto || !fecha) {
        return res.status(400).json({ success: false, error: 'empresa, ccosto y fecha son requeridos' });
    }
    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS cnt FROM detalle_inventario
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND tipo = 'SALIDA POR VENTA'`,
            [fecha, ccosto, parseInt(empresa)]
        );
        const existe = parseInt(result.rows[0].cnt) > 0;
        res.json({ success: true, existe });
    } catch (error) {
        console.error('Error en GET /api/almacen/verificar-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── AJUSTE DE INVENTARIO (TOMA FÍSICA) ──────────────────────────

// GET /api/almacen/ajuste-inventario/stock
// Devuelve todos los productos con control='SI' y su stock actual en ese CC
app.get('/api/almacen/ajuste-inventario/stock', async (req, res) => {
    const { empresa, ccosto, cierre } = req.query;
    if (!empresa || !ccosto) {
        return res.status(400).json({ success: false, error: 'empresa y ccosto son requeridos' });
    }
    const emp = parseInt(empresa);
    try {
        // Determinar si el ccosto seleccionado es la bodega maestra
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`, [String(empresa)]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;
        const esBodegaMaestra = bodegaMaestra && bodegaMaestra === ccosto;
        const esCierre = cierre === 'true' || cierre === '1';

        // Bodega maestra → control = 'SI' (activo) | Punto de venta → visible_operacional = 'SI'
        // Modo "cierre de periodo" → siempre control = 'SI', sin importar el CC (conteo completo para valorización mensual)
        const filtroProductos = (esBodegaMaestra || esCierre)
            ? `p.control = 'SI'`
            : `p.visible_operacional = 'SI'`;

        const result = await pool.query(
            `SELECT
                p.codigo,
                p.nombre,
                p.und,
                p.ubicacion,
                COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                COALESCE(gp.codigo, '999')        AS grupo_codigo,
                COALESCE(
                    (SELECT SUM(d.entrada) - SUM(d.salida)
                     FROM detalle_inventario d
                     WHERE d.codigo = p.codigo
                       AND d.ccosto = $2
                       AND d.empresa = $1),
                    0
                ) AS stock_actual
             FROM productos p
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE ${filtroProductos}
             ORDER BY COALESCE(gp.codigo, '999'), p.nombre`,
            [emp, ccosto]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/ajuste-inventario/stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── PRESENTACIONES DE COMPRA ──────────────────────────────────────
// Guarda, para un producto o artículo puntual, cómo viene presentado en la
// compra (ej. TOCINETA se compra por "Paquete" de 2.5 KG, el sistema lo lleva
// en KG). Es opcional por ítem — no todos necesitan una. Se usa en la Entrada
// de Almacén de Gestión de Gastos para no tener que convertir de cabeza cada
// vez: se elige la presentación, se digita cuántas se compraron, y la cantidad
// en la unidad del sistema se calcula sola.
// No lleva columna empresa: es una característica física del producto (cómo
// lo empaca el proveedor), igual para cualquier empresa que lo compre —
// coherente con que productos/articulos tampoco están particionados por empresa.
pool.query(`
    CREATE TABLE IF NOT EXISTS presentaciones_compra (
        id                   SERIAL PRIMARY KEY,
        origen               VARCHAR(10)   NOT NULL,  -- 'PRODUCTO' | 'ARTICULO'
        codigo               VARCHAR(20)   NOT NULL,
        nombre_presentacion  VARCHAR(60)   NOT NULL,  -- 'Paquete', 'Frasco', 'Bulto'...
        contenido            NUMERIC(14,4) NOT NULL,  -- cuánto trae, en la unidad del ítem
        creado_en            TIMESTAMP     DEFAULT NOW()
    )
`).then(() => pool.query(
    `CREATE INDEX IF NOT EXISTS idx_presentaciones_item ON presentaciones_compra (origen, codigo)`
)).catch(() => {});

// GET /api/almacen/presentaciones-compra — todas, con nombre/unidad del ítem resuelto
app.get('/api/almacen/presentaciones-compra', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pc.id, pc.origen, pc.codigo, pc.nombre_presentacion, pc.contenido,
                   COALESCE(p.nombre, a.nombre, pc.codigo) AS item_nombre,
                   COALESCE(p.und, a.und, '') AS item_und
            FROM presentaciones_compra pc
            LEFT JOIN productos p ON pc.origen = 'PRODUCTO' AND p.codigo = pc.codigo
            LEFT JOIN articulos a ON pc.origen = 'ARTICULO' AND a.codigo = pc.codigo
            ORDER BY item_nombre, pc.nombre_presentacion
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/presentaciones-compra:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/almacen/presentaciones-compra
app.post('/api/almacen/presentaciones-compra', async (req, res) => {
    const { origen, codigo, nombre_presentacion, contenido } = req.body;
    if (!['PRODUCTO', 'ARTICULO'].includes(origen))
        return res.status(400).json({ success: false, error: 'origen debe ser PRODUCTO o ARTICULO' });
    if (!codigo || !nombre_presentacion?.trim())
        return res.status(400).json({ success: false, error: 'codigo y nombre_presentacion son requeridos' });
    const cont = parseFloat(contenido);
    if (!(cont > 0))
        return res.status(400).json({ success: false, error: 'El contenido debe ser mayor a 0' });
    try {
        const result = await pool.query(
            `INSERT INTO presentaciones_compra (origen, codigo, nombre_presentacion, contenido)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [origen, String(codigo).trim(), nombre_presentacion.trim().toUpperCase(), cont]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/almacen/presentaciones-compra:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/almacen/presentaciones-compra/:id
app.put('/api/almacen/presentaciones-compra/:id', async (req, res) => {
    const { nombre_presentacion, contenido } = req.body;
    if (!nombre_presentacion?.trim())
        return res.status(400).json({ success: false, error: 'nombre_presentacion es requerido' });
    const cont = parseFloat(contenido);
    if (!(cont > 0))
        return res.status(400).json({ success: false, error: 'El contenido debe ser mayor a 0' });
    try {
        const result = await pool.query(
            `UPDATE presentaciones_compra SET nombre_presentacion = $1, contenido = $2
             WHERE id = $3 RETURNING *`,
            [nombre_presentacion.trim().toUpperCase(), cont, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'No encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/almacen/presentaciones-compra/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/almacen/presentaciones-compra/:id
app.delete('/api/almacen/presentaciones-compra/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM presentaciones_compra WHERE id = $1 RETURNING id`, [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'No encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/almacen/presentaciones-compra/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN PRESENTACIONES DE COMPRA ──────────────────────────────────

// ── SNAPSHOT VALORIZADO DE TOMA FÍSICA ────────────────────────────
// Congela stock y costo unitario en el momento de la toma física, para que
// la Valoración Mensual de meses ya cerrados no cambie si luego se editan
// los precios de costo. Se escribe automáticamente al guardar cada toma.
pool.query(`
    CREATE TABLE IF NOT EXISTS toma_fisica_valorizada (
        id           SERIAL PRIMARY KEY,
        empresa      INT           NOT NULL,
        ccosto       VARCHAR(20)   NOT NULL,
        fecha        DATE          NOT NULL,
        codigo       VARCHAR(50)   NOT NULL,
        stock        NUMERIC(14,4) DEFAULT 0,
        precio_costo NUMERIC(12,2) DEFAULT 0,
        valor        NUMERIC(14,2) DEFAULT 0,
        contado      BOOLEAN       DEFAULT FALSE,
        es_cierre    BOOLEAN       DEFAULT FALSE,
        creado_en    TIMESTAMP     DEFAULT NOW(),
        UNIQUE (empresa, ccosto, fecha, codigo)
    )
`).then(() => Promise.all([
    pool.query(`CREATE INDEX IF NOT EXISTS idx_tfv_lookup ON toma_fisica_valorizada (empresa, ccosto, fecha)`),
    pool.query(`ALTER TABLE toma_fisica_valorizada ADD COLUMN IF NOT EXISTS contado   BOOLEAN DEFAULT FALSE`),
    pool.query(`ALTER TABLE toma_fisica_valorizada ADD COLUMN IF NOT EXISTS es_cierre BOOLEAN DEFAULT FALSE`),
])).catch(() => {});

// Recalcula el saldo COMPLETO del ccosto a la fecha de la toma (no solo los
// productos ajustados) y lo congela con el costo vigente en ese instante.
//
// Solo los conteos marcados como CIERRE DE PERIODO valorizan el mes. El día a día
// son tomas parciales de unos pocos productos: registrarlas como cierre haría que
// un ajuste rutinario cerca de fin de mes se tomara por el inventario final.
//
// `contado` marca qué productos se contaron de verdad (vs. arrastrados del saldo
// del kardex), para distinguir un cierre completo de uno a medias.
async function congelarTomaFisica(client, emp, empresaStr, ccosto, fecha, codigosContados = [], esCierre = false) {
    const contados = (codigosContados || []).map(c => String(c).trim());

    // Un conteo parcial del mismo día nunca debe pisar el cierre ya registrado
    if (!esCierre) {
        const yaHayCierre = await client.query(
            `SELECT 1 FROM toma_fisica_valorizada
              WHERE empresa=$1::int AND ccosto=$2::text AND fecha=$3::date
                AND es_cierre = TRUE LIMIT 1`,
            [emp, ccosto, fecha]
        );
        if (yaHayCierre.rowCount) return;
    }

    await client.query(
        `DELETE FROM toma_fisica_valorizada
          WHERE empresa=$1::int AND ccosto=$2::text AND fecha=$3::date`,
        [emp, ccosto, fecha]
    );
    // Todos los parámetros van casteados: $1 y $2 se usan a la vez como valor a
    // insertar y como filtro contra detalle_inventario, y sin cast Postgres
    // intenta deducir dos tipos distintos para el mismo parámetro y falla con
    // "inconsistent types deduced for parameter".
    await client.query(
        `INSERT INTO toma_fisica_valorizada (empresa, ccosto, fecha, codigo, stock, precio_costo, valor, contado, es_cierre)
         SELECT $1::int, $2::text, $3::date, di.codigo,
                ROUND((COALESCE(SUM(di.entrada),0) - COALESCE(SUM(di.salida),0))::numeric, 4) AS stock,
                COALESCE(pce.precio_costo, p.precio_costo, 0) AS precio_costo,
                ROUND(((COALESCE(SUM(di.entrada),0) - COALESCE(SUM(di.salida),0))
                       * COALESCE(pce.precio_costo, p.precio_costo, 0))::numeric, 2) AS valor,
                (TRIM(di.codigo) = ANY($5::text[]))                                  AS contado,
                $6::boolean                                                          AS es_cierre
         FROM detalle_inventario di
         JOIN productos p ON p.codigo = di.codigo
         LEFT JOIN producto_costo_empresa pce
                ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($4::text)
         WHERE di.empresa = $1::int AND di.ccosto = $2::text
           AND di.fecha <= $3::date AND p.control = 'SI'
         GROUP BY di.codigo, pce.precio_costo, p.precio_costo`,
        [emp, ccosto, fecha, empresaStr, contados, !!esCierre]
    );
}

// POST /api/almacen/ajuste-inventario
// Guarda los ajustes en detalle_inventario
app.post('/api/almacen/ajuste-inventario', async (req, res) => {
    const { empresa, fecha, ccosto, observaciones, ajustes, mode, es_cierre } = req.body;
    // ajustes: [{ codigo, diferencia }]  diferencia = fisico - actual
    // mode: 'new' | 'replace' | 'add'
    // es_cierre: true → conteo de fin de periodo; trae todo lo digitado (incluso
    //            diferencia 0) y es el único que valoriza el inventario del mes.

    if (!empresa || !fecha || !ccosto || !Array.isArray(ajustes) || ajustes.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Registra el conteo físico de al menos un producto antes de guardar'
        });
    }

    const emp = parseInt(empresa);
    const obs = (observaciones || '').trim().toUpperCase();
    const TIPO = 'TOMA FISICA';
    const esCierre = !!es_cierre;
    const codigosContados = ajustes.map(a => a.codigo).filter(Boolean);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Detectar conflicto (modo 'new'). Se revisan ambas fuentes: una toma
        // donde todo cuadró no deja filas en detalle_inventario, pero sí en el
        // snapshot valorizado.
        if (!mode || mode === 'new') {
            const dup = await client.query(
                `SELECT
                    (SELECT COUNT(*) FROM detalle_inventario
                      WHERE fecha=$1::date AND ccosto=$2::text AND empresa=$3::int AND tipo=$4::text)
                  + (SELECT COUNT(*) FROM toma_fisica_valorizada
                      WHERE fecha=$1::date AND ccosto=$2::text AND empresa=$3::int) AS cnt`,
                [fecha, ccosto, emp, TIPO]
            );
            if (parseInt(dup.rows[0].cnt) > 0) {
                await client.query('ROLLBACK');
                return res.json({ success: false, conflict: true, count: parseInt(dup.rows[0].cnt) });
            }
        }

        // Eliminar previos si replace
        if (mode === 'replace') {
            await client.query(
                `DELETE FROM detalle_inventario WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4`,
                [fecha, ccosto, emp, TIPO]
            );
        }

        // Insertar ajustes — solo los que realmente difieren generan movimiento
        let registros = 0;
        for (const aj of ajustes) {
            const diff = parseFloat(aj.diferencia);
            if (!diff || diff === 0 || isNaN(diff)) continue;

            const entrada = diff > 0 ? diff : 0;
            const salida  = diff < 0 ? Math.abs(diff) : 0;

            await client.query(
                `INSERT INTO detalle_inventario (fecha,ccosto,codigo,entrada,salida,tipo,empresa,observaciones)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [fecha, ccosto, aj.codigo, entrada, salida, TIPO, emp, obs || 'AJUSTE DE INVENTARIO']
            );
            registros++;
        }

        // Congelar la valorización. En un cierre queda constancia aunque no hubiera
        // ni una sola diferencia; en un conteo parcial solo sirve de histórico.
        await congelarTomaFisica(client, emp, String(empresa), ccosto, fecha, codigosContados, esCierre);

        await client.query('COMMIT');

        // Notificaciones de stock solo para los productos cuyo saldo cambió. En un
        // cierre `ajustes` trae todo el conteo (cientos de productos) y los que
        // cuadran no movieron stock: recorrerlos todos solo alarga la respuesta.
        for (const aj of ajustes) {
            if (aj.codigo && parseFloat(aj.diferencia)) {
                await verificarYGenerarNotificacionesStock(aj.codigo, ccosto, empresa);
            }
        }

        res.json({ success: true, registros, contados: codigosContados.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/almacen/ajuste-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ── FIN AJUSTE DE INVENTARIO ──────────────────────────────────────

// ── KARDEX POR PERÍODO ────────────────────────────────────────────

// GET /api/almacen/kardex
// Parámetros: empresa, ccosto, fecha
// Devuelve movimiento del día por producto agrupado por grupo
app.get('/api/almacen/kardex', async (req, res) => {
    const { empresa, ccosto, fecha } = req.query;
    if (!empresa || !ccosto || !fecha) {
        return res.status(400).json({ success: false, error: 'empresa, ccosto y fecha son requeridos' });
    }
    const emp = parseInt(empresa);
    try {
        // Determinar si el ccosto seleccionado es la bodega maestra
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`, [String(empresa)]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;
        const esBodegaMaestra = bodegaMaestra && bodegaMaestra === ccosto;

        // Filtro según si es bodega maestra o punto de venta
        // Bodega maestra → control = 'SI' (activo)
        // Punto de venta  → visible_operacional = 'SI'
        const filtroProductos = esBodegaMaestra
            ? `p.control = 'SI'`
            : `p.visible_operacional = 'SI'`;

        const result = await pool.query(
            `SELECT
                p.codigo,
                p.nombre,
                p.und,
                COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                COALESCE(gp.codigo, '999')        AS grupo_codigo,

                -- Stock anterior (todo antes de la fecha)
                COALESCE((
                    SELECT SUM(d.entrada) - SUM(d.salida)
                    FROM detalle_inventario d
                    WHERE d.codigo  = p.codigo
                      AND d.ccosto  = $2
                      AND d.empresa = $1
                      AND d.fecha   < $3
                ), 0) AS stock_anterior,

                -- Entradas del día (todos los tipos)
                COALESCE((
                    SELECT SUM(d.entrada)
                    FROM detalle_inventario d
                    WHERE d.codigo  = p.codigo
                      AND d.ccosto  = $2
                      AND d.empresa = $1
                      AND d.fecha   = $3
                ), 0) AS entradas_dia,

                -- Salidas del día (excluyendo ventas)
                COALESCE((
                    SELECT SUM(d.salida)
                    FROM detalle_inventario d
                    WHERE d.codigo  = p.codigo
                      AND d.ccosto  = $2
                      AND d.empresa = $1
                      AND d.fecha   = $3
                      AND d.tipo   <> 'SALIDA POR VENTA'
                ), 0) AS salidas_dia,

                -- Ventas del día
                COALESCE((
                    SELECT SUM(d.salida)
                    FROM detalle_inventario d
                    WHERE d.codigo  = p.codigo
                      AND d.ccosto  = $2
                      AND d.empresa = $1
                      AND d.fecha   = $3
                      AND d.tipo    = 'SALIDA POR VENTA'
                ), 0) AS ventas_dia

             FROM productos p
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE ${filtroProductos}
             ORDER BY COALESCE(gp.codigo, '999'), p.nombre`,
            [emp, ccosto, fecha]
        );

        // Obtener total efectivo de ventas del día (filtrado por empresa + ccosto)
        const efectivoRes = await pool.query(
            `SELECT COALESCE(SUM(efectivo), 0) AS total FROM ventas WHERE fecha = $1 AND empresa = $2 AND ccosto = $3`,
            [fecha, emp, ccosto]
        );
        const total_efectivo = parseFloat(efectivoRes.rows[0]?.total || 0);

        // Devolver TODOS los productos con control='SI' + total efectivo del día
        res.json({ success: true, data: result.rows, total_efectivo });
    } catch (error) {
        console.error('Error GET /api/almacen/kardex:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── FIN KARDEX ────────────────────────────────────────────────────

// ── REPORTE MOVIMIENTO POR PRODUCTO (RANGO DE FECHAS, DÍA A DÍA) ─

// GET /api/almacen/reporte-movimiento-producto
// Parámetros: empresa, ccosto, fecha_inicio, fecha_fin
// Devuelve movimientos diarios por producto con stock inicial acumulado
app.get('/api/almacen/reporte-movimiento-producto', async (req, res) => {
    const { empresa, ccosto, fecha_inicio, fecha_fin } = req.query;
    if (!empresa || !ccosto || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, error: 'empresa, ccosto, fecha_inicio y fecha_fin son requeridos' });
    }
    const emp = parseInt(empresa);
    try {
        // 1. Stock inicial por producto (todo antes de fecha_inicio)
        const stockInicialRes = await pool.query(`
            SELECT
                di.codigo,
                ROUND((COALESCE(SUM(di.entrada), 0) - COALESCE(SUM(di.salida), 0))::numeric, 4) AS stock_inicial
            FROM detalle_inventario di
            WHERE di.empresa = $1
              AND di.ccosto  = $2
              AND di.fecha   < $3
            GROUP BY di.codigo
        `, [emp, ccosto, fecha_inicio]);

        const stockMap = {};
        for (const row of stockInicialRes.rows) {
            stockMap[row.codigo] = parseFloat(row.stock_inicial);
        }

        // 2. Movimientos día a día en el rango
        const movResult = await pool.query(`
            SELECT
                di.fecha::text                                                               AS fecha,
                CASE
                    WHEN di.tipo = 'SALIDA POR TRASLADO' THEN
                        'SALIDA POR TRASLADO PARA ' || COALESCE(cc_rel.nombre, di.cc_relacion)
                    WHEN di.tipo = 'ENTRADA POR TRASLADO' THEN
                        'ENTRADA POR TRASLADO DESDE ' || COALESCE(cc_rel.nombre, di.cc_relacion)
                    ELSE di.tipo
                END                                                                          AS tipo,
                di.codigo,
                p.nombre,
                p.und,
                COALESCE(gp.nombre, 'Sin Grupo')                                             AS grupo_nombre,
                COALESCE(gp.codigo, '999')                                                   AS grupo_codigo,
                ROUND(COALESCE(SUM(di.entrada), 0)::numeric, 4)                             AS entradas,
                ROUND(COALESCE(SUM(CASE WHEN di.tipo <> 'SALIDA POR VENTA' THEN di.salida ELSE 0 END), 0)::numeric, 4) AS salidas,
                ROUND(COALESCE(SUM(CASE WHEN di.tipo  = 'SALIDA POR VENTA' THEN di.salida ELSE 0 END), 0)::numeric, 4) AS ventas
            FROM detalle_inventario di
            JOIN productos p ON p.codigo = di.codigo
            LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
            LEFT JOIN ccostos cc_rel ON cc_rel.codigo = di.cc_relacion AND cc_rel.empresa = di.empresa
            WHERE di.empresa = $1
              AND di.ccosto  = $2
              AND di.fecha BETWEEN $3 AND $4
            GROUP BY di.fecha, di.tipo, di.cc_relacion, cc_rel.nombre, di.codigo, p.nombre, p.und, grupo_nombre, grupo_codigo
            ORDER BY COALESCE(gp.codigo, '999'), p.nombre, di.fecha, di.tipo
        `, [emp, ccosto, fecha_inicio, fecha_fin]);

        res.json({
            success: true,
            data: movResult.rows,
            stock_inicial_map: stockMap
        });
    } catch (error) {
        console.error('Error GET /api/almacen/reporte-movimiento-producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── FIN REPORTE MOVIMIENTO POR PRODUCTO ───────────────────────────

// ── REPORTE CONSUMOS (SALIDA POR VENTA) ──────────────────────────
app.get('/api/almacen/reporte-consumos', async (req, res) => {
    try {
        const { empresa, ccostos, fecha_ini, fecha_fin } = req.query;
        if (!empresa || !ccostos || !fecha_ini || !fecha_fin)
            return res.status(400).json({ success: false, error: 'Faltan parámetros' });

        // ccostos llega como "CC1,CC2,CC3" → convertir a array
        const listaCcostos = ccostos.split(',').map(s => s.trim()).filter(Boolean);
        // $1 = empresa, $2..$N+1 = ccostos, $N+2 = fecha_ini, $N+3 = fecha_fin
        const n = listaCcostos.length;
        const placeholders = listaCcostos.map((_, i) => `$${i + 2}`).join(', ');

        const result = await pool.query(
            `SELECT
                di.codigo,
                p.nombre,
                p.und,
                SUM(di.salida)  AS total_consumido,
                COUNT(*)        AS num_movimientos,
                COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                COALESCE(gp.codigo, '999')        AS grupo_codigo
             FROM detalle_inventario di
             JOIN productos p ON p.codigo = di.codigo
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE di.empresa::text = $1
               AND di.ccosto  IN (${placeholders})
               AND di.fecha  >= $${n + 2}
               AND di.fecha  <= $${n + 3}
               AND di.tipo   LIKE 'SALIDA POR VENTA%'
             GROUP BY di.codigo, p.nombre, p.und, gp.nombre, gp.codigo
             ORDER BY COALESCE(gp.codigo, '999'), p.nombre`,
            [String(empresa), ...listaCcostos, fecha_ini, fecha_fin]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/reporte-consumos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN REPORTE CONSUMOS ──────────────────────────────────────────

// ── REPORTE FALTANTES Y SOBRANTES (TOMA FÍSICA) ───────────────────
// Parámetros: empresa, ccostos ("CC1,CC2,..."), fecha_ini, fecha_fin
// Suma por producto entradas (sobrante) y salidas (faltante) de todos
// los ajustes de tipo 'TOMA FISICA' en el rango, sin importar cuántas
// tomas físicas se hayan hecho.
app.get('/api/almacen/reporte-toma-fisica', async (req, res) => {
    try {
        const { empresa, ccostos, fecha_ini, fecha_fin } = req.query;
        if (!empresa || !ccostos || !fecha_ini || !fecha_fin)
            return res.status(400).json({ success: false, error: 'Faltan parámetros' });

        const listaCcostos = ccostos.split(',').map(s => s.trim()).filter(Boolean);
        const n = listaCcostos.length;
        const placeholders = listaCcostos.map((_, i) => `$${i + 2}`).join(', ');

        // Obtener bodega_maestra de la empresa para aplicar el filtro automático:
        // ccosto = bodega maestra -> producto.control='SI'; ccosto distinto -> producto.visible_operacional='SI'
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`, [String(empresa)]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;

        const queryParams = [String(empresa), ...listaCcostos, fecha_ini, fecha_fin];
        let filtroProductosSQL;
        if (bodegaMaestra) {
            queryParams.push(bodegaMaestra);
            const bmIdx = queryParams.length;
            filtroProductosSQL = ` AND ((di.ccosto = $${bmIdx} AND p.control='SI') OR (di.ccosto <> $${bmIdx} AND p.visible_operacional='SI'))`;
        } else {
            filtroProductosSQL = ` AND p.visible_operacional='SI'`;
        }

        const result = await pool.query(
            `SELECT
                di.codigo,
                p.nombre,
                COALESCE(p.descripcion, '') AS descripcion,
                p.und,
                COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                COALESCE(gp.codigo, '999')        AS grupo_codigo,
                COALESCE(pce.precio_costo, p.precio_costo, 0)   AS precio_costo,
                ROUND(COALESCE(SUM(di.entrada), 0)::numeric, 4) AS total_sobrante,
                ROUND(COALESCE(SUM(di.salida),  0)::numeric, 4) AS total_faltante,
                COUNT(DISTINCT (di.fecha, di.ccosto))            AS num_tomas
             FROM detalle_inventario di
             JOIN productos p ON p.codigo = di.codigo
             LEFT JOIN producto_costo_empresa pce
                    ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE di.empresa::text = $1
               AND di.ccosto  IN (${placeholders})
               AND di.fecha  >= $${n + 2}
               AND di.fecha  <= $${n + 3}
               AND di.tipo    = 'TOMA FISICA'
               ${filtroProductosSQL}
             GROUP BY di.codigo, p.nombre, p.descripcion, p.und, gp.nombre, gp.codigo, pce.precio_costo, p.precio_costo
             ORDER BY COALESCE(gp.codigo, '999'), p.nombre`,
            queryParams
        );

        // Obtener ventas del CC en el período (desde tabla ventas)
        const ventasRes = await pool.query(
            `SELECT COALESCE(SUM(ventas_netas), 0) AS total_ventas
             FROM ventas
             WHERE empresa = $1
               AND ccosto IN (${placeholders})
               AND fecha >= $${n + 2}
               AND fecha <= $${n + 3}`,
            [String(empresa), ...listaCcostos, fecha_ini, fecha_fin]
        );
        const ventasTotal = parseFloat(ventasRes.rows[0]?.total_ventas || 0);

        // Obtener tolerancia de pérdidas desde config_general
        const configRes = await pool.query(
            `SELECT COALESCE(tolerancia_perdida_faltantes, 2.00) AS tolerancia FROM config_general WHERE empresa::text = $1`,
            [String(empresa)]
        );
        const tolerancia = parseFloat(configRes.rows[0]?.tolerancia || 2.00);

        res.json({
            success: true,
            data: result.rows,
            ventas_ccosto: ventasTotal,
            tolerancia_perdida: tolerancia
        });
    } catch (error) {
        console.error('Error GET /api/almacen/reporte-toma-fisica:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN REPORTE FALTANTES Y SOBRANTES ─────────────────────────────

// ── REPORTE CONSUMO INSUMOS (SALIDA POR TRASLADO, BODEGA MAESTRA) ─
app.get('/api/almacen/reporte-consumo-insumos', async (req, res) => {
    try {
        const { empresa, fecha_ini, fecha_fin } = req.query;
        if (!empresa || !fecha_ini || !fecha_fin)
            return res.status(400).json({ success: false, error: 'Faltan parámetros' });

        // Obtener bodega maestra de la empresa
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`, [String(empresa)]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra;
        if (!bodegaMaestra)
            return res.status(400).json({ success: false, error: 'La empresa no tiene Bodega Maestra configurada' });

        const result = await pool.query(
            `SELECT
                di.codigo,
                p.nombre,
                p.und,
                SUM(di.salida)  AS total_consumido,
                COUNT(*)        AS num_movimientos,
                COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                COALESCE(gp.codigo, '999')        AS grupo_codigo
             FROM detalle_inventario di
             JOIN productos p ON p.codigo = di.codigo
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE di.empresa::text = $1
               AND di.ccosto  = $2
               AND di.fecha  >= $3
               AND di.fecha  <= $4
               AND di.tipo   LIKE 'SALIDA POR TRASLADO%'
             GROUP BY di.codigo, p.nombre, p.und, gp.nombre, gp.codigo
             ORDER BY COALESCE(gp.codigo, '999'), p.nombre`,
            [String(empresa), bodegaMaestra, fecha_ini, fecha_fin]
        );

        res.json({ success: true, data: result.rows, bodega_maestra: bodegaMaestra });
    } catch (error) {
        console.error('Error GET /api/almacen/reporte-consumo-insumos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN REPORTE CONSUMO INSUMOS ───────────────────────────────────

// ══════════════════════════════════════════════════════════════════
// VALORACIÓN MENSUAL DE INVENTARIO (juego de inventarios / COGS real)
//
// Inventario inicial/final = TOMA FÍSICA real (ajuste tipo 'TOMA FISICA' en
// detalle_inventario). NO se usa el saldo teórico del kardex: si un centro de
// costo no hizo toma física en la ventana de cierre, su inventario va en $0 y
// se reporta como faltante — así el consumo nunca se infla con saldos ficticios.
//
// VENTANA DE CIERRE (el restaurante opera de noche): la toma que cierra el mes
// M puede hacerse el último día de M o la mañana del día 1 de M+1, después de
// la venta de la última noche. El inventario inicial de M es, por continuidad,
// el mismo corte de cierre de M-1.
//
// COSTO CONGELADO: cada toma física guarda su valorización en
// toma_fisica_valorizada (stock + costo del momento). Si existe snapshot se usa
// ese valor y el mes queda inmune a cambios posteriores de precio_costo. Las
// tomas antiguas sin snapshot se calculan en vivo y se marcan como no congeladas.
//
// Compras = SUM(gastos.total) del mes en la cuenta contable configurada como
// "Cuenta Materia Prima (Entrada de Almacén)" (config_general.cta_materia_prima).
//
// Consumo real MP (empresa) = Inv. Inicial + Compras - Inv. Final.
//
// Ese consumo total se distribuye entre los centros de costo que SÍ tuvieron
// ventas en el período (excluyendo la bodega maestra y los CC administrativos
// sin ventas), en proporción a su participación % en las ventas netas totales.
// ══════════════════════════════════════════════════════════════════

// Días de gracia tras el cierre para aceptar la toma física del mes.
const DIAS_GRACIA_TOMA = 1;

function sumarDias(fechaStr, n) {
    const d = new Date(fechaStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

app.get('/api/almacen/valoracion-mensual', async (req, res) => {
    const { empresa, desde, hasta } = req.query;
    if (!empresa || !desde || !hasta)
        return res.status(400).json({ success: false, error: 'empresa, desde y hasta son requeridos' });
    const emp = parseInt(empresa);
    try {
        const [ccRes, bodegaRes, cfgRes] = await Promise.all([
            pool.query(`SELECT codigo, nombre FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO' ORDER BY nombre`, [emp]),
            pool.query(`SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [emp]),
            pool.query(`SELECT cta_materia_prima, valor_estimado_inventario_final FROM config_general WHERE empresa = $1`, [emp]),
        ]);
        const bodegaMaestra   = bodegaRes.rows[0]?.bodega_maestra || null;
        const ctaMateriaPrima = cfgRes.rows[0]?.cta_materia_prima || null;
        const valorEstimadoInventarioFinal = cfgRes.rows[0]?.valor_estimado_inventario_final != null
            ? parseFloat(cfgRes.rows[0].valor_estimado_inventario_final)
            : null;

        // ── Ventanas de cierre ────────────────────────────────────────────
        // Cierre del mes: [hasta, hasta + gracia]
        // Cierre del mes anterior (= inventario inicial): [desde-1, desde-1 + gracia]
        const cierreAnteriorIni = sumarDias(desde, -1);
        const ventanas = {
            inicial: { ini: cierreAnteriorIni, fin: sumarDias(cierreAnteriorIni, DIAS_GRACIA_TOMA) },
            final:   { ini: hasta,             fin: sumarDias(hasta, DIAS_GRACIA_TOMA) },
        };

        // Toma de CIERRE por centro de costo dentro de cada ventana.
        //
        // Solo cuentan los conteos marcados como "Cierre de Inventario Final de
        // Periodo": el día a día son tomas parciales de unos pocos productos y no
        // representan el inventario del centro. Un ajuste rutinario del día 31 no
        // debe tomarse por el inventario final del mes.
        //
        // Las tomas anteriores a este marcador no tienen snapshot; para no perder
        // el histórico se siguen aceptando desde detalle_inventario.
        async function tomasEnVentana(v) {
            const r = await pool.query(
                `SELECT ccosto, MAX(fecha)::text AS fecha FROM (
                     SELECT ccosto::text AS ccosto, fecha
                       FROM toma_fisica_valorizada
                      WHERE empresa = $1::int AND es_cierre = TRUE
                        AND fecha >= $2::date AND fecha <= $3::date
                     UNION
                     SELECT di.ccosto::text AS ccosto, di.fecha
                       FROM detalle_inventario di
                      WHERE di.empresa = $1::int AND di.tipo = 'TOMA FISICA'
                        AND di.fecha >= $2::date AND di.fecha <= $3::date
                        AND NOT EXISTS (
                              SELECT 1 FROM toma_fisica_valorizada t
                               WHERE t.empresa = di.empresa
                                 AND t.ccosto  = di.ccosto
                                 AND t.fecha   = di.fecha)
                 ) t
                 GROUP BY ccosto`,
                [emp, v.ini, v.fin]
            );
            const m = {};
            r.rows.forEach(row => { m[row.ccosto] = row.fecha.slice(0, 10); });
            return m;
        }

        const [tomasInicial, tomasFinal] = await Promise.all([
            tomasEnVentana(ventanas.inicial),
            tomasEnVentana(ventanas.final),
        ]);

        // Valoriza un conjunto de cortes (ccosto → fecha). Usa el snapshot
        // congelado cuando existe; si no, calcula en vivo desde el kardex.
        async function valorizarCortes(cortes) {
            const pares = Object.entries(cortes);
            if (!pares.length) return { rows: [], congelados: {}, conteos: {} };

            // 1) Snapshots congelados
            const ph = pares.map((_, i) => `($${i * 2 + 2}::varchar, $${i * 2 + 3}::date)`).join(', ');
            const params = [emp];
            pares.forEach(([cc, f]) => { params.push(cc, f); });
            const snapRes = await pool.query(
                `SELECT t.ccosto, t.codigo, t.stock, t.precio_costo, COALESCE(t.contado, false) AS contado,
                        p.nombre, p.und, COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre
                 FROM toma_fisica_valorizada t
                 JOIN productos p ON p.codigo = t.codigo
                 LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
                 WHERE t.empresa = $1 AND (t.ccosto, t.fecha) IN (${ph})`,
                params
            );

            // Cobertura del conteo: cuántos productos se contaron de verdad frente
            // a los que solo se arrastraron del saldo del kardex (toma parcial).
            const congelados = {};
            const conteos    = {};
            snapRes.rows.forEach(r => {
                congelados[r.ccosto] = true;
                if (!conteos[r.ccosto]) conteos[r.ccosto] = { contados: 0, total: 0 };
                conteos[r.ccosto].total++;
                if (r.contado) conteos[r.ccosto].contados++;
            });

            // 2) Cortes históricos sin snapshot → cálculo en vivo
            const pendientes = pares.filter(([cc]) => !congelados[cc]);
            let liveRows = [];
            if (pendientes.length) {
                const vals = pendientes.map((_, i) => `($${i * 2 + 3}::varchar, $${i * 2 + 4}::date)`).join(', ');
                const lp = [emp, String(empresa)];
                pendientes.forEach(([cc, f]) => { lp.push(cc, f); });
                const liveRes = await pool.query(
                    `WITH cortes(ccosto, fecha) AS (VALUES ${vals})
                     SELECT c.ccosto, di.codigo,
                            ROUND((COALESCE(SUM(di.entrada),0) - COALESCE(SUM(di.salida),0))::numeric, 4) AS stock,
                            COALESCE(pce.precio_costo, p.precio_costo, 0) AS precio_costo,
                            p.nombre, p.und, COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre
                     FROM cortes c
                     JOIN detalle_inventario di
                       ON di.ccosto = c.ccosto AND di.fecha <= c.fecha AND di.empresa = $1
                     JOIN productos p ON p.codigo = di.codigo
                     LEFT JOIN producto_costo_empresa pce
                            ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($2::text)
                     LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
                     WHERE p.control = 'SI'
                     GROUP BY c.ccosto, di.codigo, pce.precio_costo, p.precio_costo, p.nombre, p.und, gp.nombre`,
                    lp
                );
                liveRows = liveRes.rows;
            }

            return { rows: [...snapRes.rows, ...liveRows], congelados, conteos };
        }

        const gastosMPQuery = ctaMateriaPrima
            ? pool.query(
                `SELECT g.codigo, g.fecha, g.proveedor, COALESCE(pr.nombre, g.proveedor) AS proveedor_nombre,
                        g.concepto, g.factura, g.total
                 FROM gastos g
                 LEFT JOIN proveedores pr ON pr.codigo = g.proveedor AND pr.empresa = g.empresa
                 WHERE g.empresa = $1 AND g.cuenta = $2 AND g.fecha >= $3 AND g.fecha <= $4
                 ORDER BY g.fecha`,
                [emp, ctaMateriaPrima, desde, hasta]
              )
            : Promise.resolve({ rows: [] });

        const [valInicial, valFinal, gastosMPRes, ventasRes] = await Promise.all([
            valorizarCortes(tomasInicial),
            valorizarCortes(tomasFinal),
            gastosMPQuery,
            pool.query(
                `SELECT ccosto, COALESCE(SUM(ventas_netas), 0) AS ventas
                 FROM ventas
                 WHERE empresa = $1 AND fecha >= $2 AND fecha <= $3
                 GROUP BY ccosto`,
                [emp, desde, hasta]
            )
        ]);

        // ── Valorización de inventario por CC (toma física) ──────────────
        const porCC = {};
        const porProducto = {};
        function acumular(rows, campo) {
            for (const row of rows) {
                const valor = parseFloat(row.stock) * parseFloat(row.precio_costo);
                const cc = row.ccosto;
                if (!porCC[cc]) porCC[cc] = { ccosto: cc, valorInicial: 0, valorFinal: 0 };
                porCC[cc][campo] += valor;

                if (!porProducto[row.codigo]) {
                    porProducto[row.codigo] = {
                        codigo: row.codigo, nombre: row.nombre, und: row.und,
                        grupo_nombre: row.grupo_nombre, precio_costo: parseFloat(row.precio_costo),
                        valorInicial: 0, valorFinal: 0, stockInicial: 0, stockFinal: 0
                    };
                }
                porProducto[row.codigo][campo] += valor;
                porProducto[row.codigo][campo === 'valorInicial' ? 'stockInicial' : 'stockFinal'] += parseFloat(row.stock);
            }
        }
        acumular(valInicial.rows, 'valorInicial');
        acumular(valFinal.rows, 'valorFinal');

        const itemsSinCosto = new Set();
        for (const p of Object.values(porProducto)) {
            if (p.precio_costo <= 0 && (p.stockInicial > 0 || p.stockFinal > 0)) itemsSinCosto.add(p.codigo);
        }

        const ccNombres = {};
        ccRes.rows.forEach(cc => { ccNombres[cc.codigo] = cc.nombre; });

        const valorInicialTotal = Object.values(porCC).reduce((s, c) => s + c.valorInicial, 0);
        const valorFinalTotal   = Object.values(porCC).reduce((s, c) => s + c.valorFinal, 0);

        // ── Compras de materia prima (cuenta contable configurada) ────────
        const totalCompras = gastosMPRes.rows.reduce((s, g) => s + (parseFloat(g.total) || 0), 0);

        // ── Inventario final estimado (fallback) ───────────────────────────
        // Solo aplica al período ACTUAL (en curso) y cuando NINGÚN centro tiene
        // toma física de cierre registrada en la ventana final: en ese caso se
        // usa el valor estimado de Configuración General · Almacén para no
        // reportar un consumo distorsionado por un inventario final en $0.
        const hoy = new Date().toISOString().slice(0, 10);
        const inventarioFinalEsEstimado = Object.keys(tomasFinal).length === 0
            && hasta >= hoy
            && valorEstimadoInventarioFinal != null;
        const valorFinalUsado = inventarioFinalEsEstimado ? valorEstimadoInventarioFinal : valorFinalTotal;

        // ── Consumo real MP (empresa) ─────────────────────────────────────
        const consumoReal = valorInicialTotal + totalCompras - valorFinalUsado;

        // ── Ventas netas por CC en el período ──────────────────────────────
        const ventasPorCC = {};
        ventasRes.rows.forEach(v => { ventasPorCC[v.ccosto] = parseFloat(v.ventas) || 0; });

        // ── Asignación proporcional del consumo por CC según % de ventas ───
        // Se excluyen: la bodega maestra y cualquier CC sin ventas en el período
        // (p.ej. centros administrativos).
        const ccostosParaAsignar = ccRes.rows.filter(cc => {
            const esBodega = bodegaMaestra && String(cc.codigo) === String(bodegaMaestra);
            const ventas = ventasPorCC[cc.codigo] || 0;
            return !esBodega && ventas > 0;
        });
        const totalVentasBase = ccostosParaAsignar.reduce((s, cc) => s + (ventasPorCC[cc.codigo] || 0), 0);

        const centros = ccRes.rows.map(cc => {
            const esBodegaMaestra = bodegaMaestra && String(cc.codigo) === String(bodegaMaestra);
            const ventas = ventasPorCC[cc.codigo] || 0;
            const v = porCC[cc.codigo] || { valorInicial: 0, valorFinal: 0 };
            const incluidoEnAsignacion = !esBodegaMaestra && ventas > 0;
            const pctVentas   = incluidoEnAsignacion && totalVentasBase > 0 ? (ventas / totalVentasBase) * 100 : 0;
            const consumoAsig = incluidoEnAsignacion && totalVentasBase > 0 ? consumoReal * (ventas / totalVentasBase) : 0;
            return {
                ccosto: cc.codigo,
                nombre: cc.nombre,
                esBodegaMaestra,
                valorInicial: v.valorInicial,
                valorFinal: v.valorFinal,
                diferencia: v.valorFinal - v.valorInicial,
                // Trazabilidad de la toma física que respalda cada corte
                tomaInicial: tomasInicial[cc.codigo] || null,
                tomaFinal:   tomasFinal[cc.codigo]   || null,
                congeladoInicial: !!valInicial.congelados[cc.codigo],
                congeladoFinal:   !!valFinal.congelados[cc.codigo],
                conteoInicial: valInicial.conteos[cc.codigo] || null,
                conteoFinal:   valFinal.conteos[cc.codigo]   || null,
                ventas,
                incluidoEnAsignacion,
                pctVentas,
                consumoMP: consumoAsig,
                foodCostPct: incluidoEnAsignacion && ventas > 0 ? (consumoAsig / ventas) * 100 : null
            };
        }).sort((a, b) => b.consumoMP - a.consumoMP);

        // Centros sin toma física en la ventana de cierre → su inventario va en $0
        const sinTomaInicial = centros.filter(c => !c.tomaInicial).map(c => c.nombre);
        const sinTomaFinal   = centros.filter(c => !c.tomaFinal).map(c => c.nombre);
        const noCongelados   = centros.filter(c => (c.tomaInicial && !c.congeladoInicial) ||
                                                   (c.tomaFinal   && !c.congeladoFinal)).map(c => c.nombre);

        const productos = Object.values(porProducto)
            .filter(p => p.valorInicial > 0.0001 || p.valorFinal > 0.0001)
            .sort((a, b) => (b.valorInicial + b.valorFinal) - (a.valorInicial + a.valorFinal));

        // Detalle por producto DENTRO de cada centro de costo (a diferencia de
        // `productos`, que ya viene sumado entre todos los centros). Sirve para
        // verificar de dónde sale el total de un centro puntual en el detalle de
        // Inventario Inicial/Final. Se agrupa por ccosto y se descartan filas en
        // stock cero para no llenar la vista con productos que no tocan ese centro.
        function agruparPorCentro(rows) {
            const porCentro = {};
            for (const row of rows) {
                const stock = parseFloat(row.stock) || 0;
                if (Math.abs(stock) < 0.0001) continue;
                const precio = parseFloat(row.precio_costo) || 0;
                if (!porCentro[row.ccosto]) porCentro[row.ccosto] = [];
                porCentro[row.ccosto].push({
                    codigo: row.codigo, nombre: row.nombre, und: row.und,
                    grupo_nombre: row.grupo_nombre, stock, precio_costo: precio,
                    valor: stock * precio,
                });
            }
            for (const cc of Object.keys(porCentro)) {
                porCentro[cc].sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
            }
            return porCentro;
        }
        const productosPorCentro = {
            inicial: agruparPorCentro(valInicial.rows),
            final:   agruparPorCentro(valFinal.rows),
        };

        res.json({
            success: true,
            periodo: { desde, hasta },
            ventanas,
            diasGracia: DIAS_GRACIA_TOMA,
            bodegaMaestra,
            ctaMateriaPrima,
            kpis: {
                valorInicial: valorInicialTotal,
                valorFinal: valorFinalUsado,
                valorFinalReal: valorFinalTotal,
                inventarioFinalEsEstimado,
                valorEstimadoInventarioFinal,
                compras: totalCompras,
                consumoReal,
                itemsSinCosto: itemsSinCosto.size,
                totalVentasBase,
                ccSinTomaInicial: sinTomaInicial.length,
                ccSinTomaFinal: sinTomaFinal.length
            },
            avisos: { sinTomaInicial, sinTomaFinal, noCongelados },
            centros,
            productos,
            productosPorCentro,
            gastosMP: gastosMPRes.rows
        });
    } catch (error) {
        console.error('Error GET /api/almacen/valoracion-mensual:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN VALORACIÓN MENSUAL DE INVENTARIO ──────────────────────────

// ══════════════════════════════════════════════════════════════════
// ÓRDENES DE PRODUCCIÓN (subproductos de recetas)
// Sugerencia de producción basada en consumo de los últimos N días
// (ventas directas + uso como ingrediente en platos vendidos),
// con explosión de materia prima desde detalle_recetas.
// ══════════════════════════════════════════════════════════════════

let ordenProdTablesReady = false;
async function ensureOrdenProduccionTables() {
    if (ordenProdTablesReady) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orden_produccion (
            id              SERIAL PRIMARY KEY,
            empresa         VARCHAR(20),
            fecha           DATE DEFAULT CURRENT_DATE,
            receta          VARCHAR(50),
            receta_nombre   VARCHAR(200),
            und             VARCHAR(30),
            cantidad        NUMERIC DEFAULT 0,
            dias_ventana    INT DEFAULT 15,
            consumo_periodo NUMERIC DEFAULT 0,
            costo_total     NUMERIC DEFAULT 0,
            estado          VARCHAR(20) DEFAULT 'PENDIENTE',
            notas           TEXT,
            created_at      TIMESTAMP DEFAULT NOW()
        )`);
    // Migración: agregar columnas faltantes si la tabla existía con esquema viejo
    const colsMigration = [
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS empresa         VARCHAR(20)`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS fecha           DATE DEFAULT CURRENT_DATE`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS receta          VARCHAR(50)`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS receta_nombre   VARCHAR(200)`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS und             VARCHAR(30)`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS cantidad        NUMERIC DEFAULT 0`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS dias_ventana    INT DEFAULT 15`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS consumo_periodo NUMERIC DEFAULT 0`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS costo_total     NUMERIC DEFAULT 0`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS estado          VARCHAR(20) DEFAULT 'PENDIENTE'`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS notas           TEXT`,
        `ALTER TABLE orden_produccion ADD COLUMN IF NOT EXISTS created_at      TIMESTAMP DEFAULT NOW()`,
    ];
    for (const sql of colsMigration) {
        try { await pool.query(sql); } catch (e) { /* columna ya existe o tipo distinto, ignorar */ }
    }
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orden_produccion_detalle (
            id            SERIAL PRIMARY KEY,
            orden_id      INT,
            articulo      VARCHAR(50),
            nombre        VARCHAR(200),
            und           VARCHAR(30),
            es_subreceta  BOOLEAN DEFAULT FALSE,
            cant_unitaria NUMERIC DEFAULT 0,
            cant_total    NUMERIC DEFAULT 0,
            costo_unit    NUMERIC DEFAULT 0,
            costo_total   NUMERIC DEFAULT 0
        )`);
    // Migración: agregar FK solo si aún no existe
    await pool.query(`
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name = 'orden_produccion_detalle'
                  AND constraint_type = 'FOREIGN KEY'
            ) THEN
                ALTER TABLE orden_produccion_detalle
                    ADD CONSTRAINT fk_op_detalle_orden
                    FOREIGN KEY (orden_id) REFERENCES orden_produccion(id) ON DELETE CASCADE;
            END IF;
        END $$`);
    ordenProdTablesReady = true;
}

// GET listado de órdenes
app.get('/api/almacen/ordenes-produccion', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        await ensureOrdenProduccionTables();
        const r = await pool.query(
            `SELECT * FROM orden_produccion WHERE empresa::text = $1 ORDER BY fecha DESC, id DESC LIMIT 200`,
            [String(empresa)]
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/almacen/ordenes-produccion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET sugerencia: consumo del subproducto en los últimos N días + explosión de MP
app.get('/api/almacen/ordenes-produccion/sugerencia', async (req, res) => {
    const { empresa, receta, dias = 15 } = req.query;
    if (!empresa || !receta)
        return res.status(400).json({ success: false, error: 'empresa y receta son requeridos' });
    const emp = parseInt(empresa);
    const nDias = Math.max(1, parseInt(dias) || 15);
    try {
        // La receta (subproducto) puede tener un código distinto al del producto
        // controlado que realmente se descuenta en detalle_inventario. Se resuelve
        // vía receta_producto; si no hay mapeo, se usa el código de la receta tal cual.
        let codigoInventario = String(receta);
        try {
            const mapeoRes = await pool.query(
                'SELECT codigo_producto FROM receta_producto WHERE codigo_receta = $1',
                [String(receta)]
            );
            if (mapeoRes.rows.length > 0) codigoInventario = mapeoRes.rows[0].codigo_producto;
        } catch (e) {
            console.error('receta_producto lookup:', e.message);
        }

        const [recRes, directoRes, totalRes, mpRes] = await Promise.all([

            // Datos de la receta
            pool.query(`
                SELECT codigo, nombre, COALESCE(und,'UND') AS und, COALESCE(valor,0) AS valor
                FROM recetas WHERE TRIM(codigo::text) = TRIM($1)`, [String(receta)]),

            // Consumo directo: el subproducto vendido como plato (registro de venta)
            pool.query(`
                SELECT COALESCE(SUM(d.cant),0) AS cant
                FROM detalle_ventas d
                WHERE d.empresa = $1
                  AND TRIM(d.codigo::text) = TRIM($2)
                  AND d.fecha::date >= NOW()::date - ($3 || ' days')::interval`,
                [emp, String(receta), String(nDias)]),

            // Consumo TOTAL real: salidas de inventario ya registradas para el código
            // de producto controlado mapeado (incluye venta directa + su uso dentro
            // de cualquier plato, sin importar niveles de anidación, porque ya quedó
            // reflejado al importar las ventas)
            pool.query(`
                SELECT COALESCE(SUM(di.salida),0) AS cant
                FROM detalle_inventario di
                WHERE di.empresa::text = $1
                  AND TRIM(di.codigo::text) = TRIM($2)
                  AND di.tipo LIKE 'SALIDA POR VENTA%'
                  AND di.fecha >= NOW()::date - ($3 || ' days')::interval`,
                [String(emp), String(codigoInventario), String(nDias)]),

            // Materia prima de la receta (1 unidad de producción)
            pool.query(`
                SELECT dr.articulo,
                       COALESCE(r2.nombre, a.nombre, dr.articulo) AS nombre,
                       COALESCE(r2.und, a.und, '')                 AS und,
                       dr.cantidad                                  AS cant_unitaria,
                       COALESCE(r2.valor, a.valor, 0)               AS costo_unit,
                       CASE WHEN r2.codigo IS NOT NULL THEN TRUE ELSE FALSE END AS es_subreceta
                FROM detalle_recetas dr
                LEFT JOIN recetas r2 ON TRIM(r2.codigo::text) = TRIM(dr.articulo::text) AND r2.subproducto = 'SI'
                LEFT JOIN articulos a ON TRIM(a.codigo::text) = TRIM(dr.articulo::text) AND r2.codigo IS NULL
                WHERE TRIM(dr.receta::text) = TRIM($1)
                ORDER BY dr.codigo`, [String(receta)]),
        ]);

        if (!recRes.rows.length)
            return res.status(404).json({ success: false, error: 'Receta no encontrada' });

        const consumoDirecto     = parseFloat(directoRes.rows[0].cant) || 0;
        const consumoTotal       = Math.max(parseFloat(totalRes.rows[0].cant) || 0, consumoDirecto);
        const consumoIngrediente = consumoTotal - consumoDirecto;

        res.json({
            success: true,
            receta: recRes.rows[0],
            dias: nDias,
            consumo: {
                directo: consumoDirecto,
                como_ingrediente: consumoIngrediente,
                total: consumoTotal,
                promedio_diario: consumoTotal / nDias,
            },
            ingredientes: mpRes.rows,
        });
    } catch (e) {
        console.error('Error GET /api/almacen/ordenes-produccion/sugerencia:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET detalle de una orden
app.get('/api/almacen/ordenes-produccion/:id', async (req, res) => {
    try {
        await ensureOrdenProduccionTables();
        const orden = await pool.query('SELECT * FROM orden_produccion WHERE id = $1', [req.params.id]);
        if (!orden.rows.length) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        const det = await pool.query(
            'SELECT * FROM orden_produccion_detalle WHERE orden_id = $1 ORDER BY id', [req.params.id]
        );
        res.json({ success: true, orden: orden.rows[0], detalles: det.rows });
    } catch (e) {
        console.error('Error GET /api/almacen/ordenes-produccion/:id:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST crear orden
app.post('/api/almacen/ordenes-produccion', async (req, res) => {
    const { empresa, fecha, receta, receta_nombre, und, cantidad,
            dias_ventana, consumo_periodo, notas, detalles = [] } = req.body;
    if (!empresa || !receta || !cantidad)
        return res.status(400).json({ success: false, error: 'empresa, receta y cantidad son requeridos' });
    const client = await pool.connect();
    try {
        await ensureOrdenProduccionTables();
        await client.query('BEGIN');

        const costoTotal = detalles.reduce((s, d) => s + (parseFloat(d.costo_total) || 0), 0);
        const ordenR = await client.query(
            `INSERT INTO orden_produccion
                (empresa, fecha, receta, receta_nombre, und, cantidad, dias_ventana, consumo_periodo, costo_total, notas)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [String(empresa), fecha || new Date(), receta, receta_nombre || '', und || '',
             parseFloat(cantidad) || 0, parseInt(dias_ventana) || 15,
             parseFloat(consumo_periodo) || 0, costoTotal, notas || null]
        );
        const ordenId = ordenR.rows[0].id;

        for (const d of detalles) {
            await client.query(
                `INSERT INTO orden_produccion_detalle
                    (orden_id, articulo, nombre, und, es_subreceta, cant_unitaria, cant_total, costo_unit, costo_total)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [ordenId, d.articulo, d.nombre || '', d.und || '', !!d.es_subreceta,
                 parseFloat(d.cant_unitaria) || 0, parseFloat(d.cant_total) || 0,
                 parseFloat(d.costo_unit) || 0, parseFloat(d.costo_total) || 0]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, id: ordenId });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/almacen/ordenes-produccion:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// PUT cambiar estado (PENDIENTE ↔ COMPLETADA)
app.put('/api/almacen/ordenes-produccion/:id/estado', async (req, res) => {
    const { estado } = req.body;
    if (!['PENDIENTE', 'COMPLETADA'].includes(estado))
        return res.status(400).json({ success: false, error: 'estado inválido' });
    try {
        const r = await pool.query(
            'UPDATE orden_produccion SET estado = $1 WHERE id = $2 RETURNING id', [estado, req.params.id]
        );
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE eliminar orden
app.delete('/api/almacen/ordenes-produccion/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM orden_produccion WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── FIN ÓRDENES DE PRODUCCIÓN ─────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════
// ETIQUETAS PRODUCTO
// ═══════════════════════════════════════════════════════════════════
app.get('/api/almacen/etiquetas-producto', async (req, res) => {
    try {
        const { empresa } = req.query;
        if (!empresa) return res.status(400).json({ success: false, error: 'Falta empresa' });
        const r = await pool.query(
            `SELECT * FROM etiquetas_producto WHERE empresa = $1 ORDER BY producto`,
            [parseInt(empresa)]
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/almacen/etiquetas-producto:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/almacen/etiquetas-producto', async (req, res) => {
    try {
        const { codigo, producto, empresa, peso_neto_oz, peso_neto_g, porciones, tamano_porcion, ingredientes, alergenos, instrucciones, dias_vencimiento, activo, barcode } = req.body;
        if (!codigo || !producto || !empresa) return res.status(400).json({ success: false, error: 'Código, producto y empresa son requeridos' });
        await pool.query(
            `INSERT INTO etiquetas_producto (codigo, producto, empresa, peso_neto_oz, peso_neto_g, porciones, tamano_porcion, ingredientes, alergenos, instrucciones, dias_vencimiento, activo, barcode)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [codigo, producto, parseInt(empresa), peso_neto_oz||null, peso_neto_g||null, porciones||null, tamano_porcion||null, ingredientes||null, alergenos||null, instrucciones||null, dias_vencimiento||null, activo||'SI', barcode||null]
        );
        const r = await pool.query(`SELECT * FROM etiquetas_producto WHERE codigo = $1`, [codigo]);
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error POST /api/almacen/etiquetas-producto:', e);
        if (e.code === '23505') return res.status(400).json({ success: false, error: 'Ya existe una etiqueta con ese código' });
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/almacen/etiquetas-producto/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { producto, peso_neto_oz, peso_neto_g, porciones, tamano_porcion, ingredientes, alergenos, instrucciones, dias_vencimiento, activo, barcode } = req.body;
        await pool.query(
            `UPDATE etiquetas_producto SET producto=$1, peso_neto_oz=$2, peso_neto_g=$3, porciones=$4, tamano_porcion=$5, ingredientes=$6, alergenos=$7, instrucciones=$8, dias_vencimiento=$9, activo=$10, barcode=$11 WHERE codigo=$12`,
            [producto, peso_neto_oz||null, peso_neto_g||null, porciones||null, tamano_porcion||null, ingredientes||null, alergenos||null, instrucciones||null, dias_vencimiento||null, activo||'SI', barcode||null, codigo]
        );
        const r = await pool.query(`SELECT * FROM etiquetas_producto WHERE codigo = $1`, [codigo]);
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error PUT /api/almacen/etiquetas-producto:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/almacen/etiquetas-producto/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        await pool.query(`DELETE FROM etiquetas_producto WHERE codigo = $1`, [codigo]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/almacen/etiquetas-producto:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// LOTES DE FABRICACIÓN
// ═══════════════════════════════════════════════════════════════════
app.get('/api/almacen/lotes-fabricacion/proximo-codigo', async (req, res) => {
    try {
        const hoy = new Date();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        const aa = String(hoy.getFullYear()).slice(-2);
        const prefijo = `${mm}${dd}${aa}`;
        const r = await pool.query(
            `SELECT codigo FROM lotes_fabricacion WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,
            [`${prefijo}%`]
        );
        const consecutivo = r.rows[0] ? parseInt(r.rows[0].codigo.slice(-3)) + 1 : 1;
        res.json({ success: true, codigo: `${prefijo}${String(consecutivo).padStart(3, '0')}` });
    } catch (e) {
        console.error('Error GET proximo-codigo lotes-fabricacion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/almacen/lotes-fabricacion', async (req, res) => {
    try {
        const { empresa } = req.query;
        const r = await pool.query(
            `SELECT lf.*,
                    ep.producto AS etiqueta_nombre,
                    ep.ingredientes, ep.alergenos, ep.instrucciones,
                    ep.peso_neto_oz, ep.peso_neto_g, ep.porciones, ep.tamano_porcion,
                    ep.barcode
             FROM lotes_fabricacion lf
             LEFT JOIN etiquetas_producto ep ON ep.codigo = lf.etiqueta AND ep.empresa = $1
             ORDER BY lf.codigo DESC`,
            [parseInt(empresa) || 0]
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/almacen/lotes-fabricacion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/almacen/lotes-fabricacion', async (req, res) => {
    try {
        const { codigo, etiqueta, fecha_fab, fecha_vence, responsable, observaciones } = req.body;
        if (!codigo || !etiqueta || !fecha_fab) return res.status(400).json({ success: false, error: 'Código, etiqueta y fecha de fabricación son requeridos' });
        await pool.query(
            `INSERT INTO lotes_fabricacion (codigo, etiqueta, fecha_fab, fecha_vence, responsable, observaciones) VALUES ($1,$2,$3,$4,$5,$6)`,
            [codigo, etiqueta, fecha_fab, fecha_vence||null, responsable||null, observaciones||null]
        );
        const r = await pool.query(
            `SELECT lf.*,
                    ep.producto AS etiqueta_nombre,
                    ep.ingredientes, ep.alergenos, ep.instrucciones,
                    ep.peso_neto_oz, ep.peso_neto_g, ep.porciones, ep.tamano_porcion,
                    ep.barcode
             FROM lotes_fabricacion lf
             LEFT JOIN etiquetas_producto ep ON ep.codigo = lf.etiqueta
             WHERE lf.codigo = $1`,
            [codigo]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error POST /api/almacen/lotes-fabricacion:', e);
        if (e.code === '23505') return res.status(400).json({ success: false, error: 'Ya existe un lote con ese código' });
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/almacen/lotes-fabricacion/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { etiqueta, fecha_fab, fecha_vence, responsable, observaciones } = req.body;
        await pool.query(
            `UPDATE lotes_fabricacion SET etiqueta=$1, fecha_fab=$2, fecha_vence=$3, responsable=$4, observaciones=$5 WHERE codigo=$6`,
            [etiqueta, fecha_fab, fecha_vence||null, responsable||null, observaciones||null, codigo]
        );
        const r = await pool.query(
            `SELECT lf.*,
                    ep.producto AS etiqueta_nombre,
                    ep.ingredientes, ep.alergenos, ep.instrucciones,
                    ep.peso_neto_oz, ep.peso_neto_g, ep.porciones, ep.tamano_porcion,
                    ep.barcode
             FROM lotes_fabricacion lf
             LEFT JOIN etiquetas_producto ep ON ep.codigo = lf.etiqueta
             WHERE lf.codigo = $1`,
            [codigo]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error PUT /api/almacen/lotes-fabricacion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/almacen/lotes-fabricacion/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        await pool.query(`DELETE FROM lotes_fabricacion WHERE codigo = $1`, [codigo]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/almacen/lotes-fabricacion:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/inventario/movimientos - Registrar movimientos (formato nuevo)
app.post('/api/inventario/movimientos', async (req, res) => {
    const { movimientos } = req.body;
    
    if (!movimientos || !Array.isArray(movimientos) || movimientos.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Se requiere un array de movimientos'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let registrosCreados = 0;
        
        for (const mov of movimientos) {
            const query = `
                INSERT INTO detalle_inventario 
                (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
            
            await client.query(query, [
                mov.fecha,
                mov.ccosto,
                mov.codigo,
                mov.entrada || 0,
                mov.salida || 0,
                mov.tipo,
                mov.empresa,
                mov.observaciones || ''
            ]);
            
            registrosCreados++;
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            registros_creados: registrosCreados,
            message: `${registrosCreados} movimiento(s) guardado(s) exitosamente`
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/inventario/movimientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar movimientos',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ================================================================
// MÓDULO 4: MOVIMIENTOS (ALIAS TEMPORAL PARA COMPATIBILIDAD)
// ================================================================

app.post('/api/movimientos/registrar', async (req, res) => {
    const { empresa, fecha, tipo, ccOrigen, ccDestino, observaciones, productos } = req.body;
    
    if (!empresa || !fecha || !tipo || !ccOrigen || !productos || productos.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros obligatorios'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let registrosCreados = 0;
        
        if (tipo === 'ENTRADA A ALMACEN') {
            for (const prod of productos) {
                const query = `
                    INSERT INTO detalle_inventario 
                    (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                    VALUES ($1, $2, $3, $4, 0, $5, $6, $7)
                `;
                
                await client.query(query, [
                    fecha,
                    ccOrigen,
                    prod.producto,
                    prod.cantidad,
                    'ENTRADA',
                    empresa,
                    observaciones || 'Entrada a almacén'
                ]);
                
                registrosCreados++;
            }
            
        } else if (tipo === 'SALIDA DE ALMACEN') {
            for (const prod of productos) {
                const query = `
                    INSERT INTO detalle_inventario 
                    (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                    VALUES ($1, $2, $3, 0, $4, $5, $6, $7)
                `;
                
                await client.query(query, [
                    fecha,
                    ccOrigen,
                    prod.producto,
                    prod.cantidad,
                    'SALIDA',
                    empresa,
                    observaciones || 'Salida de almacén'
                ]);
                
                registrosCreados++;
            }
            
        } else if (tipo === 'TRANSFERENCIA ENTRE ALMACENES') {
            if (!ccDestino) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere centro de costo destino para transferencias'
                });
            }
            
            for (const prod of productos) {
                const querySalida = `
                    INSERT INTO detalle_inventario 
                    (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                    VALUES ($1, $2, $3, 0, $4, $5, $6, $7)
                `;
                
                await client.query(querySalida, [
                    fecha,
                    ccOrigen,
                    prod.producto,
                    prod.cantidad,
                    'TRANSFERENCIA',
                    empresa,
                    observaciones || `Transferencia a ${ccDestino}`
                ]);
                
                const queryEntrada = `
                    INSERT INTO detalle_inventario 
                    (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                    VALUES ($1, $2, $3, $4, 0, $5, $6, $7)
                `;
                
                await client.query(queryEntrada, [
                    fecha,
                    ccDestino,
                    prod.producto,
                    prod.cantidad,
                    'TRANSFERENCIA',
                    empresa,
                    observaciones || `Transferencia desde ${ccOrigen}`
                ]);
                
                registrosCreados += 2;
            }
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            registros_creados: registrosCreados,
            message: `${tipo} registrado exitosamente`
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/movimientos/registrar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar movimientos',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ================================================================
// MÓDULO 5: TESORERÍA - CUENTAS BANCARIAS
// ================================================================

// GET /api/cuentas-bancarias - Obtener cuentas bancarias
app.get('/api/cuentas-bancarias', async (req, res) => {
    const { empresa } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        const query = `
            SELECT codigo, nombre_banco, nombre_cta, tipo_cuenta, estado
            FROM cuentas_bancarias
            WHERE empresa = $1
            AND estado = 'ACTIVA'
            ORDER BY nombre_cta
        `;

        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/cuentas-bancarias:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener cuentas bancarias',
            details: error.message
        });
    }
});

// GET /api/movimientos-bancarios - Obtener movimientos bancarios
app.get('/api/movimientos-bancarios', async (req, res) => {
    const { empresa, cuenta, fecha_inicial, fecha_final } = req.query;
    
    if (!empresa || !cuenta || !fecha_inicial || !fecha_final) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros empresa, cuenta, fecha_inicial y fecha_final requeridos'
        });
    }
    
    try {
        const saldoInicialQuery = `
            SELECT COALESCE(SUM(ingreso), 0) - COALESCE(SUM(egreso), 0) as saldo
            FROM moviban
            WHERE empresa = $1
            AND banco = $2
            AND fecha < $3
        `;
        
        const saldoInicialResult = await pool.query(saldoInicialQuery, [empresa, cuenta, fecha_inicial]);
        const saldoInicial = parseFloat(saldoInicialResult.rows[0].saldo || 0);
        
        const movimientosQuery = `
            SELECT 
                m.fecha,
                m.beneficia,
                p.nombre as beneficiario,
                m.concepto,
                m.ingreso,
                m.egreso
            FROM moviban m
            LEFT JOIN proveedores p ON m.beneficia = p.codigo
            WHERE m.empresa = $1
            AND m.banco = $2
            AND m.fecha >= $3
            AND m.fecha <= $4
            ORDER BY m.fecha, m.numero
        `;
        
        const movimientosResult = await pool.query(movimientosQuery, [empresa, cuenta, fecha_inicial, fecha_final]);
        
        let totalIngresos = 0;
        let totalEgresos = 0;
        
        movimientosResult.rows.forEach(mov => {
            totalIngresos += parseFloat(mov.ingreso || 0);
            totalEgresos += parseFloat(mov.egreso || 0);
        });
        
        const saldoFinal = saldoInicial + totalIngresos - totalEgresos;
        
        res.json({
            success: true,
            data: movimientosResult.rows,
            resumen: {
                saldo_inicial: saldoInicial,
                total_ingresos: totalIngresos,
                total_egresos: totalEgresos,
                saldo_final: saldoFinal
            },
            total: movimientosResult.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/movimientos-bancarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener movimientos bancarios',
            details: error.message
        });
    }
});

// POST /api/movimientos-bancarios/crear - Crear movimiento bancario
app.post('/api/movimientos-bancarios/crear', async (req, res) => {
    const { fecha, tipo, cuenta_origen, cuenta_destino, valor, concepto, empresa } = req.body;
    
    if (!fecha || !tipo || !cuenta_origen || !valor || !concepto || !empresa) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros requeridos'
        });
    }
    
    if (valor <= 0) {
        return res.status(400).json({
            success: false,
            error: 'El valor debe ser mayor a cero'
        });
    }
    
    if (tipo === 'TRA' && !cuenta_destino) {
        return res.status(400).json({
            success: false,
            error: 'Se requiere cuenta destino para transferencias'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const consecutivoQuery = `
            SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as siguiente
            FROM moviban
            WHERE empresa = $1
        `;
        const consecutivoResult = await client.query(consecutivoQuery, [empresa]);
        const numeroConsecutivo = consecutivoResult.rows[0].siguiente;
        const numero = numeroConsecutivo.toString().padStart(10, '0');
        
        let registrosCreados = 0;
        
        if (tipo === 'ING') {
            const query = `
                INSERT INTO moviban 
                (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            
            await client.query(query, [
                tipo, numero, fecha, concepto, null, valor, 0, cuenta_origen, 'NO', empresa, null, null, null, null
            ]);
            
            registrosCreados = 1;
            
        } else if (tipo === 'EGR') {
            const query = `
                INSERT INTO moviban 
                (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            
            await client.query(query, [
                tipo, numero, fecha, concepto, null, 0, valor, cuenta_origen, 'NO', empresa, null, null, null, null
            ]);
            
            registrosCreados = 1;
            
        } else if (tipo === 'TRA') {
            const queryEgreso = `
                INSERT INTO moviban 
                (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            
            await client.query(queryEgreso, [
                tipo, numero, fecha, concepto, null, 0, valor, cuenta_origen, 'NO', empresa, null, null, null, null
            ]);
            
            const queryIngreso = `
                INSERT INTO moviban 
                (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            
            await client.query(queryIngreso, [
                tipo, numero, fecha, concepto, null, valor, 0, cuenta_destino, 'NO', empresa, null, null, null, null
            ]);
            
            registrosCreados = 2;
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: `${tipo === 'ING' ? 'Ingreso' : tipo === 'EGR' ? 'Egreso' : 'Transferencia'} registrado exitosamente`,
            registros_creados: registrosCreados,
            numero: numero
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/movimientos-bancarios/crear:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear movimiento bancario',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ================================================================
// TESORERÍA - CONCILIACIÓN BANCARIA
// ================================================================

// GET /api/tesoreria/movimientos - Obtener movimientos bancarios para conciliación
app.get('/api/tesoreria/movimientos', async (req, res) => {
    const { empresa, banco, conciliado } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        const params = [empresa];
        let paramIndex = 2;

        let query = `
            SELECT
                m.numero,
                m.tipo,
                m.fecha,
                m.concepto,
                COALESCE(p.nombre, m.beneficia) AS beneficia,
                m.cheque,
                m.ingreso,
                m.egreso,
                m.banco,
                m.conciliado,
                m.gasto,
                m.ccosto,
                m.empresa
            FROM moviban m
            LEFT JOIN proveedores p ON CAST(p.codigo AS TEXT) = CAST(m.beneficia AS TEXT) AND p.empresa = m.empresa
            WHERE m.empresa = $1
        `;

        // Filtro por banco (opcional)
        if (banco) {
            query += ` AND m.banco = $${paramIndex}`;
            params.push(banco);
            paramIndex++;
        }

        // Filtro por conciliado (varchar: 'NO' o 'SI')
        if (conciliado === 'NO') {
            query += ` AND (m.conciliado = 'NO' OR m.conciliado IS NULL)`;
        } else if (conciliado === 'SI') {
            query += ` AND m.conciliado = 'SI'`;
        }

        query += ` ORDER BY m.fecha DESC, m.numero DESC`;

        const result = await pool.query(query, params);

        const movimientos = result.rows.map(row => ({
            numero:     row.numero,
            tipo:       row.tipo,
            fecha:      row.fecha,
            concepto:   row.concepto,
            beneficia:  row.beneficia || '',
            cheque:     row.cheque || '',
            ingreso:    parseFloat(row.ingreso || 0),
            egreso:     parseFloat(row.egreso || 0),
            banco:      row.banco,
            conciliado: row.conciliado || 'NO',
            gasto:      row.gasto,
            ccosto:     row.ccosto,
            empresa:    row.empresa
        }));

        res.json({
            success: true,
            data: movimientos,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/movimientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener movimientos',
            details: error.message
        });
    }
});

// PUT /api/tesoreria/movimientos/:numero/editar - Editar un movimiento bancario manual
//
// Solo se permite editar movimientos que:
//  - NO estén asociados a un gasto (moviban.gasto IS NULL) — esos se editan desde
//    Contabilidad > Gastos, que ya mantiene sincronizado el moviban asociado.
//  - NO sean de tipo TRANSFERENCIA — una TRA crea dos registros pareados (uno por
//    cuenta) sin columna de vínculo explícita entre ellos, así que no hay forma
//    segura de ubicar y editar ambos lados a la vez. Se recomienda eliminar y
//    volver a crear la transferencia si está mal.
app.put('/api/tesoreria/movimientos/:numero/editar', async (req, res) => {
    const { numero } = req.params;
    const { empresa, fecha, concepto, beneficia, cheque, monto } = req.body;

    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    if (!fecha)   return res.status(400).json({ success: false, error: 'La fecha es requerida' });
    if (!concepto?.trim()) return res.status(400).json({ success: false, error: 'El concepto es requerido' });
    const montoVal = parseFloat(monto);
    if (isNaN(montoVal) || montoVal <= 0) return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const actualRes = await client.query(
            `SELECT numero, tipo, gasto FROM moviban WHERE numero = $1 AND empresa = $2 FOR UPDATE`,
            [numero, empresa]
        );
        if (actualRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
        }
        const actual = actualRes.rows[0];

        if (actual.gasto) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Este movimiento está asociado a un gasto — edítalo desde Contabilidad > Gastos'
            });
        }
        if (actual.tipo === 'TRA') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Las transferencias no se pueden editar — elimínala y créala de nuevo si está mal'
            });
        }

        const ingresoVal = actual.tipo === 'ING' ? montoVal : 0;
        const egresoVal  = actual.tipo === 'EGR' ? montoVal : 0;

        const result = await client.query(
            `UPDATE moviban
                SET fecha = $1, concepto = $2, beneficia = $3, cheque = $4,
                    ingreso = $5, egreso = $6
              WHERE numero = $7 AND empresa = $8
          RETURNING *`,
            [fecha, concepto.trim().toUpperCase(), (beneficia || '').toUpperCase(),
             (cheque || '').toUpperCase(), ingresoVal, egresoVal, numero, empresa]
        );

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en PUT /api/tesoreria/movimientos/:numero/editar:', error);
        res.status(500).json({ success: false, error: 'Error al editar movimiento', details: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/tesoreria/movimientos/:id - Marcar movimiento como conciliado/pendiente
app.put('/api/tesoreria/movimientos/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, empresa } = req.body;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    if (!estado || !['CONCILIADO', 'PENDIENTE'].includes(estado)) {
        return res.status(400).json({
            success: false,
            error: 'Estado debe ser CONCILIADO o PENDIENTE'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // conciliado es varchar(2): 'SI' o 'NO'
        const conciliado = estado === 'CONCILIADO' ? 'SI' : 'NO';

        const updateQuery = `
            UPDATE moviban
            SET conciliado = $1
            WHERE numero = $2 AND empresa = $3
            RETURNING numero, conciliado, fecha, concepto, beneficia
        `;

        const result = await client.query(updateQuery, [conciliado, id, empresa]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Movimiento no encontrado'
            });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Movimiento marcado como ${estado}`,
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en PUT /api/tesoreria/movimientos/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar movimiento',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// POST /api/tesoreria/movimientos/batch/conciliar - Marcar múltiples como conciliados
app.post('/api/tesoreria/movimientos/batch/conciliar', async (req, res) => {
    const { ids, empresa } = req.body;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'ids debe ser un array no vacío'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Build dynamic query for multiple IDs
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const params = [...ids, empresa];

        const updateQuery = `
            UPDATE moviban
            SET conciliado = 'SI'
            WHERE numero IN (${placeholders}) AND empresa = $${ids.length + 1}
            RETURNING numero, conciliado
        `;

        const result = await client.query(updateQuery, params);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${result.rowCount} movimientos marcados como conciliados`,
            updated: result.rowCount,
            data: result.rows
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en POST /api/tesoreria/movimientos/batch/conciliar:', error);
        res.status(500).json({
            success: false,
            error: 'Error en conciliación en lote',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/tesoreria/movimientos/resumen - Obtener resumen de conciliación por banco
app.get('/api/tesoreria/movimientos/resumen', async (req, res) => {
    const { empresa, banco } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    if (!banco) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro banco requerido'
        });
    }

    try {
        // conciliado es varchar(2): 'SI' o 'NO'
        const query = `
            SELECT
                COALESCE(SUM(ingreso) FILTER (WHERE conciliado = 'SI'), 0)  AS ingreso_conciliado,
                COALESCE(SUM(egreso)  FILTER (WHERE conciliado = 'SI'), 0)  AS egreso_conciliado,
                COALESCE(SUM(ingreso) FILTER (WHERE conciliado = 'NO' OR conciliado IS NULL), 0) AS ingreso_pendiente,
                COALESCE(SUM(egreso)  FILTER (WHERE conciliado = 'NO' OR conciliado IS NULL), 0) AS egreso_pendiente
            FROM moviban
            WHERE empresa = $1
              AND banco = $2
        `;

        const result = await pool.query(query, [empresa, banco]);
        const row = result.rows[0];

        const ingresoConciliado = parseFloat(row.ingreso_conciliado) || 0;
        const egresoConciliado  = parseFloat(row.egreso_conciliado)  || 0;
        const ingresoPendiente  = parseFloat(row.ingreso_pendiente)  || 0;
        const egresoPendiente   = parseFloat(row.egreso_pendiente)   || 0;

        const saldoInicial = ingresoConciliado - egresoConciliado;
        const saldoFinal   = saldoInicial + ingresoPendiente - egresoPendiente;

        res.json({
            success: true,
            data: {
                saldo_inicial_conciliado: saldoInicial,
                ingresos_pendientes:      ingresoPendiente,
                egresos_pendientes:       egresoPendiente,
                saldo_final_conciliado:   saldoFinal
            }
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/movimientos/resumen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resumen',
            details: error.message
        });
    }
});

// GET /api/tesoreria/saldos-cuentas — saldo actual de todas las cuentas
// bancarias ACTIVAS de la empresa (ingresos - egresos de moviban por banco).
// Usado por el dashboard del módulo Tesorería.
app.get('/api/tesoreria/saldos-cuentas', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });

    try {
        const result = await pool.query(`
            SELECT
                cb.codigo,
                cb.nombre_cta,
                cb.nombre_banco,
                cb.tipo_cuenta,
                COALESCE(SUM(m.ingreso), 0) - COALESCE(SUM(m.egreso), 0) AS saldo
            FROM cuentas_bancarias cb
            LEFT JOIN moviban m ON m.banco = cb.codigo AND m.empresa = $1
            WHERE cb.empresa = $1 AND cb.estado = 'ACTIVA'
            GROUP BY cb.codigo, cb.nombre_cta, cb.nombre_banco, cb.tipo_cuenta
            ORDER BY cb.nombre_cta
        `, [empresa]);

        const data = result.rows.map(r => ({ ...r, saldo: parseFloat(r.saldo) || 0 }));
        const total = data.reduce((s, r) => s + r.saldo, 0);

        res.json({ success: true, data, total });
    } catch (error) {
        console.error('Error GET /api/tesoreria/saldos-cuentas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/tesoreria/movimientos/next-numero - Obtener próximo número de movimiento
app.get('/api/tesoreria/movimientos/next-numero', async (req, res) => {
    const { empresa } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        const result = await pool.query(
            `SELECT COALESCE(MAX(CAST(numero AS BIGINT)), 0) + 1 AS next_num
             FROM moviban
             WHERE empresa = $1`,
            [empresa]
        );

        const nextNum = result.rows[0].next_num || 1;
        // Pad to 10 digits
        const numeroPadded = String(nextNum).padStart(10, '0');

        res.json({
            success: true,
            data: { numero: numeroPadded }
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/movimientos/next-numero:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener próximo número',
            details: error.message
        });
    }
});

// POST /api/tesoreria/movimientos - Crear nuevo movimiento bancario
app.post('/api/tesoreria/movimientos', async (req, res) => {
    const { tipo, fecha, concepto, beneficia, cheque, ingreso, egreso, banco, gasto, ccosto, origen, empresa, banco_destino } = req.body;

    if (!empresa) {
        return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    }
    if (!tipo || !['ING', 'EGR', 'TRA'].includes(tipo)) {
        return res.status(400).json({ success: false, error: 'tipo debe ser ING, EGR o TRA' });
    }
    if (!banco) {
        return res.status(400).json({ success: false, error: 'Parámetro banco requerido' });
    }
    if (!fecha) {
        return res.status(400).json({ success: false, error: 'Parámetro fecha requerido' });
    }
    if (tipo === 'TRA' && !banco_destino) {
        return res.status(400).json({ success: false, error: 'Para TRANSFERENCIA se requiere banco_destino' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bloquear tabla para obtener número seguro (transacción aislada)
        await client.query('LOCK TABLE moviban IN EXCLUSIVE MODE');

        // Obtener próximo número (después del lock)
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(numero AS BIGINT)), 0) + 1 AS next_num
             FROM moviban WHERE empresa = $1`,
            [empresa]
        );
        const nextNum = parseInt(numRes.rows[0]?.next_num, 10) || 1;
        const numero = String(nextNum).padStart(10, '0');

        const ingresoVal = parseFloat(ingreso || 0);
        const egresoVal  = parseFloat(egreso  || 0);

        const insertQuery = `
            INSERT INTO moviban
                (numero, tipo, fecha, concepto, beneficia, cheque, ingreso, egreso, banco, conciliado, gasto, ccosto, origen, empresa)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'NO', $10, $11, $12, $13)
            RETURNING *
        `;

        const result = await client.query(insertQuery, [
            numero,
            tipo,
            fecha,
            (concepto || '').trim().toUpperCase(),
            (beneficia || '').trim().toUpperCase(),
            (cheque || '').trim().toUpperCase(),
            ingresoVal,
            egresoVal,
            banco,
            gasto || null,
            ccosto || null,
            origen || null,
            empresa
        ]);

        // Si es TRANSFERENCIA, crear asiento en cuenta destino
        if (tipo === 'TRA') {
            const numDest = String(nextNum + 1).padStart(10, '0');
            await client.query(insertQuery, [
                numDest,
                'TRA',
                fecha,
                (concepto || '').trim().toUpperCase(),
                (beneficia || '').trim().toUpperCase(),
                (cheque || '').trim().toUpperCase(),
                egresoVal,  // Lo que egresa de origen es ingreso en destino
                0,          // egreso destino = 0
                banco_destino,
                gasto || null,
                ccosto || null,
                origen || null,
                empresa
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Movimiento creado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Error durante ROLLBACK:', rollbackErr);
        }
        console.error('Error en POST /api/tesoreria/movimientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear movimiento',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/tesoreria/conciliacion - Reporte de conciliación bancaria por cuenta
app.get('/api/tesoreria/conciliacion', async (req, res) => {
    const { banco, empresa } = req.query;

    if (!banco || !empresa) {
        return res.status(400).json({ success: false, error: 'Parámetros banco y empresa requeridos' });
    }

    try {
        // Saldo conciliado (movimientos con conciliado = 'SI')
        const saldoConciliadoRes = await pool.query(
            `SELECT
                COALESCE(SUM(ingreso), 0) AS total_ingresos_conc,
                COALESCE(SUM(egreso), 0)  AS total_egresos_conc
             FROM moviban
             WHERE banco = $1 AND empresa = $2 AND conciliado = 'SI'`,
            [banco, empresa]
        );

        const ingConc  = parseFloat(saldoConciliadoRes.rows[0]?.total_ingresos_conc || 0);
        const egrConc  = parseFloat(saldoConciliadoRes.rows[0]?.total_egresos_conc  || 0);
        const saldoConciliado = ingConc - egrConc;

        // Movimientos pendientes (conciliado = 'NO')
        const pendRes = await pool.query(
            `SELECT
                m.numero, m.fecha, m.tipo, m.concepto, m.beneficia,
                COALESCE(p.nombre, '') AS beneficiario_nombre,
                COALESCE(m.ingreso,0) AS ingreso,
                COALESCE(m.egreso,0)  AS egreso
             FROM moviban m
             LEFT JOIN proveedores p ON TRIM(p.codigo) = TRIM(m.beneficia)
             WHERE m.banco = $1 AND m.empresa = $2 AND m.conciliado = 'NO'
             ORDER BY m.fecha ASC, m.numero ASC`,
            [banco, empresa]
        );

        const movimientos = pendRes.rows;
        let totalIngresosPend = 0;
        let totalEgresosPend  = 0;
        movimientos.forEach(m => {
            totalIngresosPend += parseFloat(m.ingreso || 0);
            totalEgresosPend  += parseFloat(m.egreso  || 0);
        });

        const saldoProyectado = saldoConciliado + totalIngresosPend - totalEgresosPend;

        res.json({
            success: true,
            data: {
                saldoConciliado,
                totalIngresosPend,
                totalEgresosPend,
                saldoProyectado,
                movimientos: movimientos.map(m => ({
                    numero:              m.numero,
                    fecha:               m.fecha,
                    tipo:                m.tipo,
                    concepto:            m.concepto,
                    beneficiario:        m.beneficiario_nombre || '',
                    ingreso:             parseFloat(m.ingreso || 0),
                    egreso:              parseFloat(m.egreso  || 0),
                }))
            }
        });
    } catch (error) {
        console.error('Error GET /api/tesoreria/conciliacion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/tesoreria/movimientos-cuenta - Reporte de movimientos por cuenta y periodo
app.get('/api/tesoreria/movimientos-cuenta', async (req, res) => {
    const { banco, empresa, fechaInicio, fechaFin } = req.query;

    if (!banco || !empresa || !fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, error: 'Parámetros banco, empresa, fechaInicio y fechaFin son requeridos' });
    }

    try {
        // Saldo anterior: todo lo registrado en la cuenta ANTES de fechaInicio
        const saldoAntRes = await pool.query(
            `SELECT COALESCE(SUM(ingreso), 0) - COALESCE(SUM(egreso), 0) AS saldo_anterior
             FROM moviban
             WHERE banco = $1 AND empresa = $2 AND fecha < $3`,
            [banco, empresa, fechaInicio]
        );
        const saldoAnterior = parseFloat(saldoAntRes.rows[0]?.saldo_anterior || 0);

        const result = await pool.query(
            `SELECT
                m.numero, m.fecha, m.tipo, m.concepto, m.beneficia,
                COALESCE(p.nombre, '') AS beneficiario_nombre,
                COALESCE(m.ingreso, 0) AS ingreso,
                COALESCE(m.egreso,  0) AS egreso
             FROM moviban m
             LEFT JOIN proveedores p ON TRIM(p.codigo) = TRIM(m.beneficia)
             WHERE m.banco = $1 AND m.empresa = $2
               AND m.fecha >= $3 AND m.fecha <= $4
             ORDER BY m.fecha ASC, m.numero ASC`,
            [banco, empresa, fechaInicio, fechaFin]
        );

        const movimientos = result.rows;
        let totalIngresos = 0;
        let totalEgresos  = 0;
        movimientos.forEach(m => {
            totalIngresos += parseFloat(m.ingreso || 0);
            totalEgresos  += parseFloat(m.egreso  || 0);
        });

        res.json({
            success: true,
            data: {
                saldoAnterior,
                totalIngresos,
                totalEgresos,
                saldoNeto:           totalIngresos - totalEgresos,
                cantidadMovimientos: movimientos.length,
                movimientos: movimientos.map(m => ({
                    numero:       m.numero,
                    fecha:        m.fecha,
                    tipo:         m.tipo,
                    concepto:     m.concepto || '',
                    beneficiario: m.beneficiario_nombre || '',
                    ingreso:      parseFloat(m.ingreso || 0),
                    egreso:       parseFloat(m.egreso  || 0),
                }))
            }
        });
    } catch (error) {
        console.error('Error GET /api/tesoreria/movimientos-cuenta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas/por-skus - Busca recetas por lista de códigos (SKU), sin filtro de empresa
app.get('/api/recetas/por-skus', async (req, res) => {
    const { skus } = req.query;
    if (!skus) return res.json({ success: true, data: [] });

    const skuList = skus.split(',').map(s => s.trim()).filter(Boolean);
    if (skuList.length === 0) return res.json({ success: true, data: [] });

    try {
        const placeholders = skuList.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(
            `SELECT codigo, nombre, precio_venta FROM recetas WHERE TRIM(codigo::text) IN (${placeholders})`,
            skuList
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/recetas/por-skus:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/detalle-productos/por-recetas - Trae componentes de inventario por lista de SKUs (campo RECETA)
// JOIN con productos para obtener nombre y unidad del ingrediente
app.get('/api/detalle-productos/por-recetas', async (req, res) => {
    const { recetas } = req.query;
    if (!recetas) return res.json({ success: true, data: [] });
    const recetaList = recetas.split(',').map(s => s.trim()).filter(Boolean);
    if (recetaList.length === 0) return res.json({ success: true, data: [] });
    try {
        const placeholders = recetaList.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(
            `SELECT dp.receta, dp.articulo, dp.cant,
                    COALESCE(p.nombre, dp.articulo) AS articulo_nombre,
                    COALESCE(p.und, '') AS und,
                    COALESCE(p.grupo, '') AS grupo,
                    COALESCE(gp.nombre, p.grupo, '') AS grupo_nombre
             FROM detalle_productos dp
             INNER JOIN productos p ON TRIM(p.codigo::text) = TRIM(dp.articulo::text)
             LEFT JOIN grupo_productos gp ON TRIM(gp.codigo::text) = TRIM(p.grupo::text)
             WHERE TRIM(dp.receta::text) IN (${placeholders})
             AND UPPER(TRIM(COALESCE(p.control, ''))) = 'SI'`,
            recetaList
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/detalle-productos/por-recetas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════════
// MODIFICADORES → INVENTARIO
// Tabla: modificadores_inventario (id, modificador, articulo, cant, tipo)
// Mapea nombres de modificadores del CSV a ingredientes de inventario
// ══════════════════════════════════════════════════════════════════

// GET /api/modificadores-inventario — lista todas las configuraciones
app.get('/api/modificadores-inventario', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT mi.id, mi.modificador, mi.articulo, mi.cant, mi.tipo,
                   COALESCE(p.nombre, mi.articulo) AS articulo_nombre,
                   COALESCE(p.und, '') AS und,
                   COALESCE(p.grupo, '') AS grupo
            FROM modificadores_inventario mi
            LEFT JOIN productos p ON TRIM(p.codigo::text) = TRIM(mi.articulo::text)
            ORDER BY mi.modificador, mi.id
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/modificadores-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/modificadores-inventario — crea o actualiza una fila
app.post('/api/modificadores-inventario', async (req, res) => {
    const { modificador, articulo, cant, tipo } = req.body;
    if (!modificador || !articulo || cant == null || !tipo) {
        return res.status(400).json({ success: false, error: 'Faltan campos: modificador, articulo, cant, tipo' });
    }
    try {
        const result = await pool.query(`
            INSERT INTO modificadores_inventario (modificador, articulo, cant, tipo)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (modificador, articulo)
            DO UPDATE SET cant = EXCLUDED.cant, tipo = EXCLUDED.tipo
            RETURNING *
        `, [modificador.trim(), articulo.trim(), parseFloat(cant), tipo]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/modificadores-inventario:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/modificadores-inventario/:id — elimina una fila
app.delete('/api/modificadores-inventario/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM modificadores_inventario WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/modificadores-inventario/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// SQUARE ITEM MAPPING — mapea Item name + variation → SKU receta
// ═══════════════════════════════════════════════════════════════

pool.query(`CREATE TABLE IF NOT EXISTS square_item_mapping (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    item_variation TEXT NOT NULL DEFAULT '',
    sku TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(item_name, item_variation)
)`).catch(e => console.error('Error creando square_item_mapping:', e.message));

// Migración: el mapeo es global (igual para todos los clientes), ya no por empresa
pool.query(`ALTER TABLE square_item_mapping DROP COLUMN IF EXISTS empresa`).catch(e => console.error('Migración square_item_mapping (drop empresa):', e.message));
pool.query(`ALTER TABLE square_item_mapping ADD CONSTRAINT square_item_mapping_item_name_item_variation_key UNIQUE (item_name, item_variation)`).catch(() => {});

app.get('/api/square/item-mappings', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT m.id, m.item_name, m.item_variation, m.sku,
                    r.nombre AS receta_nombre, r.precio_venta
             FROM square_item_mapping m
             LEFT JOIN recetas r ON TRIM(r.codigo::text) = TRIM(m.sku)
             ORDER BY m.item_name, m.item_variation`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error GET /api/square/item-mappings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/square/item-mappings', async (req, res) => {
    const { item_name, item_variation, sku } = req.body;
    if (!item_name || !sku) return res.status(400).json({ success: false, error: 'item_name y sku requeridos' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO square_item_mapping (item_name, item_variation, sku)
             VALUES ($1, $2, $3)
             ON CONFLICT (item_name, item_variation) DO UPDATE SET sku = $3
             RETURNING *`,
            [item_name, item_variation || '', sku]
        );
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error POST /api/square/item-mappings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/square/item-mappings/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM square_item_mapping WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/square/item-mappings/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/square/item-mappings/bulk', async (req, res) => {
    const { mappings } = req.body;
    if (!mappings?.length) return res.status(400).json({ success: false, error: 'mappings requeridos' });
    try {
        let saved = 0;
        for (const m of mappings) {
            if (!m.item_name || !m.sku) continue;
            await pool.query(
                `INSERT INTO square_item_mapping (item_name, item_variation, sku)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (item_name, item_variation) DO UPDATE SET sku = $3`,
                [m.item_name, m.item_variation || '', m.sku]
            );
            saved++;
        }
        res.json({ success: true, saved });
    } catch (error) {
        console.error('Error POST /api/square/item-mappings/bulk:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/productos/controlados — productos con control='SI' para autocomplete
app.get('/api/productos/controlados', async (req, res) => {
    const { q } = req.query;
    try {
        let query = `SELECT codigo, nombre, und, COALESCE(grupo,'') AS grupo
                     FROM productos
                     WHERE UPPER(TRIM(COALESCE(control,''))) = 'SI'`;
        const params = [];
        if (q && q.trim()) {
            query += ` AND (UPPER(nombre) LIKE UPPER($1) OR TRIM(codigo::text) LIKE UPPER($1))`;
            params.push(`%${q.trim()}%`);
        }
        query += ` ORDER BY nombre LIMIT 60`;
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/productos/controlados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/tesoreria/proveedores/buscar - Buscar/listar proveedores
app.get('/api/tesoreria/proveedores/buscar', async (req, res) => {
    const { empresa, q } = req.query;

    if (!empresa) {
        return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    }

    try {
        let query = `
            SELECT codigo, nombre
            FROM proveedores
            WHERE empresa = $1
        `;
        const params = [empresa];

        // Si hay búsqueda, filtrar por nombre (LIKE)
        if (q && q.trim().length >= 1) {
            query += ` AND LOWER(nombre) LIKE $2`;
            params.push(`%${q.toLowerCase()}%`);
        }

        query += ` ORDER BY nombre LIMIT 50`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/proveedores/buscar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar proveedores',
            details: error.message
        });
    }
});

// ================================================================
// TESORERÍA - FACTURAS (COMPRA Y VENTA)
// ================================================================

// GET /api/tesoreria/facturas-compra - Obtener facturas de compra para cliente (mismo que facturas-venta)
app.get('/api/tesoreria/facturas-compra', async (req, res) => {
    const { empresa, estado, fecha_inicio, fecha_fin } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        let query = `
            SELECT
                codigo,
                fecha,
                cliente,
                orden_compra,
                subtotal,
                impuestos,
                total,
                estado,
                observaciones,
                fecha_vencimiento,
                valor_pagado,
                COALESCE((SELECT COUNT(*) FROM soportes_pago WHERE pago = factura_venta.codigo), 0) as soportes_count
            FROM factura_venta
            WHERE cliente = $1
        `;

        const params = [empresa];
        let paramIndex = 2;

        // Por defecto mostrar PENDIENTE
        if (!estado || estado === 'PENDIENTE') {
            query += ` AND estado = 'PENDIENTE'`;
        } else if (estado !== 'TODOS') {
            query += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        if (fecha_inicio) {
            query += ` AND fecha >= $${paramIndex}`;
            params.push(fecha_inicio);
            paramIndex++;
        }

        if (fecha_fin) {
            query += ` AND fecha <= $${paramIndex}`;
            params.push(fecha_fin);
            paramIndex++;
        }

        query += ` ORDER BY fecha_vencimiento ASC, codigo DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-compra:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener facturas de compra',
            details: error.message
        });
    }
});

// GET /api/tesoreria/facturas-venta - Obtener facturas de venta para cliente
app.get('/api/tesoreria/facturas-venta', async (req, res) => {
    const { empresa, estado, fecha_inicio, fecha_fin } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        let query = `
            SELECT
                codigo,
                fecha,
                cliente,
                orden_compra,
                subtotal,
                impuestos,
                total,
                estado,
                observaciones,
                fecha_vencimiento,
                valor_pagado,
                COALESCE((SELECT COUNT(*) FROM soportes_pago WHERE pago = factura_venta.codigo), 0) as soportes_count
            FROM factura_venta
            WHERE cliente = $1
        `;

        const params = [empresa];
        let paramIndex = 2;

        // Por defecto mostrar PENDIENTE
        if (!estado || estado === 'PENDIENTE') {
            query += ` AND estado = 'PENDIENTE'`;
        } else if (estado !== 'TODOS') {
            query += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        if (fecha_inicio) {
            query += ` AND fecha >= $${paramIndex}`;
            params.push(fecha_inicio);
            paramIndex++;
        }

        if (fecha_fin) {
            query += ` AND fecha <= $${paramIndex}`;
            params.push(fecha_fin);
            paramIndex++;
        }

        query += ` ORDER BY fecha_vencimiento ASC, codigo DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-venta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener facturas de venta',
            details: error.message
        });
    }
});

// GET /api/tesoreria/facturas-compra/:codigo - Obtener factura específica
app.get('/api/tesoreria/facturas-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                codigo, fecha, cliente, orden_compra, subtotal, impuestos, total,
                estado, observaciones, fecha_vencimiento, valor_pagado
             FROM factura_venta
             WHERE codigo = $1 AND cliente = $2`,
            [codigo, empresa]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-compra/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener factura',
            details: error.message
        });
    }
});

// GET /api/tesoreria/facturas-compra/:codigo/soportes - Obtener soportes de pago
app.get('/api/tesoreria/facturas-compra/:codigo/soportes', async (req, res) => {
    const { codigo } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                id, pago, nombre_archivo, tipo_archivo, fecha_subida
             FROM soportes_pago
             WHERE pago = $1
             ORDER BY fecha_subida DESC`,
            [codigo]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-compra/:codigo/soportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener soportes',
            details: error.message
        });
    }
});

// POST /api/tesoreria/facturas-compra/:codigo/soportes - Subir soporte de pago (base64)
app.post('/api/tesoreria/facturas-compra/:codigo/soportes', async (req, res) => {
    const { codigo } = req.params;
    const { nombre_archivo, archivo_base64, tipo_archivo } = req.body;

    try {
        // Validar campos requeridos
        if (!nombre_archivo || !archivo_base64 || !tipo_archivo) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros requeridos: nombre_archivo, archivo_base64, tipo_archivo'
            });
        }

        // Verificar que la factura exista y esté PENDIENTE
        const facturaRes = await pool.query(
            'SELECT estado FROM factura_venta WHERE codigo = $1',
            [codigo]
        );

        if (facturaRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        if (facturaRes.rows[0].estado !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden subir soportes en facturas PENDIENTE'
            });
        }

        // Validar que base64 es válido (debe tener múltiplo de 4 caracteres)
        if (archivo_base64.length % 4 !== 0) {
            return res.status(400).json({
                success: false,
                error: 'El archivo base64 es inválido'
            });
        }

        // Convertir base64 a buffer
        let archivo_data;
        try {
            archivo_data = Buffer.from(archivo_base64, 'base64');
        } catch (e) {
            console.error(`Error decodificando base64 para ${codigo}:`, e.message);
            return res.status(400).json({
                success: false,
                error: 'No se pudo decodificar el archivo base64'
            });
        }

        // Validar que el buffer tiene contenido
        if (archivo_data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El archivo está vacío'
            });
        }

        // Validar tamaño (máx 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (archivo_data.length > maxSize) {
            return res.status(413).json({
                success: false,
                error: 'El archivo excede el tamaño máximo de 10MB'
            });
        }

        // Log para diagnóstico
        console.log(`[CARGA] Factura: ${codigo}, Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, Tamaño: ${archivo_data.length} bytes`);

        // Insertar soporte
        const result = await pool.query(
            `INSERT INTO soportes_pago
                (pago, nombre_archivo, archivo_data, tipo_archivo, fecha_subida)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, pago, nombre_archivo, tipo_archivo, fecha_subida`,
            [codigo, nombre_archivo, archivo_data, tipo_archivo]
        );

        // Cambiar estado de factura a POR VERIFICAR
        await pool.query(
            'UPDATE factura_venta SET estado = $1 WHERE codigo = $2',
            ['POR VERIFICAR', codigo]
        );

        res.status(201).json({
            success: true,
            message: 'Soporte de pago cargado exitosamente',
            data: result.rows[0],
            nuevoEstado: 'POR VERIFICAR'
        });

    } catch (error) {
        console.error('Error en POST /api/tesoreria/facturas-compra/:codigo/soportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar soporte',
            details: error.message
        });
    }
});

// GET /api/tesoreria/facturas-venta/:codigo - Obtener factura específica
app.get('/api/tesoreria/facturas-venta/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                codigo, fecha, cliente, orden_compra, subtotal, impuestos, total,
                estado, observaciones, fecha_vencimiento, valor_pagado
             FROM factura_venta
             WHERE codigo = $1 AND cliente = $2`,
            [codigo, empresa]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-venta/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener factura',
            details: error.message
        });
    }
});

// GET /api/tesoreria/facturas-venta/:codigo/pdf - Datos completos para PDF de factura
app.get('/api/tesoreria/facturas-venta/:codigo/pdf', async (req, res) => {
    const { codigo } = req.params;
    try {
        const facResult = await pool.query(
            `SELECT fv.codigo, fv.fecha, fv.cliente, fv.orden_compra, fv.subtotal,
                    fv.impuestos, fv.total, fv.estado, fv.observaciones,
                    fv.fecha_vencimiento, fv.valor_pagado,
                    ec.nombre AS cliente_nombre, ec.direccion AS cliente_direccion, ec.telefono AS cliente_telefono,
                    ep.nombre AS proveedor_nombre, ep.direccion AS proveedor_direccion, ep.telefono AS proveedor_telefono
             FROM factura_venta fv
             LEFT JOIN empresas ec ON fv.cliente::text = ec.codigo::text
             LEFT JOIN ordenes_compra oc ON fv.orden_compra = oc.codigo
             LEFT JOIN empresas ep ON oc.empresa::text = ep.codigo::text
             WHERE fv.codigo = $1`,
            [codigo]
        );
        if (facResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Factura no encontrada' });

        const detResult = await pool.query(
            `SELECT dfv.producto_venta, dfv.cantidad, dfv.precio_unitario, dfv.subtotal,
                    p.nombre AS producto_nombre
             FROM detalle_factura_venta dfv
             LEFT JOIN productos p ON dfv.producto_venta::text = p.codigo::text
             WHERE dfv.factura = $1
             ORDER BY p.nombre`,
            [codigo]
        );

        res.json({ success: true, factura: facResult.rows[0], detalles: detResult.rows });
    } catch (e) {
        console.error('Error GET pdf factura:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/tesoreria/facturas-venta/:codigo/soportes - Obtener soportes de pago
app.get('/api/tesoreria/facturas-venta/:codigo/soportes', async (req, res) => {
    const { codigo } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                id, pago, nombre_archivo, tipo_archivo, fecha_subida
             FROM soportes_pago
             WHERE pago = $1
             ORDER BY fecha_subida DESC`,
            [codigo]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-venta/:codigo/soportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener soportes',
            details: error.message
        });
    }
});

// POST /api/tesoreria/facturas-venta/:codigo/soportes - Subir soporte de pago (base64)
app.post('/api/tesoreria/facturas-venta/:codigo/soportes', async (req, res) => {
    const { codigo } = req.params;
    const { nombre_archivo, archivo_base64, tipo_archivo } = req.body;

    try {
        // Validar campos requeridos
        if (!nombre_archivo || !archivo_base64 || !tipo_archivo) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros requeridos: nombre_archivo, archivo_base64, tipo_archivo'
            });
        }

        // Verificar que la factura exista y esté PENDIENTE
        const facturaRes = await pool.query(
            'SELECT estado FROM factura_venta WHERE codigo = $1',
            [codigo]
        );

        if (facturaRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }

        if (facturaRes.rows[0].estado !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden subir soportes en facturas PENDIENTE'
            });
        }

        // Convertir base64 a buffer
        const archivo_data = Buffer.from(archivo_base64, 'base64');

        // Validar tamaño (máx 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (archivo_data.length > maxSize) {
            return res.status(413).json({
                success: false,
                error: 'El archivo excede el tamaño máximo de 10MB'
            });
        }

        // Insertar soporte
        const result = await pool.query(
            `INSERT INTO soportes_pago
                (pago, nombre_archivo, archivo_data, tipo_archivo, fecha_subida)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, pago, nombre_archivo, tipo_archivo, fecha_subida`,
            [codigo, nombre_archivo, archivo_data, tipo_archivo]
        );

        res.status(201).json({
            success: true,
            message: 'Soporte de pago cargado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error en POST /api/tesoreria/facturas-venta/:codigo/soportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar soporte',
            details: error.message
        });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS VISTA PROVEEDOR: Facturas de Venta
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/tesoreria/facturas-proveedor - Todas las facturas emitidas (vista proveedor)
app.get('/api/tesoreria/facturas-proveedor', async (req, res) => {
    const { empresa, estado } = req.query;

    if (!empresa) {
        return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    }

    try {
        let query = `
            SELECT
                fv.codigo,
                fv.fecha,
                fv.cliente,
                COALESCE(e.nombre, fv.cliente) AS cliente_nombre,
                fv.orden_compra,
                fv.subtotal,
                fv.impuestos,
                fv.total,
                fv.estado,
                fv.observaciones,
                fv.fecha_vencimiento,
                fv.valor_pagado,
                COALESCE((SELECT COUNT(*) FROM soportes_pago WHERE pago = fv.codigo), 0) AS soportes_count
            FROM factura_venta fv
            LEFT JOIN empresas e ON CAST(e.codigo AS TEXT) = CAST(fv.cliente AS TEXT)
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (estado && estado !== 'TODOS') {
            query += ` AND fv.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        query += ` ORDER BY fv.fecha DESC, fv.codigo DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/facturas-proveedor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener facturas',
            details: error.message
        });
    }
});

// GET /api/tesoreria/saldo-favor-cliente/:cliente - Saldo a favor de un cliente
app.get('/api/tesoreria/saldo-favor-cliente/:cliente', async (req, res) => {
    const { cliente } = req.params;

    try {
        const result = await pool.query(
            `SELECT saldo FROM saldo_favor_cliente WHERE CAST(cliente AS TEXT) = $1`,
            [cliente]
        );

        const saldo = result.rows.length > 0 ? parseFloat(result.rows[0].saldo) : 0;

        res.json({
            success: true,
            data: { saldo, tiene_saldo: saldo > 0 }
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/saldo-favor-cliente/:cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener saldo a favor',
            details: error.message
        });
    }
});

// POST /api/tesoreria/facturas-proveedor/:codigo/aprobar-pago - Aprobar pago de factura
app.post('/api/tesoreria/facturas-proveedor/:codigo/aprobar-pago', async (req, res) => {
    const { codigo } = req.params;
    const { fecha, banco, valor_pagado, empresa, usar_saldo_favor } = req.body;

    if (!fecha || !empresa || valor_pagado === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros requeridos: fecha, valor_pagado, empresa'
        });
    }

    // Si usa saldo a favor, banco es opcional
    // Si no usa saldo a favor, banco es obligatorio
    if (!usar_saldo_favor && !banco) {
        return res.status(400).json({
            success: false,
            error: 'Banco es requerido cuando no se aplica saldo a favor'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener factura actual
        const facturaRes = await client.query(
            `SELECT codigo, total, cliente, estado, valor_pagado FROM factura_venta WHERE codigo = $1`,
            [codigo]
        );

        if (facturaRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Factura no encontrada' });
        }

        const factura = facturaRes.rows[0];
        const valorFactura = parseFloat(factura.total);
        const valorPagadoPrevio = parseFloat(factura.valor_pagado || 0);
        const saldoPendiente = valorFactura - valorPagadoPrevio;
        // Convertir valor_pagado a número, defecto a 0 si está vacío o inválido
        const valorPago = parseFloat(valor_pagado) || 0;

        // 1b. Obtener saldo a favor del cliente (si aplica)
        let saldoFavorDisponible = 0;
        let saldoFavorUsado = 0;
        if (usar_saldo_favor) {
            const saldoRes = await client.query(
                `SELECT saldo FROM saldo_favor_cliente WHERE CAST(cliente AS TEXT) = $1`,
                [factura.cliente]
            );
            saldoFavorDisponible = saldoRes.rows.length > 0 ? parseFloat(saldoRes.rows[0].saldo) : 0;

            // El saldo a favor solo cubre lo que falta pagar (saldo pendiente)
            // No puede pagar más de lo que debe
            const pendienteDespuesBanco = Math.max(0, saldoPendiente - valorPago);
            saldoFavorUsado = Math.min(saldoFavorDisponible, pendienteDespuesBanco);
        }

        const valorPagoEfectivo = valorPago + saldoFavorUsado;

        // 2. Determinar caso de pago y nuevo estado (basado en pago EFECTIVO vs SALDO PENDIENTE)
        let nuevoEstado, valorPagadoFinal, conceptoMoviban, excedente = 0;

        console.log('DEBUG APROBACION PAGO:', {
            codigo,
            valorFactura,
            valorPagadoPrevio,
            saldoPendiente,
            valorPago,
            saldoFavorDisponible,
            saldoFavorUsado,
            valorPagoEfectivo,
            usar_saldo_favor,
            diferencia: Math.abs(valorPagoEfectivo - saldoPendiente)
        });

        if (Math.abs(valorPagoEfectivo - saldoPendiente) < 0.01) {
            // CASO 1: Pago completo del saldo pendiente (tolerancia de 1 centavo)
            nuevoEstado = 'PAGADA';
            valorPagadoFinal = valorFactura;
            conceptoMoviban = `PAGO FACTURA DE VENTA ${codigo}`;
        } else if (valorPagoEfectivo < saldoPendiente) {
            // CASO 2: Pago parcial (no cubre todo lo pendiente)
            nuevoEstado = 'PENDIENTE';
            valorPagadoFinal = valorPagadoPrevio + valorPagoEfectivo;
            conceptoMoviban = `PAGO PARCIAL FACTURA DE VENTA ${codigo}`;
        } else {
            // CASO 3: Sobrepago (paga más de lo adeudado)
            nuevoEstado = 'PAGADA';
            valorPagadoFinal = valorFactura;
            excedente = parseFloat((valorPagoEfectivo - saldoPendiente).toFixed(2));
            conceptoMoviban = `PAGO FACTURA DE VENTA ${codigo}`;
        }

        // 3. Actualizar factura_venta
        await client.query(
            `UPDATE factura_venta SET estado = $1, valor_pagado = $2 WHERE codigo = $3`,
            [nuevoEstado, valorPagadoFinal, codigo]
        );

        // 4. Generar número de movimiento bancario (10 dígitos)
        await client.query('LOCK TABLE moviban IN SHARE ROW EXCLUSIVE MODE');
        const maxNumRes = await client.query(
            `SELECT MAX(CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS BIGINT) ELSE 0 END) AS max_num
             FROM moviban WHERE empresa = $1`,
            [empresa]
        );
        const nextNum = (parseInt(maxNumRes.rows[0].max_num) || 0) + 1;
        const numeroMoviban = String(nextNum).padStart(10, '0');

        // 5. Insertar movimiento en MOVIBAN (solo si hay valor pagado por banco)
        if (valorPago > 0) {
            await client.query(
                `INSERT INTO moviban
                    (tipo, numero, fecha, concepto, beneficia, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, ccosto, origen)
                 VALUES
                    ('ING', $1, $2, $3, NULL, NULL, $4, 0, $5, 'NO', $6, NULL, NULL, NULL)`,
                [numeroMoviban, fecha, conceptoMoviban.substring(0, 60), valorPago, banco, empresa]
            );
        }

        // 6. Manejar saldo a favor del cliente
        if (usar_saldo_favor && saldoFavorUsado > 0) {
            // Si se usó saldo a favor, reducirlo
            const nuevoSaldo = parseFloat((saldoFavorDisponible - saldoFavorUsado).toFixed(2));
            if (nuevoSaldo > 0.01) {
                // Actualizar saldo existente
                await client.query(
                    `UPDATE saldo_favor_cliente SET saldo = $1 WHERE CAST(cliente AS TEXT) = $2`,
                    [nuevoSaldo, factura.cliente]
                );
            } else {
                // Si saldo quedó en 0 o negativo, borrar el registro
                await client.query(
                    `DELETE FROM saldo_favor_cliente WHERE CAST(cliente AS TEXT) = $1`,
                    [factura.cliente]
                );
            }
        }

        // Manejar nuevo saldo a favor (en caso de sobrepago)
        if (excedente > 0) {
            const saldoRes = await client.query(
                `SELECT saldo FROM saldo_favor_cliente WHERE CAST(cliente AS TEXT) = $1`,
                [factura.cliente]
            );

            if (saldoRes.rows.length > 0) {
                // Actualizar saldo existente
                const saldoActual = parseFloat(saldoRes.rows[0].saldo);
                await client.query(
                    `UPDATE saldo_favor_cliente SET saldo = $1 WHERE CAST(cliente AS TEXT) = $2`,
                    [parseFloat((saldoActual + excedente).toFixed(2)), factura.cliente]
                );
            } else {
                // Crear nuevo registro de saldo a favor
                await client.query(
                    `INSERT INTO saldo_favor_cliente (empresa, cliente, saldo) VALUES ($1, $2, $3)`,
                    [parseInt(empresa), factura.cliente, excedente]
                );
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Pago aprobado exitosamente. Factura ${nuevoEstado}.`,
            data: {
                codigo,
                estado: nuevoEstado,
                valor_pagado: valorPagadoFinal,
                numero_movimiento: numeroMoviban,
                excedente_saldo_favor: excedente > 0 ? excedente : null
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en POST /api/tesoreria/facturas-proveedor/:codigo/aprobar-pago:', error);
        res.status(500).json({
            success: false,
            error: 'Error al aprobar el pago',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/tesoreria/soportes/:id/descargar - Descargar soporte de pago
app.get('/api/tesoreria/soportes/:id/descargar', async (req, res) => {
    const { id } = req.params;

    try {
        // Usar encode() para garantizar base64 format en la respuesta
        const result = await pool.query(
            'SELECT encode(archivo_data, \'base64\') as archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Soporte no encontrado'
            });
        }

        const { archivo_data, nombre_archivo, tipo_archivo } = result.rows[0];

        // Validar que existe data
        if (!archivo_data) {
            return res.status(404).json({
                success: false,
                error: 'El archivo está vacío o corrupto'
            });
        }

        // Convertir archivo_data (ya debería estar en base64 del SQL encode())
        let buffer;

        if (Buffer.isBuffer(archivo_data)) {
            // Ya es Buffer - perfecto
            buffer = archivo_data;
        } else if (typeof archivo_data === 'string') {
            // Esperamos base64 desde el SQL encode(), pero con fallbacks
            try {
                buffer = Buffer.from(archivo_data, 'base64');

                // Si resulta vacío, intentar otros formatos
                if (buffer.length === 0) {
                    // Intenta hex format
                    if (archivo_data.startsWith('\\x')) {
                        buffer = Buffer.from(archivo_data.slice(2), 'hex');
                    } else {
                        // Fallback a binary
                        buffer = Buffer.from(archivo_data, 'binary');
                    }
                }
            } catch (e) {
                console.warn(`Error decodificando base64 para soporte ${id}:`, e.message);
                // Fallback a binary
                buffer = Buffer.from(archivo_data, 'binary');
            }
        } else if (typeof archivo_data === 'object') {
            // Uint8Array o similar
            buffer = Buffer.from(archivo_data);
        } else {
            buffer = Buffer.from(String(archivo_data), 'binary');
        }

        // Validar que el buffer tiene contenido válido
        if (!buffer || buffer.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El archivo está vacío'
            });
        }

        // Log para diagnóstico (remover en producción)
        console.log(`[DESCARGA] ID: ${id}, Archivo: ${nombre_archivo}, TipoArchivo: ${tipo_archivo}, BufferSize: ${buffer.length} bytes`);

        // Detectar tipo MIME - SIEMPRE usar extensión del archivo como fuente confiable
        // porque la PWA Light guarda tipo_archivo como ".jpg" (extensión)
        // y la app Vue lo guarda como "image/jpeg" (MIME type)
        const ext = nombre_archivo.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'txt': 'text/plain'
        };
        // Siempre priorizar la extensión del archivo para el Content-Type
        let contentType = mimeTypes[ext] || 'application/octet-stream';

        console.log(`[DESCARGA] tipo_archivo en BD: "${tipo_archivo}", ext: "${ext}", Content-Type usado: "${contentType}"`);

        // Establecer headers correctos para descarga de archivo
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${nombre_archivo}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // Enviar el buffer binario
        res.end(buffer);

    } catch (error) {
        console.error('Error en GET /api/tesoreria/soportes/:id/descargar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al descargar soporte',
            details: error.message
        });
    }
});

// GET /api/tesoreria/soportes/:id/preview - Preview de soporte (sin descarga)
app.get('/api/tesoreria/soportes/:id/preview', async (req, res) => {
    const { id } = req.params;

    try {
        // Usar encode() para garantizar base64 format en la respuesta
        const result = await pool.query(
            'SELECT encode(archivo_data, \'base64\') as archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Soporte no encontrado'
            });
        }

        const { archivo_data, nombre_archivo, tipo_archivo } = result.rows[0];

        if (!archivo_data) {
            return res.status(404).json({
                success: false,
                error: 'El archivo está vacío'
            });
        }

        // Convertir base64 a Buffer
        let buffer;
        try {
            buffer = Buffer.from(archivo_data, 'base64');
        } catch (e) {
            console.error('Error decodificando base64:', e.message);
            buffer = Buffer.from(archivo_data, 'binary');
        }

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El archivo está vacío'
            });
        }

        // Detectar MIME type
        const ext = nombre_archivo.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'txt': 'text/plain'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Headers para preview (inline en lugar de attachment)
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        // NO incluir Content-Disposition para que se muestre inline

        // Enviar el buffer binario
        res.end(buffer);

    } catch (error) {
        console.error('Error en GET /api/tesoreria/soportes/:id/preview:', error);
        res.status(500).json({
            success: false,
            error: 'Error al previsualizar soporte',
            details: error.message
        });
    }
});

// TEST: POST /api/tesoreria/test-bytea - Test de round-trip bytea (para diagnóstico)
app.post('/api/tesoreria/test-bytea', async (req, res) => {
    const { base64String } = req.body;

    if (!base64String) {
        return res.status(400).json({ error: 'base64String requerido' });
    }

    try {
        // Convertir base64 a buffer
        const buffer = Buffer.from(base64String, 'base64');

        // Crear tabla temporal si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_bytea (
                id SERIAL PRIMARY KEY,
                data BYTEA,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Insertar el buffer
        const insertResult = await pool.query(
            'INSERT INTO test_bytea (data) VALUES ($1) RETURNING id',
            [buffer]
        );
        const testId = insertResult.rows[0].id;

        // Recuperar como base64
        const selectResult = await pool.query(
            'SELECT encode(data, \'base64\') as data_base64, LENGTH(data) as size FROM test_bytea WHERE id = $1',
            [testId]
        );

        const retrieved = selectResult.rows[0];
        const matches = retrieved.data_base64 === base64String;

        res.json({
            success: true,
            test_id: testId,
            original_size: buffer.length,
            retrieved_size: retrieved.size,
            matches: matches,
            message: matches ? 'Round-trip SUCCESS' : 'Round-trip FAIL - datos no coinciden',
            hex_original: buffer.toString('hex').substring(0, 32),
            hex_retrieved: Buffer.from(retrieved.data_base64, 'base64').toString('hex').substring(0, 32)
        });

    } catch (error) {
        console.error('Error en test-bytea:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/tesoreria/soportes/:id/info - Info diagnóstica del soporte (sin descargar)
app.get('/api/tesoreria/soportes/:id/info', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, pago, nombre_archivo, tipo_archivo, fecha_subida, LENGTH(archivo_data) as archivo_size, encode(archivo_data, \'hex\') as archivo_hex_preview FROM soportes_pago WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Soporte no encontrado'
            });
        }

        const data = result.rows[0];
        const hexPreview = data.archivo_hex_preview ? data.archivo_hex_preview.substring(0, 32) : 'VACIO';

        // Detectar tipo de archivo por magic bytes (primeros bytes en hex)
        let detectedType = 'DESCONOCIDO';
        if (hexPreview.startsWith('ffd8ffe0') || hexPreview.startsWith('ffd8ffe1')) {
            detectedType = 'JPEG';
        } else if (hexPreview.startsWith('89504e47')) {
            detectedType = 'PNG';
        } else if (hexPreview.startsWith('47494638')) {
            detectedType = 'GIF';
        } else if (hexPreview.startsWith('25504446')) {
            detectedType = 'PDF';
        }

        res.json({
            success: true,
            data: {
                id: data.id,
                pago: data.pago,
                nombre_archivo: data.nombre_archivo,
                tipo_archivo_registrado: data.tipo_archivo,
                archivo_size: data.archivo_size,
                archivo_size_mb: (data.archivo_size / (1024 * 1024)).toFixed(2),
                hex_preview: `${hexPreview}...`,
                tipo_detectado: detectedType,
                fecha_subida: data.fecha_subida
            }
        });

    } catch (error) {
        console.error('Error en GET /api/tesoreria/soportes/:id/info:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información del soporte',
            details: error.message
        });
    }
});

// GET /api/facturas-compra - Obtener facturas de compra
app.get('/api/facturas-compra', async (req, res) => {
    const { empresa, fecha_desde, fecha_hasta, estado } = req.query;
    
    if (!empresa || !fecha_desde || !fecha_hasta) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros empresa, fecha_desde y fecha_hasta requeridos'
        });
    }
    
    try {
        let query = `
            SELECT 
                codigo,
                fecha,
                orden_compra,
                subtotal,
                impuestos,
                total,
                estado,
                observaciones,
                fecha_vencimiento,
                valor_pagado
            FROM factura_venta
            WHERE cliente = $1
            AND fecha >= $2
            AND fecha <= $3
        `;
        
        const params = [empresa, fecha_desde, fecha_hasta];
        
        if (estado && estado !== 'TODOS') {
            query += ` AND estado = $4`;
            params.push(estado);
        }
        
        query += ` ORDER BY fecha DESC, codigo DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });
        
    } catch (error) {
        console.error('Error en /api/facturas-compra:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener facturas de compra',
            details: error.message
        });
    }
});

// GET /api/facturas-compra/detalle - Obtener detalle de factura
app.get('/api/facturas-compra/detalle', async (req, res) => {
    const { factura } = req.query;
    
    if (!factura) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro factura requerido'
        });
    }
    
    try {
        const facturaQuery = `
            SELECT 
                codigo,
                fecha,
                orden_compra,
                subtotal,
                impuestos,
                total,
                estado,
                observaciones,
                fecha_vencimiento
            FROM factura_venta
            WHERE codigo = $1
        `;
        
        const facturaResult = await pool.query(facturaQuery, [factura]);
        
        if (facturaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada'
            });
        }
        
        const detalleQuery = `
            SELECT 
                d.id,
                d.factura,
                d.producto_venta,
                p.nombre as producto_nombre,
                d.cantidad,
                d.precio_unitario,
                d.subtotal
            FROM detalle_factura_venta d
            LEFT JOIN productos_venta p ON d.producto_venta = p.codigo
            WHERE d.factura = $1
            ORDER BY d.id
        `;
        
        const detalleResult = await pool.query(detalleQuery, [factura]);
        
        res.json({
            success: true,
            factura: facturaResult.rows[0],
            detalle: detalleResult.rows
        });
        
    } catch (error) {
        console.error('Error en /api/facturas-compra/detalle:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle de factura',
            details: error.message
        });
    }
});

// POST /api/soporte-pago/subir - Subir soporte de pago
app.post('/api/soporte-pago/subir', async (req, res) => {
    const { factura, archivo_base64, nombre_archivo, empresa } = req.body;
    
    if (!factura || !archivo_base64 || !nombre_archivo) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros factura, archivo_base64 y nombre_archivo requeridos'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const extension = nombre_archivo.split('.').pop().toLowerCase();
        const tipoArchivo = `.${extension}`;
        
        let base64Puro = archivo_base64;
        if (archivo_base64.includes('base64,')) {
            base64Puro = archivo_base64.split('base64,')[1];
        }
        
        const buffer = Buffer.from(base64Puro, 'base64');
        
        const insertQuery = `
            INSERT INTO soportes_pago (pago, nombre_archivo, archivo_data, tipo_archivo, fecha_subida)
            VALUES ($1, $2, $3, $4, NOW())
        `;
        
        await client.query(insertQuery, [factura, nombre_archivo, buffer, tipoArchivo]);
        
        const updateQuery = `
            UPDATE factura_venta
            SET estado = 'POR VERIFICAR'
            WHERE codigo = $1
        `;

        await client.query(updateQuery, [factura]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Soporte de pago subido exitosamente. Estado actualizado a POR VERIFICAR.'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/soporte-pago/subir:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir soporte de pago',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/soporte-pago/obtener - Obtener soporte de pago
app.get('/api/soporte-pago/obtener', async (req, res) => {
    const { factura } = req.query;
    
    if (!factura) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro factura requerido'
        });
    }
    
    try {
        const query = `
            SELECT id, pago, nombre_archivo, archivo_data, tipo_archivo, fecha_subida
            FROM soportes_pago
            WHERE pago = $1
            ORDER BY fecha_subida DESC
            LIMIT 1
        `;
        
        const result = await pool.query(query, [factura]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró soporte de pago para esta factura'
            });
        }
        
        const soporte = result.rows[0];
        
        let archivoBase64 = '';
        if (soporte.archivo_data) {
            if (Buffer.isBuffer(soporte.archivo_data)) {
                archivoBase64 = `data:image/jpeg;base64,${soporte.archivo_data.toString('base64')}`;
            } else {
                archivoBase64 = soporte.archivo_data.startsWith('data:image') 
                    ? soporte.archivo_data 
                    : `data:image/jpeg;base64,${soporte.archivo_data}`;
            }
        }
        
        res.json({
            success: true,
            soporte: {
                id: soporte.id,
                pago: soporte.pago,
                nombre_archivo: soporte.nombre_archivo,
                archivo_data: archivoBase64,
                tipo_archivo: soporte.tipo_archivo,
                fecha_subida: soporte.fecha_subida
            }
        });
        
    } catch (error) {
        console.error('Error en /api/soporte-pago/obtener:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener soporte de pago',
            details: error.message
        });
    }
});

// ================================================================
// MÓDULO 6: GASTOS Y CONTABILIDAD
// ================================================================

// GET /api/gastos/proveedores - Obtener proveedores
app.get('/api/gastos/proveedores', async (req, res) => {
    const { empresa } = req.query;
    
    try {
        const query = `
            SELECT codigo, nombre
            FROM proveedores
            WHERE empresa = $1
            ORDER BY nombre
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            proveedores: result.rows
        });
    } catch (error) {
        console.error('Error en /api/gastos/proveedores:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proveedores'
        });
    }
});

// GET /api/gastos/ccostos - Obtener centros de costo para gastos
app.get('/api/gastos/ccostos', async (req, res) => {
    const { empresa } = req.query;
    
    try {
        const query = `
            SELECT codigo, nombre
            FROM ccostos
            WHERE empresa = $1
              AND COALESCE(activo, 'SI') <> 'NO'
            ORDER BY codigo
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            ccostos: result.rows
        });
    } catch (error) {
        console.error('Error en /api/gastos/ccostos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener centros de costo'
        });
    }
});

// GET /api/gastos/cuentas-contables - Obtener cuentas contables
app.get('/api/gastos/cuentas-contables', async (req, res) => {
    const { empresa } = req.query;
    
    try {
        const query = `
            SELECT codigo, cuenta
            FROM cuentas
            WHERE empresa = $1
            ORDER BY codigo
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            cuentas: result.rows
        });
    } catch (error) {
        console.error('Error en /api/gastos/cuentas-contables:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener cuentas contables'
        });
    }
});

// GET /api/gastos/cuentas-bancarias - Obtener cuentas bancarias para gastos
app.get('/api/gastos/cuentas-bancarias', async (req, res) => {
    const { empresa } = req.query;
    
    try {
        const query = `
            SELECT codigo, nombre_banco, nombre_cta
            FROM cuentas_bancarias
            WHERE empresa = $1 AND estado = 'ACTIVA'
            ORDER BY nombre_banco
        `;
        
        const result = await pool.query(query, [empresa]);
        
        res.json({
            success: true,
            cuentas: result.rows
        });
    } catch (error) {
        console.error('Error en /api/gastos/cuentas-bancarias:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener cuentas bancarias'
        });
    }
});

// GET /api/gastos/siguiente-codigo - Generar siguiente código
app.get('/api/gastos/siguiente-codigo', async (req, res) => {
    const { empresa } = req.query;
    
    try {
        const query = `
            SELECT COALESCE(MAX(CAST(codigo AS BIGINT)), 0) + 1 as siguiente
            FROM gastos
            WHERE empresa = $1
        `;
        
        const result = await pool.query(query, [empresa]);
        const siguiente = result.rows[0].siguiente;
        const codigo = siguiente.toString().padStart(10, '0');
        
        res.json({
            success: true,
            codigo: codigo
        });
    } catch (error) {
        console.error('Error en /api/gastos/siguiente-codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar código'
        });
    }
});

// POST /api/gastos/crear - Crear gasto
app.post('/api/gastos/crear', async (req, res) => {
    const { fecha, proveedor, cuenta, factura, subtotal, impuestos, total, ccosto, forma_pago, codigo_banco, empresa } = req.body;
    const concepto = req.body.concepto || '';
    
    if (!fecha || !proveedor || !cuenta || !ccosto || !forma_pago || !codigo_banco) {
        return res.status(400).json({
            success: false,
            error: 'Faltan campos obligatorios'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const codigoQuery = `
            SELECT COALESCE(MAX(CAST(codigo AS BIGINT)), 0) + 1 as siguiente
            FROM gastos
            WHERE empresa = $1
        `;
        const codigoResult = await client.query(codigoQuery, [empresa]);
        const codigoGasto = codigoResult.rows[0].siguiente.toString().padStart(10, '0');
        
        const insertGastoQuery = `
            INSERT INTO gastos (codigo, fecha, proveedor, concepto, cuenta, factura, subtotal, impuestos, total, ccosto, forma_pago, estado, empresa)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDIENTE', $12)
        `;
        
        await client.query(insertGastoQuery, [
            codigoGasto, fecha, proveedor, concepto, cuenta, factura, 
            subtotal, impuestos, total, ccosto, forma_pago, empresa
        ]);
        
        const numeroQuery = `
            SELECT COALESCE(MAX(CAST(numero AS BIGINT)), 0) + 1 as siguiente
            FROM moviban
            WHERE empresa = $1
        `;
        const numeroResult = await client.query(numeroQuery, [empresa]);
        const numeroMovimiento = numeroResult.rows[0].siguiente.toString().padStart(10, '0');
        
        const insertMovibanQuery = `
            INSERT INTO moviban (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
            VALUES ('EGR', $1, $2, $3, NULL, 0, $4, $5, 'NO', $6, $7, $8, NULL, $9)
        `;
        
        await client.query(insertMovibanQuery, [
            numeroMovimiento, fecha, concepto, total, codigo_banco, empresa, codigoGasto, proveedor, ccosto
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Gasto y movimiento bancario creados exitosamente',
            codigoGasto: codigoGasto,
            numeroMovimiento: numeroMovimiento
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/gastos/crear:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear gasto',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/gastos/reporte - Reporte de gastos (con todos los filtros)
app.get('/api/gastos/reporte', async (req, res) => {
    const { empresa, fechaInicial, fechaFinal, proveedor, cuentaBancaria, cuentaContable } = req.query;

    if (!empresa || !fechaInicial || !fechaFinal) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios' });
    }

    try {
        let query = `
            SELECT
                g.codigo,
                g.fecha,
                g.proveedor,
                COALESCE(p.nombre, g.proveedor) as proveedor_nombre,
                g.concepto,
                g.cuenta,
                COALESCE(cu.cuenta, g.cuenta) as cuenta_nombre,
                g.factura,
                g.subtotal,
                g.impuestos,
                g.total,
                g.ccosto,
                COALESCE(cc.nombre, g.ccosto) as ccosto_nombre,
                g.forma_pago,
                COALESCE(cb.nombre_cta, g.forma_pago) as forma_pago_nombre,
                g.estado
            FROM gastos g
            LEFT JOIN proveedores p ON g.proveedor = p.codigo AND g.empresa = p.empresa
            LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND g.empresa = cc.empresa
            LEFT JOIN cuentas_bancarias cb ON g.forma_pago = cb.codigo AND g.empresa = cb.empresa
            LEFT JOIN cuentas cu ON g.cuenta = cu.codigo AND g.empresa = cu.empresa
            WHERE g.empresa = $1
            AND g.fecha >= $2
            AND g.fecha <= $3
        `;

        const params = [empresa, fechaInicial, fechaFinal];
        let paramIndex = 4;

        if (proveedor) {
            query += ` AND g.proveedor = $${paramIndex}`;
            params.push(proveedor);
            paramIndex++;
        }

        if (cuentaBancaria) {
            query += ` AND g.forma_pago = $${paramIndex}`;
            params.push(cuentaBancaria);
            paramIndex++;
        }

        if (cuentaContable) {
            query += ` AND g.cuenta = $${paramIndex}`;
            params.push(cuentaContable);
            paramIndex++;
        }

        query += ' ORDER BY COALESCE(cu.cuenta, g.cuenta) ASC, g.fecha ASC';

        const result = await pool.query(query, params);

        res.json({ success: true, gastos: result.rows });

    } catch (error) {
        console.error('Error en /api/gastos/reporte:', error);
        res.json({ success: false, error: 'Error al obtener reporte', details: error.message });
    }
});

// ================================================================
// MÓDULO 7: ÓRDENES DE COMPRA Y RECEPCIÓN
// ================================================================

// GET /api/ordenes-compra/todas - Listar TODAS las órdenes (para PROVEEDOR)
app.get('/api/ordenes-compra/todas', async (req, res) => {
    const { estado } = req.query;
    
    try {
        let query = `
            SELECT oc.codigo, oc.fecha, oc.fecha_entrega, oc.fecha_vencimiento,
                   oc.cliente, oc.tipo_precio, oc.dias_credito, oc.estado,
                   oc.total, oc.observaciones, oc.empresa,
                   e.nombre as empresa_nombre,
                   ec.nombre as cliente_nombre,
                   COALESCE((SELECT COUNT(*) FROM soportes_entrega se WHERE se.orden = oc.codigo), 0) AS soportes_count
            FROM ordenes_compra oc
            LEFT JOIN empresas e ON oc.empresa::text = e.codigo::text
            LEFT JOIN empresas ec ON oc.cliente::text = ec.codigo::text
        `;
        
        const params = [];
        
        if (estado) {
            query += ` WHERE oc.estado = $1`;
            params.push(estado);
        }
        
        query += ` ORDER BY oc.fecha DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo todas las órdenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener órdenes de compra'
        });
    }
});


// GET /api/ordenes-compra/:codigo/detalle - Productos de una orden
app.get('/api/ordenes-compra/:codigo/detalle', async (req, res) => {
    const { codigo } = req.params;
    
    try {
        const query = `
            SELECT d.id, d.orden, d.producto_venta, d.cantidad,
                   d.precio_unitario, d.subtotal, d.empresa,
                   p.nombre as nombre_producto
            FROM detalle_ordenes d
            LEFT JOIN productos p ON d.producto_venta = p.codigo
            WHERE d.orden = $1
            ORDER BY d.id
        `;
        
        const result = await pool.query(query, [codigo]);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo productos de orden:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos de la orden'
        });
    }
});

// PUT /api/ordenes-compra/:codigo/procesar-recepcion - Procesar recepción
app.put('/api/ordenes-compra/:codigo/procesar-recepcion', async (req, res) => {
    const { codigo } = req.params;
    const { entrega_completa, fecha_entrega_real } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ordenQuery = await client.query(
            `SELECT oc.codigo, oc.estado, oc.observaciones, oc.dias_credito, oc.empresa
             FROM ordenes_compra oc
             WHERE oc.codigo = $1`,
            [codigo]
        );

        if (ordenQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Orden de compra no encontrada'
            });
        }

        const orden = ordenQuery.rows[0];

        if (entrega_completa) {
            const fechaEntrega = fecha_entrega_real || new Date().toISOString().split('T')[0];

            let observacionesLimpias = orden.observaciones || '';
            if (observacionesLimpias.startsWith('[ORDEN INCOMPLETA] ')) {
                observacionesLimpias = observacionesLimpias.replace('[ORDEN INCOMPLETA] ', '');
            }

            await client.query(
                `UPDATE ordenes_compra
                 SET estado = 'ENTREGADA',
                     fecha_entrega = $1,
                     fecha_vencimiento = $1::date + dias_credito,
                     observaciones = $2
                 WHERE codigo = $3`,
                [fechaEntrega, observacionesLimpias, codigo]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Orden marcada como ENTREGADA'
            });
            
        } else {
            const observacionesActuales = orden.observaciones || '';
            let nuevasObservaciones;
            
            if (observacionesActuales.startsWith('[ORDEN INCOMPLETA] ')) {
                nuevasObservaciones = observacionesActuales;
            } else {
                nuevasObservaciones = '[ORDEN INCOMPLETA] ' + observacionesActuales;
            }
            
            await client.query(
                `UPDATE ordenes_compra 
                 SET observaciones = $1
                 WHERE codigo = $2`,
                [nuevasObservaciones, codigo]
            );
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Orden marcada como INCOMPLETA, estado sigue PENDIENTE'
            });
        }
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error procesando recepción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la recepción: ' + error.message
        });
    } finally {
        client.release();
    }
});

// ================================================================
// PROVEEDURÍA: VÍNCULO ORDEN DE COMPRA ↔ ORDEN DE DESPACHO (VENTA)
// ================================================================

// Despacho de bodega vinculado a una orden de compra (tipo VENTA), si existe.
async function obtenerDespachoVentaOC(client, ocCodigo) {
    const r = await client.query(
        `SELECT id, estado FROM ordenes_despacho
         WHERE orden_compra = $1 AND estado <> 'CANCELADO'
         ORDER BY id DESC LIMIT 1`,
        [ocCodigo]
    );
    return r.rows[0] || null;
}

// Crea la orden de despacho tipo VENTA en Despachos de Bodega del proveedor.
// Sale de la bodega maestra; al confirmarse genera SALIDA POR VENTA (no traslado).
async function crearDespachoVentaOC(client, { codigo, empresaProveedor, fecha, clienteNombre, detalles }) {
    const bodRes = await client.query(
        `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`,
        [String(empresaProveedor)]
    );
    const bodega = bodRes.rows[0]?.bodega_maestra;
    if (!bodega) return null; // proveedor sin bodega maestra configurada

    const obs = `Orden de Compra ${codigo}${clienteNombre ? ' — ' + clienteNombre : ''}`;
    const r = await client.query(
        `INSERT INTO ordenes_despacho (empresa, fecha, cc_origen, cc_destino, observaciones, creado_por, tipo, orden_compra)
         VALUES ($1::integer, $2, $3, NULL, $4, 'SISTEMA', 'VENTA', $5) RETURNING id`,
        [empresaProveedor, fecha || new Date().toISOString().split('T')[0], bodega, obs, codigo]
    );
    const despachoId = r.rows[0].id;

    for (const d of detalles) {
        const cant = parseFloat(d.cantidad) || 0;
        if (cant <= 0) continue;
        await client.query(
            `INSERT INTO ordenes_despacho_detalle (orden_id, producto_codigo, cant_requerida)
             VALUES ($1, $2, $3)`,
            [despachoId, d.producto_venta, cant]
        );
    }

    // Notificar al personal de bodega (misma preferencia que despachos normales)
    try {
        const prefRes = await client.query(
            `SELECT usuarios_receptores FROM preferencias_notificaciones
             WHERE empresa = $1 AND tipo = 'DESPACHO_BODEGA' AND activa = 'SI'`,
            [empresaProveedor]
        );
        if (prefRes.rows.length > 0) {
            const usuarios = JSON.parse(prefRes.rows[0].usuarios_receptores || '[]');
            if (usuarios.length > 0) {
                const notifResult = await client.query(
                    `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, fecha_creacion)
                     VALUES ($1, $2, $3, 'DESPACHO_BODEGA', NOW()) RETURNING id`,
                    [empresaProveedor, 'Nuevo Despacho por Venta', `Despacho #${despachoId} — ${obs}`]
                );
                for (const usr of usuarios) {
                    await client.query(
                        `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                         VALUES ($1, $2, 'NO')`,
                        [notifResult.rows[0].id, usr]
                    ).catch(() => {});
                }
            }
        }
    } catch (notifError) {
        console.error('Error creando notificación de despacho por venta:', notifError);
    }

    return despachoId;
}

// DELETE /api/ordenes-compra/:codigo — eliminar orden (solo PENDIENTE, cliente)
// Elimina también la orden de despacho vinculada si la bodega aún no la procesó.
app.delete('/api/ordenes-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const r = await client.query(
            `SELECT estado FROM ordenes_compra WHERE codigo = $1 FOR UPDATE`, [codigo]
        );
        if (r.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }
        if (r.rows[0].estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: `Solo se pueden eliminar órdenes PENDIENTE. Estado actual: ${r.rows[0].estado}` });
        }

        const despacho = await obtenerDespachoVentaOC(client, codigo);
        if (despacho && despacho.estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'El almacén ya está procesando el despacho de esta orden. No se puede eliminar.' });
        }
        if (despacho) {
            await client.query(`DELETE FROM ordenes_despacho WHERE id = $1`, [despacho.id]);
        }

        await client.query(`DELETE FROM detalle_ordenes WHERE orden = $1`, [codigo]);
        await client.query(`DELETE FROM ordenes_compra WHERE codigo = $1`, [codigo]);

        await client.query('COMMIT');
        res.json({ success: true, message: `Orden ${codigo} eliminada` });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error eliminando orden de compra:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
});

// PUT /api/ordenes-compra/:codigo/marcar-entregada — cliente confirma recepción
// EN REPARTO → ENTREGADA (a partir de aquí el proveedor puede facturar)
app.put('/api/ordenes-compra/:codigo/marcar-entregada', async (req, res) => {
    const { codigo } = req.params;
    const { fecha_entrega_real } = req.body;
    try {
        const r = await pool.query(
            `SELECT estado, dias_credito FROM ordenes_compra WHERE codigo = $1`, [codigo]
        );
        if (r.rows.length === 0)
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        if (r.rows[0].estado !== 'EN REPARTO')
            return res.status(400).json({ success: false, error: `Solo se pueden marcar como entregadas las órdenes EN REPARTO. Estado actual: ${r.rows[0].estado}` });

        const fechaEntrega = fecha_entrega_real || new Date().toISOString().split('T')[0];
        await pool.query(
            `UPDATE ordenes_compra
             SET estado = 'ENTREGADA',
                 fecha_entrega = $1,
                 fecha_vencimiento = $1::date + dias_credito
             WHERE codigo = $2`,
            [fechaEntrega, codigo]
        );
        res.json({ success: true, message: `Orden ${codigo} marcada como ENTREGADA` });
    } catch (e) {
        console.error('Error marcando orden entregada:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ================================================================
// MÓDULO 5: ÓRDENES DE COMPRA
// ================================================================

// GET /api/productos-venta?control=SI - Obtener productos de venta
app.get('/api/productos-venta', async (req, res) => {
    const { control } = req.query;

    try {
        let query = `
            SELECT
                pv.codigo,
                pv.nombre,
                pv.descripcion,
                pv.unidad,
                pv.grupo,
                gpv.nombre as grupo_nombre,
                pv.precio_costo,
                pv.precio_venta1,
                pv.precio_venta2,
                pv.precio_venta3
            FROM productos_venta pv
            LEFT JOIN grupo_productos_venta gpv ON pv.grupo = gpv.codigo
        `;

        if (control) {
            query += ` WHERE UPPER(pv.control) = UPPER('${control}')`;
        }

        query += ` ORDER BY pv.grupo, pv.nombre`;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en /api/productos-venta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos de venta',
            details: error.message
        });
    }
});

// GET /api/config-listas-precios/:tipo - Obtener días de crédito por tipo de precio
app.get('/api/config-listas-precios/:tipo', async (req, res) => {
    const { tipo } = req.params;

    try {
        const query = `
            SELECT dias_credito
            FROM config_listas_precios
            WHERE UPPER(lista) = UPPER($1)
            AND UPPER(activo) = 'SI'
        `;

        const result = await pool.query(query, [tipo]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                dias_credito: 0
            });
        }

        res.json({
            success: true,
            dias_credito: result.rows[0].dias_credito
        });

    } catch (error) {
        console.error('Error en /api/config-listas-precios/:tipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración de lista de precios',
            details: error.message
        });
    }
});

// GET /api/ordenes-compra/entrega/pendientes - Obtener órdenes PENDIENTE de TODAS las empresas cliente (para personal de entregas)
app.get('/api/ordenes-compra/entrega/pendientes', async (req, res) => {
    try {
        const query = `
            SELECT
                codigo,
                fecha,
                fecha_entrega,
                cliente,
                tipo_precio,
                dias_credito,
                estado,
                total,
                observaciones,
                empresa
            FROM ordenes_compra
            WHERE estado = 'PENDIENTE'
            ORDER BY fecha DESC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en /api/ordenes-compra/entrega/pendientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener órdenes',
            details: error.message
        });
    }
});

// GET /api/ordenes-compra/mis-ordenes?cliente=X — DEBE ir ANTES de /:codigo para no ser capturado como wildcard
app.get('/api/ordenes-compra/mis-ordenes', async (req, res) => {
    const { cliente } = req.query;
    if (!cliente) return res.status(400).json({ success: false, error: 'cliente es requerido' });
    try {
        const r = await pool.query(`
            SELECT oc.codigo, oc.fecha, oc.fecha_entrega, oc.tipo_precio,
                   oc.dias_credito, oc.estado, oc.total, oc.observaciones,
                   oc.empresa, e.nombre AS proveedor_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas e ON CAST(e.codigo AS TEXT) = CAST(oc.empresa AS TEXT)
            WHERE CAST(oc.cliente AS TEXT) = $1
            ORDER BY oc.fecha DESC
        `, [String(cliente)]);
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/ordenes-compra/mis-ordenes:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/ordenes-compra - Obtener órdenes de compra con filtros
app.get('/api/ordenes-compra', async (req, res) => {
    const { empresa, fechaDesde, fechaHasta, estado } = req.query;

    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }

    try {
        let query = `
            SELECT
                codigo,
                fecha,
                fecha_entrega,
                cliente,
                tipo_precio,
                dias_credito,
                estado,
                total,
                observaciones,
                empresa
            FROM ordenes_compra
            WHERE empresa = $1
        `;

        const params = [empresa];
        let paramCount = 1;

        if (fechaDesde) {
            paramCount++;
            query += ` AND fecha >= $${paramCount}`;
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            paramCount++;
            query += ` AND fecha <= $${paramCount}`;
            params.push(fechaHasta);
        }

        if (estado) {
            paramCount++;
            query += ` AND UPPER(estado) = UPPER($${paramCount})`;
            params.push(estado);
        }

        query += ` ORDER BY fecha DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en /api/ordenes-compra:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener órdenes de compra',
            details: error.message
        });
    }
});

// GET /api/ordenes-compra/:codigo - Obtener orden específica
app.get('/api/ordenes-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;

    console.log('GET /api/ordenes-compra - Buscando código:', codigo);

    try {
        const query = `
            SELECT
                codigo,
                fecha,
                fecha_entrega,
                cliente,
                tipo_precio,
                dias_credito,
                estado,
                total,
                observaciones,
                empresa
            FROM ordenes_compra
            WHERE codigo = $1
        `;

        const result = await pool.query(query, [codigo]);

        console.log('Resultado de query:', result.rows.length, 'filas encontradas');

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Orden ${codigo} no encontrada`
            });
        }

        res.json({
            success: true,
            orden: result.rows[0]
        });

    } catch (error) {
        console.error('Error en /api/ordenes-compra/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener orden',
            details: error.message
        });
    }
});

// GET /api/ordenes-compra/:codigo/detalles - Obtener detalles de orden con info de empresas
app.get('/api/ordenes-compra/:codigo/detalles', async (req, res) => {
    const { codigo } = req.params;

    try {
        const ordenQuery = `
            SELECT
                codigo,
                fecha,
                fecha_entrega,
                cliente,
                tipo_precio,
                dias_credito,
                estado,
                total,
                observaciones,
                empresa
            FROM ordenes_compra
            WHERE codigo = $1
        `;

        const detallesQuery = `
            SELECT
                d.id,
                d.orden,
                d.producto_venta,
                d.producto_venta as codigo,
                d.cantidad,
                d.precio_unitario,
                d.subtotal,
                d.empresa,
                p.nombre as producto_nombre,
                p.codigo as producto_codigo,
                p.descripcion as producto_descripcion,
                p.grupo,
                g.nombre AS grupo_nombre
            FROM detalle_ordenes d
            LEFT JOIN productos p ON d.producto_venta = p.codigo
            LEFT JOIN grupo_productos g ON g.codigo = p.grupo
            WHERE d.orden = $1
            ORDER BY g.nombre, p.nombre
        `;

        const ordenResult = await pool.query(ordenQuery, [codigo]);
        const detallesResult = await pool.query(detallesQuery, [codigo]);

        if (ordenResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada'
            });
        }

        const orden = ordenResult.rows[0];

        // Obtener datos de la empresa PROVEEDOR (vendedor)
        const proveedorResult = await pool.query(
            `SELECT codigo, nombre, direccion, telefono FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`
        );
        const proveedor = proveedorResult.rows[0] || {};
        if (proveedor.codigo) {
            proveedor.logo_url = `/api/empresa/logo?empresa=${proveedor.codigo}`;
        }

        // Obtener datos de la empresa CLIENTE (quien hace la orden - envía a)
        const clienteResult = await pool.query(
            `SELECT codigo, nombre, direccion, telefono FROM empresas WHERE codigo = $1`,
            [orden.cliente]
        );

        res.json({
            success: true,
            orden: orden,
            detalles: detallesResult.rows,
            proveedor: proveedor,
            cliente: clienteResult.rows[0] || {}
        });

    } catch (error) {
        console.error('Error en /api/ordenes-compra/:codigo/detalles:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalles',
            details: error.message
        });
    }
});

// PUT /api/ordenes-compra/:codigo - Actualizar orden (solo si estado=PENDIENTE)
app.put('/api/ordenes-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { fecha_entrega, estado, observaciones, detalles, total } = req.body;

    console.log(`PUT /api/ordenes-compra/${codigo}`, {
        fecha_entrega,
        estado,
        observaciones,
        detalles,
        total
    });

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que la orden existe y está en estado PENDIENTE
        const checkQuery = `
            SELECT estado, cliente
            FROM ordenes_compra
            WHERE codigo = $1
        `;

        const checkResult = await client.query(checkQuery, [codigo]);

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada'
            });
        }

        if (checkResult.rows[0].estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: `No se puede editar una orden con estado ${checkResult.rows[0].estado}. Solo se pueden editar órdenes PENDIENTE.`
            });
        }

        // Si la bodega ya está procesando el despacho vinculado, no permitir cambios
        const despachoVinculado = await obtenerDespachoVentaOC(client, codigo);
        if (despachoVinculado && despachoVinculado.estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'El almacén ya está procesando el despacho de esta orden. No se puede modificar.'
            });
        }

        const ordenCliente = checkResult.rows[0].cliente;

        // Actualizar la orden (preservar estado si no se envía)
        const updateQuery = `
            UPDATE ordenes_compra
            SET fecha_entrega = $1, estado = COALESCE($2, estado), observaciones = $3, total = $4
            WHERE codigo = $5
            RETURNING codigo
        `;

        await client.query(updateQuery, [
            fecha_entrega || null,
            estado || null,
            observaciones || '',
            total || 0,
            codigo
        ]);

        // Si hay detalles, actualizar la tabla detalle_ordenes
        if (detalles && detalles.length > 0) {
            console.log(`Eliminando detalles viejos para orden: ${codigo}`);
            // Eliminar detalles viejos
            await client.query(`DELETE FROM detalle_ordenes WHERE orden = $1`, [codigo]);

            // Insertar nuevos detalles
            console.log(`Insertando ${detalles.length} nuevos detalles`);
            for (const detalle of detalles) {
                console.log(`Insertando detalle:`, detalle);

                const subtotal = detalle.cantidad * detalle.precio_unitario;
                try {
                    await client.query(
                        `INSERT INTO detalle_ordenes (orden, producto_venta, cantidad, precio_unitario, subtotal, empresa)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [codigo, detalle.producto_venta, detalle.cantidad, detalle.precio_unitario, subtotal, ordenCliente]
                    );
                } catch (fkErr) {
                    throw new Error(`FK error en producto "${detalle.producto_venta}": ${fkErr.message}`);
                }
            }
            console.log(`Detalles insertados correctamente`);
        }

        // Sincronizar la orden de despacho vinculada (aún PENDIENTE en bodega)
        if (despachoVinculado && detalles && detalles.length > 0) {
            await client.query(
                `UPDATE ordenes_despacho SET fecha = COALESCE($1, fecha) WHERE id = $2`,
                [fecha_entrega || null, despachoVinculado.id]
            );
            await client.query(`DELETE FROM ordenes_despacho_detalle WHERE orden_id = $1`, [despachoVinculado.id]);
            for (const detalle of detalles) {
                const cant = parseFloat(detalle.cantidad) || 0;
                if (cant <= 0) continue;
                await client.query(
                    `INSERT INTO ordenes_despacho_detalle (orden_id, producto_codigo, cant_requerida)
                     VALUES ($1, $2, $3)`,
                    [despachoVinculado.id, detalle.producto_venta, cant]
                );
            }
        }

        await client.query('COMMIT');

        // Crear notificación para el proveedor
        await crearNotificacionOrdenCompra(codigo, ordenCliente, 'modificada');

        res.json({
            success: true,
            codigo: codigo,
            message: 'Orden actualizada correctamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en PUT /api/ordenes-compra/:codigo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar orden',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// PUT /api/ordenes-compra/:codigo/ajustar-entrega — ajustar cantidades reales entregadas (solo PROVEEDOR, orden ENTREGADA)
app.put('/api/ordenes-compra/:codigo/ajustar-entrega', async (req, res) => {
    const { codigo } = req.params;
    const { fecha_entrega, detalles } = req.body;
    const empresaActiva = req.headers['x-empresa'];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const ordenRes = await client.query(
            `SELECT oc.estado, oc.empresa FROM ordenes_compra oc WHERE oc.codigo = $1`,
            [codigo]
        );
        if (ordenRes.rows.length === 0) throw new Error('Orden no encontrada');
        if (ordenRes.rows[0].estado !== 'ENTREGADA') throw new Error('Solo se pueden ajustar órdenes ENTREGADA');

        const nuevoTotal = detalles.reduce((s, d) => s + (parseFloat(d.cantidad_entregada) * parseFloat(d.precio_unitario)), 0);

        // Actualizar cantidades en detalle_ordenes
        for (const d of detalles) {
            await client.query(
                `UPDATE detalle_ordenes SET cantidad = $1, subtotal = $2 WHERE orden = $3 AND producto_venta = $4`,
                [d.cantidad_entregada, d.cantidad_entregada * d.precio_unitario, codigo, d.producto_venta]
            );
        }

        // Actualizar total de la orden y fecha_entrega
        await client.query(
            `UPDATE ordenes_compra SET total = $1, fecha_entrega = $2 WHERE codigo = $3`,
            [nuevoTotal, fecha_entrega, codigo]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: 'Cantidades ajustadas correctamente' });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error ajustar-entrega:', e);
        res.status(500).json({ success: false, error: 'Error al ajustar entrega', details: e.message });
    } finally { client.release(); }
});

// POST /api/ordenes-compra/crear - Crear orden de compra con detalles
// GET /api/empresas/proveedor — empresa tipo PROVEEDOR (para que el cliente la identifique)
app.get('/api/empresas/proveedor', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT codigo, nombre, tipo_empresa FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`
        );
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'No hay empresa proveedor registrada' });
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


app.post('/api/ordenes-compra/crear', async (req, res) => {
    const { empresa, cliente, tipo_precio, fecha_entrega, dias_credito, observaciones, detalles, total } = req.body;

    if (!empresa || !tipo_precio || !detalles || detalles.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros obligatorios'
        });
    }
    // cliente = quien hace el pedido (puede ser diferente a empresa/proveedor)
    const clienteId = cliente || empresa;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Mapear tipo_precio a formato PRECIO1, PRECIO2, PRECIO3
        const tipoPrecioMapeado = tipo_precio === 'precio_venta1' ? 'PRECIO1' :
                                  tipo_precio === 'precio_venta2' ? 'PRECIO2' : 'PRECIO3';

        // Consecutivo basado en el CLIENTE (empresa activa que hace el pedido)
        const codigoResult = await client.query(`
            SELECT COALESCE(MAX(
                CAST(SPLIT_PART(codigo, '-', 3) AS INTEGER)
            ), 0) + 1 AS numero_orden
            FROM ordenes_compra
            WHERE CAST(cliente AS TEXT) = $1
              AND codigo LIKE 'OC-%'
        `, [String(clienteId)]);

        const numeroOrden = String(codigoResult.rows[0].numero_orden).padStart(5, '0');
        const codigoOrden = `OC-${clienteId}-${numeroOrden}`;

        // Insertar orden de compra
        const fechaHoy = new Date().toISOString().split('T')[0];
        const insertOrdenQuery = `
            INSERT INTO ordenes_compra
            (codigo, fecha, fecha_entrega, cliente, tipo_precio, dias_credito, estado, total, observaciones, empresa)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, $8, $9)
            RETURNING codigo
        `;

        const ordenResult = await client.query(insertOrdenQuery, [
            codigoOrden,
            fechaHoy,
            fecha_entrega || null,
            clienteId,
            tipoPrecioMapeado,
            dias_credito || 0,
            total,
            observaciones || '',
            empresa
        ]);

        const codigoOrdenGuardado = ordenResult.rows[0].codigo;

        // Obtener tipo_empresa para validar permisos de productos
        const empresaTypeResult = await client.query(
            `SELECT tipo_empresa FROM empresas WHERE codigo = $1`,
            [empresa]
        );
        const esClienteFranquiciado = empresaTypeResult.rows.length > 0 &&
                                       empresaTypeResult.rows[0].tipo_empresa === 'CLIENTE';

        // Insertar detalles de la orden (solo con cantidad > 0)
        let detallesCreados = 0;
        for (const detalle of detalles) {
            const cantidad = parseFloat(detalle.cantidad) || 0;

            // Solo guardar si cantidad es diferente a 0, null o blanco
            if (cantidad > 0) {
                // Si es cliente franquiciado, validar que el producto sea para venta
                if (esClienteFranquiciado) {
                    const productoCheck = await client.query(
                        `SELECT codigo, para_venta FROM productos WHERE codigo = $1`,
                        [detalle.producto_venta]
                    );

                    if (productoCheck.rows.length === 0) {
                        throw new Error(`Producto ${detalle.producto_venta} no existe`);
                    }

                    if (productoCheck.rows[0].para_venta !== 'SI') {
                        throw new Error(`Producto ${detalle.producto_venta} no está disponible para franquiciados`);
                    }
                }

                const insertDetalleQuery = `
                    INSERT INTO detalle_ordenes
                    (orden, producto_venta, cantidad, precio_unitario, subtotal, empresa)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;

                await client.query(insertDetalleQuery, [
                    codigoOrdenGuardado,
                    detalle.producto_venta,
                    cantidad,
                    detalle.precio_unitario,
                    detalle.subtotal,
                    empresa
                ]);

                detallesCreados++;
            }
        }

        if (detallesCreados === 0) {
            throw new Error('No hay productos con cantidad válida para guardar');
        }

        // Crear orden de despacho tipo VENTA en Despachos de Bodega del proveedor
        const provRes = await client.query(
            `SELECT codigo FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`
        );
        const empresaProveedor = provRes.rows[0]?.codigo;
        if (empresaProveedor) {
            const cliNomRes = await client.query(
                `SELECT nombre FROM empresas WHERE codigo::text = $1`, [String(clienteId)]
            );
            await crearDespachoVentaOC(client, {
                codigo: codigoOrdenGuardado,
                empresaProveedor,
                fecha: fecha_entrega || null,
                clienteNombre: cliNomRes.rows[0]?.nombre || '',
                detalles: detalles.map(d => ({ producto_venta: d.producto_venta, cantidad: d.cantidad })),
            });
        }

        await client.query('COMMIT');

        // Crear notificación para el proveedor
        await crearNotificacionOrdenCompra(codigoOrdenGuardado, clienteId, 'creada');

        res.json({
            success: true,
            codigo: codigoOrdenGuardado,
            detalles_creados: detallesCreados,
            message: `Orden de compra ${codigoOrdenGuardado} creada exitosamente`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/ordenes-compra/crear:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear orden de compra',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// POST /api/ordenes-compra/:codigo/generar-factura - Generar factura_venta desde orden ENTREGADA
app.post('/api/ordenes-compra/:codigo/generar-factura', async (req, res) => {
    const { codigo } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener la orden
        const ordenRes = await client.query(
            `SELECT oc.codigo, oc.fecha, oc.empresa, oc.cliente, oc.estado,
                    oc.total, oc.observaciones, oc.dias_credito, oc.fecha_vencimiento
             FROM ordenes_compra oc
             WHERE oc.codigo = $1`,
            [codigo]
        );

        if (ordenRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }

        const orden = ordenRes.rows[0];

        if (orden.estado !== 'ENTREGADA') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: `Solo se puede facturar una orden ENTREGADA. Estado actual: ${orden.estado}` });
        }

        // 1b. Debe tener al menos un soporte de entrega
        const soporteRes = await client.query(
            `SELECT COUNT(*)::int AS n FROM soportes_entrega WHERE orden = $1`, [codigo]
        );
        if (soporteRes.rows[0].n === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'La orden debe tener al menos un soporte de entrega para generar la factura' });
        }

        // 2. Verificar que no exista ya una factura para esta orden
        const factExiste = await client.query(
            `SELECT codigo FROM factura_venta WHERE orden_compra = $1`,
            [codigo]
        );
        if (factExiste.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: `Ya existe la factura ${factExiste.rows[0].codigo} para esta orden` });
        }

        // 3. Obtener detalles de la orden
        const detallesRes = await client.query(
            `SELECT d.producto_venta, d.cantidad, d.precio_unitario, d.subtotal,
                    p.nombre as producto_nombre, p.grupo, g.nombre AS grupo_nombre
             FROM detalle_ordenes d
             LEFT JOIN productos p ON d.producto_venta = p.codigo
             LEFT JOIN grupo_productos g ON g.codigo = p.grupo
             WHERE d.orden = $1
             ORDER BY g.nombre, p.nombre`,
            [codigo]
        );

        if (detallesRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'La orden no tiene productos' });
        }

        // 4. Generar código de factura (mismo formato que facturas existentes: 10 dígitos numéricos)
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(codigo AS BIGINT)), 0) + 1 AS num
             FROM factura_venta
             WHERE codigo ~ '^[0-9]+$'`
        );
        const codigoFactura = String(numRes.rows[0].num).padStart(10, '0');

        // 5. Calcular subtotal e impuestos (0% impuestos por defecto)
        const subtotal = parseFloat(orden.total) || 0;
        const impuestos = 0;
        const total = subtotal;

        // 6. Fecha vencimiento = hoy + dias_credito
        const fechaHoy = new Date().toISOString().split('T')[0];
        const diasCredito = parseInt(orden.dias_credito) || 0;
        let fechaVencimiento = orden.fecha_vencimiento;
        if (!fechaVencimiento) {
            const d = new Date();
            d.setDate(d.getDate() + diasCredito);
            fechaVencimiento = d.toISOString().split('T')[0];
        }

        // 7. Insertar factura_venta (con el centro de costo de proveeduría configurado)
        const cfgProvRes = await client.query(
            `SELECT ccosto_proveeduria FROM config_general WHERE empresa::text = $1`,
            [String(orden.empresa)]
        );
        const ccostoProveeduria = cfgProvRes.rows[0]?.ccosto_proveeduria || null;

        await client.query(
            `INSERT INTO factura_venta
             (codigo, fecha, cliente, orden_compra, subtotal, impuestos, total, estado, observaciones, fecha_vencimiento, valor_pagado, ccosto)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', $8, $9, 0, $10)`,
            [codigoFactura, fechaHoy, orden.cliente, codigo, subtotal, impuestos, total,
             orden.observaciones || '', fechaVencimiento, ccostoProveeduria]
        );

        // 8. Insertar detalle_factura_venta
        for (const det of detallesRes.rows) {
            await client.query(
                `INSERT INTO detalle_factura_venta (factura, producto_venta, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [codigoFactura, det.producto_venta, det.cantidad, det.precio_unitario, det.subtotal]
            );
        }

        // 9. Marcar orden como FACTURADA
        await client.query(
            `UPDATE ordenes_compra SET estado = 'FACTURADA' WHERE codigo = $1`,
            [codigo]
        );

        // 10. Descargar del inventario (bodega maestra) con las cantidades reales de la orden
        //     SOLO si la orden NO tiene un despacho de bodega COMPLETADO (flujo nuevo:
        //     la SALIDA POR VENTA ya se hizo al confirmar el despacho — evitar doble descargue)
        const despachosCheck = await client.query(
            `SELECT COUNT(*)::int AS n FROM ordenes_despacho
             WHERE orden_compra = $1 AND estado = 'COMPLETADO'`, [codigo]
        );
        const tieneDespachos = despachosCheck.rows[0].n > 0;

        const empresaActivaFact = req.headers['x-empresa'] || String(orden.empresa);
        const empResFact = await client.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`,
            [String(empresaActivaFact)]
        );
        const bodegaMaestraFact = empResFact.rows[0]?.bodega_maestra;
        const fechaDescarga = new Date().toISOString().split('T')[0];

        if (bodegaMaestraFact && !tieneDespachos) {
            for (const det of detallesRes.rows) {
                if (parseFloat(det.cantidad) > 0) {
                    await client.query(
                        `INSERT INTO detalle_inventario (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                         VALUES ($1, $2, $3, 0, $4, 'SALIDA', $5, $6)`,
                        [fechaDescarga, bodegaMaestraFact, det.producto_venta, det.cantidad, String(empresaActivaFact), `SALIDA POR VENTA ${codigo}`]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            factura: codigoFactura,
            message: `Factura ${codigoFactura} generada exitosamente`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generando factura:', error);
        res.status(500).json({ success: false, error: 'Error al generar factura', details: error.message });
    } finally {
        client.release();
    }
});

// ================================================================
// MÓDULO 8: SOPORTES DE ENTREGA
// ================================================================

// POST /api/soportes-entrega/subir - Subir comprobante de entrega
app.post('/api/soportes-entrega/subir', async (req, res) => {
    const { orden, imagen_base64, nombre_archivo, empresa } = req.body;

    if (!orden || !imagen_base64) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros: orden e imagen_base64'
        });
    }

    try {
        // Decodificar base64 a Buffer
        let archivoBuffer;
        try {
            archivoBuffer = Buffer.from(imagen_base64, 'base64');
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'El base64 proporcionado no es válido'
            });
        }

        const insertQuery = `
            INSERT INTO soportes_entrega (orden, archivo_data, nombre_archivo, fecha_subida, empresa)
            VALUES ($1, $2, $3, NOW(), $4)
            RETURNING id
        `;

        const result = await pool.query(insertQuery, [
            orden,
            archivoBuffer,
            nombre_archivo || `comprobante_${orden}_${Date.now()}.png`,
            empresa
        ]);

        res.json({
            success: true,
            id: result.rows[0].id,
            message: 'Comprobante de entrega guardado correctamente'
        });
    } catch (error) {
        console.error('Error en /api/soportes-entrega/subir:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar comprobante de entrega',
            details: error.message
        });
    }
});

// GET /api/soportes-entrega/:orden - Obtener TODOS los comprobantes de entrega para una orden
app.get('/api/soportes-entrega/:orden', async (req, res) => {
    const { orden } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, orden, nombre_archivo, tipo_archivo, archivo_data, fecha_subida, empresa, numero_soporte
             FROM soportes_entrega
             WHERE orden = $1
             ORDER BY COALESCE(numero_soporte, id) ASC`,
            [orden]
        );

        // Sin soportes → devolver array vacío (no 404)
        if (result.rows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Convertir archivo_data a base64 con MIME type correcto
        const soportes = result.rows.map(soporte => {
            if (soporte.archivo_data) {
                const mime = soporte.tipo_archivo || detectMime(soporte.nombre_archivo);
                const base64Data = Buffer.from(soporte.archivo_data).toString('base64');
                soporte.archivo_data = `data:${mime};base64,` + base64Data;
            }
            return soporte;
        });

        res.json({ success: true, data: soportes });
    } catch (error) {
        console.error('Error en /api/soportes-entrega/:orden:', error);
        res.status(500).json({ success: false, error: 'Error al obtener comprobantes de entrega', details: error.message });
    }
});

function detectMime(nombre) {
    if (!nombre) return 'image/jpeg';
    const ext = nombre.split('.').pop().toLowerCase();
    const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf' };
    return map[ext] || 'image/jpeg';
}

// ================================================================
// MÓDULO 9: CONTABILIDAD - PROVEEDORES (NUEVO)
// ================================================================

// GET /api/contabilidad/proveedores - Listar proveedores con filtros
app.get('/api/contabilidad/proveedores', async (req, res) => {
    try {
        const {
            empresa,
            page = 1,
            limit = 20,
            search = '',
            sortBy = 'nombre',
            sortOrder = 'asc'
        } = req.query;

        console.log('📋 GET /api/contabilidad/proveedores - Params:', { empresa, page, limit, search, sortBy, sortOrder });

        if (!empresa) {
            console.log('⚠️  Parámetro "empresa" no proporcionado');
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        // Campos permitidos para ordenamiento
        const camposPermitidos = ['codigo', 'nombre', 'direccion', 'telefono1', 'departamen'];
        const sortByLimpio = camposPermitidos.includes(sortBy) ? sortBy : 'nombre';
        const sortOrderLimpio = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        let whereClause = 'WHERE empresa = $1';
        let queryParams = [empresa];
        let paramIndex = 2;

        if (search && search.trim()) {
            whereClause += ` AND (
                UPPER(codigo) LIKE UPPER($${paramIndex}) OR
                UPPER(nombre) LIKE UPPER($${paramIndex + 1}) OR
                UPPER(direccion) LIKE UPPER($${paramIndex + 2})
            )`;
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam);
            paramIndex += 3;
        }

        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM proveedores ${whereClause}`;
        console.log('📊 Count Query:', countQuery, 'Params:', queryParams.slice(0, search ? paramIndex : 1));

        const countResult = await pool.query(countQuery, queryParams.slice(0, search ? paramIndex : 1));
        const total = parseInt(countResult.rows[0].total);

        // Calcular offset
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Query principal
        const query = `
            SELECT
                codigo, nombre, direccion, telefono1, departamen, empresa
            FROM proveedores
            ${whereClause}
            ORDER BY ${sortByLimpio} ${sortOrderLimpio}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);

        console.log('📝 Main Query:', query);
        console.log('📌 Query Params:', queryParams);

        const result = await pool.query(query, queryParams);

        console.log('✅ Found', result.rows.length, 'proveedores out of', total);

        res.json({
            success: true,
            data: result.rows,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        console.error('❌ Error en GET /api/contabilidad/proveedores:', error.message);
        console.error('📋 Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proveedores',
            details: error.message
        });
    }
});

// Códigos de proveedor: arrancan en 1000000000 y avanzan de uno en uno hasta
// encontrar el primer valor libre. No se calcula como "máximo + 1" porque hay
// códigos heredados fuera de rango (2147483647, el tope de un entero de 32 bits)
// que empujaban el siguiente código a valores imposibles y terminaban repitiendo
// el mismo en proveedores distintos — lo que duplica las filas de gastos y
// movimientos bancarios, que resuelven el nombre del proveedor por JOIN.
const PROVEEDOR_CODIGO_BASE = 1000000000;

async function proximoCodigoProveedor(empresa) {
    const r = await pool.query(
        `SELECT TRIM(codigo) AS codigo FROM proveedores WHERE empresa = $1`,
        [empresa]
    );
    const usados = new Set(r.rows.map(x => x.codigo));
    let n = PROVEEDOR_CODIGO_BASE;
    while (usados.has(String(n))) n++;
    return String(n);
}

// GET /api/contabilidad/proveedores/proximo-codigo
app.get('/api/contabilidad/proveedores/proximo-codigo', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
        res.json({ success: true, codigo: await proximoCodigoProveedor(empresa) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/proveedores/duplicados
// Diagnóstico: códigos compartidos por más de un proveedor, con el número real de
// referencias que tiene ese código en el resto del sistema. Un código repetido hace
// que gastos y movimientos bancarios muestren la misma fila varias veces (una por
// cada proveedor que comparte el código), porque ambos resuelven el nombre por JOIN.
app.get('/api/contabilidad/proveedores/duplicados', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const dupRes = await pool.query(
            `SELECT TRIM(codigo) AS codigo, COUNT(*)::int AS cuantos,
                    ARRAY_AGG(nombre ORDER BY nombre) AS nombres
             FROM proveedores
             WHERE empresa = $1
             GROUP BY TRIM(codigo)
             HAVING COUNT(*) > 1
             ORDER BY TRIM(codigo)`,
            [empresa]
        );

        const data = [];
        for (const row of dupRes.rows) {
            const [gas, mov, ea] = await Promise.all([
                pool.query(`SELECT COUNT(*)::int AS n FROM gastos          WHERE empresa = $1 AND TRIM(proveedor) = $2`, [empresa, row.codigo]),
                pool.query(`SELECT COUNT(*)::int AS n FROM moviban         WHERE empresa::text = $1::text AND TRIM(beneficia) = $2`, [empresa, row.codigo]),
                pool.query(`SELECT COUNT(*)::int AS n FROM entrada_almacen WHERE empresa::text = $1::text AND TRIM(proveedor) = $2`, [empresa, row.codigo]),
            ]);
            data.push({
                codigo: row.codigo,
                cuantos: row.cuantos,
                nombres: row.nombres,
                referencias: { gastos: gas.rows[0].n, moviban: mov.rows[0].n, entrada_almacen: ea.rows[0].n },
                total_referencias: gas.rows[0].n + mov.rows[0].n + ea.rows[0].n,
            });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error GET /api/contabilidad/proveedores/duplicados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/proveedores/depurar-duplicados
// Body: { empresa, acciones: [{ codigo, conservar }] }
//   conservar = nombre exacto del proveedor que se queda con ese código.
//               Si va null, se elimina el grupo completo (sirve para códigos
//               basura heredados que ningún gasto referencia).
//
// Eliminar duplicados de un código NO rompe referencias mientras quede al menos
// un proveedor con ese código: gastos y moviban apuntan al código, no a la fila.
// Por eso, si `conservar` viene null, se exige que el código no tenga ninguna
// referencia — de lo contrario esos registros quedarían sin nombre que mostrar.
app.post('/api/contabilidad/proveedores/depurar-duplicados', async (req, res) => {
    const { empresa, acciones } = req.body;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    if (!Array.isArray(acciones) || !acciones.length) {
        return res.status(400).json({ success: false, error: 'acciones es requerido' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = [];

        for (const acc of acciones) {
            const codigo = String(acc.codigo || '').trim();
            if (!codigo) continue;

            const existentes = await client.query(
                `SELECT nombre FROM proveedores WHERE empresa = $1 AND TRIM(codigo) = $2`,
                [empresa, codigo]
            );
            if (existentes.rowCount === 0) {
                resultado.push({ codigo, estado: 'no encontrado' });
                continue;
            }

            if (acc.conservar) {
                const conservar = String(acc.conservar).trim();
                if (!existentes.rows.some(r => (r.nombre || '').trim() === conservar)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: `"${conservar}" no existe entre los proveedores del código ${codigo}`
                    });
                }
                const del = await client.query(
                    `DELETE FROM proveedores
                      WHERE empresa = $1 AND TRIM(codigo) = $2 AND TRIM(nombre) <> $3`,
                    [empresa, codigo, conservar]
                );
                resultado.push({ codigo, conservado: conservar, eliminados: del.rowCount });
            } else {
                // Sin `conservar`: se borra el grupo entero, solo si nada lo referencia
                const [gas, mov, ea] = await Promise.all([
                    client.query(`SELECT COUNT(*)::int AS n FROM gastos          WHERE empresa = $1 AND TRIM(proveedor) = $2`, [empresa, codigo]),
                    client.query(`SELECT COUNT(*)::int AS n FROM moviban         WHERE empresa::text = $1::text AND TRIM(beneficia) = $2`, [empresa, codigo]),
                    client.query(`SELECT COUNT(*)::int AS n FROM entrada_almacen WHERE empresa::text = $1::text AND TRIM(proveedor) = $2`, [empresa, codigo]),
                ]);
                const refs = gas.rows[0].n + mov.rows[0].n + ea.rows[0].n;
                if (refs > 0) {
                    await client.query('ROLLBACK');
                    return res.status(409).json({
                        success: false,
                        error: `El código ${codigo} tiene ${refs} referencia(s) en uso; indica cuál proveedor conservar en vez de eliminarlo`
                    });
                }
                const del = await client.query(
                    `DELETE FROM proveedores WHERE empresa = $1 AND TRIM(codigo) = $2`,
                    [empresa, codigo]
                );
                resultado.push({ codigo, conservado: null, eliminados: del.rowCount });
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, resultado });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/proveedores/depurar-duplicados:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/contabilidad/proveedores/reasignar-duplicados
// Para códigos compartidos que tienen referencias (no se pueden eliminar): mantiene
// el proveedor indicado en `conservar` con el código original y asigna códigos nuevos
// (secuenciales desde PROVEEDOR_CODIGO_BASE) al resto.
// Body: { empresa, acciones: [{ codigo, conservar }] }
//   conservar = nombre exacto del proveedor que QUEDA con el código original.
//              Si se omite, queda el primero en orden alfabético.
app.post('/api/contabilidad/proveedores/reasignar-duplicados', async (req, res) => {
    const { empresa, acciones } = req.body;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    if (!Array.isArray(acciones) || !acciones.length) {
        return res.status(400).json({ success: false, error: 'acciones es requerido' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener todos los códigos ya usados para generar nuevos sin colisiones
        const todosR = await client.query(
            `SELECT TRIM(codigo) AS codigo FROM proveedores WHERE empresa = $1`,
            [empresa]
        );
        const usados = new Set(todosR.rows.map(x => x.codigo));

        function siguienteCodigo() {
            let n = PROVEEDOR_CODIGO_BASE;
            while (usados.has(String(n))) n++;
            usados.add(String(n));
            return String(n);
        }

        const resultado = [];

        for (const acc of acciones) {
            const codigo = String(acc.codigo || '').trim();
            if (!codigo) continue;

            const existentes = await client.query(
                `SELECT nombre FROM proveedores WHERE empresa = $1 AND TRIM(codigo) = $2 ORDER BY nombre`,
                [empresa, codigo]
            );
            if (existentes.rowCount <= 1) {
                resultado.push({ codigo, estado: existentes.rowCount === 0 ? 'no encontrado' : 'sin duplicados' });
                continue;
            }

            const conservar = acc.conservar ? String(acc.conservar).trim() : existentes.rows[0].nombre.trim();
            if (!existentes.rows.some(r => (r.nombre || '').trim() === conservar)) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: `"${conservar}" no existe entre los proveedores del código ${codigo}`
                });
            }

            const reasignados = [];
            for (const row of existentes.rows) {
                const nombre = (row.nombre || '').trim();
                if (nombre === conservar) continue;
                const nuevoCodigo = siguienteCodigo();
                await client.query(
                    `UPDATE proveedores SET codigo = $1 WHERE empresa = $2 AND TRIM(codigo) = $3 AND TRIM(nombre) = $4`,
                    [nuevoCodigo, empresa, codigo, nombre]
                );
                reasignados.push({ nombre, codigo_nuevo: nuevoCodigo });
            }
            resultado.push({ codigo_original: codigo, conservado: conservar, reasignados });
        }

        await client.query('COMMIT');
        res.json({ success: true, resultado });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/proveedores/reasignar-duplicados:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/contabilidad/proveedores - Crear proveedor
app.post('/api/contabilidad/proveedores', async (req, res) => {
    try {
        const { codigo, nombre, direccion, telefono1, departamen, empresa } = req.body;

        if (!nombre || !empresa) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: nombre, empresa'
            });
        }

        // El código identifica al proveedor en gastos y movimientos bancarios, que
        // lo resuelven con un JOIN. Dos proveedores con el mismo código hacen que
        // ese JOIN devuelva una fila por cada uno, y el gasto aparece duplicado en
        // pantalla (con distinto nombre) aunque en la base haya un solo registro.
        const cod = (codigo || '').toString().trim();
        if (!cod) {
            return res.status(400).json({ success: false, error: 'El código es requerido' });
        }
        const dup = await pool.query(
            `SELECT nombre FROM proveedores WHERE TRIM(codigo) = $1 AND empresa = $2 LIMIT 1`,
            [cod, empresa]
        );
        if (dup.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: `El código ${cod} ya está en uso por "${dup.rows[0].nombre}"`
            });
        }

        const query = `
            INSERT INTO proveedores (codigo, nombre, direccion, telefono1, departamen, empresa)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING codigo, nombre, direccion, telefono1, departamen, empresa
        `;

        const result = await pool.query(query, [
            cod,
            nombre,
            direccion || null,
            telefono1 || null,
            departamen || null,
            empresa
        ]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Proveedor creado correctamente'
        });

    } catch (error) {
        console.error('Error en POST /api/contabilidad/proveedores:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear proveedor',
            details: error.message
        });
    }
});

// PUT /api/contabilidad/proveedores/:codigo - Actualizar proveedor
app.put('/api/contabilidad/proveedores/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre, direccion, telefono1, departamen, empresa } = req.body;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        console.log('[PUT proveedores] INICIO - Parámetros:', { codigo, nombre, direccion, telefono1, departamen, empresa });

        // Primero verificar si el registro existe
        const checkQuery = `SELECT * FROM proveedores WHERE codigo = $1 AND empresa = $2`;
        const checkResult = await pool.query(checkQuery, [codigo, empresa]);
        console.log('[PUT proveedores] Búsqueda inicial:', { existe: checkResult.rows.length > 0, registro: checkResult.rows[0] });

        if (checkResult.rows.length === 0) {
            console.error('[PUT proveedores] ❌ REGISTRO NO ENCONTRADO en BD:', { codigo, empresa });
            return res.status(404).json({
                success: false,
                error: 'Proveedor no encontrado en la base de datos',
                debug: { codigo, empresa, buscado: `codigo=${codigo} AND empresa=${empresa}` }
            });
        }

        // Ahora actualizar
        const updateQuery = `
            UPDATE proveedores
            SET
                nombre = COALESCE($1, nombre),
                direccion = COALESCE($2, direccion),
                telefono1 = COALESCE($3, telefono1),
                departamen = COALESCE($4, departamen)
            WHERE codigo = $5 AND empresa = $6
            RETURNING codigo, nombre, direccion, telefono1, departamen, empresa
        `;

        const result = await pool.query(updateQuery, [
            nombre || null,
            direccion || null,
            telefono1 || null,
            departamen || null,
            codigo,
            empresa
        ]);

        console.log('[PUT proveedores] ✅ ACTUALIZACIÓN EXITOSA:', { rowCount: result.rowCount, updated: result.rows[0] });

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Proveedor actualizado correctamente'
        });

    } catch (error) {
        console.error('Error en PUT /api/contabilidad/proveedores/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar proveedor',
            details: error.message
        });
    }
});

// DELETE /api/contabilidad/proveedores/:id - Eliminar proveedor
app.delete('/api/contabilidad/proveedores/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { empresa } = req.query;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        const query = `
            DELETE FROM proveedores
            WHERE codigo = $1 AND empresa = $2
            RETURNING codigo
        `;

        const result = await pool.query(query, [codigo, empresa]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Proveedor eliminado correctamente'
        });

    } catch (error) {
        console.error('Error en DELETE /api/contabilidad/proveedores/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar proveedor',
            details: error.message
        });
    }
});

// POST /api/contabilidad/proveedores/batch/eliminar - Eliminar múltiples
app.post('/api/contabilidad/proveedores/batch/eliminar', async (req, res) => {
    try {
        const { codigos, empresa } = req.body;

        if (!codigos || !Array.isArray(codigos) || codigos.length === 0 || !empresa) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren: codigos (array), empresa'
            });
        }

        const placeholders = codigos.map((_, i) => `$${i + 1}`).join(',');
        const query = `
            DELETE FROM proveedores
            WHERE codigo IN (${placeholders}) AND empresa = $${codigos.length + 1}
            RETURNING codigo
        `;

        const result = await pool.query(query, [...codigos, empresa]);

        res.json({
            success: true,
            deleted: result.rows.length,
            message: `${result.rows.length} proveedor(es) eliminado(s)`
        });

    } catch (error) {
        console.error('Error en POST /api/contabilidad/proveedores/batch/eliminar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar proveedores',
            details: error.message
        });
    }
});

// GET /api/contabilidad/proveedores/buscar - Búsqueda
app.get('/api/contabilidad/proveedores/buscar', async (req, res) => {
    try {
        const { q, empresa } = req.query;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        if (!q || q.trim().length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const searchParam = `%${q}%`;
        const query = `
            SELECT codigo, nombre, direccion, telefono1, departamen, empresa
            FROM proveedores
            WHERE empresa = $1 AND (
                UPPER(codigo) LIKE UPPER($2) OR
                UPPER(nombre) LIKE UPPER($2) OR
                UPPER(direccion) LIKE UPPER($2)
            )
            LIMIT 20
        `;

        const result = await pool.query(query, [empresa, searchParam]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error en GET /api/contabilidad/proveedores/buscar:', error);
        res.status(500).json({
            success: false,
            error: 'Error en búsqueda',
            details: error.message
        });
    }
});

// GET /api/contabilidad/proveedores/:codigo - Obtener un proveedor
// Va DESPUÉS de las rutas específicas (/proximo-codigo, /duplicados, /buscar):
// Express matchea por orden de registro, y como :codigo acepta cualquier texto,
// si esta ruta quedara primero se comería esas rutas específicas — exactamente
// lo que pasaba antes de este reordenamiento (las tres devolvían "Proveedor no
// encontrado" porque el router las tomaba como si "proximo-codigo"/"duplicados"/
// "buscar" fueran el código de un proveedor).
app.get('/api/contabilidad/proveedores/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { empresa } = req.query;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        const query = `
            SELECT codigo, nombre, direccion, telefono1, departamen, empresa
            FROM proveedores
            WHERE codigo = $1 AND empresa = $2
        `;

        const result = await pool.query(query, [codigo, empresa]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error en GET /api/contabilidad/proveedores/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proveedor',
            details: error.message
        });
    }
});

// ================================================================
// CONTABILIDAD - CUENTAS BANCARIAS (CRUD)
// ================================================================

// GET /api/contabilidad/cuentas-bancarias/proximo-codigo
app.get('/api/contabilidad/cuentas-bancarias/proximo-codigo', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            `SELECT codigo FROM cuentas_bancarias WHERE empresa = $1 ORDER BY codigo DESC`,
            [empresa]
        );
        // Encontrar el máximo numérico y sumar 1
        let maxNum = 0;
        result.rows.forEach(row => {
            const n = parseInt(row.codigo) || 0;
            if (n > maxNum) maxNum = n;
        });
        const proximoCodigo = String(maxNum + 1).padStart(3, '0');
        res.json({ success: true, codigo: proximoCodigo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-bancarias/buscar
app.get('/api/contabilidad/cuentas-bancarias/buscar', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const q = req.query.q || '';
        const result = await pool.query(
            `SELECT codigo, nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado
             FROM cuentas_bancarias
             WHERE empresa = $1 AND (codigo ILIKE $2 OR nombre_banco ILIKE $2 OR nombre_cta ILIKE $2)
             ORDER BY codigo ASC LIMIT 20`,
            [empresa, `%${q}%`]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-bancarias
app.get('/api/contabilidad/cuentas-bancarias', async (req, res) => {
    try {
        const empresa  = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const search   = req.query.search || '';
        const estado   = req.query.estado;
        const sortBy   = ['codigo','nombre_banco','nombre_cta','estado'].includes(req.query.sortBy) ? req.query.sortBy : 'codigo';
        const sortOrd  = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset   = ((parseInt(req.query.page) || 1) - 1) * limit;

        const params = [empresa];
        let where = 'WHERE empresa = $1';

        if (estado && estado !== 'TODOS') {
            params.push(estado);
            where += ` AND estado = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (codigo ILIKE $${params.length} OR nombre_banco ILIKE $${params.length} OR nombre_cta ILIKE $${params.length})`;
        }

        const countRes = await pool.query(`SELECT COUNT(*) FROM cuentas_bancarias ${where}`, params);
        const total    = parseInt(countRes.rows[0].count);

        params.push(limit, offset);
        const dataRes = await pool.query(
            `SELECT codigo, nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado
             FROM cuentas_bancarias ${where}
             ORDER BY ${sortBy} ${sortOrd}
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({ success: true, data: dataRes.rows, total, page: parseInt(req.query.page) || 1, limit });
    } catch (error) {
        console.error('Error GET /api/contabilidad/cuentas-bancarias:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-bancarias/:codigo
app.get('/api/contabilidad/cuentas-bancarias/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const result = await pool.query(
            `SELECT codigo, nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado
             FROM cuentas_bancarias WHERE codigo = $1 AND empresa = $2`,
            [codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/cuentas-bancarias
app.post('/api/contabilidad/cuentas-bancarias', async (req, res) => {
    try {
        const { codigo, nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado } = req.body;
        if (!codigo || !nombre_banco || !nombre_cta || !empresa) {
            return res.status(400).json({ success: false, error: 'codigo, nombre_banco, nombre_cta y empresa son requeridos' });
        }
        const existe = await pool.query('SELECT codigo FROM cuentas_bancarias WHERE codigo = $1 AND empresa = $2', [codigo, empresa]);
        if (existe.rows.length) return res.status(409).json({ success: false, error: `El código ${codigo} ya existe` });

        const result = await pool.query(
            `INSERT INTO cuentas_bancarias (codigo, nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [codigo, nombre_banco.trim(), nombre_cta.trim(), tipo_cuenta || '', nro_cta || '', cheque ?? 0, vr_transfe ?? 0, empresa, estado || 'ACTIVA']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/contabilidad/cuentas-bancarias:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/contabilidad/cuentas-bancarias/:codigo
app.put('/api/contabilidad/cuentas-bancarias/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre_banco, nombre_cta, tipo_cuenta, nro_cta, cheque, vr_transfe, empresa, estado } = req.body;
        const result = await pool.query(
            `UPDATE cuentas_bancarias
             SET nombre_banco=$1, nombre_cta=$2, tipo_cuenta=$3, nro_cta=$4, cheque=$5, vr_transfe=$6, estado=$7
             WHERE codigo=$8 AND empresa=$9 RETURNING *`,
            [nombre_banco, nombre_cta, tipo_cuenta || '', nro_cta || '', cheque ?? 0, vr_transfe ?? 0, estado || 'ACTIVA', codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/contabilidad/cuentas-bancarias:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/contabilidad/cuentas-bancarias/:codigo/estado - Toggle estado
app.patch('/api/contabilidad/cuentas-bancarias/:codigo/estado', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { estado, empresa } = req.body;
        if (!['ACTIVA','INACTIVA'].includes(estado)) {
            return res.status(400).json({ success: false, error: 'estado debe ser ACTIVA o INACTIVA' });
        }
        const result = await pool.query(
            `UPDATE cuentas_bancarias SET estado=$1 WHERE codigo=$2 AND empresa=$3 RETURNING *`,
            [estado, codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// CONTABILIDAD - CUENTAS CONTABLES (CRUD)
// ================================================================

// GET /api/contabilidad/grupos-gastos - Obtener todos los grupos de gastos (GLOBAL, sin empresa)
app.get('/api/contabilidad/grupos-gastos', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT codigo, nombre FROM grupo_gastos ORDER BY codigo ASC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/contabilidad/grupos-gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/dashboard — datos para el panel principal del módulo:
// KPIs por grupo específico, últimos gastos, y P&G del mes actual.
app.get('/api/contabilidad/dashboard', async (req, res) => {
    const empresa = req.query.empresa || req.headers['x-empresa'];
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    const ccostoPanel = req.query.ccosto && req.query.ccosto.trim() ? req.query.ccosto.trim() : null;

    try {
        const [kpisRes, pygRes, ultimosRes, kpiMapPanelRes, ccostosRes, ventasCCRes, bodegaRes] = await Promise.all([
            // KPIs por código de grupo específico (siempre toda la empresa, para el hero)
            pool.query(
                `SELECT
                    gg.codigo AS codigo_grupo,
                    gg.nombre AS grupo,
                    SUM(g.total)  AS total,
                    COUNT(*)      AS cantidad
                 FROM gastos g
                 LEFT JOIN cuentas c       ON g.cuenta = c.codigo AND c.empresa = g.empresa
                 LEFT JOIN grupo_gastos gg ON c.grupo = gg.codigo
                 WHERE g.empresa = $1
                   AND DATE_TRUNC('month', g.fecha::date) = DATE_TRUNC('month', CURRENT_DATE)
                 GROUP BY gg.codigo, gg.nombre`,
                [empresa]
            ),
            // P&G del mes actual agrupados por grupo de la cuenta contable (para el panel lateral, legado)
            pool.query(
                `SELECT
                    COALESCE(gg.nombre, 'SIN GRUPO') AS grupo,
                    SUM(g.total)  AS total,
                    COUNT(*)      AS cantidad
                 FROM gastos g
                 LEFT JOIN cuentas c       ON g.cuenta = c.codigo AND c.empresa = g.empresa
                 LEFT JOIN grupo_gastos gg ON c.grupo = gg.codigo
                 WHERE g.empresa = $1
                   AND DATE_TRUNC('month', g.fecha::date) = DATE_TRUNC('month', CURRENT_DATE)
                 GROUP BY gg.nombre
                 ORDER BY total DESC`,
                [empresa]
            ),
            // Últimos gastos con proveedor válido (no null / no vacío)
            pool.query(
                `SELECT g.codigo, g.fecha::text, g.concepto, g.total, g.estado,
                        COALESCE(p.nombre, g.proveedor) AS proveedor_nombre
                 FROM gastos g
                 LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
                 WHERE g.empresa = $1 AND g.proveedor IS NOT NULL AND TRIM(g.proveedor) <> ''
                 ORDER BY g.fecha DESC, g.codigo DESC
                 LIMIT 8`,
                [empresa]
            ),
            // KPIs por grupo, filtrados por centro de costo — alimenta el panel
            // "MOVIMIENTOS DEL MES" cuando el usuario elige un CC específico.
            pool.query(
                `SELECT
                    gg.codigo AS codigo_grupo,
                    gg.nombre AS grupo,
                    SUM(g.total)  AS total,
                    COUNT(*)      AS cantidad
                 FROM gastos g
                 LEFT JOIN cuentas c       ON g.cuenta = c.codigo AND c.empresa = g.empresa
                 LEFT JOIN grupo_gastos gg ON c.grupo = gg.codigo
                 WHERE g.empresa = $1
                   AND DATE_TRUNC('month', g.fecha::date) = DATE_TRUNC('month', CURRENT_DATE)
                   AND ($2::text IS NULL OR g.ccosto = $2)
                 GROUP BY gg.codigo, gg.nombre`,
                [empresa, ccostoPanel]
            ),
            pool.query(`SELECT codigo, nombre FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO' ORDER BY nombre`, [empresa]),
            pool.query(
                `SELECT ccosto, COALESCE(SUM(ventas_netas), 0) AS ventas
                 FROM ventas
                 WHERE empresa = $1
                   AND DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE)
                 GROUP BY ccosto`,
                [empresa]
            ),
            pool.query(`SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [empresa]),
        ]);

        // Mapear KPIs por código de grupo (hero, siempre toda la empresa)
        const kpiMap = {};
        kpisRes.rows.forEach(r => {
            kpiMap[r.codigo_grupo] = {
                grupo:    r.grupo,
                total:    parseFloat(r.total) || 0,
                cantidad: parseInt(r.cantidad) || 0,
            };
        });

        // Mapear KPIs por código de grupo, filtrados por CC (panel "MOVIMIENTOS DEL MES")
        const kpiMapPanel = {};
        kpiMapPanelRes.rows.forEach(r => {
            kpiMapPanel[r.codigo_grupo] = {
                grupo:    r.grupo,
                total:    parseFloat(r.total) || 0,
                cantidad: parseInt(r.cantidad) || 0,
            };
        });

        // ── Preliquidación de nómina — dos ventanas distintas ──────────────
        //
        // (a) preliqSemana: la semana de nómina en curso (o la más reciente),
        //     recortada a ayer (el servicio es nocturno, hoy aún no está
        //     completo). Alimenta el panel "PRELIQUIDACIÓN NÓMINA" con bruto/
        //     deducciones/neto/aportes-er de la semana en curso.
        //
        // (b) preliqMes: la nómina proyectada del MES en curso (1 al ayer).
        //     Es la que se suma en el panel "MOVIMIENTOS DEL MES" — no debe
        //     mezclarse con la semana porque una semana de nómina puede
        //     abarcar días de dos meses distintos y contaminar el total.
        //
        // Ambas usan la misma función `calcularNominaProyectadaPeriodo` que
        // Estado de Resultados, para que los tres reportes queden alineados.
        let preliquidacionNomina = { total_bruto: 0, total_deducciones: 0, total_neto: 0, total_aportes_er: 0 };
        let preliqMes = { total_bruto: 0, porCcosto: {} };
        try {
            const semanaRes = await pool.query(
                `SELECT semana_inicio::text AS ini, semana_fin::text AS fin
                 FROM nom_semana
                 WHERE empresa = $1 AND CURRENT_DATE BETWEEN semana_inicio AND semana_fin
                 ORDER BY semana_inicio DESC LIMIT 1`,
                [empresa]
            );
            const semanaFallbackRes = semanaRes.rows.length ? semanaRes : await pool.query(
                `SELECT semana_inicio::text AS ini, semana_fin::text AS fin
                 FROM nom_semana WHERE empresa = $1 ORDER BY semana_inicio DESC LIMIT 1`,
                [empresa]
            );
            if (semanaFallbackRes.rows.length) {
                const s = semanaFallbackRes.rows[0];
                const semanaCalc = await calcularNominaProyectadaPeriodo(empresa, s.ini.slice(0, 10), s.fin.slice(0, 10));
                preliquidacionNomina = {
                    total_bruto: semanaCalc.total_bruto,
                    total_deducciones: semanaCalc.total_deducciones,
                    total_neto: semanaCalc.total_neto,
                    total_aportes_er: semanaCalc.total_aportes_er
                };
            }

            const hoy = new Date();
            const mesIni = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
            const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
            const mesFin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;
            preliqMes = await calcularNominaProyectadaPeriodo(empresa, mesIni, mesFin);
        } catch(e) {
            console.error('Error calculando preliquidación:', e.message);
        }

        // Construcción del mini estado de resultados (para panel lateral)
        // Usa kpiMapPanel (filtrado por CC cuando aplica); la proyección de
        // nómina del MES se prorratea por el CC "hogar" de cada empleado.
        const kpiSrc = ccostoPanel ? kpiMapPanel : kpiMap;
        const ventas = kpiSrc['00']?.total || 0;
        const otrosIngresos = kpiSrc['04']?.total || 0;
        const totalIngresos = ventas + otrosIngresos;

        const preliqParaPanel = ccostoPanel ? (preliqMes.porCcosto[String(ccostoPanel)] || 0) : (preliqMes.total_bruto || 0);

        // MATERIA PRIMA (grupo 01): las compras están centralizadas en la
        // bodega maestra, así que un filtro literal por CC deja el gasto en
        // $0 para cualquier CC de servicio. Igual que Estado de Resultados,
        // se prorratea el total-empresa por el % de ventas del CC frente al
        // total de ventas de los CC con venta (excluyendo la bodega maestra).
        // La bodega maestra en sí no consume MP → 0 cuando se filtra por ella.
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;
        const ventasPorCC = {};
        ventasCCRes.rows.forEach(r => { ventasPorCC[String(r.ccosto)] = parseFloat(r.ventas) || 0; });
        const mpEmpresa = kpiMap['01']?.total || 0;
        let comprasMP;
        if (!ccostoPanel) {
            comprasMP = mpEmpresa;
        } else if (bodegaMaestra && String(ccostoPanel) === String(bodegaMaestra)) {
            comprasMP = 0;
        } else {
            const ventasBase = Object.entries(ventasPorCC).reduce((s, [cc, v]) => {
                const esBodega = bodegaMaestra && String(cc) === String(bodegaMaestra);
                return (!esBodega && v > 0) ? s + v : s;
            }, 0);
            const ventasCC = ventasPorCC[String(ccostoPanel)] || 0;
            comprasMP = (ventasCC > 0 && ventasBase > 0) ? mpEmpresa * (ventasCC / ventasBase) : 0;
        }
        const nomina = (kpiSrc['02']?.total || 0) + preliqParaPanel;
        const gastosGenerales = kpiSrc['03']?.total || 0;
        const impuestos = kpiSrc['05']?.total || 0;
        const totalGastos = comprasMP + nomina + gastosGenerales + impuestos;

        const utilidad = totalIngresos - totalGastos;

        const pyg = [
            { grupo: 'VENTAS', total: ventas, cantidad: kpiSrc['00']?.cantidad || 0, tipo: 'ingreso' },
            { grupo: 'OTROS INGRESOS', total: otrosIngresos, cantidad: kpiSrc['04']?.cantidad || 0, tipo: 'ingreso' },
            { grupo: 'TOTAL INGRESOS', total: totalIngresos, cantidad: 0, tipo: 'subtotal-ingreso', bold: true },
            { grupo: 'NÓMINA', total: nomina, cantidad: kpiSrc['02']?.cantidad || 0, tipo: 'gasto' },
            { grupo: 'MATERIA PRIMA', total: comprasMP, cantidad: kpiSrc['01']?.cantidad || 0, tipo: 'gasto' },
            { grupo: 'GASTOS GENERALES', total: gastosGenerales, cantidad: kpiSrc['03']?.cantidad || 0, tipo: 'gasto' },
            { grupo: 'IMPUESTOS', total: impuestos, cantidad: kpiSrc['05']?.cantidad || 0, tipo: 'gasto' },
            { grupo: 'TOTAL GASTOS', total: totalGastos, cantidad: 0, tipo: 'subtotal-gasto', bold: true },
            { grupo: 'UTILIDAD APROXIMADA', total: utilidad, cantidad: 0, tipo: 'utilidad', bold: true },
        ];
        delete preliquidacionNomina._totalBrutoPanel;

        const pyg_legacy = pygRes.rows.map(r => ({
            grupo:    r.grupo,
            total:    parseFloat(r.total) || 0,
            cantidad: parseInt(r.cantidad) || 0,
        }));

        res.json({
            success: true,
            data: {
                kpis: {
                    ingresos: kpiMap['00'] || { grupo: 'INGRESOS', total: 0, cantidad: 0 },
                    comprasMP: kpiMap['01'] || { grupo: 'COMPRAS MATERIA PRIMA', total: 0, cantidad: 0 },
                    nomina: kpiMap['02'] || { grupo: 'NÓMINA', total: 0, cantidad: 0 },
                    gastosGenerales: kpiMap['03'] || { grupo: 'GASTOS GENERALES', total: 0, cantidad: 0 },
                    otros: kpiMap['04'] || { grupo: 'OTROS', total: 0, cantidad: 0 },
                    impuestos: kpiMap['05'] || { grupo: 'IMPUESTOS', total: 0, cantidad: 0 },
                },
                pyg,
                ccostoFiltro: ccostoPanel,
                ccostosDisponibles: ccostosRes.rows,
                totalMes: pyg_legacy.reduce((s, r) => s + r.total, 0),
                cantidadMes: pyg_legacy.reduce((s, r) => s + r.cantidad, 0),
                ultimosGastos: ultimosRes.rows,
                preliquidacionNomina,
            },
        });
    } catch (error) {
        console.error('Error GET /api/contabilidad/dashboard:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Nómina proyectada (para un rango de fechas del período actual) ───
// A diferencia de la preliquidación del dashboard (que siempre mira "la
// semana de nómina más reciente" sin importar si ya terminó), esta versión
// se ciñe estrictamente al rango [fechaDesde, fechaHastaPeriodo] del período
// que se está reportando en Estado de Resultados, recortado además a "ayer"
// (el servicio es nocturno, así que el día de hoy todavía no tiene ventas ni
// horas completas). Recorre TODAS las semanas de nómina que se traslapen con
// ese rango — no solo una — para no perder horas de semanas ya cerradas pero
// aún no liquidadas oficialmente, y para no mezclar horas de fuera del mes
// (p.ej. días de julio de una semana 27 jul–2 ago cuando se reporta agosto).
// El umbral de horas extra se aplica sobre las horas de cada semana YA
// recortadas a ese rango (aproximación razonable, igual de "estimada" que
// el resto de proyecciones de este endpoint).
async function calcularNominaProyectadaPeriodo(empresa, fechaDesde, fechaHastaPeriodo) {
    const resultado = {
        total_bruto: 0, total_deducciones: 0, total_neto: 0, total_aportes_er: 0,
        fechaDesde: null, fechaHasta: null, porCcosto: {}
    };
    try {
        const hoy = new Date().toISOString().slice(0, 10);
        const ayer = sumarDias(hoy, -1);
        const fechaHastaEfectiva = fechaHastaPeriodo < ayer ? fechaHastaPeriodo : ayer;
        if (fechaHastaEfectiva < fechaDesde) return resultado;
        resultado.fechaDesde = fechaDesde;
        resultado.fechaHasta = fechaHastaEfectiva;

        const semanasRes = await pool.query(
            `SELECT id, semana_inicio::text AS semana_inicio, semana_fin::text AS semana_fin
             FROM nom_semana
             WHERE empresa = $1 AND semana_fin >= $2::date AND semana_inicio <= $3::date
             ORDER BY semana_inicio`,
            [empresa, fechaDesde, fechaHastaEfectiva]
        );
        if (!semanasRes.rows.length) return resultado;

        for (const s of semanasRes.rows) {
            const wDesde = s.semana_inicio.slice(0, 10) > fechaDesde ? s.semana_inicio.slice(0, 10) : fechaDesde;
            const wHasta = s.semana_fin.slice(0, 10) < fechaHastaEfectiva ? s.semana_fin.slice(0, 10) : fechaHastaEfectiva;
            if (wDesde > wHasta) continue;

            const anio = new Date(s.semana_fin).getFullYear();
            let cfg = {};
            const cfgR = await pool.query('SELECT * FROM nom_config_fiscal WHERE empresa=$1 AND anio=$2', [empresa, anio]);
            if (cfgR.rows.length) cfg = cfgR.rows[0];
            else cfg = { ss_rate:0.062, ss_wage_base:168600, medicare_rate:0.0145,
                         medicare_adicional_rate:0.009, medicare_adicional_threshold:200000,
                         futa_rate:0.006, futa_wage_base:7000, suta_rate:0.027, suta_wage_base:7000,
                         ot_threshold_hours:40, ot_multiplier:1.5, wc_default_rate:0, fit_config:null };

            const det = await pool.query(
                `SELECT empleado_id, ccosto, SUM(COALESCE(real_horas, prog_horas, 0)) AS horas
                 FROM nom_semana_detalle
                 WHERE semana_id=$1 AND es_dia_libre=FALSE AND fecha >= $2::date AND fecha <= $3::date
                 GROUP BY empleado_id, ccosto`,
                [s.id, wDesde, wHasta]
            );
            let horasPorEmpleado = {};
            let empleadosEnSemana = new Set();
            for (const row of det.rows) {
                empleadosEnSemana.add(parseInt(row.empleado_id));
                if (!horasPorEmpleado[row.empleado_id]) horasPorEmpleado[row.empleado_id] = {};
                const cc = row.ccosto || 'GEN';
                horasPorEmpleado[row.empleado_id][cc] = parseFloat(row.horas || 0);
            }
            if (!empleadosEnSemana.size) continue;

            const diasDet = await pool.query(
                `SELECT empleado_id, COUNT(DISTINCT fecha) AS dias
                 FROM nom_semana_detalle
                 WHERE semana_id=$1 AND es_dia_libre=FALSE AND fecha >= $2::date AND fecha <= $3::date
                   AND COALESCE(real_horas, prog_horas, 0) > 0
                 GROUP BY empleado_id`,
                [s.id, wDesde, wHasta]
            );
            let diasPorEmpleado = {};
            diasDet.rows.forEach(row => { diasPorEmpleado[row.empleado_id] = parseInt(row.dias || 0); });

            const ids = [...empleadosEnSemana];
            const empleados = await pool.query(`SELECT * FROM nom_empleados WHERE id = ANY($1) ORDER BY apellido, nombre`, [ids]);

            const otThreshold = parseFloat(cfg.ot_threshold_hours || 40);
            const otMult = parseFloat(cfg.ot_multiplier || 1.5);

            for (const emp of empleados.rows) {
                const ytdR = await pool.query(
                    `SELECT COALESCE(SUM(ll.total_bruto),0) AS ytd
                     FROM nom_liquidacion_linea ll
                     JOIN nom_liquidacion l ON l.id=ll.liquidacion_id
                     WHERE ll.empleado_id=$1 AND l.empresa=$2
                       AND EXTRACT(YEAR FROM l.semana_fin)=$3 AND l.estado IN ('APROBADA','PAGADA')`,
                    [emp.id, empresa, anio]
                );
                const ytdBruto = parseFloat(ytdR.rows[0].ytd || 0);

                const ccHoras = horasPorEmpleado[emp.id] || {};
                const totalHoras = Object.values(ccHoras).reduce((s, h) => s + h, 0);

                let brutoRegular = 0, brutoOT = 0, brutoBase = 0;
                const tipoPago = emp.tipo_pago || (emp.es_por_horas ? 'HORAS' : 'FIJO_SEMANAL');

                if (tipoPago === 'DIA_LABORADO') {
                    const diasTrabajados = diasPorEmpleado[emp.id] || 0;
                    brutoBase = diasTrabajados * parseFloat(emp.valor_dia || 0);
                } else if (tipoPago === 'FIJO_MAS_HORAS') {
                    brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
                    const horasOtrosCC = Object.entries(ccHoras)
                        .filter(([cc]) => String(cc) !== String(emp.ccosto))
                        .reduce((s, [, h]) => s + h, 0);
                    const valorHora = parseFloat(emp.valor_hora || 0);
                    const valorHoraOT = valorHora * otMult;
                    if (horasOtrosCC <= otThreshold) {
                        brutoRegular = horasOtrosCC * valorHora;
                    } else {
                        brutoRegular = otThreshold * valorHora;
                        brutoOT = (horasOtrosCC - otThreshold) * valorHoraOT;
                    }
                } else if (tipoPago === 'FIJO_SEMANAL' || (emp.tipo_empleado === '1099' && !emp.es_por_horas)) {
                    brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
                } else {
                    const valorHora = parseFloat(emp.valor_hora || 0);
                    const valorHoraOT = valorHora * otMult;
                    if (totalHoras <= otThreshold) {
                        brutoRegular = totalHoras * valorHora;
                    } else {
                        brutoRegular = otThreshold * valorHora;
                        brutoOT = (totalHoras - otThreshold) * valorHoraOT;
                    }
                }

                const totalBrutoEmp = brutoRegular + brutoOT + brutoBase;
                const taxes = calcularRetenciones(emp, totalBrutoEmp, ytdBruto, cfg);
                const netoEmp = totalBrutoEmp - taxes.total_deducciones;

                if (totalBrutoEmp > 0) {
                    resultado.total_bruto += totalBrutoEmp;
                    resultado.total_deducciones += taxes.total_deducciones;
                    resultado.total_aportes_er += taxes.total_aportes_er;
                    resultado.total_neto += netoEmp;
                    const ccHome = emp.ccosto != null ? String(emp.ccosto) : 'GEN';
                    resultado.porCcosto[ccHome] = (resultado.porCcosto[ccHome] || 0) + totalBrutoEmp;
                }
            }
        }

        resultado.total_bruto = +resultado.total_bruto.toFixed(2);
        resultado.total_deducciones = +resultado.total_deducciones.toFixed(2);
        resultado.total_neto = +resultado.total_neto.toFixed(2);
        resultado.total_aportes_er = +resultado.total_aportes_er.toFixed(2);
        Object.keys(resultado.porCcosto).forEach(cc => { resultado.porCcosto[cc] = +resultado.porCcosto[cc].toFixed(2); });
    } catch (e) {
        console.error('Error calculando nómina proyectada:', e.message);
    }
    return resultado;
}

// ══════════════════════════════════════════════════════════════════
// ESTADO DE RESULTADOS (P&G)
//
// Muestra las CUENTAS CONTABLES individuales (no solo el total del
// grupo), agrupadas por grupo_gastos y ordenadas por grupo_gastos.codigo.
// La cuenta configurada como Materia Prima (config_general.cta_materia_prima)
// no se suma en crudo: se reemplaza por el consumo real calculado vía
// juego de inventarios (Inv. Inicial + Compras de esa cuenta - Inv. Final),
// igual que en Almacén > Valoración Mensual de Inventario.
//
// Soporta:
//  - modo=mensual (?mes=YYYY-MM)  → 1 columna de período
//  - modo=anual   (?anio=YYYY)   → 12 columnas, una por mes, + total anual
//  - ccosto=<codigo> | vacío/omitido = toda la empresa. Cuando se filtra
//    por un CC específico, el consumo de Materia Prima (que es un cálculo
//    a nivel de empresa) se distribuye proporcionalmente según el % de
//    ventas netas de ese CC frente al total de ventas de los CC con venta
//    (excluyendo bodega maestra y CC sin venta), igual que en Valoración
//    Mensual de Inventario.
// ══════════════════════════════════════════════════════════════════

app.get('/api/contabilidad/estado-resultados', async (req, res) => {
    const { empresa, modo, mes, anio, ccosto } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    if (modo === 'anual' && !anio) return res.status(400).json({ success: false, error: 'anio requerido en modo anual' });
    if ((!modo || modo === 'mensual') && !mes) return res.status(400).json({ success: false, error: 'mes requerido en modo mensual' });

    const emp = parseInt(empresa);
    const ccostoFiltro = ccosto && ccosto.trim() ? ccosto.trim() : null;
    const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

    try {
        // ── Períodos ────────────────────────────────────────────────────
        let periodos = [];
        if (modo === 'anual') {
            const y = parseInt(anio);
            for (let m = 1; m <= 12; m++) {
                const desde = `${y}-${String(m).padStart(2, '0')}-01`;
                const ultimoDia = new Date(y, m, 0).getDate();
                const hasta = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
                periodos.push({ key: `${y}-${String(m).padStart(2, '0')}`, label: MESES[m - 1], desde, hasta });
            }
        } else {
            const [y, m] = mes.split('-').map(Number);
            const desde = `${y}-${String(m).padStart(2, '0')}-01`;
            const ultimoDia = new Date(y, m, 0).getDate();
            const hasta = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
            periodos.push({ key: mes, label: MESES[m - 1] + ' ' + y, desde, hasta });
        }
        const rangoDesde = periodos[0].desde;
        const rangoHasta = periodos[periodos.length - 1].hasta;

        const [cfgRes, gruposRes, ccostosRes] = await Promise.all([
            pool.query(`SELECT cta_materia_prima, valor_estimado_inventario_final FROM config_general WHERE empresa = $1`, [emp]),
            pool.query(`SELECT TRIM(codigo) AS codigo, TRIM(nombre) AS nombre, TRIM(tipo) AS tipo FROM grupo_gastos ORDER BY codigo ASC`),
            pool.query(`SELECT codigo, nombre FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO' ORDER BY nombre`, [emp]),
        ]);
        const ctaMateriaPrima = cfgRes.rows[0]?.cta_materia_prima || null;
        const valorEstimadoInventarioFinal = cfgRes.rows[0]?.valor_estimado_inventario_final != null
            ? parseFloat(cfgRes.rows[0].valor_estimado_inventario_final)
            : null;

        const bodegaRes = await pool.query(`SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [emp]);
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;

        let grupoMateriaPrimaCodigo = null;
        let ctaMateriaPrimaNombre = null;
        if (ctaMateriaPrima) {
            const ctaRes = await pool.query(
                `SELECT TRIM(grupo) AS grupo, cuenta FROM cuentas WHERE codigo = $1 AND empresa = $2`,
                [ctaMateriaPrima, emp]
            );
            grupoMateriaPrimaCodigo = ctaRes.rows[0]?.grupo || null;
            ctaMateriaPrimaNombre = ctaRes.rows[0]?.cuenta || null;
        }

        // ── Valorización de inventario (empresa completa) en cada corte ──
        // Réplica de la lógica de Valoración Mensual (tomasEnVentana +
        // valorizarCortes): por centro de costo, se usa la toma física de
        // cierre (congelada, o legado en detalle_inventario) cuando existe
        // dentro de la ventana de gracia — más confiable que el kardex, que
        // no captura mermas/ajustes no registrados. Solo se calcula en vivo
        // desde el kardex para los centros sin ninguna toma física cerca de
        // esa fecha. Las fechas siempre se castean a texto en SQL (nunca se
        // reenvían como objetos Date de JS) para evitar desfases de zona
        // horaria al comparar (ccosto, fecha) en la segunda consulta.
        async function stockValorizadoTotal(fechaCorte) {
            const ventanaFin = sumarDias(fechaCorte, DIAS_GRACIA_TOMA);

            const tomaRes = await pool.query(
                `SELECT ccosto, MAX(fecha)::text AS fecha FROM (
                     SELECT ccosto::text AS ccosto, fecha
                       FROM toma_fisica_valorizada
                      WHERE empresa = $1::int AND es_cierre = TRUE
                        AND fecha >= $2::date AND fecha <= $3::date
                     UNION
                     SELECT di.ccosto::text AS ccosto, di.fecha
                       FROM detalle_inventario di
                      WHERE di.empresa = $1::int AND di.tipo = 'TOMA FISICA'
                        AND di.fecha >= $2::date AND di.fecha <= $3::date
                        AND NOT EXISTS (
                              SELECT 1 FROM toma_fisica_valorizada t
                               WHERE t.empresa = di.empresa
                                 AND t.ccosto  = di.ccosto
                                 AND t.fecha   = di.fecha)
                 ) t
                 GROUP BY ccosto`,
                [emp, fechaCorte, ventanaFin]
            );
            const pares = tomaRes.rows.map(r => [r.ccosto, r.fecha.slice(0, 10)]);

            let totalFrozen = 0;
            let totalLiveEnCorte = 0;
            const congelados = new Set();
            if (pares.length) {
                const ph = pares.map((_, i) => `($${i * 2 + 2}::varchar, $${i * 2 + 3}::date)`).join(', ');
                const params = [emp];
                pares.forEach(([cc, f]) => { params.push(cc, f); });
                const snapRes = await pool.query(
                    `SELECT ccosto, COALESCE(SUM(stock * precio_costo), 0) AS valor
                       FROM toma_fisica_valorizada
                      WHERE empresa = $1 AND (ccosto, fecha) IN (${ph})
                      GROUP BY ccosto`,
                    params
                );
                snapRes.rows.forEach(r => { congelados.add(r.ccosto); totalFrozen += parseFloat(r.valor) || 0; });

                const pendientes = pares.filter(([cc]) => !congelados.has(cc));
                if (pendientes.length) {
                    const vals = pendientes.map((_, i) => `($${i * 2 + 3}::varchar, $${i * 2 + 4}::date)`).join(', ');
                    const lp = [emp, String(empresa)];
                    pendientes.forEach(([cc, f]) => { lp.push(cc, f); });
                    const liveCorteRes = await pool.query(
                        `WITH cortes(ccosto, fecha) AS (VALUES ${vals})
                         SELECT COALESCE(SUM((COALESCE(di.entrada,0) - COALESCE(di.salida,0)) * COALESCE(pce.precio_costo, p.precio_costo, 0)), 0) AS valor
                           FROM cortes c
                           JOIN detalle_inventario di ON di.ccosto = c.ccosto AND di.fecha <= c.fecha AND di.empresa = $1
                           JOIN productos p ON p.codigo = di.codigo
                           LEFT JOIN producto_costo_empresa pce ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($2::text)
                          WHERE p.control = 'SI'`,
                        lp
                    );
                    totalLiveEnCorte = parseFloat(liveCorteRes.rows[0].valor) || 0;
                }
            }

            // Centros sin ninguna toma física (ni congelada ni legado) en la
            // ventana: se calculan en vivo hasta la fecha de corte exacta
            // (comportamiento histórico, preservado para no romper períodos
            // donde nunca se ha hecho un conteo físico).
            const ccostosConToma = pares.map(([cc]) => cc);
            const liveRes = await pool.query(
                `SELECT COALESCE(SUM((COALESCE(di.entrada,0) - COALESCE(di.salida,0)) * COALESCE(pce.precio_costo, p.precio_costo, 0)), 0) AS valor
                 FROM detalle_inventario di
                 JOIN productos p ON p.codigo = di.codigo
                 LEFT JOIN producto_costo_empresa pce
                        ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
                 WHERE di.empresa = $2 AND di.fecha <= $3 AND p.control = 'SI'
                   AND (cardinality($4::text[]) = 0 OR NOT (di.ccosto = ANY($4::text[])))`,
                [String(empresa), emp, fechaCorte, ccostosConToma]
            );
            const totalSinToma = parseFloat(liveRes.rows[0].valor) || 0;

            return totalFrozen + totalLiveEnCorte + totalSinToma;
        }
        const cutoffs = [new Date(new Date(rangoDesde).getTime() - 86400000).toISOString().slice(0, 10)];
        for (const p of periodos) cutoffs.push(p.hasta);
        const stockValores = await Promise.all(cutoffs.map(stockValorizadoTotal));
        const stockPorCorte = {};
        cutoffs.forEach((c, i) => { stockPorCorte[c] = stockValores[i]; });

        // ── Inventario final estimado (fallback) ──────────────────────────
        // Solo aplica al período ACTUAL (aún en curso), nunca a un período ya
        // cerrado en el pasado: para meses pasados el kardex en vivo ya refleja
        // el movimiento real y es más preciso que un estimado genérico. Si el
        // corte final del período actual no tiene una toma física oficial de
        // cierre registrada (empresa completa, dentro de la ventana de gracia),
        // se usa el valor estimado configurado en Configuración General ·
        // Almacén para aproximar la utilidad mientras se hace la toma real.
        let inventarioFinalEsEstimado = false;
        const cutoffFinal = cutoffs[cutoffs.length - 1];
        const hoy = new Date().toISOString().slice(0, 10);
        const periodoActualEnCurso = cutoffFinal >= hoy;

        // ── Nómina proyectada (días del período actual sin liquidar aún) ────
        // Igual que el inventario estimado: solo tiene sentido para el período
        // ACTUAL (en curso), nunca para uno ya cerrado. Se suma como línea
        // aparte dentro de GASTOS DE PERSONAL, usando horas reales desde el
        // inicio del período actual hasta AYER (el servicio es nocturno, así
        // que el día de hoy todavía no tiene información completa) — sin
        // importar cómo caigan las semanas de nómina dentro de ese rango.
        const proyectarNomina = req.query.proyectarNomina === '1' || req.query.proyectarNomina === 'true';
        const periodoActual = periodos[periodos.length - 1];
        const currentPeriodKey = periodoActual.key;
        let nominaProyectadaInfo = { disponible: periodoActualEnCurso, incluida: false, monto: 0, fechaDesde: null, fechaHasta: null };
        let nominaProyectadaMonto = 0;
        if (proyectarNomina && periodoActualEnCurso) {
            const nominaProy = await calcularNominaProyectadaPeriodo(emp, periodoActual.desde, periodoActual.hasta);
            nominaProyectadaMonto = ccostoFiltro ? (nominaProy.porCcosto[String(ccostoFiltro)] || 0) : nominaProy.total_bruto;
            nominaProyectadaInfo = {
                disponible: true,
                incluida: nominaProyectadaMonto > 0,
                monto: nominaProyectadaMonto,
                fechaDesde: nominaProy.fechaDesde,
                fechaHasta: nominaProy.fechaHasta
            };
        }

        if (valorEstimadoInventarioFinal != null && cutoffFinal >= hoy) {
            const tomaCierreRes = await pool.query(
                `SELECT 1 FROM toma_fisica_valorizada
                  WHERE empresa = $1 AND es_cierre = TRUE
                    AND fecha >= $2::date AND fecha <= $3::date
                  LIMIT 1`,
                [emp, cutoffFinal, sumarDias(cutoffFinal, DIAS_GRACIA_TOMA)]
            );
            if (!tomaCierreRes.rows.length) {
                stockPorCorte[cutoffFinal] = valorEstimadoInventarioFinal;
                inventarioFinalEsEstimado = true;
            }
        }

        // ── Compras de Materia Prima por período (empresa completa) ──────
        const comprasMPRes = ctaMateriaPrima
            ? await pool.query(
                `SELECT TO_CHAR(fecha::date, 'YYYY-MM') AS periodo_key, COALESCE(SUM(total), 0) AS total
                 FROM gastos WHERE empresa = $1 AND cuenta = $2 AND fecha >= $3 AND fecha <= $4
                 GROUP BY periodo_key`,
                [emp, ctaMateriaPrima, rangoDesde, rangoHasta]
              )
            : { rows: [] };
        const comprasMPPorPeriodo = {};
        comprasMPRes.rows.forEach(r => { comprasMPPorPeriodo[r.periodo_key] = parseFloat(r.total) || 0; });

        // ── Ventas netas por CC y período (para % de asignación de MP) ───
        const ventasRes = await pool.query(
            `SELECT ccosto, TO_CHAR(fecha::date, 'YYYY-MM') AS periodo_key, COALESCE(SUM(ventas_netas), 0) AS ventas
             FROM ventas WHERE empresa = $1 AND fecha >= $2 AND fecha <= $3
             GROUP BY ccosto, periodo_key`,
            [emp, rangoDesde, rangoHasta]
        );
        const ventasPorPeriodoCC = {};
        ventasRes.rows.forEach(r => {
            if (!ventasPorPeriodoCC[r.periodo_key]) ventasPorPeriodoCC[r.periodo_key] = {};
            ventasPorPeriodoCC[r.periodo_key][r.ccosto] = parseFloat(r.ventas) || 0;
        });

        // ── Gastos por cuenta y período (excluye la cuenta de Materia Prima), filtrado por CC si aplica ──
        const gastosRes = await pool.query(
            `SELECT c.codigo, c.cuenta AS nombre, TRIM(c.grupo) AS grupo_codigo,
                    TO_CHAR(g.fecha::date, 'YYYY-MM') AS periodo_key,
                    SUM(g.total) AS total
             FROM gastos g
             JOIN cuentas c ON c.codigo = g.cuenta AND c.empresa = g.empresa
             WHERE g.empresa = $1 AND g.fecha >= $2 AND g.fecha <= $3
               AND ($4::text IS NULL OR g.cuenta <> $4)
               AND ($5::text IS NULL OR g.ccosto = $5)
             GROUP BY c.codigo, c.cuenta, c.grupo, periodo_key`,
            [emp, rangoDesde, rangoHasta, ctaMateriaPrima, ccostoFiltro]
        );

        // ── Consumo de Materia Prima por período (total y, si aplica, asignado al CC) ──
        const consumoMPPorPeriodo = {};
        for (let i = 0; i < periodos.length; i++) {
            const p = periodos[i];
            const valorInicial = stockPorCorte[cutoffs[i]];
            const valorFinal   = stockPorCorte[cutoffs[i + 1]];
            const compras      = comprasMPPorPeriodo[p.key] || 0;
            const consumoTotal = valorInicial + compras - valorFinal;

            if (!ccostoFiltro) {
                consumoMPPorPeriodo[p.key] = consumoTotal;
                continue;
            }
            const ventasCCPeriodo = ventasPorPeriodoCC[p.key] || {};
            const esBodegaSeleccionada = bodegaMaestra && String(ccostoFiltro) === String(bodegaMaestra);
            const ventasBase = ccostosRes.rows.reduce((s, cc) => {
                const esBodega = bodegaMaestra && String(cc.codigo) === String(bodegaMaestra);
                const v = ventasCCPeriodo[cc.codigo] || 0;
                return (!esBodega && v > 0) ? s + v : s;
            }, 0);
            const ventasCC = ventasCCPeriodo[ccostoFiltro] || 0;
            consumoMPPorPeriodo[p.key] = (!esBodegaSeleccionada && ventasCC > 0 && ventasBase > 0)
                ? consumoTotal * (ventasCC / ventasBase)
                : 0;
        }

        // ── Traer TODAS las cuentas (incluso sin movimientos en el período) ─
        // Se excluye la cuenta de Materia Prima porque se agrega aparte como el
        // consumo calculado por juego de inventarios (ver esGrupoMateriaPrima abajo).
        const cuentasActivasRes = await pool.query(`
            SELECT codigo, cuenta AS nombre, TRIM(grupo) AS grupo_codigo
            FROM cuentas
            WHERE empresa = $1 AND ($2::text IS NULL OR codigo <> $2)
            ORDER BY codigo
        `, [emp, ctaMateriaPrima]);

        // ── Ventas netas por período (denominador de % sobre venta) ───────
        const ventasNetasPorPeriodo = periodos.map(p => {
            const ventasCCPeriodo = ventasPorPeriodoCC[p.key] || {};
            if (ccostoFiltro) return ventasCCPeriodo[ccostoFiltro] || 0;
            return Object.values(ventasCCPeriodo).reduce((s, v) => s + v, 0);
        });
        const ventasNetasTotal = ventasNetasPorPeriodo.reduce((s, v) => s + v, 0);
        function pct(valor, base) { return base > 0 ? (valor / base) * 100 : null; }

        // ── Inicializar cuentas por grupo con TODAS las cuentas ACTIVAS ───
        const cuentasPorGrupo = {}; // grupo_codigo -> Map(cuenta_codigo -> {codigo,nombre,valores:{}})
        for (const row of cuentasActivasRes.rows) {
            const gc = row.grupo_codigo || 'SIN_GRUPO';
            if (!cuentasPorGrupo[gc]) cuentasPorGrupo[gc] = new Map();
            // Inicializar todas con valores vacíos (luego se sobrescriben si hay gastos)
            cuentasPorGrupo[gc].set(row.codigo, { codigo: row.codigo, nombre: row.nombre, valores: {} });
        }

        // ── Sobrescribir con valores reales de gastos si los hay ──────────
        for (const row of gastosRes.rows) {
            const gc = row.grupo_codigo || 'SIN_GRUPO';
            if (!cuentasPorGrupo[gc]) cuentasPorGrupo[gc] = new Map();
            if (!cuentasPorGrupo[gc].has(row.codigo)) {
                cuentasPorGrupo[gc].set(row.codigo, { codigo: row.codigo, nombre: row.nombre, valores: {} });
            }
            cuentasPorGrupo[gc].get(row.codigo).valores[row.periodo_key] = parseFloat(row.total) || 0;
        }

        function valoresArray(valoresPorKey) {
            return periodos.map(p => valoresPorKey[p.key] || 0);
        }

        const gruposFinal = gruposRes.rows.map(g => {
            const cuentasMap = cuentasPorGrupo[g.codigo] || new Map();
            const cuentas = Array.from(cuentasMap.values()).map(c => ({
                codigo: c.codigo, nombre: c.nombre,
                valores: valoresArray(c.valores),
                total: periodos.reduce((s, p) => s + (c.valores[p.key] || 0), 0)
            }));
            const esGrupoMateriaPrima = grupoMateriaPrimaCodigo && g.codigo === grupoMateriaPrimaCodigo;
            if (esGrupoMateriaPrima) {
                cuentas.unshift({
                    codigo: ctaMateriaPrima, nombre: ctaMateriaPrimaNombre || 'MATERIA PRIMA',
                    valores: valoresArray(consumoMPPorPeriodo),
                    total: periodos.reduce((s, p) => s + (consumoMPPorPeriodo[p.key] || 0), 0),
                    esConsumoCalculado: true
                });
            }
            if (g.codigo === '02' && nominaProyectadaInfo.incluida) {
                cuentas.push({
                    codigo: 'NOM-PROY', nombre: 'Nómina Proyectada (semana en curso)',
                    valores: valoresArray({ [currentPeriodKey]: nominaProyectadaMonto }),
                    total: nominaProyectadaMonto,
                    esNominaProyectada: true
                });
            }
            delete cuentasPorGrupo[g.codigo];
            const subtotales = periodos.map((_, i) => cuentas.reduce((s, c) => s + c.valores[i], 0));
            const total = subtotales.reduce((s, v) => s + v, 0);
            const signo = g.tipo === 'INGRESO' ? 1 : -1;
            const subtotalesPct = subtotales.map((v, i) => pct(v, ventasNetasPorPeriodo[i]));
            const totalPct = pct(total, ventasNetasTotal);
            return { codigo: g.codigo, nombre: g.nombre, tipo: g.tipo, signo, esGrupoMateriaPrima, cuentas, subtotales, total, subtotalesPct, totalPct };
        });

        // Cuentas cuyo grupo no existe en grupo_gastos (huérfanas)
        const huerfanosMap = Object.values(cuentasPorGrupo);
        if (huerfanosMap.length) {
            const cuentas = [];
            huerfanosMap.forEach(m => m.forEach(c => cuentas.push({
                codigo: c.codigo, nombre: c.nombre, valores: valoresArray(c.valores),
                total: periodos.reduce((s, p) => s + (c.valores[p.key] || 0), 0)
            })));
            const subtotales = periodos.map((_, i) => cuentas.reduce((s, c) => s + c.valores[i], 0));
            const total = subtotales.reduce((s, v) => s + v, 0);
            gruposFinal.push({
                codigo: null, nombre: 'SIN GRUPO', tipo: 'EGRESO', signo: -1, esGrupoMateriaPrima: false,
                cuentas, subtotales, total,
                subtotalesPct: subtotales.map((v, i) => pct(v, ventasNetasPorPeriodo[i])),
                totalPct: pct(total, ventasNetasTotal)
            });
        }

        // ── Utilidad neta por período (suma de grupos con signo por tipo) ──
        const utilidadPorPeriodo = periodos.map((_, i) =>
            gruposFinal.reduce((s, g) => s + g.signo * g.subtotales[i], 0)
        );
        const utilidadTotal = utilidadPorPeriodo.reduce((s, v) => s + v, 0);

        const totalIngresos = gruposFinal.filter(g => g.signo > 0).reduce((s, g) => s + g.total, 0);
        const totalEgresos  = gruposFinal.filter(g => g.signo < 0).reduce((s, g) => s + g.total, 0);
        const consumoMPTotal = periodos.reduce((s, p) => s + (consumoMPPorPeriodo[p.key] || 0), 0);

        res.json({
            success: true,
            modo: modo === 'anual' ? 'anual' : 'mensual',
            periodo: { desde: rangoDesde, hasta: rangoHasta },
            periodos: periodos.map(p => ({ key: p.key, label: p.label })),
            ccostoFiltro,
            ccostosDisponibles: ccostosRes.rows,
            materiaPrima: {
                ctaCodigo: ctaMateriaPrima, ctaNombre: ctaMateriaPrimaNombre,
                grupoCodigo: grupoMateriaPrimaCodigo, consumo: consumoMPTotal,
                inventarioFinalEsEstimado
            },
            nominaProyectada: nominaProyectadaInfo,
            grupos: gruposFinal,
            utilidadPorPeriodo,
            ventasNetasPorPeriodo,
            kpis: { totalIngresos, totalEgresos, consumoMP: consumoMPTotal, utilidadNeta: utilidadTotal, ventasNetas: ventasNetasTotal }
        });
    } catch (error) {
        console.error('Error GET /api/contabilidad/estado-resultados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── FIN ESTADO DE RESULTADOS ───────────────────────────────────────

// GET /api/contabilidad/cuentas-contables/proximo-codigo
app.get('/api/contabilidad/cuentas-contables/proximo-codigo', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            `SELECT codigo FROM cuentas WHERE empresa = $1 ORDER BY codigo DESC`,
            [empresa]
        );
        // Encontrar el máximo numérico y sumar 1
        let maxNum = 0;
        result.rows.forEach(row => {
            const n = parseInt(row.codigo) || 0;
            if (n > maxNum) maxNum = n;
        });
        const proximoCodigo = String(maxNum + 1).padStart(3, '0');
        res.json({ success: true, codigo: proximoCodigo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-contables/buscar
app.get('/api/contabilidad/cuentas-contables/buscar', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const q = req.query.q || '';
        const result = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             WHERE c.empresa = $1 AND (c.codigo ILIKE $2 OR c.cuenta ILIKE $2 OR c.grupo ILIKE $2)
             ORDER BY c.codigo ASC LIMIT 20`,
            [empresa, `%${q}%`]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-contables
app.get('/api/contabilidad/cuentas-contables', async (req, res) => {
    try {
        const empresa  = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const search   = req.query.search || '';
        const estado   = req.query.estado;
        const sortBy   = ['codigo','nombre','grupo_gastos_codigo','estado'].includes(req.query.sortBy) ? req.query.sortBy : 'codigo';
        const sortOrd  = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset   = ((parseInt(req.query.page) || 1) - 1) * limit;

        const params = [empresa];
        let where = 'WHERE empresa = $1';

        if (estado && estado !== 'TODOS') {
            params.push(estado);
            where += ` AND contable = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (codigo ILIKE $${params.length} OR cuenta ILIKE $${params.length} OR grupo ILIKE $${params.length})`;
        }

        const countRes = await pool.query(`SELECT COUNT(*) FROM cuentas ${where}`, params);
        const total    = parseInt(countRes.rows[0].count);

        params.push(limit, offset);
        const dataRes = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa, c.iva_descontable
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             ${where}
             ORDER BY ${sortBy === 'nombre' ? 'c.cuenta' : sortBy === 'grupo_gastos_codigo' ? 'c.grupo' : sortBy === 'estado' ? 'c.contable' : 'c.codigo'} ${sortOrd}
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({ success: true, data: dataRes.rows, total, page: parseInt(req.query.page) || 1, limit });
    } catch (error) {
        console.error('Error GET /api/contabilidad/cuentas-contables:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/cuentas-contables/:codigo
app.get('/api/contabilidad/cuentas-contables/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const result = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa, c.iva_descontable
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             WHERE c.codigo = $1 AND c.empresa = $2`,
            [codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/cuentas-contables
app.post('/api/contabilidad/cuentas-contables', async (req, res) => {
    try {
        const { codigo, nombre, grupo_gastos_codigo, empresa } = req.body;
        if (!codigo || !nombre || !grupo_gastos_codigo || !empresa) {
            return res.status(400).json({ success: false, error: 'codigo, nombre, grupo_gastos_codigo y empresa son requeridos' });
        }
        const existe = await pool.query('SELECT codigo FROM cuentas WHERE codigo = $1 AND empresa = $2', [codigo, empresa]);
        if (existe.rows.length) return res.status(409).json({ success: false, error: `El código ${codigo} ya existe` });

        await pool.query(
            `INSERT INTO cuentas (codigo, cuenta, grupo, empresa, contable, iva_descontable)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [codigo, nombre.trim(), grupo_gastos_codigo, empresa, 'ACTIVA', null]
        );
        // Obtener los datos con el nombre del grupo
        const fullResult = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa, c.iva_descontable
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             WHERE c.codigo = $1 AND c.empresa = $2`,
            [codigo, empresa]
        );
        res.status(201).json({ success: true, data: fullResult.rows[0] });
    } catch (error) {
        console.error('Error POST /api/contabilidad/cuentas-contables:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/contabilidad/cuentas-contables/:codigo
app.put('/api/contabilidad/cuentas-contables/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre, grupo_gastos_codigo, empresa } = req.body;
        // NO actualizar el estado en PUT - solo nombre y grupo
        await pool.query(
            `UPDATE cuentas
             SET cuenta=$1, grupo=$2
             WHERE codigo=$3 AND empresa=$4`,
            [nombre, grupo_gastos_codigo, codigo, empresa]
        );
        // Obtener los datos actualizados con el nombre del grupo
        const result = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa, c.iva_descontable
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             WHERE c.codigo = $1 AND c.empresa = $2`,
            [codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/contabilidad/cuentas-contables:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/contabilidad/cuentas-contables/:codigo/estado - Toggle estado
app.patch('/api/contabilidad/cuentas-contables/:codigo/estado', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { estado, empresa } = req.body;
        if (!['ACTIVA','INACTIVA'].includes(estado)) {
            return res.status(400).json({ success: false, error: 'estado debe ser ACTIVA o INACTIVA' });
        }
        await pool.query(
            `UPDATE cuentas SET contable=$1 WHERE codigo=$2 AND empresa=$3`,
            [estado, codigo, empresa]
        );
        // Obtener los datos actualizados con el nombre del grupo
        const result = await pool.query(
            `SELECT c.codigo, c.cuenta as nombre, c.grupo as grupo_gastos_codigo, g.nombre as grupo_gastos_nombre, c.contable as estado, c.empresa, c.iva_descontable
             FROM cuentas c
             LEFT JOIN grupo_gastos g ON c.grupo = g.codigo
             WHERE c.codigo = $1 AND c.empresa = $2`,
            [codigo, empresa]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/contabilidad/cuentas-contables/:codigo - Eliminar
app.delete('/api/contabilidad/cuentas-contables/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const result = await pool.query(
            'DELETE FROM cuentas WHERE codigo = $1 AND empresa = $2 RETURNING codigo',
            [codigo, empresa]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, message: `Cuenta contable ${codigo} eliminada` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/cuentas-contables/batch/eliminar - Eliminar múltiples
app.post('/api/contabilidad/cuentas-contables/batch/eliminar', async (req, res) => {
    try {
        const { codigos, empresa } = req.body;
        if (!codigos || !codigos.length) return res.status(400).json({ success: false, error: 'codigos requeridos' });

        const placeholders = codigos.map((_, i) => `$${i + 2}`).join(', ');
        await pool.query(
            `DELETE FROM cuentas WHERE empresa = $1 AND codigo IN (${placeholders})`,
            [empresa, ...codigos]
        );
        res.json({ success: true, message: `${codigos.length} cuentas contables eliminadas` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// CONTABILIDAD - CENTROS DE COSTOS (CRUD)
// ================================================================

// GET /api/contabilidad/centrocostos - Listar
app.get('/api/contabilidad/centrocostos', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const search  = req.query.search  || '';
        const sortBy  = ['codigo', 'nombre'].includes(req.query.sortBy) ? req.query.sortBy : 'codigo';
        const sortOrd = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        const limit   = Math.min(parseInt(req.query.limit)  || 50, 200);
        const offset  = ((parseInt(req.query.page) || 1) - 1) * limit;

        let whereClause = 'WHERE empresa = $1';
        const params    = [empresa];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (codigo ILIKE $${params.length} OR nombre ILIKE $${params.length})`;
        }

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM ccostos ${whereClause}`, params
        );
        const total = parseInt(countRes.rows[0].count);

        params.push(limit, offset);
        const dataRes = await pool.query(
            `SELECT codigo, nombre, empresa, square_location_id, COALESCE(activo, 'SI') AS activo
             FROM ccostos ${whereClause}
             ORDER BY ${sortBy} ${sortOrd}
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({ success: true, data: dataRes.rows, total, page: parseInt(req.query.page) || 1, limit });
    } catch (error) {
        console.error('Error GET /api/contabilidad/centrocostos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/centrocostos/buscar - Búsqueda rápida
app.get('/api/contabilidad/centrocostos/buscar', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const q = req.query.q || '';
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            `SELECT codigo, nombre, empresa, square_location_id
             FROM ccostos
             WHERE empresa = $1 AND (codigo ILIKE $2 OR nombre ILIKE $2)
               AND COALESCE(activo, 'SI') <> 'NO'
             ORDER BY codigo ASC LIMIT 20`,
            [empresa, `%${q}%`]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/centrocostos/:codigo - Obtener uno
app.get('/api/contabilidad/centrocostos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const result = await pool.query(
            `SELECT codigo, nombre, empresa, square_location_id, COALESCE(activo, 'SI') AS activo
             FROM ccostos WHERE codigo = $1 AND empresa = $2`,
            [codigo, empresa]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Centro de costos no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/centrocostos - Crear
app.post('/api/contabilidad/centrocostos', async (req, res) => {
    try {
        const { codigo, nombre, empresa, square_location_id } = req.body;
        if (!codigo || !nombre || !empresa) {
            return res.status(400).json({ success: false, error: 'codigo, nombre y empresa son requeridos' });
        }
        // Verificar duplicado
        const existe = await pool.query(
            'SELECT codigo FROM ccostos WHERE codigo = $1 AND empresa = $2',
            [codigo.toUpperCase(), empresa]
        );
        if (existe.rows.length > 0) {
            return res.status(409).json({ success: false, error: `El código ${codigo} ya existe` });
        }
        const result = await pool.query(
            `INSERT INTO ccostos (codigo, nombre, empresa, square_location_id, activo)
             VALUES ($1, $2, $3, $4, 'SI') RETURNING *`,
            [codigo.toUpperCase(), nombre.trim(), empresa, square_location_id || '']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/contabilidad/centrocostos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/contabilidad/centrocostos/:codigo - Actualizar
app.put('/api/contabilidad/centrocostos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre, empresa, square_location_id, activo } = req.body;
        if (!nombre) return res.status(400).json({ success: false, error: 'nombre es requerido' });

        const result = await pool.query(
            `UPDATE ccostos SET nombre = $1, square_location_id = $2,
                    activo = COALESCE($3, activo, 'SI')
             WHERE codigo = $4 AND empresa = $5 RETURNING *`,
            [nombre.trim(), square_location_id || '', activo === 'SI' || activo === 'NO' ? activo : null, codigo, empresa]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Centro de costos no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/contabilidad/centrocostos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/contabilidad/centrocostos/:codigo - Eliminar
app.delete('/api/contabilidad/centrocostos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const result = await pool.query(
            'DELETE FROM ccostos WHERE codigo = $1 AND empresa = $2 RETURNING codigo',
            [codigo, empresa]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, message: `Centro de costos ${codigo} eliminado` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/centrocostos/batch/eliminar - Eliminar múltiples
app.post('/api/contabilidad/centrocostos/batch/eliminar', async (req, res) => {
    try {
        const { codigos, empresa } = req.body;
        if (!codigos || !codigos.length) return res.status(400).json({ success: false, error: 'codigos requeridos' });

        const placeholders = codigos.map((_, i) => `$${i + 2}`).join(', ');
        await pool.query(
            `DELETE FROM ccostos WHERE empresa = $1 AND codigo IN (${placeholders})`,
            [empresa, ...codigos]
        );
        res.json({ success: true, message: `${codigos.length} centros de costos eliminados` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
            database: 'Connected',
            architecture: 'Modular v2.0 - Archivo único'
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
// RUTA RAÍZ
// ================================================================

app.get('/', (req, res) => {
    res.json({
        message: 'API de Inventario con Autenticación (Modular v2.0)',
        version: '2.0',
        architecture: 'Modular - Archivo único organizado por secciones',
        modules: [
            'Autenticación',
            'Centros de Costo y Empresas',
            'Inventario',
            'Movimientos (alias temporal)',
            'Tesorería (Cuentas bancarias, Movimientos, Facturas, Soportes)',
            'Gastos y Contabilidad',
            'Órdenes de Compra y Recepción',
            'Contabilidad - Proveedores (NUEVO)'
        ],
        endpoints: {
            health: '/health',
            login: 'POST /api/auth/login',
            inventario: 'GET /api/inventario?empresa=X&ccosto=Y',
            movimientos: 'POST /api/movimientos/registrar',
            cuentas: 'GET /api/cuentas-bancarias?empresa=X',
            gastos: 'POST /api/gastos/crear',
            ordenes: 'GET /api/ordenes-compra?empresa=X',
            proveedores: 'GET/POST/PUT/DELETE /api/contabilidad/proveedores (NUEVO)'
        }
    });
});

// ================================================================
// CONTABILIDAD - GESTIÓN DE GASTOS (CRUD) + MOVIBAN
// ================================================================

// ================================================================
// MÓDULO: CONFIGURACIÓN GENERAL
// ================================================================

// GET /api/grupo-gastos — lista todos los grupos (sin filtro de empresa)
app.get('/api/grupo-gastos', async (req, res) => {
    try {
        const result = await pool.query('SELECT TRIM(codigo) AS codigo, TRIM(nombre) AS nombre, TRIM(tipo) AS tipo FROM grupo_gastos ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/grupo-gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/configuracion/cuentas?empresa=X — cuentas con su grupo
app.get('/api/configuracion/cuentas', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const { grupo } = req.query;
        const params = [empresa];
        let whereExtra = '';
        if (grupo) {
            params.push(grupo);
            whereExtra = ` AND TRIM(c.grupo) = TRIM($2)`;
        }
        const result = await pool.query(
            `SELECT c.codigo, TRIM(c.cuenta) AS cuenta, TRIM(c.grupo) AS grupo
             FROM cuentas c
             WHERE c.empresa = $1${whereExtra}
             ORDER BY c.cuenta`,
            params
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/configuracion/cuentas:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/configuracion/usuarios?empresa=X
app.get('/api/configuracion/usuarios', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const result = await pool.query(
            'SELECT codigo, usuario, nombre, nivel FROM usuarios WHERE empresa = $1 ORDER BY nombre',
            [empresa]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/configuracion/usuarios:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/configuracion/usuarios
app.post('/api/configuracion/usuarios', async (req, res) => {
    const { codigo, usuario, nombre, clave, empresa } = req.body;
    if (!codigo || !usuario || !nombre || !clave || !empresa)
        return res.status(400).json({ success: false, error: 'Campos requeridos: codigo, usuario, nombre, clave' });
    try {
        await pool.query(
            'INSERT INTO usuarios (codigo, usuario, nombre, clave, nivel, empresa) VALUES ($1, $2, $3, $4, 1, $5)',
            [parseInt(codigo), usuario.toUpperCase(), nombre.toUpperCase(), clave, parseInt(empresa)]
        );
        res.json({ success: true, data: { codigo: parseInt(codigo), usuario: usuario.toUpperCase(), nombre: nombre.toUpperCase(), nivel: 1 } });
    } catch (error) {
        const msg = error.code === '23505' ? 'Ya existe un usuario con ese código' : error.message;
        console.error('Error POST /api/configuracion/usuarios:', error.message);
        res.status(400).json({ success: false, error: msg });
    }
});

// DELETE /api/configuracion/usuarios/:codigo?empresa=X
app.delete('/api/configuracion/usuarios/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa } = req.query;
    try {
        await pool.query('DELETE FROM usuarios WHERE codigo = $1 AND empresa = $2', [parseInt(codigo), parseInt(empresa)]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/configuracion/usuarios:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/empresa/logo?empresa=X — devuelve la imagen como binario
app.get('/api/empresa/logo', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const result = await pool.query('SELECT logo, logo_nombre FROM empresas WHERE codigo = $1', [empresa]);
        if (!result.rows[0]?.logo) return res.status(404).json({ success: false, error: 'Sin logo' });
        const { logo, logo_nombre } = result.rows[0];
        const ext = (logo_nombre || 'logo.png').split('.').pop().toLowerCase();
        const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
        res.setHeader('Content-Type', mimeMap[ext] || 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(logo);
    } catch (error) {
        console.error('Error GET /api/empresa/logo:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/empresa/logo — guarda logo como bytea
app.post('/api/empresa/logo', async (req, res) => {
    const { empresa, logoBase64, logoNombre } = req.body;
    if (!empresa || !logoBase64) return res.status(400).json({ success: false, error: 'empresa y logoBase64 requeridos' });
    try {
        const buffer = Buffer.from(logoBase64, 'base64');
        await pool.query(
            'UPDATE empresas SET logo = $1, logo_nombre = $2 WHERE codigo = $3',
            [buffer, logoNombre || 'logo.png', parseInt(empresa)]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error POST /api/empresa/logo:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── FIN CONFIGURACIÓN GENERAL ──────────────────────────────────

// GET /api/dashboard/resumen - KPIs para la pantalla de inicio
app.get('/api/dashboard/resumen', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        // Paso 1: obtener ventas del mes + max_dia importado (base para todas las comparaciones)
        const ventasRes = await pool.query(
            `WITH mes_actual AS (
                SELECT COALESCE(SUM(ventas_brutas), 0) AS total,
                       COUNT(*) AS cant,
                       COALESCE(MAX(EXTRACT(DAY FROM fecha::date)), EXTRACT(DAY FROM CURRENT_DATE)) AS max_dia
                FROM ventas
                WHERE empresa = $1
                  AND DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE)
             ),
             mes_anterior AS (
                SELECT COALESCE(SUM(ventas_brutas), 0) AS total
                FROM ventas
                WHERE empresa = $1
                  AND DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                  AND EXTRACT(DAY FROM fecha::date) <= (SELECT max_dia FROM mes_actual)
             )
             SELECT (SELECT total   FROM mes_actual)  AS total_actual,
                    (SELECT cant    FROM mes_actual)   AS cant_actual,
                    (SELECT max_dia FROM mes_actual)   AS max_dia,
                    (SELECT total   FROM mes_anterior) AS total_anterior`,
            [empresa]
        );
        const maxDia = parseInt(ventasRes.rows[0].max_dia || 1);

        // Paso 2: resto de queries usando maxDia como referencia de período
        const [gastosRes, saldoRes, facturasRes, ultimosGastosRes] = await Promise.all([
            // Gastos del mes actual + comparación mes anterior (mismos días)
            pool.query(
                `SELECT
                    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0) AS total_actual,
                    COUNT(CASE WHEN DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) AS cant_actual,
                    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', fecha::date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                                      AND EXTRACT(DAY FROM fecha::date) <= $2 THEN total ELSE 0 END), 0) AS total_anterior
                 FROM gastos
                 WHERE empresa = $1 AND proveedor IS NOT NULL AND proveedor <> ''`,
                [empresa, maxDia]
            ),
            // Saldo bancario acumulado hasta día N del mes actual vs día N del mes anterior
            pool.query(
                `SELECT
                    -- Saldo hasta el día N del mes actual (último día importado de ventas)
                    COALESCE(SUM(CASE WHEN fecha::date <= (DATE_TRUNC('month', CURRENT_DATE) + ($2 - 1) * INTERVAL '1 day')::date THEN ingreso ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN fecha::date <= (DATE_TRUNC('month', CURRENT_DATE) + ($2 - 1) * INTERVAL '1 day')::date THEN egreso  ELSE 0 END), 0) AS saldo_actual,
                    -- Saldo hasta el día N del mes anterior (mismo punto de referencia)
                    COALESCE(SUM(CASE WHEN fecha::date <= (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + ($2 - 1) * INTERVAL '1 day')::date THEN ingreso ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN fecha::date <= (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + ($2 - 1) * INTERVAL '1 day')::date THEN egreso  ELSE 0 END), 0) AS saldo_anterior
                 FROM moviban WHERE empresa = $1`,
                [empresa, maxDia]
            ),
            // Facturas pendientes/por verificar (cliente = empresa)
            pool.query(
                `SELECT COUNT(*) AS cantidad,
                        COALESCE(SUM(total - COALESCE(valor_pagado, 0)), 0) AS valor
                 FROM factura_venta
                 WHERE cliente = $1 AND estado IN ('PENDIENTE', 'POR VERIFICAR')`,
                [empresa]
            ),
            // Últimos 6 gastos
            pool.query(
                `SELECT g.codigo, g.fecha::text, g.concepto, g.total, g.estado,
                        COALESCE(p.nombre, g.proveedor) AS proveedor_nombre
                 FROM gastos g
                 LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
                 WHERE g.empresa = $1 AND g.proveedor IS NOT NULL AND g.proveedor <> ''
                 ORDER BY g.fecha DESC, g.codigo DESC LIMIT 6`,
                [empresa]
            )
        ]);

        // Calcular variaciones
        const calcVar = (actual, anterior) => anterior > 0 ? ((actual - anterior) / anterior * 100) : null;

        const vActual   = parseFloat(ventasRes.rows[0].total_actual   || 0);
        const vAnterior = parseFloat(ventasRes.rows[0].total_anterior || 0);
        const gActual   = parseFloat(gastosRes.rows[0].total_actual   || 0);
        const gAnterior = parseFloat(gastosRes.rows[0].total_anterior || 0);
        const sActual   = parseFloat(saldoRes.rows[0].saldo_actual    || 0);
        const sAnterior = parseFloat(saldoRes.rows[0].saldo_anterior  || 0);

        res.json({
            success: true,
            data: {
                gastos: {
                    total: gActual, cantidad: parseInt(gastosRes.rows[0].cant_actual || 0),
                    totalAnterior: gAnterior, variacion: calcVar(gActual, gAnterior), maxDia
                },
                saldoBancario: {
                    total: sActual,
                    totalAnterior: sAnterior, variacion: calcVar(sActual, sAnterior), maxDia
                },
                ventasMes: {
                    total: vActual, cantidad: parseInt(ventasRes.rows[0].cant_actual || 0),
                    totalAnterior: vAnterior, variacion: calcVar(vActual, vAnterior), maxDia
                },
                facturasPend: { cantidad: parseInt(facturasRes.rows[0].cantidad), valor: parseFloat(facturasRes.rows[0].valor) },
                ultimosGastos: ultimosGastosRes.rows
            }
        });
    } catch (error) {
        console.error('Error GET /api/dashboard/resumen:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/gastos - Listar gastos (sin JOINs por ahora)
app.get('/api/contabilidad/gastos', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        console.log(`[DEBUG] GET /api/contabilidad/gastos - Empresa: ${empresa}`);

        // Consulta con LEFT JOINs para obtener nombres de proveedores, centros de costos y forma de pago
        const dataRes = await pool.query(
            `SELECT
                g.codigo,
                g.fecha,
                g.factura,
                g.proveedor,
                COALESCE(p.nombre, g.proveedor) as proveedor_nombre,
                g.ccosto,
                COALESCE(cc.nombre, g.ccosto) as ccosto_nombre,
                g.concepto,
                g.total,
                g.empresa,
                g.subtotal,
                g.impuestos,
                g.cuenta,
                COALESCE(cta.cuenta, g.cuenta) as cuenta_nombre,
                g.forma_pago,
                COALESCE(cb.nombre_cta, g.forma_pago) as forma_pago_nombre,
                g.estado,
                g.entrada_almacen,
                g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_bancarias cb ON g.forma_pago = cb.codigo AND cb.empresa = g.empresa
             LEFT JOIN cuentas cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
             WHERE g.empresa = $1
             ORDER BY g.fecha DESC, g.codigo DESC
             LIMIT 1000`,
            [empresa]
        );

        console.log(`  Registros encontrados: ${dataRes.rows.length}`);

        res.json({
            success: true,
            data: dataRes.rows,
            total: dataRes.rows.length,
            page: 1,
            limit: 300
        });
    } catch (error) {
        console.error('Error GET /api/contabilidad/gastos:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/gastos - Crear gasto + registrar MOVIBAN
app.post('/api/contabilidad/gastos', async (req, res) => {
    const client = await pool.connect();
    try {
        const { fecha, factura, proveedor, ccosto, forma_pago,
                cuenta, concepto, subtotal, impuestos, total, empresa } = req.body;

        if (!fecha || !proveedor || !ccosto || !forma_pago || !cuenta || !subtotal || !empresa) {
            return res.status(400).json({ success: false, error: 'Campos requeridos faltantes' });
        }

        await client.query('BEGIN');

        // 1. Bloquear la tabla para evitar códigos duplicados entre usuarios concurrentes
        //    SHARE ROW EXCLUSIVE impide que otra transacción haga INSERT simultáneo
        await client.query('LOCK TABLE gastos IN SHARE ROW EXCLUSIVE MODE');

        // 2. Obtener próximo código (10 dígitos) — solo considera códigos puramente numéricos
        const codigoRes = await client.query(
            `SELECT MAX(CASE WHEN codigo ~ '^[0-9]+$' THEN CAST(codigo AS BIGINT) ELSE 0 END) as max_codigo
             FROM gastos WHERE empresa = $1`,
            [empresa]
        );
        const proximoCodigo = String((parseInt(codigoRes.rows[0].max_codigo) || 0) + 1).padStart(10, '0');

        // 3. Insertar gasto (siempre con estado = PENDIENTE)
        await client.query(
            `INSERT INTO gastos (codigo, fecha, factura, proveedor, ccosto,
                                forma_pago, cuenta, concepto, subtotal, impuestos, total, empresa, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [proximoCodigo, fecha, factura || null, proveedor, ccosto,
             forma_pago, cuenta, (concepto || '').toUpperCase(), subtotal, impuestos || 0, total, empresa, 'PENDIENTE']
        );

        // 4. Registrar movimiento bancario en moviban
        await client.query('LOCK TABLE moviban IN SHARE ROW EXCLUSIVE MODE');

        const movibanNumRes = await client.query(
            `SELECT MAX(CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS BIGINT) ELSE 0 END) as max_numero
             FROM moviban WHERE empresa = $1`,
            [empresa]
        );
        const proximoNumMoviban = String((parseInt(movibanNumRes.rows[0].max_numero) || 0) + 1).padStart(10, '0');

        await client.query(
            `INSERT INTO moviban (tipo, numero, fecha, concepto, cheque, ingreso, egreso,
                                  banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                'GTO',
                proximoNumMoviban,
                fecha,
                ('GASTO DE COMPRA: ' + proximoCodigo).substring(0, 60),
                null,
                0,
                total,
                forma_pago,
                'NO',
                empresa,
                proximoCodigo,
                proveedor,
                null,
                ccosto
            ]
        );

        // 5. Obtener el gasto con JOINs para devolver nombres
        const gastoConNombresRes = await client.query(
            `SELECT
                g.codigo,
                g.fecha,
                g.factura,
                g.proveedor,
                COALESCE(p.nombre, g.proveedor) as proveedor_nombre,
                g.ccosto,
                COALESCE(cc.nombre, g.ccosto) as ccosto_nombre,
                g.concepto,
                g.total,
                g.empresa,
                g.subtotal,
                g.impuestos,
                g.cuenta,
                g.forma_pago,
                COALESCE(cb.nombre_cta, g.forma_pago) as forma_pago_nombre,
                g.estado,
                g.entrada_almacen,
                g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_bancarias cb ON g.forma_pago = cb.codigo AND cb.empresa = g.empresa
             WHERE g.codigo = $1 AND g.empresa = $2`,
            [proximoCodigo, empresa]
        );

        await client.query('COMMIT');

        res.status(201).json({ success: true, data: gastoConNombresRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/contabilidad/gastos/verificar-factura — detecta si ya existe un
// gasto registrado para la misma empresa + proveedor + número de factura.
// Se usa para advertir antes de guardar (posible factura duplicada).
app.get('/api/contabilidad/gastos/verificar-factura', async (req, res) => {
    try {
        const { empresa, proveedor, factura, excluir_codigo } = req.query;
        if (!empresa || !proveedor || !factura || !factura.trim()) {
            return res.json({ success: true, existe: false, data: [] });
        }
        const params = [empresa, proveedor, factura.trim()];
        let where = 'WHERE g.empresa = $1 AND g.proveedor = $2 AND UPPER(g.factura) = UPPER($3)';
        if (excluir_codigo) {
            params.push(excluir_codigo);
            where += ` AND g.codigo <> $${params.length}`;
        }
        const r = await pool.query(
            `SELECT g.codigo, g.fecha, g.total, g.concepto
             FROM gastos g
             ${where}
             ORDER BY g.fecha DESC, g.codigo`,
            params
        );
        res.json({ success: true, existe: r.rows.length > 0, data: r.rows });
    } catch (error) {
        console.error('Error GET /api/contabilidad/gastos/verificar-factura:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/gastos/multiple — registra UNA factura de compra
// distribuida en varias líneas (ccosto + cuenta contable + montos).
// Crea N registros en gastos (uno por línea) pero UN SOLO asiento en moviban
// por el total de la factura. Las líneas de materia prima pueden incluir
// entrada de almacén a la bodega maestra y actualización del precio de costo.
// Body: { empresa, fecha, factura, proveedor, forma_pago, lineas: [
//   { ccosto, cuenta, concepto, subtotal, impuestos, total,
//     materiaPrima?: { afectaInventario, actualizaCosto,
//                      items: [{ codigo, cantidad, costoUnit }] } } ] }
app.post('/api/contabilidad/gastos/multiple', async (req, res) => {
    const client = await pool.connect();
    try {
        const { empresa, fecha, factura, proveedor, forma_pago, lineas } = req.body;

        if (!empresa || !fecha || !proveedor || !forma_pago) {
            return res.status(400).json({ success: false, error: 'Campos requeridos faltantes (fecha, proveedor, forma de pago)' });
        }
        if (!Array.isArray(lineas) || lineas.length === 0) {
            return res.status(400).json({ success: false, error: 'Debe incluir al menos una línea de distribución' });
        }
        for (const [i, ln] of lineas.entries()) {
            if (!ln.ccosto || !ln.cuenta) {
                return res.status(400).json({ success: false, error: `Línea ${i + 1}: centro de costo y cuenta contable son requeridos` });
            }
            if (!(parseFloat(ln.subtotal) > 0)) {
                return res.status(400).json({ success: false, error: `Línea ${i + 1}: el subtotal debe ser mayor a 0` });
            }
        }

        const totalFactura = lineas.reduce((s, ln) => s + (parseFloat(ln.total) || 0), 0);

        await client.query('BEGIN');

        // 1. Códigos consecutivos para las N líneas
        await client.query('LOCK TABLE gastos IN SHARE ROW EXCLUSIVE MODE');
        const codigoRes = await client.query(
            `SELECT MAX(CASE WHEN codigo ~ '^[0-9]+$' THEN CAST(codigo AS BIGINT) ELSE 0 END) as max_codigo
             FROM gastos WHERE empresa = $1`,
            [empresa]
        );
        let seq = (parseInt(codigoRes.rows[0].max_codigo) || 0) + 1;

        // 2. Insertar un gasto por línea
        const codigos = [];
        for (const ln of lineas) {
            const codigo = String(seq).padStart(10, '0');
            const tieneEntrada = !!(ln.materiaPrima && Array.isArray(ln.materiaPrima.items) && ln.materiaPrima.items.length);
            await client.query(
                `INSERT INTO gastos (codigo, fecha, factura, proveedor, ccosto,
                                    forma_pago, cuenta, concepto, subtotal, impuestos, total, empresa, estado, entrada_almacen)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDIENTE', $13)`,
                [codigo, fecha, factura || null, proveedor, ln.ccosto,
                 forma_pago, ln.cuenta, (ln.concepto || '').toUpperCase(),
                 parseFloat(ln.subtotal) || 0, parseFloat(ln.impuestos) || 0, parseFloat(ln.total) || 0,
                 empresa, tieneEntrada ? 'SI' : null]
            );
            codigos.push(codigo);
            seq++;
        }

        // 3. UN SOLO movimiento bancario por el total de la factura
        await client.query('LOCK TABLE moviban IN SHARE ROW EXCLUSIVE MODE');
        const movibanNumRes = await client.query(
            `SELECT MAX(CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS BIGINT) ELSE 0 END) as max_numero
             FROM moviban WHERE empresa = $1`,
            [empresa]
        );
        const proximoNumMoviban = String((parseInt(movibanNumRes.rows[0].max_numero) || 0) + 1).padStart(10, '0');

        const conceptoMoviban = (codigos.length > 1
            ? `GASTO DE COMPRA: ${codigos[0]} A ${codigos[codigos.length - 1]}`
            : `GASTO DE COMPRA: ${codigos[0]}`).substring(0, 60);

        await client.query(
            `INSERT INTO moviban (tipo, numero, fecha, concepto, cheque, ingreso, egreso,
                                  banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            ['GTO', proximoNumMoviban, fecha, conceptoMoviban, null, 0, totalFactura,
             forma_pago, 'NO', empresa, codigos[0], proveedor, null, lineas[0].ccosto]
        );

        // 4. Materia prima: siempre guardar en entrada_almacen/detalle_entrada_almacen;
        //    condicionalmente afectar detalle_inventario y/o precio_costo
        let bodegaMaestra = null;
        // Ítems que se pidió llevar a inventario pero no existen como producto:
        // se informan al final para que el usuario sepa que solo quedó su compra.
        const omitidosInventario = new Set();
        await client.query('LOCK TABLE entrada_almacen IN SHARE ROW EXCLUSIVE MODE');
        const eaMaxRes = await client.query(
            `SELECT COALESCE(MAX(CASE WHEN codigo ~ '^[0-9]+$' THEN CAST(codigo AS BIGINT) ELSE 0 END), 0) AS max_cod
             FROM entrada_almacen WHERE empresa = $1`,
            [parseInt(empresa)]
        );
        let eaSeq = (parseInt(eaMaxRes.rows[0].max_cod) || 0) + 1;

        // ¿La empresa que registra el gasto es el principal (PROVEEDOR)?
        // Principal → actualiza el costo BASE. Cliente → actualiza SU capa de costo.
        const teRes = await client.query(`SELECT tipo_empresa FROM empresas WHERE codigo = $1`, [empresa]);
        const esPrincipal = (teRes.rows[0]?.tipo_empresa || 'PROVEEDOR') === 'PROVEEDOR';

        for (let i = 0; i < lineas.length; i++) {
            const mp = lineas[i].materiaPrima;
            if (!mp || !Array.isArray(mp.items) || !mp.items.length) continue;

            const itemsValidos = mp.items.filter(it => it.codigo && (parseFloat(it.cantidad) || 0) > 0);
            if (!itemsValidos.length) continue;

            // 4a. SIEMPRE: crear registro en entrada_almacen
            const eaCodigo = String(eaSeq++).padStart(10, '0');
            const totalEa = itemsValidos.reduce(
                (s, it) => s + (parseFloat(it.cantidad) || 0) * (parseFloat(it.costoUnit) || 0), 0
            );
            await client.query(
                `INSERT INTO entrada_almacen (codigo, empresa, fecha, gasto, proveedor, total)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [eaCodigo, empresa, fecha, codigos[i], proveedor, totalEa]
            );

            // 4b. SIEMPRE: crear detalle_entrada_almacen
            for (const item of itemsValidos) {
                const cant  = parseFloat(item.cantidad) || 0;
                const costo = parseFloat(item.costoUnit) || 0;
                await client.query(
                    `INSERT INTO detalle_entrada_almacen (articulo, cantidad, codigo, vr_unitario, subtotal, empresa)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [item.codigo, cant, eaCodigo, costo, cant * costo, empresa]
                );
            }

            // 4c. OPCIONAL: afectar inventario (detalle_inventario)
            //
            // Solo los ítems que existen como PRODUCTO mueven stock. Los artículos
            // (insumos de receta) se quedan fuera: detalle_inventario está ligada al
            // catálogo de productos — todos los reportes de almacén hacen JOIN contra
            // él — así que un artículo insertado ahí sería invisible en el kardex, la
            // toma física y la valoración, además de no caber en la columna.
            // Su compra y su costo sí quedan registrados en los pasos 4a/4b/4d.
            if (mp.afectaInventario) {
                if (!bodegaMaestra) {
                    const bmRes = await client.query(
                        `SELECT bodega_maestra FROM empresas WHERE codigo = $1`, [empresa]
                    );
                    bodegaMaestra = bmRes.rows[0]?.bodega_maestra;
                    if (!bodegaMaestra) throw new Error('Bodega maestra no configurada para esta empresa');
                }

                // Se resuelve contra la tabla productos, no contra el campo `origen`
                // que manda el cliente, para que el filtro no dependa del frontend.
                const codsLinea = itemsValidos.map(it => String(it.codigo).trim());
                const rProd = await client.query(
                    `SELECT TRIM(codigo) AS codigo FROM productos WHERE TRIM(codigo) = ANY($1::text[])`,
                    [codsLinea]
                );
                const esProducto = new Set(rProd.rows.map(r => r.codigo));

                for (const item of itemsValidos) {
                    const cod = String(item.codigo).trim();
                    if (!esProducto.has(cod)) { omitidosInventario.add(cod); continue; }
                    await client.query(
                        `INSERT INTO detalle_inventario (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                         VALUES ($1, $2, $3, $4, 0, 'ENTRADA DE ALMACEN', $5, $6)`,
                        [fecha, bodegaMaestra, cod, parseFloat(item.cantidad), empresa,
                         `COMPRA GASTO ${codigos[i]}${factura ? ' FACT ' + factura : ''}`.substring(0, 100)]
                    );
                }
            }

            // 4d. OPCIONAL: actualizar precio de costo (ruteado por empresa)
            //     PRINCIPAL → costo BASE (productos.precio_costo / articulos.valor)
            //     CLIENTE   → su capa de costo (producto_costo_empresa / articulo_costo_empresa),
            //                 sin tocar jamás el costo del principal ni de otros clientes.
            if (mp.actualizaCosto) {
                for (const item of itemsValidos) {
                    const costo = parseFloat(item.costoUnit) || 0;
                    if (costo <= 0) continue;
                    const cod = String(item.codigo).trim();
                    if (item.origen === 'ARTICULO') {
                        if (esPrincipal) {
                            await client.query(
                                `UPDATE articulos SET valor = $1 WHERE TRIM(codigo) = $2`,
                                [costo, cod]
                            );
                        } else {
                            await client.query(
                                `INSERT INTO articulo_costo_empresa (empresa, codigo, valor)
                                 VALUES ($1, $2, $3)
                                 ON CONFLICT (empresa, codigo) DO UPDATE SET valor = EXCLUDED.valor`,
                                [empresa, cod, costo]
                            );
                        }
                    } else {
                        if (esPrincipal) {
                            await client.query(
                                `UPDATE productos SET precio_costo = $1 WHERE codigo = $2`,
                                [costo, item.codigo]
                            );
                        } else {
                            await client.query(
                                `INSERT INTO producto_costo_empresa (empresa, codigo, precio_costo)
                                 VALUES ($1, $2, $3)
                                 ON CONFLICT (empresa, codigo) DO UPDATE SET precio_costo = EXCLUDED.precio_costo`,
                                [empresa, cod, costo]
                            );
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');

        // Nombres de los ítems que no movieron stock, para poder avisar en pantalla
        let omitidos = [];
        if (omitidosInventario.size) {
            const cods = [...omitidosInventario];
            const rNom = await pool.query(
                `SELECT TRIM(codigo) AS codigo, nombre FROM articulos WHERE TRIM(codigo) = ANY($1::text[])`,
                [cods]
            );
            const mapaNom = new Map(rNom.rows.map(r => [r.codigo, r.nombre]));
            omitidos = cods.map(c => ({ codigo: c, nombre: mapaNom.get(c) || c }));
        }

        res.status(201).json({
            success: true,
            data: { codigos, moviban: proximoNumMoviban, total: totalFactura, omitidos_inventario: omitidos }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/gastos/multiple:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/contabilidad/gastos/:codigo - Actualizar gasto + moviban
app.put('/api/contabilidad/gastos/:codigo', async (req, res) => {
    const client = await pool.connect();
    try {
        const { codigo } = req.params;
        const { fecha, factura, proveedor, ccosto, forma_pago,
                cuenta, concepto, subtotal, impuestos, total, empresa } = req.body;

        await client.query('BEGIN');

        // 1. Actualizar gasto
        await client.query(
            `UPDATE gastos
             SET fecha=$1, factura=$2, proveedor=$3, ccosto=$4, forma_pago=$5,
                 cuenta=$6, concepto=$7, subtotal=$8, impuestos=$9, total=$10
             WHERE codigo=$11 AND empresa=$12`,
            [fecha, factura || null, proveedor, ccosto, forma_pago,
             cuenta, (concepto || '').toUpperCase(), subtotal, impuestos || 0, total, codigo, empresa]
        );

        // 2. Actualizar moviban asociado (identificado por gasto = codigo)
        await client.query(
            `UPDATE moviban
             SET fecha=$1, egreso=$2, banco=$3, beneficia=$4, ccosto=$5
             WHERE gasto=$6 AND empresa=$7`,
            [fecha, total, forma_pago, proveedor, ccosto, codigo, empresa]
        );

        await client.query('COMMIT');

        // 3. Obtener el gasto actualizado con JOINs para devolver nombres
        const result = await pool.query(
            `SELECT
                g.codigo,
                g.fecha,
                g.factura,
                g.proveedor,
                COALESCE(p.nombre, g.proveedor) as proveedor_nombre,
                g.ccosto,
                COALESCE(cc.nombre, g.ccosto) as ccosto_nombre,
                g.concepto,
                g.total,
                g.empresa,
                g.subtotal,
                g.impuestos,
                g.cuenta,
                g.forma_pago,
                COALESCE(cb.nombre_cta, g.forma_pago) as forma_pago_nombre,
                g.estado,
                g.entrada_almacen,
                g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_bancarias cb ON g.forma_pago = cb.codigo AND cb.empresa = g.empresa
             WHERE g.codigo = $1 AND g.empresa = $2`,
            [codigo, empresa]
        );

        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error PUT /api/contabilidad/gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// DELETE /api/contabilidad/gastos/:codigo - Eliminar gasto + moviban asociado
app.delete('/api/contabilidad/gastos/:codigo', async (req, res) => {
    const client = await pool.connect();
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];

        await client.query('BEGIN');

        // 1. Eliminar moviban asociado al gasto
        await client.query(
            'DELETE FROM moviban WHERE gasto = $1 AND empresa = $2',
            [codigo, empresa]
        );

        // 2. Eliminar gasto (validando que pertenece a la empresa)
        const result = await client.query(
            'DELETE FROM gastos WHERE codigo = $1 AND empresa = $2 RETURNING codigo',
            [codigo, empresa]
        );

        if (!result.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        }

        await client.query('COMMIT');
        res.json({ success: true, message: `Gasto ${codigo} eliminado` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error DELETE /api/contabilidad/gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/contabilidad/gastos/:codigo - Obtener un gasto específico
app.get('/api/contabilidad/gastos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            `SELECT g.codigo, g.fecha, g.factura, g.proveedor, p.nombre as proveedor_nombre,
                    g.ccosto, cc.nombre as ccosto_nombre,
                    g.forma_pago, COALESCE(cb.nombre_cta, g.forma_pago) as forma_pago_nombre,
                    g.cuenta, cta.cuenta as cuenta_nombre,
                    g.concepto, g.subtotal, g.impuestos, g.total, g.empresa,
                    g.estado, g.entrada_almacen, g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_bancarias cb ON g.forma_pago = cb.codigo AND cb.empresa = g.empresa
             LEFT JOIN cuentas cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
             WHERE g.codigo = $1 AND g.empresa = $2`,
            [codigo, empresa]
        );

        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error GET /api/contabilidad/gastos/:codigo:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/gastos/buscar - Búsqueda rápida
app.get('/api/contabilidad/gastos/buscar', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        const q = req.query.q || '';

        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
        if (!q) return res.json({ success: true, data: [] });

        const result = await pool.query(
            `SELECT g.codigo, g.fecha, g.factura, g.proveedor, p.nombre as proveedor_nombre,
                    g.ccosto, cc.nombre as ccosto_nombre, g.forma_pago,
                    g.cuenta, cta.cuenta as cuenta_nombre,
                    g.concepto, g.subtotal, g.impuestos, g.total, g.empresa
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
             WHERE g.empresa = $1 AND (g.codigo ILIKE $2 OR g.factura ILIKE $2 OR p.nombre ILIKE $2 OR g.concepto ILIKE $2)
             ORDER BY g.fecha DESC
             LIMIT 20`,
            [empresa, `%${q}%`]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/contabilidad/gastos/buscar:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/contabilidad/gastos/batch/eliminar - Eliminar múltiples gastos
app.post('/api/contabilidad/gastos/batch/eliminar', async (req, res) => {
    const client = await pool.connect();
    try {
        const { codigos, empresa } = req.body;

        if (!Array.isArray(codigos) || codigos.length === 0) {
            return res.status(400).json({ success: false, error: 'Códigos requeridos (array)' });
        }
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        await client.query('BEGIN');

        // 1. Eliminar movimientos asociados
        const placeholders = codigos.map((_, i) => `$${i + 1}`).join(',');
        await client.query(
            `DELETE FROM movimientos WHERE gasto_codigo IN (${placeholders}) AND empresa = $${codigos.length + 1}`,
            [...codigos, empresa]
        );

        // 2. Eliminar gastos
        const result = await client.query(
            `DELETE FROM gastos WHERE codigo IN (${placeholders}) AND empresa = $${codigos.length + 1} RETURNING codigo`,
            [...codigos, empresa]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${result.rows.length} gasto(s) eliminado(s)`,
            eliminados: result.rows.length
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/gastos/batch/eliminar:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/contabilidad/gastos/export/excel - Exportar a Excel
app.get('/api/contabilidad/gastos/export/excel', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const search = req.query.search || '';

        let where = 'WHERE g.empresa = $1';
        const params = [empresa];

        if (search) {
            params.push(`%${search}%`);
            where += ` AND (g.codigo ILIKE $${params.length} OR g.factura ILIKE $${params.length} OR p.nombre ILIKE $${params.length})`;
        }

        const result = await pool.query(
            `SELECT g.codigo, g.fecha, g.factura, p.nombre as proveedor,
                    cc.nombre as centro_costos, g.forma_pago,
                    cta.cuenta as cuenta_contable, g.concepto, g.subtotal, g.impuestos, g.total
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
             ${where}
             ORDER BY g.fecha DESC`,
            params
        );

        // Formatos simples para Excel (sin librerías externas, responder como JSON)
        // El frontend se encargará de convertir a Excel con SheetJS o similar
        res.json({
            success: true,
            data: result.rows,
            filename: `gastos-${new Date().toISOString().split('T')[0]}.xlsx`
        });
    } catch (error) {
        console.error('Error GET /api/contabilidad/gastos/export/excel:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DEBUG: GET /api/contabilidad/gastos/debug - Verificar datos en BD
app.get('/api/contabilidad/gastos/debug', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];

        // Verificar tabla gastos
        const countGastos = await pool.query('SELECT COUNT(*) FROM gastos');
        const totalGastos = parseInt(countGastos.rows[0].count);

        const countGastosEmpresa = await pool.query(
            'SELECT COUNT(*) FROM gastos WHERE empresa = $1',
            [empresa]
        );
        const totalGastosEmpresa = parseInt(countGastosEmpresa.rows[0].count);

        // Obtener algunos datos de ejemplo
        const ejemplos = await pool.query(
            'SELECT codigo, fecha, proveedor, empresa FROM gastos ORDER BY fecha DESC LIMIT 5'
        );

        res.json({
            success: true,
            debug: {
                total_gastos_bd: totalGastos,
                total_gastos_empresa: totalGastosEmpresa,
                empresa_buscada: empresa,
                ultimos_5_gastos: ejemplos.rows
            }
        });
    } catch (error) {
        console.error('Error DEBUG:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/contabilidad/gastos/proximo-codigo
app.get('/api/contabilidad/gastos/proximo-codigo', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            'SELECT MAX(CAST(codigo AS INTEGER)) as max_codigo FROM gastos WHERE empresa = $1',
            [empresa]
        );

        const proximoCodigo = String((parseInt(result.rows[0].max_codigo) || 0) + 1).padStart(10, '0');
        res.json({ success: true, codigo: proximoCodigo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// SQUARE: CONFIG GENERAL + IMPORTACIÓN
// ================================================================

// Asegurar columna cta_materia_prima en config_general (cuenta contable que
// dispara el flujo de entrada de almacén en Gestión de Gastos)
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS cta_materia_prima VARCHAR(10)`).catch(() => {});

// Valor por defecto de los checkboxes "Afectar inventario" / "Actualizar precio
// de costo" al abrir el diálogo de materia prima en Gestión de Gastos. Solo
// fija el estado inicial del checkbox — el usuario lo puede cambiar en cada
// línea/transacción sin que eso altere esta preferencia.
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS mp_afecta_inventario_default VARCHAR(2) DEFAULT 'SI'`).catch(() => {});
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS mp_actualiza_costo_default   VARCHAR(2) DEFAULT 'SI'`).catch(() => {});

// Reparación puntual: "CALDO DE GALLINA" quedó con codigo NULL (el POST viejo de
// /api/articulos insertaba sin código si no venía uno) — inservible, porque todo
// endpoint de artículos filtra por codigo, y por eso desaparecía en silencio de
// la entrada de almacén. Se corre una sola vez; UPDATE sobre 0 filas no hace daño
// en despliegues futuros donde ya quedó reparado.
pool.query(`
    UPDATE articulos SET codigo = '1034'
     WHERE codigo IS NULL AND nombre = 'CALDO DE GALLINA'
       AND NOT EXISTS (SELECT 1 FROM articulos WHERE TRIM(codigo) = '1034')
`).then(r => { if (r.rowCount) console.log('✅ Reparado articulo CALDO DE GALLINA -> codigo 1034'); })
  .catch(() => {});

// Cuentas bancarias predeterminadas para Importar Ventas (Square) — Cta. Otros y Cta. Efectivo
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS cta_bancaria_otros VARCHAR(10)`).catch(() => {});
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS cta_bancaria_efectivo VARCHAR(10)`).catch(() => {});

// Estado activo/inactivo de centros de costo (solo los activos aparecen en los menús)
pool.query(`ALTER TABLE ccostos ADD COLUMN IF NOT EXISTS activo VARCHAR(2) DEFAULT 'SI'`).catch(() => {});

// Centro de costo asignado al módulo de Proveeduría/Franquicias (empresa PROVEEDOR)
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS ccosto_proveeduria VARCHAR(10)`).catch(() => {});

// Valor estimado de inventario final (Almacén): usado por el Estado de Resultados
// como aproximación de la utilidad cuando el cierre del periodo aún no tiene una
// toma física oficial registrada en toma_fisica_valorizada (es_cierre = TRUE).
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS valor_estimado_inventario_final NUMERIC(14,2)`).catch(() => {});

// Tolerancia de pérdidas en Faltantes y Sobrantes (Toma Física): porcentaje máximo aceptable
// para determinar nivel de pérdida (EXCELENTE < 50%, BUENO < 100%, MALO >= 100% del valor)
pool.query(`ALTER TABLE config_general ADD COLUMN IF NOT EXISTS tolerancia_perdida_faltantes NUMERIC(5,2) DEFAULT 2.00`).catch(() => {});

// Centro de costo en facturas de venta (para P&L por ccosto)
pool.query(`ALTER TABLE factura_venta ADD COLUMN IF NOT EXISTS ccosto VARCHAR(10)`).catch(() => {});

// Vincular órdenes de despacho de bodega con órdenes de compra de proveeduría
// tipo: 'TRASLADO' (entre ccostos, flujo original) | 'VENTA' (despacho de una orden de compra de cliente)
pool.query(`ALTER TABLE ordenes_despacho ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'TRASLADO'`).catch(() => {});
pool.query(`ALTER TABLE ordenes_despacho ADD COLUMN IF NOT EXISTS orden_compra VARCHAR(30)`).catch(() => {});
pool.query(`ALTER TABLE ordenes_despacho ALTER COLUMN cc_destino DROP NOT NULL`).catch(() => {});

// GET /api/config-general
app.get('/api/config-general', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
    try {
        const result = await pool.query(
            'SELECT * FROM config_general WHERE empresa = $1',
            [empresa]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No existe configuración general para esta empresa' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error en /api/config-general:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/config-general  — actualiza los campos de config_general para la empresa
app.put('/api/config-general', async (req, res) => {
    const { empresa, ...fields } = req.body;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const allowed = [
        'cta_ventas', 'cta_comisiones', 'cta_descuentos_ventas',
        'cta_propinas', 'cta_impuestos', 'cta_egresos_impuestos',
        'cta_egresos_propinas', 'tipo_moviban_ventas', 'cuenta_efectivo',
        'cta_materia_prima', 'cta_bancaria_otros', 'cta_bancaria_efectivo',
        'ccosto_proveeduria',
        'mp_afecta_inventario_default', 'mp_actualiza_costo_default',
        'valor_estimado_inventario_final', 'tolerancia_perdida_faltantes'
    ];

    const sets = [];
    const values = [];
    let idx = 1;
    for (const f of allowed) {
        if (f in fields) {
            sets.push(`${f} = $${idx}`);
            values.push(fields[f] || null);
            idx++;
        }
    }
    if (sets.length === 0)
        return res.status(400).json({ success: false, error: 'Sin campos para actualizar' });

    values.push(empresa);
    try {
        const upd = await pool.query(
            `UPDATE config_general SET ${sets.join(', ')} WHERE empresa = $${idx} RETURNING *`,
            values
        );
        if (upd.rows.length === 0)
            return res.status(404).json({ success: false, error: 'No existe config_general para esta empresa' });
        res.json({ success: true, data: upd.rows[0] });
    } catch (error) {
        console.error('Error en PUT /api/config-general:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/square/importar-resumen
// Inserta hasta 7 registros en gastos + 1 registro en ventas (transacción atómica)
// Body: { empresa, fecha, ccosto, ventas: {...}, pagos: {...}, force }
app.post('/api/square/importar-resumen', async (req, res) => {
    const { empresa, fecha, ccosto, ccostoNombre, ventas, pagos,
            items = [], consumoItems = [],
            ctaSquare, ctaOtros, ctaEfectivo,
            force } = req.body;
    if (!empresa || !fecha || !ccosto) {
        return res.status(400).json({ success: false, error: 'empresa, fecha y ccosto son requeridos' });
    }
    if (!ventas || !pagos) {
        return res.status(400).json({ success: false, error: 'ventas y pagos son requeridos' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Leer config_general
        const cfgRes = await client.query(
            'SELECT * FROM config_general WHERE empresa = $1',
            [empresa]
        );
        if (cfgRes.rows.length === 0) throw new Error('No existe configuración general para esta empresa');
        const cfg = cfgRes.rows[0];

        // 2. Verificar duplicados en gastos (misma fecha + ccosto + empresa + origen=SQUARE)
        const dupRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM gastos
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND origen = 'SQUARE'`,
            [fecha, ccosto, empresa]
        );
        const dupCount = parseInt(dupRes.rows[0].cnt) || 0;

        // También verificar duplicado en ventas
        const dupVentasRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM ventas
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3`,
            [fecha, ccosto, parseInt(empresa)]
        );
        const dupVentasCount = parseInt(dupVentasRes.rows[0].cnt) || 0;

        // Verificar duplicado en detalle_ventas
        const dupDetalleRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM detalle_ventas
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3`,
            [fecha, ccosto, parseInt(empresa)]
        );
        const dupDetalleCount = parseInt(dupDetalleRes.rows[0].cnt) || 0;

        // Verificar duplicado en detalle_inventario
        const dupInvRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM detalle_inventario
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND tipo = 'SALIDA POR VENTA'`,
            [fecha, ccosto, parseInt(empresa)]
        );
        const dupInvCount = parseInt(dupInvRes.rows[0].cnt) || 0;

        // Verificar duplicado en moviban
        const dupMovRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM moviban
             WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND origen = 'SQUARE' AND tipo = 'IMP'`,
            [fecha, ccosto, parseInt(empresa)]
        );
        const dupMovCount = parseInt(dupMovRes.rows[0].cnt) || 0;

        const totalDups = dupCount + dupVentasCount + dupDetalleCount + dupInvCount + dupMovCount;
        console.log(`[importar-resumen] DUPLICATE CHECK: fecha=${fecha} ccosto=${ccosto} empresa=${empresa} → gastos=${dupCount} ventas=${dupVentasCount} detalle=${dupDetalleCount} inv=${dupInvCount} moviban=${dupMovCount}`);
        if (totalDups > 0 && !force) {
            // Obtener fila de muestra para diagnóstico
            let sampleRow = null;
            try {
                const sampleRes = await client.query(
                    `SELECT fecha::text, ccosto::text, empresa::text FROM ventas
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 LIMIT 1`,
                    [fecha, ccosto, parseInt(empresa)]
                );
                if (sampleRes.rows.length > 0) sampleRow = sampleRes.rows[0];
            } catch(_) {}
            await client.query('ROLLBACK');
            return res.json({
                success: false,
                conflict: true,
                count: dupCount,
                countVentas: dupVentasCount,
                countDetalle: dupDetalleCount,
                countInventario: dupInvCount,
                countMoviban: dupMovCount,
                sampleRow,
                message: `Ya existen registros para esta fecha, centro de costo y empresa.`
            });
        }
        if (totalDups > 0 && force) {
            if (dupCount > 0) {
                await client.query(
                    `DELETE FROM gastos
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND origen = 'SQUARE'`,
                    [fecha, ccosto, empresa]
                );
            }
            if (dupVentasCount > 0) {
                await client.query(
                    `DELETE FROM ventas
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3`,
                    [fecha, ccosto, parseInt(empresa)]
                );
            }
            if (dupDetalleCount > 0) {
                await client.query(
                    `DELETE FROM detalle_ventas
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3`,
                    [fecha, ccosto, parseInt(empresa)]
                );
            }
            if (dupInvCount > 0) {
                await client.query(
                    `DELETE FROM detalle_inventario
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND tipo = 'SALIDA POR VENTA'`,
                    [fecha, ccosto, parseInt(empresa)]
                );
            }
            if (dupMovCount > 0) {
                await client.query(
                    `DELETE FROM moviban
                     WHERE fecha = $1 AND ccosto = $2 AND empresa = $3 AND origen = 'SQUARE' AND tipo = 'IMP'`,
                    [fecha, ccosto, parseInt(empresa)]
                );
            }
        }

        // 3. Calcular valores (siempre positivos con Math.abs)
        const vBrutas   = Math.abs(parseFloat(ventas.ventasBrutas) || 0);
        const vDevoluc  = Math.abs(parseFloat(ventas.devoluciones) || 0);
        const vNetas    = Math.abs(parseFloat(ventas.ventasNetas)  || 0);
        const descuentos = Math.abs(parseFloat(ventas.descuentos)  || 0);
        const impuestos  = Math.abs(parseFloat(ventas.impuestos)   || 0);
        const propinas   = Math.abs(parseFloat(ventas.propinas)    || 0);
        const comisiones = Math.abs(parseFloat(pagos.comisiones)   || 0);
        const efectivo   = Math.abs(parseFloat(pagos.efectivo)     || 0);
        const tarjetas   = Math.abs(parseFloat(pagos.tarjeta)      || 0)
                         + Math.abs(parseFloat(pagos.tarjetaRegalo) || 0);
        const otros      = Math.abs(parseFloat(pagos.otro)         || 0);

        // 4. INSERT en tabla ventas
        await client.query(
            `INSERT INTO ventas
                (fecha, ccosto, ventas_brutas, devoluciones, descuentos, ventas_netas,
                 impuestos, propinas, comisiones, tarjetas, efectivo, empresa, otros)
             VALUES ($1, $2, $3, $4, $5, $6,
                     $7, $8, $9, $10, $11, $12, $13)`,
            [fecha, ccosto, vBrutas, vDevoluc, descuentos, vNetas,
             impuestos, propinas, comisiones, tarjetas, efectivo, parseInt(empresa), otros]
        );

        // 5. Bloquear tabla gastos y obtener MAX codigo
        await client.query('LOCK TABLE gastos IN SHARE ROW EXCLUSIVE MODE');
        const maxRes = await client.query(
            `SELECT COALESCE(MAX(CAST(codigo AS BIGINT)), 0) AS max_codigo
             FROM gastos WHERE empresa = $1`,
            [empresa]
        );
        let seq = parseInt(maxRes.rows[0].max_codigo) + 1;

        // 6. Definir los 7 registros de gastos
        const records = [
            { cuenta: cfg.cta_ventas,            valor: vNetas     },
            { cuenta: cfg.cta_descuentos_ventas,  valor: descuentos },
            { cuenta: cfg.cta_impuestos,          valor: impuestos  },
            { cuenta: cfg.cta_propinas,           valor: propinas   },
            { cuenta: cfg.cta_comisiones,         valor: comisiones },
            { cuenta: cfg.cta_egresos_impuestos,  valor: impuestos  },
            { cuenta: cfg.cta_egresos_propinas,   valor: propinas   },
        ];

        // 7. Insertar cada registro en gastos
        const insertados = [];
        for (const rec of records) {
            if (!rec.cuenta || rec.cuenta.trim() === '') continue;
            const codigo = String(seq).padStart(10, '0');
            await client.query(
                `INSERT INTO gastos
                    (codigo, fecha, factura, proveedor, ccosto, forma_pago,
                     cuenta, concepto, subtotal, impuestos, total,
                     empresa, estado, entrada_almacen, origen)
                 VALUES ($1, $2, NULL, NULL, $3, NULL,
                         $4, NULL, $5, 0, $5,
                         $6, 'PENDIENTE', NULL, 'SQUARE')`,
                [codigo, fecha, ccosto, rec.cuenta, rec.valor, empresa]
            );
            insertados.push({ codigo, cuenta: rec.cuenta, valor: rec.valor });
            seq++;
        }

        // 8. INSERT en detalle_ventas (un registro por ítem de artículos)
        let detallesInsertados = 0;
        for (const item of items) {
            if (!item.nombre) continue;
            const codigo  = item.sku  ? String(item.sku).substring(0, 6)       : null;
            const nombre  = item.nombre ? String(item.nombre).substring(0, 100) : '';
            const cant    = parseFloat(item.cantidad)         || 0;
            const vrUnit  = Math.abs(parseFloat(item.precioVenta) || 0);
            const subtot  = Math.abs(parseFloat(item.subtotal)    || 0);
            await client.query(
                `INSERT INTO detalle_ventas
                    (fecha, ccosto, codigo, nombre, cant, vr_unit, subtotal, empresa)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [fecha, ccosto, codigo, nombre, cant, vrUnit, subtot, parseInt(empresa)]
            );
            detallesInsertados++;
        }

        // 9. INSERT en detalle_inventario (un registro por ítem de consumo)
        let inventarioInsertados = 0;
        for (const c of consumoItems) {
            if (!c.codigo) continue;
            const salida = Math.abs(parseFloat(c.totalConsumo) || 0);
            await client.query(
                `INSERT INTO detalle_inventario
                    (fecha, ccosto, codigo, entrada, salida, tipo, empresa, observaciones)
                 VALUES ($1, $2, $3, 0, $4, 'SALIDA POR VENTA', $5, NULL)`,
                [fecha, ccosto, String(c.codigo), salida, parseInt(empresa)]
            );
            inventarioInsertados++;
        }

        // 10. INSERT en moviban — 3 registros: Efectivo, Tarjeta, Otros
        const maxMovRes = await client.query(
            `SELECT COALESCE(MAX(CAST(numero AS BIGINT)), 0) AS max_num
             FROM moviban WHERE empresa = $1`,
            [parseInt(empresa)]
        );
        let movSeq = parseInt(maxMovRes.rows[0].max_num) + 1;

        const nombreCcosto = (ccostoNombre || ccosto).toString().trim();
        const valorEfectivo = Math.abs(parseFloat(pagos.efectivo)      || 0);
        const valorTarjeta  = Math.abs(parseFloat(pagos.tarjeta)       || 0)
                            + Math.abs(parseFloat(pagos.tarjetaRegalo) || 0);
        const valorOtros    = Math.abs(parseFloat(pagos.otro)          || 0);

        // La cuenta Square es el saldo bancario real: Square deposita las ventas
        // con tarjeta YA DESCONTADA su comisión, no el bruto. `comisiones` ya se
        // registró arriba como gasto (cta_comisiones) — aquí solo se neteliza el
        // ingreso que entra al banco, para que el saldo de esa cuenta cuadre con
        // lo que Square efectivamente deposita. Math.max(0, …) evita un ingreso
        // negativo si algún día las comisiones superan el bruto de tarjeta.
        const valorTarjetaNeto = Math.max(0, valorTarjeta - comisiones);

        const movibanRecords = [
            { concepto: `VENTAS EFECTIVO - ${nombreCcosto}`, ingreso: valorEfectivo,     banco: ctaEfectivo || null },
            { concepto: `VENTAS TARJETA - ${nombreCcosto}`,  ingreso: valorTarjetaNeto,  banco: ctaSquare  || null },
            { concepto: `VENTAS OTROS - ${nombreCcosto}`,    ingreso: valorOtros,        banco: ctaOtros   || null },
        ];

        for (const mov of movibanRecords) {
            const numero = String(movSeq).padStart(10, '0');
            await client.query(
                `INSERT INTO moviban
                    (tipo, numero, fecha, concepto, cheque, ingreso, egreso,
                     banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                 VALUES ('IMP', $1, $2, $3, NULL, $4, 0,
                         $5, 'NO', $6, NULL, NULL, 'SQUARE', $7)`,
                [numero, fecha, mov.concepto.substring(0, 60), mov.ingreso,
                 mov.banco, parseInt(empresa), ccosto]
            );
            movSeq++;
        }

        await client.query('COMMIT');
        res.json({
            success: true,
            data: {
                registros: insertados,
                total: insertados.length,
                detalles: detallesInsertados,
                inventario: inventarioInsertados,
                moviban: movibanRecords.length,
                ventas: { fecha, ccosto, ventas_brutas: vBrutas, ventas_netas: vNetas }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/square/importar-resumen:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ================================================================
// REPORTE VENTAS POR PERÍODO
// ================================================================

// GET /api/tesoreria/ventas-periodo
// Retorna filas de la tabla ventas filtradas por empresa, rango de fechas y opcionalmente ccosto
app.get('/api/tesoreria/ventas-periodo', async (req, res) => {
    const { empresa, fechaInicio, fechaFin, ccostos } = req.query;
    if (!empresa || !fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, error: 'empresa, fechaInicio y fechaFin son requeridos' });
    }
    try {
        const params = [parseInt(empresa), fechaInicio, fechaFin];
        let ccostoFilter = '';
        if (ccostos) {
            const lista = ccostos.split(',').map(s => s.trim()).filter(Boolean);
            if (lista.length > 0) {
                const placeholders = lista.map((_, i) => `$${params.length + i + 1}`).join(', ');
                params.push(...lista);
                ccostoFilter = `AND v.ccosto IN (${placeholders})`;
            }
        }
        const sql = `
            SELECT
                v.fecha,
                SUM(COALESCE(v.ventas_brutas, 0))  AS ventas_brutas,
                SUM(COALESCE(v.devoluciones, 0))   AS devoluciones,
                SUM(COALESCE(v.descuentos, 0))     AS descuentos,
                SUM(COALESCE(v.ventas_netas, 0))   AS ventas_netas,
                SUM(COALESCE(v.impuestos, 0))      AS impuestos,
                SUM(COALESCE(v.propinas, 0))       AS propinas,
                SUM(COALESCE(v.comisiones, 0))     AS comisiones,
                SUM(COALESCE(v.tarjetas, 0))       AS tarjetas,
                SUM(COALESCE(v.efectivo, 0))       AS efectivo,
                SUM(COALESCE(v.otros, 0))          AS otros
            FROM ventas v
            WHERE v.empresa = $1
              AND v.fecha BETWEEN $2 AND $3
              ${ccostoFilter}
            GROUP BY v.fecha
            ORDER BY v.fecha ASC
        `;
        const result = await pool.query(sql, params);

        // Totales agregados
        const totals = result.rows.reduce((acc, r) => {
            acc.ventas_brutas  += parseFloat(r.ventas_brutas)  || 0;
            acc.devoluciones   += parseFloat(r.devoluciones)   || 0;
            acc.descuentos     += parseFloat(r.descuentos)     || 0;
            acc.ventas_netas   += parseFloat(r.ventas_netas)   || 0;
            acc.impuestos      += parseFloat(r.impuestos)      || 0;
            acc.propinas       += parseFloat(r.propinas)       || 0;
            acc.comisiones     += parseFloat(r.comisiones)     || 0;
            acc.tarjetas       += parseFloat(r.tarjetas)       || 0;
            acc.efectivo       += parseFloat(r.efectivo)       || 0;
            acc.otros          += parseFloat(r.otros)          || 0;
            return acc;
        }, { ventas_brutas:0, devoluciones:0, descuentos:0, ventas_netas:0,
             impuestos:0, propinas:0, comisiones:0, tarjetas:0, efectivo:0, otros:0 });

        res.json({ success: true, data: result.rows, totals, total: result.rowCount });
    } catch (error) {
        console.error('Error en /api/tesoreria/ventas-periodo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// MÓDULO PRODUCCIÓN — CONFIGURACIÓN
// ================================================================

// ── GRUPO DE PRODUCTOS DE VENTA ────────────────────────────────
// Asegurar columna activo en grupo_productos_venta
pool.query(`ALTER TABLE grupo_productos_venta ADD COLUMN IF NOT EXISTS activo VARCHAR(2) DEFAULT 'SI'`).catch(() => {});

// ── GRUPO DE PRODUCTOS (ALMACÉN) ────────────────────────────────
// Asegurar columna activo en grupo_productos
pool.query(`ALTER TABLE grupo_productos ADD COLUMN IF NOT EXISTS activo VARCHAR(2) DEFAULT 'SI'`).catch(() => {});

// ── PRODUCTOS ────────────────────────────────────────────────────
// Asegurar columnas en productos (franquicia/proveeduría/precios)
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS para_venta VARCHAR(2) DEFAULT 'NO'`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS visible_operacional VARCHAR(2) DEFAULT 'SI'`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT NULL`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_costo NUMERIC(12,2) DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_venta1 NUMERIC(12,2) DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_venta2 NUMERIC(12,2) DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_venta3 NUMERIC(12,2) DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(10,2) DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS receta_vinculada VARCHAR(50) DEFAULT NULL`).catch(() => {});
pool.query(`ALTER TABLE etiquetas_producto ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) DEFAULT NULL`).catch(() => {});

// Migración: asegurar precisión de 2 decimales en campos de precios (por si la columna existe con otro tipo)
(async () => {
    try {
        await pool.query(`ALTER TABLE productos ALTER COLUMN precio_costo  TYPE NUMERIC(12,2) USING precio_costo::NUMERIC(12,2)`);
        await pool.query(`ALTER TABLE productos ALTER COLUMN precio_venta1 TYPE NUMERIC(12,2) USING precio_venta1::NUMERIC(12,2)`);
        await pool.query(`ALTER TABLE productos ALTER COLUMN precio_venta2 TYPE NUMERIC(12,2) USING precio_venta2::NUMERIC(12,2)`);
        await pool.query(`ALTER TABLE productos ALTER COLUMN precio_venta3 TYPE NUMERIC(12,2) USING precio_venta3::NUMERIC(12,2)`);
        await pool.query(`ALTER TABLE productos ALTER COLUMN stock_minimo  TYPE NUMERIC(10,2) USING stock_minimo::NUMERIC(10,2)`);
        console.log('✅ Precisión de columnas de precios asegurada (2 decimales)');
    } catch (e) { console.error('Error migrando precisión de precios:', e.message); }
})();

// ── COSTOS POR EMPRESA (Fase 1) ───────────────────────────────
// Capas de costo por empresa sobre el catálogo compartido. El costo BASE sigue
// en productos.precio_costo / articulos.valor / recetas.valor (= costos del
// principal). Cada empresa CLIENTE guarda aquí SU propio costo; las lecturas
// resuelven COALESCE(costo_empresa, costo_base). Ver memoria costos-por-empresa.
(async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS producto_costo_empresa (
            empresa      VARCHAR(20)   NOT NULL,
            codigo       VARCHAR(30)   NOT NULL,
            precio_costo NUMERIC(12,2) DEFAULT 0,
            PRIMARY KEY (empresa, codigo)
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS articulo_costo_empresa (
            empresa VARCHAR(20)   NOT NULL,
            codigo  VARCHAR(30)   NOT NULL,
            valor   NUMERIC(12,4) DEFAULT 0,
            PRIMARY KEY (empresa, codigo)
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS receta_costo_empresa (
            empresa VARCHAR(20)   NOT NULL,
            codigo  VARCHAR(30)   NOT NULL,
            valor   NUMERIC(12,4) DEFAULT 0,
            PRIMARY KEY (empresa, codigo)
        )`);
        console.log('✅ Tablas de costo por empresa listas');
    } catch (e) { console.error('Error creando tablas de costo por empresa:', e.message); }
})();

// ── NOTIFICACIONES ────────────────────────────────────────────
// Tabla base de notificaciones
pool.query(`
    CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        empresa VARCHAR(20),
        titulo VARCHAR(200),
        mensaje TEXT,
        tipo VARCHAR(30),
        url VARCHAR(500),
        id_producto VARCHAR(10),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(() => {});

// Tabla de seguimiento de lectura por usuario
pool.query(`
    CREATE TABLE IF NOT EXISTS notificaciones_usuarios (
        id SERIAL PRIMARY KEY,
        notificacion_id INTEGER REFERENCES notificaciones(id) ON DELETE CASCADE,
        usuario_codigo VARCHAR(20),
        leida VARCHAR(2) DEFAULT 'NO',
        fecha_lectura TIMESTAMP,
        UNIQUE(notificacion_id, usuario_codigo)
    )
`).catch(() => {});

// Tabla para descartes permanentes de notificaciones por usuario
pool.query(`
    CREATE TABLE IF NOT EXISTS notificaciones_descartadas (
        notificacion_id INTEGER REFERENCES notificaciones(id) ON DELETE CASCADE,
        usuario_codigo VARCHAR(20),
        fecha_descarte TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (notificacion_id, usuario_codigo)
    )
`).catch(() => {});

// Tabla de preferencias de notificaciones por usuario
pool.query(`
    CREATE TABLE IF NOT EXISTS preferencias_notificaciones (
        id SERIAL PRIMARY KEY,
        empresa VARCHAR(20),
        tipo VARCHAR(30),
        activa VARCHAR(2) DEFAULT 'SI',
        usuarios_receptores TEXT DEFAULT '[]',
        UNIQUE(empresa, tipo)
    )
`).catch(() => {});

// Migración: eliminar FK constraint detalle_ordenes_producto_venta_fkey
pool.query(`ALTER TABLE detalle_ordenes DROP CONSTRAINT IF EXISTS detalle_ordenes_producto_venta_fkey`).catch(() => {});

// Migración: adaptar tabla preferencias_notificaciones al nuevo esquema empresa-based
(async () => {
    try {
        // 1. Agregar columna empresa si no existe
        await pool.query(`ALTER TABLE preferencias_notificaciones ADD COLUMN IF NOT EXISTS empresa VARCHAR(20)`);
        // 2. Agregar columna usuarios_receptores si no existe
        await pool.query(`ALTER TABLE preferencias_notificaciones ADD COLUMN IF NOT EXISTS usuarios_receptores TEXT DEFAULT '[]'`);
        // 3. Si existe columna usuario_codigo, copiar datos a empresa
        const cols = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'preferencias_notificaciones' AND column_name = 'usuario_codigo'
        `);
        if (cols.rows.length > 0) {
            await pool.query(`UPDATE preferencias_notificaciones SET empresa = usuario_codigo WHERE empresa IS NULL`);
        }
        // 4. Intentar agregar el UNIQUE constraint en (empresa, tipo) si no existe
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'preferencias_notificaciones_empresa_tipo_key'
                ) THEN
                    ALTER TABLE preferencias_notificaciones ADD CONSTRAINT preferencias_notificaciones_empresa_tipo_key UNIQUE (empresa, tipo);
                END IF;
            END$$;
        `);
        console.log('✅ Migración preferencias_notificaciones completa');
    } catch (e) { console.error('Error migrando preferencias_notificaciones:', e.message); }
})();

// Migración: backfill de producto_barcodes.empresa
// La pantalla Almacén > Configuración > Productos nunca envió `empresa` al crear
// o consultar códigos de barras (bug de origen — ninguna otra pantalla toca esta
// tabla), así que todo lo registrado hasta ahora quedó con empresa = NULL. El GET
// filtra por empresa = $1 con el valor real de la empresa activa, así que esos
// registros existentes se volvían invisibles aunque estuvieran ahí. Se asignan
// una sola vez a la empresa PROVEEDOR (la principal, dueña del catálogo de
// productos), que es bajo la que se estuvieron creando en la práctica.
(async () => {
    try {
        const prov = await pool.query(`SELECT codigo FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`);
        const empresaPrincipal = prov.rows[0]?.codigo;
        if (empresaPrincipal) {
            const upd = await pool.query(
                `UPDATE producto_barcodes SET empresa = $1 WHERE empresa IS NULL`,
                [String(empresaPrincipal)]
            );
            if (upd.rowCount > 0) console.log(`✅ Backfill producto_barcodes.empresa: ${upd.rowCount} fila(s)`);
        }
    } catch (e) { console.error('Error en backfill producto_barcodes.empresa:', e.message); }
})();

// FUNCIÓN AUXILIAR: Crear notificación de orden de compra para proveedor
async function crearNotificacionOrdenCompra(codigoOrden, cliente, accion = 'creada') {
    try {
        // Obtener empresa PROVEEDOR
        const proveedorRes = await pool.query(
            `SELECT codigo FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`
        );
        if (proveedorRes.rows.length === 0) return;

        const empresaProveedor = proveedorRes.rows[0].codigo;

        // Obtener usuarios receptores de notificaciones de orden de compra
        const prefRes = await pool.query(
            `SELECT usuarios_receptores FROM preferencias_notificaciones
             WHERE empresa = $1 AND tipo = 'ORDEN_COMPRA' AND activa = 'SI'`,
            [empresaProveedor]
        );

        if (prefRes.rows.length === 0) return;

        const usuarios = JSON.parse(prefRes.rows[0].usuarios_receptores || '[]');
        if (usuarios.length === 0) return;

        // Obtener detalles de la orden para fecha de entrega
        const ordenRes = await pool.query(
            `SELECT fecha_entrega FROM ordenes_compra WHERE codigo = $1`,
            [codigoOrden]
        );
        const fechaEntrega = ordenRes.rows[0]?.fecha_entrega;

        // Formatear fecha de entrega
        let fechaFormato = '';
        if (fechaEntrega) {
            const fecha = new Date(fechaEntrega);
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const mes = meses[fecha.getMonth()];
            const dia = fecha.getDate();
            const año = fecha.getFullYear();
            fechaFormato = `${mes} ${dia} de ${año}`;
        }

        const titulo = accion === 'creada' ? 'Nueva Orden de Compra' : 'Orden de Compra Modificada';
        const mensaje = `Orden de Compra: ${codigoOrden}${fechaFormato ? `, Fecha de Entrega: ${fechaFormato}` : ''}`;

        // Crear notificación
        const notifResult = await pool.query(
            `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, fecha_creacion)
             VALUES ($1, $2, $3, 'ORDEN_COMPRA', NOW())
             RETURNING id`,
            [empresaProveedor, titulo, mensaje]
        );

        const notif_id = notifResult.rows[0].id;

        // Crear registro para cada usuario
        for (const usuario of usuarios) {
            await pool.query(
                `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                 VALUES ($1, $2, 'NO')`,
                [notif_id, usuario]
            ).catch(() => {});
        }
    } catch (e) {
        console.error('Error creando notificación de orden de compra:', e.message);
    }
}

// FUNCIÓN AUXILIAR: Verificar stock y generar notificaciones automáticas
// SOLO genera notificaciones si el ccosto ES la bodega maestra de la empresa
async function verificarYGenerarNotificacionesStock(codigo, ccosto, empresa) {
    try {
        // Verificar que el ccosto sea la bodega maestra — si no, salir sin hacer nada
        const bodegaRes = await pool.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`,
            [String(empresa)]
        );
        const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra;
        if (!bodegaMaestra || bodegaMaestra !== ccosto) return;

        // Obtener stock actual
        const stockResult = await pool.query(
            `SELECT COALESCE(SUM(entrada), 0) - COALESCE(SUM(salida), 0) AS stock_actual
             FROM detalle_inventario
             WHERE codigo = $1 AND ccosto = $2 AND empresa = $3`,
            [codigo, ccosto, empresa]
        );
        const stock_actual = stockResult.rows[0]?.stock_actual || 0;

        // Obtener stock_minimo del producto
        const productoResult = await pool.query(
            `SELECT nombre, stock_minimo FROM productos WHERE codigo = $1`,
            [codigo]
        );
        if (productoResult.rows.length === 0) return;

        const producto = productoResult.rows[0];
        const stock_minimo = parseFloat(producto.stock_minimo) || 0;
        const nombre_producto = producto.nombre;

        // Formatear números: sin decimales innecesarios
        const fmt = n => Number(parseFloat(n).toFixed(2)).toString();

        // Determinar tipo de notificación según stock
        let tipo = null;
        let titulo = null;
        let mensaje = null;

        if (stock_actual < 0) {
            tipo = 'alerta_general';
            titulo = `⚠️ ${nombre_producto} en NEGATIVO`;
            mensaje = `El producto ${nombre_producto} se encuentra en NEGATIVO: ${fmt(stock_actual)} unidades. Verificar error en el inventario inmediatamente.`;
        } else if (stock_actual === 0) {
            tipo = 'stock_fuera';
            titulo = `🔴 FUERA DE STOCK: ${nombre_producto}`;
            mensaje = `El producto ${nombre_producto} está FUERA DE STOCK (0 unidades).`;
        } else if (stock_actual < stock_minimo) {
            tipo = 'stock_bajo';
            titulo = `🟡 STOCK BAJO: ${nombre_producto}`;
            mensaje = `El producto ${nombre_producto} está por debajo del mínimo. Stock actual: ${fmt(stock_actual)} | Stock Mínimo: ${fmt(stock_minimo)}`;
        }

        // Si hay notificación que generar
        if (tipo) {
            // Obtener preferencias de la empresa
            const prefsResult = await pool.query(
                `SELECT usuarios_receptores FROM preferencias_notificaciones
                 WHERE empresa = $1 AND tipo = $2 AND activa = 'SI'`,
                [empresa, tipo]
            );

            if (prefsResult.rows.length > 0 && prefsResult.rows[0].usuarios_receptores) {
                const usuarios = JSON.parse(prefsResult.rows[0].usuarios_receptores || '[]');

                if (usuarios.length > 0) {
                    // Crear notificación
                    const notifResult = await pool.query(
                        `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, id_producto, fecha_creacion)
                         VALUES ($1, $2, $3, $4, $5, NOW())
                         RETURNING id`,
                        [empresa, titulo, mensaje, tipo, codigo]
                    );

                    const notif_id = notifResult.rows[0].id;

                    // Crear registro para cada usuario
                    for (const usuario of usuarios) {
                        await pool.query(
                            `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                             VALUES ($1, $2, 'NO')`,
                            [notif_id, usuario]
                        ).catch(() => {}); // Ignore errors if user doesn't exist
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error verificando stock y generando notificaciones:', e);
    }
}

// POST /api/verificar-stock/:codigo - Verificar stock y generar notificaciones (para debugging)
app.post('/api/verificar-stock/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { ccosto } = req.body;
        const empresa = req.query.empresa || req.headers['x-empresa'];

        if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
        if (!ccosto) return res.status(400).json({ success: false, error: 'Centro de costo requerido' });

        await verificarYGenerarNotificacionesStock(codigo, ccosto, empresa);
        res.json({ success: true, message: 'Verificación completada' });
    } catch (e) {
        console.error('Error en POST /api/verificar-stock:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint: obtener notificaciones del usuario actual
// ── NOTIFICACIONES: sistema rediseñado ──────────────────────────────
// Tabla notificaciones_descartadas: PRIMARY KEY (notificacion_id, usuario_codigo)
// Garantiza que una notificacion descartada nunca vuelve a aparecer

app.get('/api/notificaciones', async (req, res) => {
    try {
        const usuarioCod = req.query.usuario || req.headers['x-usuario'];
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!usuarioCod) return res.status(400).json({ success: false, error: 'Usuario requerido' });
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const result = await pool.query(
            `SELECT n.id, n.titulo, n.mensaje, n.tipo, n.url, n.id_producto, n.fecha_creacion,
                    CASE WHEN nu.leida = 'SI' THEN 'SI' ELSE 'NO' END AS leida
             FROM notificaciones n
             LEFT JOIN notificaciones_usuarios nu
               ON n.id = nu.notificacion_id AND nu.usuario_codigo = $1
             WHERE n.empresa = $2
               AND n.id NOT IN (
                 SELECT notificacion_id FROM notificaciones_descartadas WHERE usuario_codigo = $1
               )
             ORDER BY n.fecha_creacion DESC
             LIMIT 50`,
            [usuarioCod, empresaCod]
        );
        res.json({ success: true, data: result.rows });
    } catch (e) {
        console.error('Error GET /api/notificaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/notificaciones/sin-leer/count', async (req, res) => {
    try {
        const usuarioCod = req.query.usuario || req.headers['x-usuario'];
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!usuarioCod) return res.status(400).json({ success: false, error: 'Usuario requerido' });
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const result = await pool.query(
            `SELECT COUNT(*) as total
             FROM notificaciones n
             LEFT JOIN notificaciones_usuarios nu
               ON n.id = nu.notificacion_id AND nu.usuario_codigo = $1
             WHERE n.empresa = $2
               AND COALESCE(nu.leida, 'NO') = 'NO'
               AND n.id NOT IN (
                 SELECT notificacion_id FROM notificaciones_descartadas WHERE usuario_codigo = $1
               )`,
            [usuarioCod, empresaCod]
        );
        res.json({ success: true, data: { total: parseInt(result.rows[0].total) } });
    } catch (e) {
        console.error('Error GET /api/notificaciones/sin-leer/count:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.patch('/api/notificaciones/:id/leer', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioCod = req.query.usuario || req.headers['x-usuario'];
        if (!usuarioCod) return res.status(400).json({ success: false, error: 'Usuario requerido' });

        await pool.query(
            `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida, fecha_lectura)
             VALUES ($1, $2, 'SI', NOW())
             ON CONFLICT (notificacion_id, usuario_codigo)
             DO UPDATE SET leida = 'SI', fecha_lectura = NOW()`,
            [id, usuarioCod]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PATCH /api/notificaciones/:id/leer:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE individual — descarta permanentemente la notificación para este usuario
app.delete('/api/notificaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioCod = req.query.usuario || req.headers['x-usuario'];
        if (!usuarioCod) return res.status(400).json({ success: false, error: 'Usuario requerido' });

        await pool.query(
            `INSERT INTO notificaciones_descartadas (notificacion_id, usuario_codigo, fecha_descarte)
             VALUES ($1, $2, NOW())
             ON CONFLICT (notificacion_id, usuario_codigo) DO NOTHING`,
            [id, usuarioCod]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/notificaciones/:id:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE todas — descarta todas las notificaciones visibles del usuario
app.delete('/api/notificaciones', async (req, res) => {
    try {
        const usuarioCod = req.query.usuario || req.headers['x-usuario'];
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!usuarioCod) return res.status(400).json({ success: false, error: 'Usuario requerido' });

        await pool.query(
            `INSERT INTO notificaciones_descartadas (notificacion_id, usuario_codigo, fecha_descarte)
             SELECT n.id, $1, NOW()
             FROM notificaciones n
             WHERE n.empresa = $2
               AND n.id NOT IN (
                 SELECT notificacion_id FROM notificaciones_descartadas WHERE usuario_codigo = $1
               )
             ON CONFLICT (notificacion_id, usuario_codigo) DO NOTHING`,
            [usuarioCod, empresaCod]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/notificaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint: obtener preferencias del usuario
// GET /api/preferencias-notificaciones - obtener todas las preferencias de la empresa con tipos disponibles
app.get('/api/preferencias-notificaciones', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        // Obtener todos los tipos de notificaciones disponibles
        const tiposResult = await pool.query(
            `SELECT valor, label, descripcion, icon, activo FROM tipos_notificaciones WHERE activo = 'SI' ORDER BY valor`
        );

        // Obtener las preferencias de la empresa
        const prefsResult = await pool.query(
            `SELECT tipo, activa, usuarios_receptores FROM preferencias_notificaciones WHERE empresa = $1`,
            [empresaCod]
        );

        // Mapear tipos con sus preferencias
        const prefs = {};
        prefsResult.rows.forEach(pref => {
            prefs[pref.tipo] = {
                activa: pref.activa,
                usuarios_receptores: pref.usuarios_receptores ? JSON.parse(pref.usuarios_receptores) : []
            };
        });

        const data = tiposResult.rows.map(tipo => ({
            ...tipo,
            activa: prefs[tipo.valor]?.activa || 'NO',
            usuarios_receptores: prefs[tipo.valor]?.usuarios_receptores || []
        }));

        res.json({ success: true, data });
    } catch (e) {
        console.error('Error GET /api/preferencias-notificaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/preferencias-notificaciones/:tipo - actualizar preferencia (activa + usuarios receptores)
app.put('/api/preferencias-notificaciones/:tipo', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        const { tipo } = req.params;
        const { activa, usuarios_receptores } = req.body;

        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const usuariosJson = JSON.stringify(usuarios_receptores || []);

        // Intentar UPDATE primero, si no existe hacer INSERT
        const upd = await pool.query(
            `UPDATE preferencias_notificaciones SET activa = $3, usuarios_receptores = $4
             WHERE empresa = $1 AND tipo = $2`,
            [empresaCod, tipo, activa || 'SI', usuariosJson]
        );
        if (upd.rowCount === 0) {
            await pool.query(
                `INSERT INTO preferencias_notificaciones (empresa, tipo, activa, usuarios_receptores)
                 VALUES ($1, $2, $3, $4)`,
                [empresaCod, tipo, activa || 'SI', usuariosJson]
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/preferencias-notificaciones/:tipo:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Tabla de tipos de notificaciones
pool.query(`
    CREATE TABLE IF NOT EXISTS tipos_notificaciones (
        id SERIAL PRIMARY KEY,
        valor VARCHAR(30) UNIQUE,
        label VARCHAR(100),
        descripcion TEXT,
        icon VARCHAR(50),
        activo VARCHAR(2) DEFAULT 'SI',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(() => {});

// Insertar tipos de notificaciones por defecto
const TIPOS_NOTIFICACIONES_DEFAULT = [
    { valor: 'ORDEN_COMPRA', label: 'Órdenes de Compra', descripcion: 'Notificación cuando un cliente crea o edita una orden de compra', icon: 'mdi-clipboard-list' },
    { valor: 'stock_fuera', label: 'Stock Fuera (0 unidades)', descripcion: 'Alerta cuando un producto no tiene stock disponible', icon: 'mdi-alert-circle' },
    { valor: 'stock_bajo', label: 'Stock Bajo (bajo mínimo)', descripcion: 'Alerta cuando el stock está por debajo del mínimo', icon: 'mdi-alert' },
    { valor: 'alerta_general', label: 'Alertas Generales', descripcion: 'Alertas y cambios importantes del sistema', icon: 'mdi-bell' },
    { valor: 'actualizaciones', label: 'Actualizaciones del Sistema', descripcion: 'Notificaciones sobre mantenimiento y nuevas características', icon: 'mdi-refresh' },
    { valor: 'reportes', label: 'Reportes Completados', descripcion: 'Notificaciones cuando tus reportes están listos', icon: 'mdi-file-chart' },
    { valor: 'DESPACHO_BODEGA', label: 'Despachos de Bodega', descripcion: 'Notificación cuando se crea o completa un despacho de bodega', icon: 'mdi-truck-delivery' },
];

// Insertar tipos por defecto si no existen
TIPOS_NOTIFICACIONES_DEFAULT.forEach(tipo => {
    pool.query(
        `INSERT INTO tipos_notificaciones (valor, label, descripcion, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (valor) DO NOTHING`,
        [tipo.valor, tipo.label, tipo.descripcion, tipo.icon]
    ).catch(() => {});
});

// Endpoint: obtener todos los tipos de notificaciones
app.get('/api/admin/tipos-notificaciones', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, valor, label, descripcion, icon, activo, fecha_creacion
             FROM tipos_notificaciones
             ORDER BY fecha_creacion DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (e) {
        console.error('Error GET /api/admin/tipos-notificaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint: crear tipo de notificación
app.post('/api/admin/tipos-notificaciones', async (req, res) => {
    try {
        const { valor, label, descripcion, icon } = req.body;
        if (!valor || !label) return res.status(400).json({ success: false, error: 'valor y label requeridos' });

        const result = await pool.query(
            `INSERT INTO tipos_notificaciones (valor, label, descripcion, icon)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [valor, label, descripcion || null, icon || 'mdi-bell']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        console.error('Error POST /api/admin/tipos-notificaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint: actualizar tipo de notificación
app.put('/api/admin/tipos-notificaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { label, descripcion, icon, activo } = req.body;

        const result = await pool.query(
            `UPDATE tipos_notificaciones
             SET label = COALESCE($1, label),
                 descripcion = COALESCE($2, descripcion),
                 icon = COALESCE($3, icon),
                 activo = COALESCE($4, activo)
             WHERE id = $5
             RETURNING *`,
            [label || null, descripcion || null, icon || null, activo || null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        console.error('Error PUT /api/admin/tipos-notificaciones/:id:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint: eliminar tipo de notificación
app.delete('/api/admin/tipos-notificaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM tipos_notificaciones WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/admin/tipos-notificaciones/:id:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/admin/actualizaciones — Crear notificación de actualización (solo admin)
app.post('/api/admin/actualizaciones', async (req, res) => {
    try {
        const { empresa, titulo, mensaje, usuarios_receptores } = req.body;

        if (!empresa || !titulo || !mensaje) {
            return res.status(400).json({ success: false, error: 'empresa, titulo y mensaje son requeridos' });
        }

        // Crear notificación de actualización
        const notifRes = await pool.query(
            `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo)
             VALUES ($1, $2, $3, 'actualizaciones')
             RETURNING id`,
            [empresa, titulo, mensaje]
        );

        const notif_id = notifRes.rows[0].id;

        res.json({ success: true, notificacion_id: notif_id, mensaje: 'Actualización registrada correctamente' });
    } catch (e) {
        console.error('Error POST /api/admin/actualizaciones:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Función interna para crear notificación (respeta preferencias)
async function crearNotificacion(empresa, titulo, mensaje, tipo, usuarios_codigo = null, url = null, id_producto = null) {
    try {
        // Insertar notificación base
        const notifRes = await pool.query(
            `INSERT INTO notificaciones (empresa, titulo, mensaje, tipo, url, id_producto)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [empresa, titulo, mensaje, tipo, url || null, id_producto || null]
        );
        const notifId = notifRes.rows[0].id;

        // Obtener todos los usuarios de la empresa si no se especificaron
        let usuariosDestino = usuarios_codigo;
        if (!usuariosDestino || usuariosDestino.length === 0) {
            const usuariosRes = await pool.query(
                `SELECT DISTINCT usuario FROM acceso WHERE empresa = $1`,
                [empresa]
            );
            usuariosDestino = usuariosRes.rows.map(r => r.usuario);
        }

        // Crear registro para cada usuario que tenga esta notificación activa
        for (const usuarioCod of usuariosDestino) {
            const prefRes = await pool.query(
                `SELECT activa FROM preferencias_notificaciones WHERE usuario_codigo = $1 AND tipo = $2`,
                [usuarioCod, tipo]
            );

            // Si no existe preferencia o está activa, crear la notificación
            if (prefRes.rows.length === 0 || prefRes.rows[0].activa === 'SI') {
                await pool.query(
                    `INSERT INTO notificaciones_usuarios (notificacion_id, usuario_codigo, leida)
                     VALUES ($1, $2, 'NO')
                     ON CONFLICT DO NOTHING`,
                    [notifId, usuarioCod]
                );
            }
        }
    } catch (e) {
        console.error('Error creando notificación:', e);
    }
}

app.get('/api/produccion/grupo-productos', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT codigo, nombre, COALESCE(activo,'SI') AS activo FROM grupo_productos_venta ORDER BY nombre`
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/produccion/grupo-productos:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET próximo código auto (3 dígitos)
app.get('/api/produccion/grupo-productos/proximo-codigo', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT codigo FROM grupo_productos_venta WHERE codigo ~ '^[0-9]+$' ORDER BY CAST(codigo AS INTEGER) DESC LIMIT 1`
        );
        const max = r.rows.length ? parseInt(r.rows[0].codigo) : 0;
        res.json({ success: true, codigo: String(max + 1).padStart(3, '0') });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/produccion/grupo-productos', async (req, res) => {
    const { codigo, nombre, activo = 'SI' } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ success: false, error: 'codigo y nombre son requeridos' });
    try {
        await pool.query(
            `INSERT INTO grupo_productos_venta (codigo, nombre, activo) VALUES ($1, $2, $3)`,
            [codigo.toUpperCase(), nombre, activo]
        );
        const r = await pool.query(
            `SELECT codigo, nombre, COALESCE(activo,'SI') AS activo FROM grupo_productos_venta WHERE codigo = $1`,
            [codigo.toUpperCase()]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, error: 'El código ya existe' });
        console.error('Error POST /api/produccion/grupo-productos:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/produccion/grupo-productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, activo } = req.body;
    try {
        await pool.query(
            `UPDATE grupo_productos_venta SET nombre = $1, activo = COALESCE($2, activo) WHERE codigo = $3`,
            [nombre, activo ?? null, codigo]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/produccion/grupo-productos:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/produccion/grupo-productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        await pool.query(`DELETE FROM grupo_productos_venta WHERE codigo = $1`, [codigo]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/produccion/grupo-productos:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── PRODUCTOS PARA VENTA ────────────────────────────────────────
// Catálogo de solo lectura sobre la tabla real `productos` (compartida con Almacén),
// filtrado por para_venta='SI'. Los precios de venta se recalculan a partir de
// precio_costo y los márgenes globales en config_listas_precios.margen_venta1/2/3.

app.get('/api/produccion/productos-venta', async (req, res) => {
    const { grupo } = req.query;
    try {
        const params = [];
        const conds = [`p.para_venta = 'SI'`];
        if (grupo) { params.push(grupo); conds.push(`p.grupo = $${params.length}`); }
        const where = 'WHERE ' + conds.join(' AND ');
        const r = await pool.query(
            `SELECT p.codigo, p.nombre, p.und, p.grupo,
                    g.nombre AS grupo_nombre,
                    COALESCE(p.precio_costo,  0) AS precio_costo,
                    COALESCE(p.precio_venta1, 0) AS precio_venta1,
                    COALESCE(p.precio_venta2, 0) AS precio_venta2,
                    COALESCE(p.precio_venta3, 0) AS precio_venta3
             FROM productos p
             LEFT JOIN grupo_productos g ON g.codigo = p.grupo
             ${where}
             ORDER BY g.codigo NULLS LAST, p.nombre`,
            params
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/produccion/productos-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── MÁRGENES DE VENTA (config_listas_precios.margen_venta1/2/3) ─────────────
// Fila única global. Se crea automáticamente si no existe ninguna.

app.get('/api/produccion/margenes-venta', async (req, res) => {
    try {
        let r = await pool.query(
            `SELECT id, COALESCE(margen_venta1,0) AS margen_venta1,
                    COALESCE(margen_venta2,0) AS margen_venta2,
                    COALESCE(margen_venta3,0) AS margen_venta3
             FROM config_listas_precios ORDER BY id LIMIT 1`
        );
        if (!r.rows.length) {
            r = await pool.query(
                `INSERT INTO config_listas_precios (lista, activo, margen_venta1, margen_venta2, margen_venta3)
                 VALUES ('GENERAL', 'SI', 0, 0, 0)
                 RETURNING id, margen_venta1, margen_venta2, margen_venta3`
            );
        }
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error GET /api/produccion/margenes-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/produccion/margenes-venta', async (req, res) => {
    const { margen_venta1, margen_venta2, margen_venta3 } = req.body;
    const m1 = parseFloat(margen_venta1) || 0;
    const m2 = parseFloat(margen_venta2) || 0;
    const m3 = parseFloat(margen_venta3) || 0;
    try {
        const existing = await pool.query(`SELECT id FROM config_listas_precios ORDER BY id LIMIT 1`);
        if (existing.rows.length) {
            await pool.query(
                `UPDATE config_listas_precios SET margen_venta1=$1, margen_venta2=$2, margen_venta3=$3 WHERE id=$4`,
                [m1, m2, m3, existing.rows[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO config_listas_precios (lista, activo, margen_venta1, margen_venta2, margen_venta3)
                 VALUES ('GENERAL', 'SI', $1, $2, $3)`,
                [m1, m2, m3]
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/produccion/margenes-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/produccion/productos-venta/recalcular-precios
// Recalcula precio_venta1/2/3 = precio_costo / (1 - margen) para todos los
// productos del catálogo de venta (para_venta='SI'), usando los márgenes globales.
app.post('/api/produccion/productos-venta/recalcular-precios', async (req, res) => {
    try {
        const cfg = await pool.query(
            `SELECT COALESCE(margen_venta1,0) AS m1, COALESCE(margen_venta2,0) AS m2, COALESCE(margen_venta3,0) AS m3
             FROM config_listas_precios ORDER BY id LIMIT 1`
        );
        if (!cfg.rows.length) {
            return res.json({ success: false, error: 'No existe configuración de listas de precios' });
        }
        const raw = cfg.rows[0];
        const m1 = parseFloat(raw.m1) || 0;
        const m2 = parseFloat(raw.m2) || 0;
        const m3 = parseFloat(raw.m3) || 0;
        console.log('Recalcular precios — márgenes:', { m1, m2, m3 });
        const sets = [];
        const params = [];
        if (m1 > 0 && m1 < 1) { params.push(m1); sets.push(`precio_venta1 = ROUND(precio_costo / (1 - $${params.length}::numeric), 2)`); }
        if (m2 > 0 && m2 < 1) { params.push(m2); sets.push(`precio_venta2 = ROUND(precio_costo / (1 - $${params.length}::numeric), 2)`); }
        if (m3 > 0 && m3 < 1) { params.push(m3); sets.push(`precio_venta3 = ROUND(precio_costo / (1 - $${params.length}::numeric), 2)`); }
        if (!sets.length) {
            return res.json({ success: false, error: `No hay márgenes válidos (deben estar entre 0% y 100%). Valores actuales: m1=${m1}, m2=${m2}, m3=${m3}` });
        }
        const r = await pool.query(
            `UPDATE productos SET ${sets.join(', ')} WHERE para_venta = 'SI' AND precio_costo > 0 RETURNING codigo`,
            params
        );
        console.log('Recalcular precios — actualizados:', r.rowCount);
        res.json({ success: true, actualizados: r.rowCount });
    } catch (e) {
        console.error('Error POST /api/produccion/productos-venta/recalcular-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── LISTA DE PRECIOS (config_listas_precios) ────────────────────

// Auto-migración: columnas de margen y nivel en config_listas_precios
(async () => {
    try {
        await pool.query(`ALTER TABLE config_listas_precios ADD COLUMN IF NOT EXISTS margen_venta1 NUMERIC(6,4) DEFAULT 0`);
        await pool.query(`ALTER TABLE config_listas_precios ADD COLUMN IF NOT EXISTS margen_venta2 NUMERIC(6,4) DEFAULT 0`);
        await pool.query(`ALTER TABLE config_listas_precios ADD COLUMN IF NOT EXISTS margen_venta3 NUMERIC(6,4) DEFAULT 0`);
        await pool.query(`ALTER TABLE config_listas_precios ADD COLUMN IF NOT EXISTS margen NUMERIC(6,4) DEFAULT 0`);
        await pool.query(`ALTER TABLE config_listas_precios ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1`);
        console.log('✅ Columnas margen/nivel en config_listas_precios listas');
    } catch (e) { console.error('Error migrando config_listas_precios:', e.message); }
})();

app.get('/api/produccion/lista-precios', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT id, lista, activo, dias_credito,
                    COALESCE(margen, 0)  AS margen,
                    COALESCE(nivel, 1)   AS nivel
             FROM config_listas_precios ORDER BY nivel, lista`
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/produccion/lista-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/produccion/lista-precios', async (req, res) => {
    const { lista, activo, dias_credito, margen, nivel } = req.body;
    if (!lista) return res.status(400).json({ success: false, error: 'lista es requerida' });
    const nv = parseInt(nivel) || 1;
    const mg = parseFloat(margen) || 0;
    try {
        const r = await pool.query(
            `INSERT INTO config_listas_precios (lista, activo, dias_credito, margen, nivel)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, lista, activo, dias_credito, margen, nivel`,
            [lista.toUpperCase(), activo || 'SI', parseInt(dias_credito) || 0, mg, nv]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, error: 'Esta lista ya existe' });
        console.error('Error POST /api/produccion/lista-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/produccion/lista-precios/:id', async (req, res) => {
    const { id } = req.params;
    const { lista, activo, dias_credito, margen, nivel } = req.body;
    try {
        await pool.query(
            `UPDATE config_listas_precios
             SET lista=$1, activo=$2, dias_credito=$3, margen=$4, nivel=$5
             WHERE id=$6`,
            [lista.toUpperCase(), activo || 'SI', parseInt(dias_credito) || 0,
             parseFloat(margen) || 0, parseInt(nivel) || 1, parseInt(id)]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/produccion/lista-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/produccion/lista-precios/:id/recalcular
// Actualiza precio_venta{nivel} de TODOS los productos usando precio_costo / (1 - margen)
app.post('/api/produccion/lista-precios/:id/recalcular', async (req, res) => {
    const { id } = req.params;
    try {
        const configRes = await pool.query(
            `SELECT margen, nivel FROM config_listas_precios WHERE id=$1`, [parseInt(id)]
        );
        if (!configRes.rows.length) return res.status(404).json({ success: false, error: 'Lista no encontrada' });

        const { margen, nivel } = configRes.rows[0];
        const m  = parseFloat(margen) || 0;
        const nv = parseInt(nivel) || 1;

        if (m <= 0 || m >= 1) return res.status(400).json({ success: false, error: 'Margen inválido (debe ser entre 0 y 1)' });
        if (![1,2,3].includes(nv)) return res.status(400).json({ success: false, error: 'Nivel inválido' });

        const campo = `precio_venta${nv}`;
        const result = await pool.query(
            `UPDATE productos_venta
             SET ${campo} = ROUND(precio_costo / (1.0 - $1::numeric), 2)
             WHERE precio_costo > 0
             RETURNING codigo`,
            [m]
        );
        res.json({ success: true, actualizados: result.rowCount, campo, nivel: nv });
    } catch (e) {
        console.error('Error POST /api/produccion/lista-precios/:id/recalcular:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/produccion/lista-precios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM config_listas_precios WHERE id=$1`, [parseInt(id)]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/produccion/lista-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── TÉRMINOS DE CRÉDITO ─────────────────────────────────────────

// Crear tabla si no existe (auto-migration)
pool.query(`
    CREATE TABLE IF NOT EXISTS terminos_credito (
        id          SERIAL PRIMARY KEY,
        nombre      VARCHAR(100) NOT NULL,
        dias_pago   INTEGER DEFAULT 0,
        descripcion VARCHAR(255),
        activo      VARCHAR(2) DEFAULT 'SI'
    )
`).catch(e => console.error('Error creando tabla terminos_credito:', e));

app.get('/api/produccion/terminos-credito', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT id, nombre, dias_pago, descripcion, activo
             FROM terminos_credito ORDER BY dias_pago`
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/produccion/terminos-credito:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/produccion/terminos-credito', async (req, res) => {
    const { nombre, dias_pago, descripcion, activo } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'nombre es requerido' });
    try {
        const r = await pool.query(
            `INSERT INTO terminos_credito (nombre, dias_pago, descripcion, activo)
             VALUES ($1,$2,$3,$4) RETURNING id, nombre, dias_pago, descripcion, activo`,
            [nombre, parseInt(dias_pago) || 0, descripcion || '', activo || 'SI']
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        console.error('Error POST /api/produccion/terminos-credito:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/produccion/terminos-credito/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, dias_pago, descripcion, activo, empresa } = req.body;
    try {
        await pool.query(
            `UPDATE terminos_credito SET nombre=$1, dias_pago=$2, descripcion=$3, activo=$4 WHERE id=$5`,
            [nombre, parseInt(dias_pago) || 0, descripcion || '', activo || 'SI', parseInt(id)]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/produccion/terminos-credito:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/produccion/terminos-credito/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM terminos_credito WHERE id=$1`, [parseInt(id)]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/produccion/terminos-credito:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ================================================================
// REPORTE VENTAS DE PRODUCTOS POR PERÍODO
// ================================================================

// GET /api/tesoreria/ventas-productos-periodo
// Retorna filas de detalle_ventas agrupadas por producto, filtradas por empresa, fechas y opcionalmente ccosto
app.get('/api/tesoreria/ventas-productos-periodo', async (req, res) => {
    const { empresa, fechaInicio, fechaFin, ccostos } = req.query;
    if (!empresa || !fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, error: 'empresa, fechaInicio y fechaFin son requeridos' });
    }
    try {
        const params = [parseInt(empresa), fechaInicio, fechaFin];
        let ccostoClause = '';
        if (ccostos) {
            const lista = ccostos.split(',').map(s => s.trim()).filter(Boolean);
            if (lista.length > 0) {
                const placeholders = lista.map((_, i) => `$${params.length + i + 1}`).join(', ');
                params.push(...lista);
                ccostoClause = `AND dv.ccosto IN (${placeholders})`;
            }
        }

        const sql = `
            SELECT
                COALESCE(dv.codigo, '—') AS codigo,
                dv.nombre,
                SUM(dv.cant)                              AS total_cant,
                CASE WHEN SUM(dv.cant) > 0
                     THEN SUM(dv.subtotal) / SUM(dv.cant)
                     ELSE 0 END                           AS vr_unit_prom,
                SUM(dv.subtotal)                          AS total_subtotal
            FROM detalle_ventas dv
            WHERE dv.empresa = $1
              AND dv.fecha BETWEEN $2 AND $3
              ${ccostoClause}
            GROUP BY COALESCE(dv.codigo, '—'), dv.nombre
            ORDER BY total_subtotal DESC
        `;

        const result = await pool.query(sql, params);

        // Totales
        const total_productos = result.rowCount;
        const total_cant      = result.rows.reduce((s, r) => s + parseFloat(r.total_cant  || 0), 0);
        const total_valor     = result.rows.reduce((s, r) => s + parseFloat(r.total_subtotal || 0), 0);
        const ticket_promedio = total_cant > 0 ? total_valor / total_cant : 0;

        res.json({
            success: true,
            data: result.rows,
            totals: { total_productos, total_cant, total_valor, ticket_promedio },
            total: result.rowCount
        });
    } catch (error) {
        console.error('Error en /api/tesoreria/ventas-productos-periodo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// MÓDULO GERENCIA: DASHBOARD EJECUTIVO Y KPIs
// ================================================================

// GET /api/gerencia/dashboard — resumen ejecutivo por período
app.get('/api/gerencia/dashboard', async (req, res) => {
    const { empresa, fechaInicio, fechaFin } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });

    const hoy = new Date().toISOString().split('T')[0];
    const anio = new Date().getFullYear();
    const fi = fechaInicio || `${anio}-01-01`;
    const ff = fechaFin   || hoy;

    try {
        // 1. Resumen facturación (todas las facturas del período — no hay filtro por proveedor)
        const [factRes, ordenesRes, gastosRes, movibanRes, topClientesRes, tendFactRes, tendOrdenesRes] = await Promise.all([

            pool.query(`
                SELECT
                    COUNT(*)                                                               AS count_total,
                    COALESCE(SUM(total),0)                                                 AS total_facturado,
                    COALESCE(SUM(valor_pagado),0)                                          AS total_cobrado,
                    COALESCE(SUM(CASE WHEN estado='PENDIENTE'
                        THEN total - COALESCE(valor_pagado,0) ELSE 0 END),0)               AS total_por_cobrar,
                    COUNT(CASE WHEN estado='PENDIENTE'     THEN 1 END)                     AS count_pendiente,
                    COUNT(CASE WHEN estado='POR VERIFICAR' THEN 1 END)                     AS count_por_verificar,
                    COUNT(CASE WHEN estado='PAGADA'        THEN 1 END)                     AS count_pagada,
                    COUNT(DISTINCT cliente)                                                AS clientes_activos
                FROM factura_venta
                WHERE fecha BETWEEN $1 AND $2`, [fi, ff]),

            pool.query(`
                SELECT estado, COUNT(*) AS count, COALESCE(SUM(total),0) AS valor
                FROM ordenes_compra
                WHERE fecha BETWEEN $1 AND $2
                GROUP BY estado`, [fi, ff]),

            pool.query(`
                SELECT COALESCE(SUM(total),0) AS total_gastos, COUNT(*) AS count_gastos
                FROM gastos WHERE empresa = $1 AND fecha BETWEEN $2 AND $3`, [empresa, fi, ff]),

            pool.query(`
                SELECT COALESCE(SUM(ingreso),0) AS total_ingresos,
                       COALESCE(SUM(egreso),0)  AS total_egresos
                FROM moviban WHERE empresa = $1 AND fecha BETWEEN $2 AND $3`, [empresa, fi, ff]),

            pool.query(`
                SELECT COALESCE(e.nombre, CAST(fv.cliente AS TEXT)) AS cliente_nombre,
                       COUNT(fv.codigo)          AS facturas_count,
                       COALESCE(SUM(fv.total),0) AS total_facturado,
                       COALESCE(SUM(fv.valor_pagado),0) AS total_cobrado
                FROM factura_venta fv
                LEFT JOIN empresas e ON CAST(e.codigo AS TEXT) = CAST(fv.cliente AS TEXT)
                WHERE fv.fecha BETWEEN $1 AND $2
                GROUP BY fv.cliente, e.nombre
                ORDER BY total_facturado DESC LIMIT 5`, [fi, ff]),

            pool.query(`
                SELECT TO_CHAR(fecha,'YYYY-MM') AS mes,
                       COALESCE(SUM(total),0)     AS valor_facturas,
                       COALESCE(SUM(valor_pagado),0) AS valor_cobrado,
                       COUNT(*)                   AS count_facturas
                FROM factura_venta
                WHERE fecha >= NOW() - INTERVAL '6 months'
                GROUP BY TO_CHAR(fecha,'YYYY-MM')
                ORDER BY mes`),

            pool.query(`
                SELECT TO_CHAR(fecha,'YYYY-MM') AS mes,
                       COALESCE(SUM(total),0)    AS valor_ordenes,
                       COUNT(*)                  AS count_ordenes
                FROM ordenes_compra
                WHERE fecha >= NOW() - INTERVAL '6 months'
                GROUP BY TO_CHAR(fecha,'YYYY-MM')
                ORDER BY mes`)
        ]);

        res.json({
            success: true,
            periodo: { fechaInicio: fi, fechaFin: ff },
            facturacion:          factRes.rows[0],
            ordenes:              ordenesRes.rows,
            gastos:               gastosRes.rows[0],
            movimientos:          movibanRes.rows[0],
            top_clientes:         topClientesRes.rows,
            tendencia_facturacion: tendFactRes.rows,
            tendencia_ordenes:    tendOrdenesRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/dashboard:', error);
        res.status(500).json({ success: false, error: 'Error al obtener dashboard', details: error.message });
    }
});

// GET /api/gerencia/kpis — KPIs globales
app.get('/api/gerencia/kpis', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });

    try {
        const [factKpiRes, ordenesKpiRes, topProductosRes, clientesVolRes, gastosCuentaRes] = await Promise.all([

            pool.query(`
                SELECT COUNT(*)                                          AS total_facturas,
                       COALESCE(SUM(total),0)                           AS total_facturado,
                       COALESCE(SUM(valor_pagado),0)                    AS total_cobrado,
                       COALESCE(AVG(total),0)                           AS ticket_promedio,
                       COUNT(DISTINCT cliente)                          AS clientes_activos
                FROM factura_venta`),

            pool.query(`
                SELECT COUNT(*)                                         AS total_ordenes,
                       COUNT(CASE WHEN estado='PENDIENTE'  THEN 1 END)  AS pendientes,
                       COUNT(CASE WHEN estado='ENTREGADA'  THEN 1 END)  AS entregadas,
                       COUNT(CASE WHEN estado='FACTURADA'  THEN 1 END)  AS facturadas,
                       COALESCE(SUM(total),0)                           AS valor_total
                FROM ordenes_compra`),

            pool.query(`
                SELECT COALESCE(pv.nombre, d.producto_venta) AS producto_nombre,
                       d.producto_venta                       AS codigo,
                       COALESCE(gpv.nombre,'Sin grupo')       AS grupo,
                       SUM(d.cantidad)                        AS total_cant,
                       COALESCE(SUM(d.subtotal),0)            AS total_valor
                FROM detalle_ordenes d
                LEFT JOIN productos_venta pv ON d.producto_venta = pv.codigo
                LEFT JOIN grupo_productos_venta gpv ON pv.grupo = gpv.codigo
                GROUP BY d.producto_venta, pv.nombre, gpv.nombre
                ORDER BY total_valor DESC LIMIT 10`),

            pool.query(`
                SELECT COALESCE(e.nombre, CAST(oc.empresa AS TEXT)) AS cliente_nombre,
                       COUNT(oc.codigo)                             AS total_ordenes,
                       COALESCE(SUM(oc.total),0)                   AS valor_total,
                       COUNT(CASE WHEN oc.estado='FACTURADA' THEN 1 END) AS facturadas,
                       COUNT(CASE WHEN oc.estado='PENDIENTE' THEN 1 END) AS pendientes
                FROM ordenes_compra oc
                LEFT JOIN empresas e ON e.codigo = oc.empresa
                GROUP BY oc.empresa, e.nombre
                ORDER BY valor_total DESC LIMIT 10`),

            pool.query(`
                SELECT g.cuenta                  AS cuenta_nombre,
                       g.cuenta,
                       COALESCE(SUM(g.total),0)  AS total_gastado,
                       COUNT(*)                  AS count_gastos
                FROM gastos g
                WHERE g.empresa = $1
                GROUP BY g.cuenta
                ORDER BY total_gastado DESC LIMIT 8`, [empresa])
        ]);

        const fk = factKpiRes.rows[0];
        const ok = ordenesKpiRes.rows[0];
        const tasaCobro       = +fk.total_facturado > 0 ? (+fk.total_cobrado / +fk.total_facturado * 100) : 0;
        const tasaFacturacion = +ok.total_ordenes   > 0 ? (+ok.facturadas   / +ok.total_ordenes   * 100) : 0;

        res.json({
            success: true,
            kpis: {
                total_facturado:    +fk.total_facturado,
                total_cobrado:      +fk.total_cobrado,
                total_por_cobrar:   +fk.total_facturado - +fk.total_cobrado,
                ticket_promedio:    +fk.ticket_promedio,
                clientes_activos:   +fk.clientes_activos,
                total_facturas:     +fk.total_facturas,
                tasa_cobro:         +tasaCobro.toFixed(1),
                total_ordenes:      +ok.total_ordenes,
                ordenes_pendientes: +ok.pendientes,
                ordenes_entregadas: +ok.entregadas,
                ordenes_facturadas: +ok.facturadas,
                valor_ordenes:      +ok.valor_total,
                tasa_facturacion:   +tasaFacturacion.toFixed(1),
            },
            top_productos:    topProductosRes.rows,
            clientes_volumen: clientesVolRes.rows,
            gastos_cuenta:    gastosCuentaRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/kpis:', error);
        res.status(500).json({ success: false, error: 'Error al obtener KPIs', details: error.message });
    }
});

// GET /api/gerencia/analisis-ventas — histórico 12m, día semana 45d, top productos, distribución ccosto
app.get('/api/gerencia/analisis-ventas', async (req, res) => {
    const { empresa, ccostos } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const emp = parseInt(empresa);
    const ccostoList = ccostos ? ccostos.split(',').map(c => c.trim()).filter(Boolean) : [];
    const ccostoFilter = ccostoList.length
        ? `AND v.ccosto IN (${ccostoList.map((_, i) => `$${i + 2}`).join(',')})`
        : '';
    const ccostoFilterDet = ccostoList.length
        ? `AND d.ccosto IN (${ccostoList.map((_, i) => `$${i + 2}`).join(',')})`
        : '';
    const params = ccostoList.length ? [emp, ...ccostoList] : [emp];

    try {
        const [mesesRes, diaRes, topProdRes, distCcostoRes, ccostosDisponiblesRes, catRes] = await Promise.all([

            // 1. Histórico mensual últimos 12 meses
            pool.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', fecha::date), 'YYYY-MM') AS mes,
                    TO_CHAR(DATE_TRUNC('month', fecha::date), 'Mon YYYY') AS mes_label,
                    COALESCE(SUM(ventas_brutas), 0)  AS ventas_brutas,
                    COALESCE(SUM(ventas_netas), 0)   AS ventas_netas,
                    COALESCE(SUM(devoluciones), 0)   AS devoluciones,
                    COALESCE(SUM(descuentos), 0)     AS descuentos,
                    COALESCE(SUM(impuestos), 0)      AS impuestos,
                    COALESCE(SUM(propinas), 0)       AS propinas,
                    COALESCE(SUM(comisiones), 0)     AS comisiones,
                    COALESCE(SUM(tarjetas), 0)       AS tarjetas,
                    COALESCE(SUM(efectivo), 0)       AS efectivo,
                    COALESCE(SUM(otros), 0)          AS otros,
                    COUNT(DISTINCT fecha)             AS dias_con_venta
                FROM ventas v
                WHERE v.empresa = $1
                  AND fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
                  ${ccostoFilter}
                GROUP BY DATE_TRUNC('month', fecha::date)
                ORDER BY DATE_TRUNC('month', fecha::date)`, params),

            // 2. Promedio por día de semana — últimos 45 días
            pool.query(`
                SELECT
                    EXTRACT(DOW FROM fecha::date) AS dow,
                    TO_CHAR(fecha::date, 'Day')   AS dia_nombre,
                    COALESCE(AVG(ventas_brutas), 0) AS avg_ventas,
                    COALESCE(SUM(ventas_brutas), 0) AS total_ventas,
                    COUNT(DISTINCT fecha)            AS dias_count
                FROM ventas v
                WHERE v.empresa = $1
                  AND fecha::date >= NOW()::date - 44
                  ${ccostoFilter}
                GROUP BY EXTRACT(DOW FROM fecha::date), TO_CHAR(fecha::date, 'Day')
                ORDER BY EXTRACT(DOW FROM fecha::date)`, params),

            // 3. Top 10 productos por ventas (últimos 12 meses, desde detalle_ventas)
            pool.query(`
                SELECT
                    d.codigo,
                    d.nombre,
                    COALESCE(SUM(d.cant), 0)     AS total_cant,
                    COALESCE(SUM(d.subtotal), 0) AS total_ventas,
                    COALESCE(AVG(d.vr_unit), 0)  AS precio_prom
                FROM detalle_ventas d
                WHERE d.empresa = $1
                  AND d.fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
                  ${ccostoFilterDet}
                GROUP BY d.codigo, d.nombre
                ORDER BY total_ventas DESC
                LIMIT 10`, params),

            // 4. Distribución por centro de costo (últimos 12 meses)
            pool.query(`
                SELECT
                    v.ccosto,
                    COALESCE(cc.nombre, v.ccosto) AS ccosto_nombre,
                    COALESCE(SUM(v.ventas_brutas), 0)  AS total_ventas,
                    COUNT(DISTINCT v.fecha)             AS dias
                FROM ventas v
                LEFT JOIN ccostos cc ON cc.codigo = v.ccosto AND cc.empresa = $1
                WHERE v.empresa = $1
                  AND fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
                GROUP BY v.ccosto, COALESCE(cc.nombre, v.ccosto)
                ORDER BY total_ventas DESC`, [emp]),

            // 5. Lista de ccostos disponibles (solo los registrados en ccostos)
            pool.query(`
                SELECT cc.codigo, cc.nombre
                FROM ccostos cc
                WHERE cc.empresa = $1
                  AND cc.codigo IN (SELECT DISTINCT ccosto FROM ventas WHERE empresa = $1)
                ORDER BY cc.nombre`, [emp]),

            // 6. Distribución por categoría de receta (últimos 12 meses)
            pool.query(`
                SELECT
                    COALESCE(gr.nombre, 'Sin categoría') AS categoria,
                    COALESCE(SUM(d.subtotal), 0) AS total_ventas,
                    COALESCE(SUM(d.cant), 0)     AS total_cant
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo = d.codigo
                LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
                WHERE d.empresa = $1
                  AND d.fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
                  ${ccostoFilterDet}
                GROUP BY COALESCE(gr.nombre, 'Sin categoría')
                ORDER BY total_ventas DESC`, params),
        ]);

        // Calcular promedio mensual para la línea
        const meses = mesesRes.rows;
        const promedioMensual = meses.length
            ? meses.reduce((s, r) => s + parseFloat(r.ventas_brutas), 0) / meses.length
            : 0;

        // KPIs
        const total12m   = meses.reduce((s, r) => s + parseFloat(r.ventas_brutas), 0);
        const mejorMes   = meses.length ? meses.reduce((a, b) => parseFloat(a.ventas_brutas) > parseFloat(b.ventas_brutas) ? a : b) : null;
        const totalItems = topProdRes.rows.reduce((s, r) => s + parseFloat(r.total_cant), 0);

        res.json({
            success: true,
            kpis: {
                total12m,
                promedioMensual,
                mejorMes: mejorMes ? { label: mejorMes.mes_label, valor: parseFloat(mejorMes.ventas_brutas) } : null,
                totalItems,
            },
            ventasPorMes:      meses,
            promedioMensual,
            ventasPorDiaSemana: diaRes.rows,
            topProductos:        topProdRes.rows,
            distribucionCcosto:  distCcostoRes.rows,
            ccostosDisponibles:  ccostosDisponiblesRes.rows,
            ventasPorCategoria:  catRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-ventas:', error);
        res.status(500).json({ success: false, error: 'Error al obtener análisis de ventas', details: error.message });
    }
});

// ── GERENCIA: ANÁLISIS DE NÓMINA (evolución semana/mes/año) ──────
app.get('/api/gerencia/analisis-nomina', async (req, res) => {
    const { empresa, agrupacion = 'semana' } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    // Rango según agrupación
    let rangoFiltro, groupExpr, labelExpr, orderExpr;
    if (agrupacion === 'mes') {
        rangoFiltro = `AND l.semana_inicio >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')`;
        groupExpr   = `DATE_TRUNC('month', l.semana_inicio)`;
        labelExpr   = `TO_CHAR(DATE_TRUNC('month', l.semana_inicio), 'Mon YYYY')`;
        orderExpr   = groupExpr;
    } else if (agrupacion === 'anio') {
        rangoFiltro = '';
        groupExpr   = `EXTRACT(YEAR FROM l.semana_inicio)`;
        labelExpr   = `EXTRACT(YEAR FROM l.semana_inicio)::text`;
        orderExpr   = groupExpr;
    } else { // semana
        rangoFiltro = `AND l.semana_inicio >= NOW()::date - INTERVAL '26 weeks'`;
        groupExpr   = `l.id, l.semana_inicio, l.semana_fin`;
        labelExpr   = `TO_CHAR(l.semana_inicio,'DD Mon') || ' - ' || TO_CHAR(l.semana_fin,'DD Mon YY')`;
        orderExpr   = `l.semana_inicio`;
    }

    try {
        const [serieRes, ccRes, topEmpRes] = await Promise.all([

            // 1. Serie temporal (bruto, deducciones, aportes ER, neto, costo empresa, horas, empleados)
            pool.query(`
                SELECT
                    ${labelExpr}                                          AS label,
                    MIN(l.semana_inicio)::date                            AS periodo_inicio,
                    MAX(l.semana_fin)::date                               AS periodo_fin,
                    COUNT(DISTINCT l.id)                                  AS nominas,
                    COUNT(DISTINCT ll.empleado_id)                        AS empleados,
                    COALESCE(SUM(ll.horas_regulares),0)                   AS horas_regulares,
                    COALESCE(SUM(ll.horas_overtime),0)                    AS horas_overtime,
                    COALESCE(SUM(ll.total_bruto),0)                       AS total_bruto,
                    COALESCE(SUM(ll.total_deducciones),0)                 AS total_deducciones,
                    COALESCE(SUM(ll.total_aportes_er),0)                  AS total_aportes_er,
                    COALESCE(SUM(ll.total_neto),0)                        AS total_neto,
                    COALESCE(SUM(ll.total_bruto + ll.total_aportes_er),0) AS costo_empresa
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                WHERE l.empresa = $1
                  AND l.estado IN ('APROBADA','PAGADA')
                  ${rangoFiltro}
                GROUP BY ${groupExpr}
                ORDER BY ${orderExpr}`, [empresa]),

            // 2. Distribución por centro de costo (mismo rango)
            pool.query(`
                SELECT
                    lc.ccosto,
                    COALESCE(cc.nombre, lc.ccosto)  AS ccosto_nombre,
                    COUNT(DISTINCT ll.empleado_id)  AS empleados,
                    COALESCE(SUM(lc.horas),0)       AS horas,
                    COALESCE(SUM(lc.costo_total),0) AS costo_total
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll  ON ll.liquidacion_id = l.id
                JOIN nom_liquidacion_ccosto lc ON lc.linea_id = ll.id
                LEFT JOIN ccostos cc ON cc.codigo = lc.ccosto AND cc.empresa::text = l.empresa::text
                WHERE l.empresa = $1
                  AND l.estado IN ('APROBADA','PAGADA')
                  ${rangoFiltro}
                GROUP BY lc.ccosto, cc.nombre
                ORDER BY costo_total DESC`, [empresa]),

            // 3. Top 10 empleados por costo empresa (mismo rango)
            pool.query(`
                SELECT
                    ll.empleado_id,
                    COALESCE(e.nombre||' '||e.apellido, 'Empleado '||ll.empleado_id) AS nombre,
                    COALESCE(e.tipo_empleado, ll.tipo_empleado)                      AS tipo_empleado,
                    COALESCE(SUM(ll.horas_regulares),0)                              AS horas_regulares,
                    COALESCE(SUM(ll.horas_overtime),0)                               AS horas_overtime,
                    COALESCE(SUM(ll.total_bruto),0)                                  AS total_bruto,
                    COALESCE(SUM(ll.total_bruto + ll.total_aportes_er),0)            AS costo_empresa
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                LEFT JOIN nom_empleados e ON e.id = ll.empleado_id
                WHERE l.empresa = $1
                  AND l.estado IN ('APROBADA','PAGADA')
                  ${rangoFiltro}
                GROUP BY ll.empleado_id, e.nombre, e.apellido, e.tipo_empleado, ll.tipo_empleado
                ORDER BY costo_empresa DESC
                LIMIT 10`, [empresa]),
        ]);

        const serie = serieRes.rows;
        const totalCosto = serie.reduce((s, r) => s + parseFloat(r.costo_empresa), 0);
        const totalBruto = serie.reduce((s, r) => s + parseFloat(r.total_bruto), 0);
        const promedio   = serie.length ? totalCosto / serie.length : 0;
        let mejor = null, peor = null;
        for (const r of serie) {
            const v = parseFloat(r.costo_empresa);
            if (!mejor || v > parseFloat(mejor.costo_empresa)) mejor = r;
            if (!peor  || v < parseFloat(peor.costo_empresa))  peor  = r;
        }
        // Variación último período vs anterior
        let variacion = null;
        if (serie.length >= 2) {
            const ult = parseFloat(serie[serie.length - 1].costo_empresa);
            const ant = parseFloat(serie[serie.length - 2].costo_empresa);
            if (ant > 0) variacion = ((ult - ant) / ant) * 100;
        }

        res.json({
            success: true,
            agrupacion,
            kpis: {
                totalCosto, totalBruto, promedio, variacion,
                periodos: serie.length,
                mayor: mejor ? { label: mejor.label, valor: parseFloat(mejor.costo_empresa) } : null,
                menor: peor  ? { label: peor.label,  valor: parseFloat(peor.costo_empresa) }  : null,
            },
            serie,
            distribucionCcosto: ccRes.rows,
            topEmpleados: topEmpRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-nomina:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GERENCIA: LABOR COST % (nómina vs ventas por local) ──────────
app.get('/api/gerencia/labor-cost', async (req, res) => {
    const { empresa, agrupacion = 'semana' } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const esMes = agrupacion === 'mes';
    // Filtro de rango sobre liquidaciones aprobadas
    const rangoFiltro = esMes
        ? `AND l.semana_inicio >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')`
        : `AND l.semana_inicio >= NOW()::date - INTERVAL '26 weeks'`;
    // Clave y etiqueta del período
    const keyExpr = esMes
        ? `TO_CHAR(DATE_TRUNC('month', l.semana_inicio),'YYYY-MM')`
        : `l.id::text`;
    const labelExpr = esMes
        ? `TO_CHAR(DATE_TRUNC('month', l.semana_inicio),'Mon YYYY')`
        : `TO_CHAR(l.semana_inicio,'DD Mon') || ' - ' || TO_CHAR(l.semana_fin,'DD Mon YY')`;
    const groupExpr = esMes ? `DATE_TRUNC('month', l.semana_inicio)` : `l.id, l.semana_inicio, l.semana_fin`;

    try {
        const [nomRes, ventasRes, nomCcRes, ventasCcRes] = await Promise.all([

            // 1. Nómina por período (costo empresa = bruto + aportes ER)
            pool.query(`
                SELECT ${keyExpr} AS key, ${labelExpr} AS label,
                       MIN(l.semana_inicio)::date AS inicio, MAX(l.semana_fin)::date AS fin,
                       COALESCE(SUM(ll.total_bruto + ll.total_aportes_er),0) AS costo_nomina
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                WHERE l.empresa = $1 AND l.estado IN ('APROBADA','PAGADA') ${rangoFiltro}
                GROUP BY ${groupExpr}
                ORDER BY MIN(l.semana_inicio)`, [empresa]),

            // 2. Ventas netas por período (mismas semanas de las liquidaciones)
            pool.query(`
                SELECT ${keyExpr} AS key, COALESCE(SUM(sub.ventas),0) AS ventas
                FROM nom_liquidacion l
                JOIN LATERAL (
                    SELECT SUM(v.ventas_netas) AS ventas
                    FROM ventas v
                    WHERE v.empresa::text = l.empresa::text
                      AND v.fecha::date BETWEEN l.semana_inicio AND l.semana_fin
                ) sub ON TRUE
                WHERE l.empresa = $1 AND l.estado IN ('APROBADA','PAGADA') ${rangoFiltro}
                GROUP BY ${esMes ? `DATE_TRUNC('month', l.semana_inicio)` : `l.id`}`, [empresa]),

            // 3. Nómina por período x centro de costo
            pool.query(`
                SELECT ${keyExpr} AS key, lc.ccosto,
                       COALESCE(cc.nombre, lc.ccosto) AS ccosto_nombre,
                       COALESCE(SUM(lc.costo_total),0) AS costo_nomina
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll  ON ll.liquidacion_id = l.id
                JOIN nom_liquidacion_ccosto lc ON lc.linea_id = ll.id
                LEFT JOIN ccostos cc ON cc.codigo = lc.ccosto AND cc.empresa::text = l.empresa::text
                WHERE l.empresa = $1 AND l.estado IN ('APROBADA','PAGADA') ${rangoFiltro}
                GROUP BY ${esMes ? `DATE_TRUNC('month', l.semana_inicio)` : `l.id, l.semana_inicio, l.semana_fin`}, lc.ccosto, cc.nombre`, [empresa]),

            // 4. Ventas por período x centro de costo
            pool.query(`
                SELECT ${keyExpr} AS key, v.ccosto, COALESCE(SUM(v.ventas_netas),0) AS ventas
                FROM nom_liquidacion l
                JOIN ventas v ON v.empresa::text = l.empresa::text
                            AND v.fecha::date BETWEEN l.semana_inicio AND l.semana_fin
                WHERE l.empresa = $1 AND l.estado IN ('APROBADA','PAGADA') ${rangoFiltro}
                GROUP BY ${esMes ? `DATE_TRUNC('month', l.semana_inicio)` : `l.id, l.semana_inicio, l.semana_fin`}, v.ccosto`, [empresa]),
        ]);

        // Merge serie global
        const ventasMap = {};
        for (const r of ventasRes.rows) ventasMap[r.key] = parseFloat(r.ventas) || 0;
        const serie = nomRes.rows.map(r => {
            const costo  = parseFloat(r.costo_nomina) || 0;
            const ventas = ventasMap[r.key] || 0;
            return {
                key: r.key, label: r.label, inicio: r.inicio, fin: r.fin,
                ventas, costo_nomina: costo,
                labor_pct: ventas > 0 ? (costo / ventas) * 100 : null,
            };
        });

        // Merge por CC: totales del rango + serie por período
        const ccMap = {};   // ccosto -> { nombre, nomina, ventas, porPeriodo: { key: {nomina, ventas} } }
        for (const r of nomCcRes.rows) {
            const cc = String(r.ccosto);
            if (!ccMap[cc]) ccMap[cc] = { ccosto: cc, nombre: r.ccosto_nombre, nomina: 0, ventas: 0, porPeriodo: {} };
            ccMap[cc].nomina += parseFloat(r.costo_nomina) || 0;
            if (!ccMap[cc].porPeriodo[r.key]) ccMap[cc].porPeriodo[r.key] = { nomina: 0, ventas: 0 };
            ccMap[cc].porPeriodo[r.key].nomina += parseFloat(r.costo_nomina) || 0;
        }
        for (const r of ventasCcRes.rows) {
            const cc = String(r.ccosto);
            if (!ccMap[cc]) ccMap[cc] = { ccosto: cc, nombre: cc, nomina: 0, ventas: 0, porPeriodo: {} };
            ccMap[cc].ventas += parseFloat(r.ventas) || 0;
            if (!ccMap[cc].porPeriodo[r.key]) ccMap[cc].porPeriodo[r.key] = { nomina: 0, ventas: 0 };
            ccMap[cc].porPeriodo[r.key].ventas += parseFloat(r.ventas) || 0;
        }

        const centros = Object.values(ccMap).map(c => ({
            ccosto: c.ccosto,
            nombre: c.nombre,
            nomina: c.nomina,
            ventas: c.ventas,
            labor_pct: c.ventas > 0 ? (c.nomina / c.ventas) * 100 : null,
            // % por período alineado con la serie global (null si no hay ventas)
            seriePct: serie.map(p => {
                const d = c.porPeriodo[p.key];
                return d && d.ventas > 0 ? (d.nomina / d.ventas) * 100 : null;
            }),
        })).sort((a, b) => (b.labor_pct ?? -1) - (a.labor_pct ?? -1));

        // KPIs
        const totVentas = serie.reduce((s, r) => s + r.ventas, 0);
        const totNomina = serie.reduce((s, r) => s + r.costo_nomina, 0);
        const pctGlobal = totVentas > 0 ? (totNomina / totVentas) * 100 : null;
        const conPct = centros.filter(c => c.labor_pct !== null);
        const mejorCC = conPct.length ? conPct[conPct.length - 1] : null;
        const peorCC  = conPct.length ? conPct[0] : null;

        res.json({
            success: true, agrupacion,
            kpis: {
                totVentas, totNomina, pctGlobal,
                periodos: serie.length,
                mejorCC: mejorCC ? { nombre: mejorCC.nombre, pct: mejorCC.labor_pct } : null,
                peorCC:  peorCC  ? { nombre: peorCC.nombre,  pct: peorCC.labor_pct }  : null,
            },
            serie,
            centros,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/labor-cost:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GERENCIA: CONSUMO MATERIA PRIMA / FOOD COST % ────────────────
// Consumo = platos/recetas vendidos (detalle_ventas, importación de ventas)
// valorizados al COSTO DE RECETA (recetas.valor). Ventas = ventas netas.
app.get('/api/gerencia/consumo-mp', async (req, res) => {
    const { empresa, agrupacion = 'semana', ccostos } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const emp = parseInt(empresa);
    const ccostoList = ccostos ? ccostos.split(',').map(c => c.trim()).filter(Boolean) : [];
    const ccFilterD = ccostoList.length
        ? `AND d.ccosto IN (${ccostoList.map((_, i) => `$${i + 2}`).join(',')})`
        : '';
    const ccFilterV = ccostoList.length
        ? `AND v.ccosto IN (${ccostoList.map((_, i) => `$${i + 2}`).join(',')})`
        : '';
    const params = ccostoList.length ? [emp, ...ccostoList] : [emp];

    // Expresiones de período según agrupación (para detalle_ventas d y ventas v)
    let rangoD, rangoV, keyD, labelD, keyV, labelV;
    if (agrupacion === 'mes') {
        rangoD = `AND d.fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')`;
        rangoV = `AND v.fecha::date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')`;
        keyD   = `TO_CHAR(DATE_TRUNC('month', d.fecha::date),'YYYY-MM')`;
        labelD = `TO_CHAR(DATE_TRUNC('month', d.fecha::date),'Mon YYYY')`;
        keyV   = `TO_CHAR(DATE_TRUNC('month', v.fecha::date),'YYYY-MM')`;
        labelV = `TO_CHAR(DATE_TRUNC('month', v.fecha::date),'Mon YYYY')`;
    } else if (agrupacion === 'anio') {
        rangoD = '';
        rangoV = '';
        keyD   = `TO_CHAR(d.fecha::date,'YYYY')`;
        labelD = `TO_CHAR(d.fecha::date,'YYYY')`;
        keyV   = `TO_CHAR(v.fecha::date,'YYYY')`;
        labelV = `TO_CHAR(v.fecha::date,'YYYY')`;
    } else { // semana
        rangoD = `AND d.fecha::date >= DATE_TRUNC('week', NOW())::date - INTERVAL '25 weeks'`;
        rangoV = `AND v.fecha::date >= DATE_TRUNC('week', NOW())::date - INTERVAL '25 weeks'`;
        keyD   = `TO_CHAR(DATE_TRUNC('week', d.fecha::date),'YYYY-MM-DD')`;
        labelD = `TO_CHAR(DATE_TRUNC('week', d.fecha::date),'DD Mon') || ' - ' || TO_CHAR(DATE_TRUNC('week', d.fecha::date) + INTERVAL '6 days','DD Mon YY')`;
        keyV   = `TO_CHAR(DATE_TRUNC('week', v.fecha::date),'YYYY-MM-DD')`;
        labelV = `TO_CHAR(DATE_TRUNC('week', v.fecha::date),'DD Mon') || ' - ' || TO_CHAR(DATE_TRUNC('week', v.fecha::date) + INTERVAL '6 days','DD Mon YY')`;
    }

    try {
        const [consumoRes, ventasRes, consumoCcRes, ventasCcRes, grupoRes, topRecRes, coberturaRes, ccDispRes] = await Promise.all([

            // 1. Consumo por período: platos vendidos × costo de receta
            pool.query(`
                SELECT ${keyD} AS key, ${labelD} AS label,
                       COALESCE(SUM(d.cant * COALESCE(r.valor,0)),0) AS consumo
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo::text = d.codigo::text
                WHERE d.empresa = $1 ${ccFilterD} ${rangoD}
                GROUP BY 1, 2 ORDER BY 1`, params),

            // 2. Ventas netas por período
            pool.query(`
                SELECT ${keyV} AS key, ${labelV} AS label,
                       COALESCE(SUM(v.ventas_netas),0) AS ventas
                FROM ventas v
                WHERE v.empresa = $1 ${ccFilterV} ${rangoV}
                GROUP BY 1, 2 ORDER BY 1`, params),

            // 3. Consumo por período x centro de costo
            pool.query(`
                SELECT ${keyD} AS key, d.ccosto,
                       COALESCE(cc.nombre, d.ccosto) AS ccosto_nombre,
                       COALESCE(SUM(d.cant * COALESCE(r.valor,0)),0) AS consumo
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo::text = d.codigo::text
                LEFT JOIN ccostos cc ON cc.codigo = d.ccosto AND cc.empresa = $1
                WHERE d.empresa = $1 ${ccFilterD} ${rangoD}
                GROUP BY 1, d.ccosto, cc.nombre`, params),

            // 4. Ventas por período x centro de costo
            pool.query(`
                SELECT ${keyV} AS key, v.ccosto, COALESCE(SUM(v.ventas_netas),0) AS ventas
                FROM ventas v
                WHERE v.empresa = $1 ${ccFilterV} ${rangoV}
                GROUP BY 1, v.ccosto`, params),

            // 5. Consumo por grupo de recetas (rango completo)
            pool.query(`
                SELECT COALESCE(gr.nombre,'Sin Grupo') AS grupo,
                       COALESCE(SUM(d.cant * COALESCE(r.valor,0)),0) AS consumo
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo::text = d.codigo::text
                LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
                WHERE d.empresa = $1 ${ccFilterD} ${rangoD}
                GROUP BY 1 ORDER BY 2 DESC`, params),

            // 6. Top 15 recetas por costo de MP consumido (rango completo)
            //    incluye margen: vendido - costo
            pool.query(`
                SELECT d.codigo,
                       COALESCE(MAX(r.nombre), MAX(d.nombre)) AS nombre,
                       COALESCE(SUM(d.cant),0)                    AS cantidad,
                       COALESCE(SUM(d.subtotal),0)                AS vendido,
                       COALESCE(SUM(d.cant * COALESCE(r.valor,0)),0) AS costo_mp
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo::text = d.codigo::text
                WHERE d.empresa = $1 ${ccFilterD} ${rangoD}
                GROUP BY d.codigo
                ORDER BY costo_mp DESC
                LIMIT 15`, params),

            // 7. Cobertura de costeo: cuánto de lo vendido tiene receta con costo > 0
            pool.query(`
                SELECT
                    COALESCE(SUM(d.subtotal),0) AS vendido_total,
                    COALESCE(SUM(CASE WHEN COALESCE(r.valor,0) > 0 THEN d.subtotal ELSE 0 END),0) AS vendido_costeado,
                    COUNT(DISTINCT CASE WHEN r.codigo IS NULL OR COALESCE(r.valor,0) = 0 THEN d.codigo END) AS items_sin_costo
                FROM detalle_ventas d
                LEFT JOIN recetas r ON r.codigo::text = d.codigo::text
                WHERE d.empresa = $1 ${ccFilterD} ${rangoD}`, params),

            // 8. Centros de costo disponibles (con ventas registradas)
            pool.query(`
                SELECT cc.codigo, cc.nombre
                FROM ccostos cc
                WHERE cc.empresa = $1
                  AND cc.codigo IN (SELECT DISTINCT ccosto FROM ventas WHERE empresa = $1)
                ORDER BY cc.nombre`, [emp]),
        ]);

        // Merge serie global: base = unión de períodos (ordenada por key)
        const perMap = {};
        for (const r of consumoRes.rows) {
            perMap[r.key] = { key: r.key, label: r.label, consumo: parseFloat(r.consumo) || 0, ventas: 0 };
        }
        for (const r of ventasRes.rows) {
            if (!perMap[r.key]) perMap[r.key] = { key: r.key, label: r.label, consumo: 0, ventas: 0 };
            perMap[r.key].ventas = parseFloat(r.ventas) || 0;
        }
        const serie = Object.values(perMap)
            .sort((a, b) => a.key.localeCompare(b.key))
            .map(r => ({ ...r, food_pct: r.ventas > 0 ? (r.consumo / r.ventas) * 100 : null }));

        // Merge por CC
        const ccMap = {};
        for (const r of consumoCcRes.rows) {
            const cc = String(r.ccosto);
            if (!ccMap[cc]) ccMap[cc] = { ccosto: cc, nombre: r.ccosto_nombre, consumo: 0, ventas: 0, porPeriodo: {} };
            ccMap[cc].consumo += parseFloat(r.consumo) || 0;
            if (!ccMap[cc].porPeriodo[r.key]) ccMap[cc].porPeriodo[r.key] = { consumo: 0, ventas: 0 };
            ccMap[cc].porPeriodo[r.key].consumo += parseFloat(r.consumo) || 0;
        }
        for (const r of ventasCcRes.rows) {
            const cc = String(r.ccosto);
            if (!ccMap[cc]) ccMap[cc] = { ccosto: cc, nombre: cc, consumo: 0, ventas: 0, porPeriodo: {} };
            ccMap[cc].ventas += parseFloat(r.ventas) || 0;
            if (!ccMap[cc].porPeriodo[r.key]) ccMap[cc].porPeriodo[r.key] = { consumo: 0, ventas: 0 };
            ccMap[cc].porPeriodo[r.key].ventas += parseFloat(r.ventas) || 0;
        }
        const centros = Object.values(ccMap).map(c => ({
            ccosto: c.ccosto,
            nombre: c.nombre,
            consumo: c.consumo,
            ventas: c.ventas,
            food_pct: c.ventas > 0 ? (c.consumo / c.ventas) * 100 : null,
            seriePct: serie.map(p => {
                const d = c.porPeriodo[p.key];
                return d && d.ventas > 0 ? (d.consumo / d.ventas) * 100 : null;
            }),
        })).sort((a, b) => (b.food_pct ?? -1) - (a.food_pct ?? -1));

        // KPIs
        const totConsumo = serie.reduce((s, r) => s + r.consumo, 0);
        const totVentas  = serie.reduce((s, r) => s + r.ventas, 0);
        const pctGlobal  = totVentas > 0 ? (totConsumo / totVentas) * 100 : null;
        const conPct = centros.filter(c => c.food_pct !== null && c.consumo > 0);
        const mejorCC = conPct.length ? conPct[conPct.length - 1] : null;
        const peorCC  = conPct.length ? conPct[0] : null;

        // Cobertura de costeo (recetas con costo vs total vendido)
        const cob = coberturaRes.rows[0] || {};
        const vendidoTotal    = parseFloat(cob.vendido_total || 0);
        const vendidoCosteado = parseFloat(cob.vendido_costeado || 0);
        const cobertura = vendidoTotal > 0 ? (vendidoCosteado / vendidoTotal) * 100 : null;

        res.json({
            success: true, agrupacion,
            kpis: {
                totConsumo, totVentas, pctGlobal,
                periodos: serie.length,
                mejorCC: mejorCC ? { nombre: mejorCC.nombre, pct: mejorCC.food_pct } : null,
                peorCC:  peorCC  ? { nombre: peorCC.nombre,  pct: peorCC.food_pct }  : null,
                cobertura,
                itemsSinCosto: parseInt(cob.items_sin_costo || 0),
            },
            serie,
            centros,
            porGrupo: grupoRes.rows,
            topRecetas: topRecRes.rows,
            ccostosDisponibles: ccDispRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/consumo-mp:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/gerencia/analisis-costos — ranking de productos por variación de precio de compra
// (a partir de entrada_almacen/detalle_entrada_almacen, período configurable, filtro opcional por grupo)
app.get('/api/gerencia/analisis-costos', async (req, res) => {
    const { empresa, desde, hasta, grupo } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().slice(0, 10);
    })();

    const params = [String(empresa), desdeDate, hastaDate];
    let grupoFilter = '';
    if (grupo) {
        params.push(grupo);
        grupoFilter = `AND p.grupo = $${params.length}`;
    }

    try {
        const result = await pool.query(`
            WITH compras AS (
                SELECT dea.articulo AS producto_codigo,
                       COALESCE(p.nombre, a.nombre, dea.articulo) AS producto_nombre,
                       COALESCE(p.und, a.und) AS und,
                       COALESCE(p.grupo, a.grupo) AS grupo,
                       COALESCE(gp.nombre, gpa.nombre, 'Sin Grupo') AS grupo_nombre,
                       ea.fecha::date AS fecha, ea.codigo AS entrada_codigo,
                       ea.proveedor, COALESCE(prov.nombre, ea.proveedor) AS proveedor_nombre,
                       dea.cantidad, dea.vr_unitario AS precio_unitario, dea.subtotal
                FROM detalle_entrada_almacen dea
                JOIN entrada_almacen ea ON ea.codigo = dea.codigo AND ea.empresa::text = $1
                LEFT JOIN productos p ON p.codigo = dea.articulo
                LEFT JOIN articulos a ON a.codigo = dea.articulo
                LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
                LEFT JOIN grupo_articulos gpa ON gpa.codigo = a.grupo
                LEFT JOIN proveedores prov ON prov.codigo = ea.proveedor AND prov.empresa::text = $1
                WHERE ea.fecha::date >= $2::date AND ea.fecha::date <= $3::date
                  AND dea.vr_unitario > 0
                  ${grupoFilter}
            ),
            primero AS (
                SELECT DISTINCT ON (producto_codigo) producto_codigo, fecha AS fecha_primera, precio_unitario AS precio_primero
                FROM compras ORDER BY producto_codigo, fecha ASC, entrada_codigo ASC
            ),
            ultimo AS (
                SELECT DISTINCT ON (producto_codigo) producto_codigo, fecha AS fecha_ultima,
                       precio_unitario AS precio_ultimo, proveedor_nombre AS proveedor_ultimo
                FROM compras ORDER BY producto_codigo, fecha DESC, entrada_codigo DESC
            )
            SELECT c.producto_codigo, MAX(c.producto_nombre) AS producto_nombre, MAX(c.und) AS und,
                   MAX(c.grupo_nombre) AS grupo_nombre,
                   COUNT(*) AS num_compras, SUM(c.cantidad) AS cantidad_total, SUM(c.subtotal) AS total_comprado,
                   MIN(c.precio_unitario) AS precio_min, MAX(c.precio_unitario) AS precio_max,
                   AVG(c.precio_unitario) AS precio_promedio,
                   COUNT(DISTINCT c.proveedor) AS num_proveedores,
                   pr.fecha_primera, pr.precio_primero, ul.fecha_ultima, ul.precio_ultimo, ul.proveedor_ultimo
            FROM compras c
            JOIN primero pr ON pr.producto_codigo = c.producto_codigo
            JOIN ultimo  ul ON ul.producto_codigo = c.producto_codigo
            GROUP BY c.producto_codigo, pr.fecha_primera, pr.precio_primero, ul.fecha_ultima, ul.precio_ultimo, ul.proveedor_ultimo
            ORDER BY producto_nombre
        `, params);

        const gruposRes = await pool.query(`SELECT codigo, nombre FROM grupo_productos ORDER BY nombre`);

        const productos = result.rows.map(r => {
            const precioPrimero = parseFloat(r.precio_primero) || 0;
            const precioUltimo = parseFloat(r.precio_ultimo) || 0;
            const numCompras = parseInt(r.num_compras) || 0;
            const sinVariacion = numCompras <= 1;
            const variacionPct = (!sinVariacion && precioPrimero > 0)
                ? ((precioUltimo - precioPrimero) / precioPrimero) * 100
                : null;
            return {
                producto_codigo: r.producto_codigo,
                producto_nombre: r.producto_nombre,
                und: r.und,
                grupo_nombre: r.grupo_nombre,
                num_compras: numCompras,
                cantidad_total: parseFloat(r.cantidad_total) || 0,
                total_comprado: parseFloat(r.total_comprado) || 0,
                precio_min: parseFloat(r.precio_min) || 0,
                precio_max: parseFloat(r.precio_max) || 0,
                precio_promedio: parseFloat(r.precio_promedio) || 0,
                num_proveedores: parseInt(r.num_proveedores) || 0,
                fecha_primera: r.fecha_primera,
                precio_primero: precioPrimero,
                fecha_ultima: r.fecha_ultima,
                precio_ultimo: precioUltimo,
                proveedor_ultimo: r.proveedor_ultimo,
                variacion_pct: variacionPct,
                sinVariacion,
            };
        });

        const conVariacion = productos.filter(p => !p.sinVariacion && p.variacion_pct !== null);
        const totalComprado = productos.reduce((s, p) => s + p.total_comprado, 0);
        const totalEntradas = productos.reduce((s, p) => s + p.num_compras, 0);
        const productosConAumento = conVariacion.filter(p => p.variacion_pct > 0).length;
        const productosConDisminucion = conVariacion.filter(p => p.variacion_pct < 0).length;
        const productosSinVariacion = productos.length - conVariacion.length;

        const ordenDesc = [...conVariacion].sort((a, b) => b.variacion_pct - a.variacion_pct);
        const top = ordenDesc.length ? ordenDesc[0] : null;
        const bottom = ordenDesc.length ? ordenDesc[ordenDesc.length - 1] : null;
        const mayorIncremento = (top && top.variacion_pct > 0) ? top : null;
        const mayorAhorro = (bottom && bottom.variacion_pct < 0) ? bottom : null;

        res.json({
            success: true,
            periodo: { desde: desdeDate, hasta: hastaDate },
            kpis: {
                totalComprado, totalEntradas,
                productosAnalizados: productos.length,
                productosConAumento, productosConDisminucion, productosSinVariacion,
                mayorIncremento: mayorIncremento ? {
                    producto_codigo: mayorIncremento.producto_codigo,
                    producto_nombre: mayorIncremento.producto_nombre,
                    variacion_pct: mayorIncremento.variacion_pct,
                } : null,
                mayorAhorro: mayorAhorro ? {
                    producto_codigo: mayorAhorro.producto_codigo,
                    producto_nombre: mayorAhorro.producto_nombre,
                    variacion_pct: mayorAhorro.variacion_pct,
                } : null,
            },
            productos,
            gruposDisponibles: gruposRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-costos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/gerencia/analisis-costos/producto/:codigo — histórico de compras de un producto puntual
app.get('/api/gerencia/analisis-costos/producto/:codigo', async (req, res) => {
    const { empresa, desde, hasta } = req.query;
    const { codigo } = req.params;
    if (!empresa || !codigo) return res.status(400).json({ success: false, error: 'empresa y codigo requeridos' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().slice(0, 10);
    })();

    try {
        const prodRes = await pool.query(
            `SELECT COALESCE(p.codigo, a.codigo) AS codigo,
                    COALESCE(p.nombre, a.nombre) AS nombre,
                    COALESCE(p.und, a.und) AS und,
                    COALESCE(gp.nombre, gpa.nombre, 'Sin Grupo') AS grupo_nombre
             FROM (SELECT $1::text AS cod) x
             LEFT JOIN productos p ON p.codigo = x.cod
             LEFT JOIN articulos a ON a.codigo = x.cod
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             LEFT JOIN grupo_articulos gpa ON gpa.codigo = a.grupo`,
            [codigo]
        );

        const rows = await pool.query(
            `SELECT ea.fecha::date AS fecha, ea.codigo AS entrada_codigo,
                    COALESCE(prov.nombre, ea.proveedor) AS proveedor_nombre,
                    dea.cantidad, dea.vr_unitario AS precio_unitario, dea.subtotal
             FROM detalle_entrada_almacen dea
             JOIN entrada_almacen ea ON ea.codigo = dea.codigo AND ea.empresa::text = $1
             LEFT JOIN proveedores prov ON prov.codigo = ea.proveedor AND prov.empresa::text = $1
             WHERE dea.articulo = $2
               AND ea.fecha::date >= $3::date AND ea.fecha::date <= $4::date
               AND dea.vr_unitario > 0
             ORDER BY ea.fecha ASC, ea.codigo ASC`,
            [String(empresa), codigo, desdeDate, hastaDate]
        );

        const pr = prodRes.rows[0];
        const productoInfo = {
            codigo,
            nombre: pr?.nombre || codigo,
            und: pr?.und || null,
            grupo_nombre: pr?.grupo_nombre || null,
        };

        const historico = [];
        let prevPrecio = null;
        for (const r of rows.rows) {
            const precio = parseFloat(r.precio_unitario) || 0;
            const variacion = (prevPrecio !== null && prevPrecio > 0)
                ? ((precio - prevPrecio) / prevPrecio) * 100
                : null;
            historico.push({
                fecha: r.fecha,
                entrada_codigo: r.entrada_codigo,
                proveedor_nombre: r.proveedor_nombre,
                cantidad: parseFloat(r.cantidad) || 0,
                precio_unitario: precio,
                subtotal: parseFloat(r.subtotal) || 0,
                variacion_vs_anterior_pct: variacion,
            });
            prevPrecio = precio;
        }

        if (!historico.length) {
            return res.json({ success: true, producto: productoInfo, kpis: null, historico: [], porProveedor: [] });
        }

        const precios = historico.map(h => h.precio_unitario);
        const precioActual = historico[historico.length - 1].precio_unitario;
        const precioPrimero = historico[0].precio_unitario;
        const precioPromedio = precios.reduce((s, v) => s + v, 0) / precios.length;
        const precioMin = Math.min(...precios);
        const precioMax = Math.max(...precios);
        const variacionTotalPct = precioPrimero > 0 ? ((precioActual - precioPrimero) / precioPrimero) * 100 : null;
        const variacionUltimasDosPct = historico.length >= 2 ? historico[historico.length - 1].variacion_vs_anterior_pct : null;

        const provMap = {};
        for (const h of historico) {
            const key = h.proveedor_nombre || 'Sin proveedor';
            if (!provMap[key]) provMap[key] = { proveedor_nombre: key, precios: [] };
            provMap[key].precios.push(h.precio_unitario);
        }
        const porProveedor = Object.values(provMap).map(p => ({
            proveedor_nombre: p.proveedor_nombre,
            num_compras: p.precios.length,
            precio_promedio: p.precios.reduce((s, v) => s + v, 0) / p.precios.length,
            precio_min: Math.min(...p.precios),
            precio_max: Math.max(...p.precios),
        })).sort((a, b) => a.precio_promedio - b.precio_promedio);

        const proveedorMasBarato = porProveedor.length ? porProveedor[0] : null;
        const proveedorMasCaro = (porProveedor.length > 1) ? porProveedor[porProveedor.length - 1] : null;
        const totalComprado = historico.reduce((s, h) => s + h.subtotal, 0);
        const alertaDato = variacionTotalPct !== null && Math.abs(variacionTotalPct) > 300;

        res.json({
            success: true,
            producto: productoInfo,
            kpis: {
                precioActual, precioPromedio, precioMin, precioMax,
                variacionTotalPct, variacionUltimasDosPct,
                totalComprado, numCompras: historico.length,
                proveedorMasBarato: proveedorMasBarato ? { nombre: proveedorMasBarato.proveedor_nombre, precio_promedio: proveedorMasBarato.precio_promedio } : null,
                proveedorMasCaro: proveedorMasCaro ? { nombre: proveedorMasCaro.proveedor_nombre, precio_promedio: proveedorMasCaro.precio_promedio } : null,
                alertaDato,
            },
            historico,
            porProveedor,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-costos/producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// GERENCIA — ANÁLISIS DE SOBRANTES / FALTANTES (Toma Física)
// Fuente: detalle_inventario (tipo='TOMA FISICA'), entrada=sobrante, salida=faltante
// ================================================================

// GET /api/gerencia/analisis-faltantes — ranking por producto + serie mensual + KPIs
app.get('/api/gerencia/analisis-faltantes', async (req, res) => {
    const { empresa, desde, hasta, ccosto, grupo } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 11);
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    })();

    const params = [String(empresa), desdeDate, hastaDate];
    let ccostoFilter = '';
    if (ccosto) { params.push(ccosto); ccostoFilter = ` AND di.ccosto = $${params.length}`; }
    let grupoFilter = '';
    if (grupo)  { params.push(grupo);  grupoFilter  = ` AND p.grupo = $${params.length}`; }

    // Obtener bodega_maestra de la empresa para aplicar el filtro automático:
    // ccosto = bodega maestra -> producto.control='SI'; ccosto distinto -> producto.visible_operacional='SI'
    const bodegaRes = await pool.query(
        `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`, [String(empresa)]
    );
    const bodegaMaestra = bodegaRes.rows[0]?.bodega_maestra || null;
    let filtroProd;
    if (bodegaMaestra) {
        params.push(bodegaMaestra);
        const bmIdx = params.length;
        filtroProd = ` AND ((di.ccosto = $${bmIdx} AND p.control='SI') OR (di.ccosto <> $${bmIdx} AND p.visible_operacional='SI'))`;
    } else {
        filtroProd = ` AND p.visible_operacional='SI'`;
    }

    // Expresión de precio de costo por empresa (overlay) con fallback al base del producto
    const precioExpr = `COALESCE(pce.precio_costo, p.precio_costo, 0)`;

    try {
        // ── Ranking por producto ──────────────────────────────────
        const prodQuery = `
            SELECT di.codigo AS producto_codigo,
                   MAX(p.nombre) AS producto_nombre,
                   MAX(p.und) AS und,
                   MAX(p.grupo) AS grupo_codigo,
                   MAX(COALESCE(gp.nombre, 'Sin Grupo')) AS grupo_nombre,
                   MAX(${precioExpr}) AS precio_costo,
                   ROUND(COALESCE(SUM(di.entrada), 0)::numeric, 4) AS sobrante_cant,
                   ROUND(COALESCE(SUM(di.salida),  0)::numeric, 4) AS faltante_cant,
                   ROUND(COALESCE(SUM(di.entrada * ${precioExpr}), 0)::numeric, 2) AS sobrante_valor,
                   ROUND(COALESCE(SUM(di.salida  * ${precioExpr}), 0)::numeric, 2) AS faltante_valor,
                   COUNT(DISTINCT (di.fecha, di.ccosto)) AS num_tomas
            FROM detalle_inventario di
            JOIN productos p ON p.codigo = di.codigo
            LEFT JOIN producto_costo_empresa pce
                   ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
            LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
            WHERE di.empresa::text = $1
              AND di.fecha >= $2::date AND di.fecha <= $3::date
              AND di.tipo = 'TOMA FISICA'
              ${ccostoFilter} ${grupoFilter} ${filtroProd}
            GROUP BY di.codigo
            HAVING COALESCE(SUM(di.entrada), 0) <> 0 OR COALESCE(SUM(di.salida), 0) <> 0
            ORDER BY producto_nombre
        `;
        const prodRes = await pool.query(prodQuery, params);

        // ── Serie mensual agregada ────────────────────────────────
        const serieQuery = `
            SELECT TO_CHAR(di.fecha, 'YYYY-MM') AS periodo_key,
                   ROUND(COALESCE(SUM(di.entrada), 0)::numeric, 4) AS sobrante_cant,
                   ROUND(COALESCE(SUM(di.salida),  0)::numeric, 4) AS faltante_cant,
                   ROUND(COALESCE(SUM(di.entrada * ${precioExpr}), 0)::numeric, 2) AS sobrante_valor,
                   ROUND(COALESCE(SUM(di.salida  * ${precioExpr}), 0)::numeric, 2) AS faltante_valor
            FROM detalle_inventario di
            JOIN productos p ON p.codigo = di.codigo
            LEFT JOIN producto_costo_empresa pce
                   ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
            WHERE di.empresa::text = $1
              AND di.fecha >= $2::date AND di.fecha <= $3::date
              AND di.tipo = 'TOMA FISICA'
              ${ccostoFilter} ${grupoFilter} ${filtroProd}
            GROUP BY periodo_key
            ORDER BY periodo_key
        `;
        const serieRes = await pool.query(serieQuery, params);

        const gruposRes = await pool.query(`SELECT codigo, nombre FROM grupo_productos ORDER BY nombre`);

        const productos = prodRes.rows.map(r => {
            const sobranteValor = parseFloat(r.sobrante_valor) || 0;
            const faltanteValor = parseFloat(r.faltante_valor) || 0;
            const sobranteCant = parseFloat(r.sobrante_cant) || 0;
            const faltanteCant = parseFloat(r.faltante_cant) || 0;
            return {
                producto_codigo: r.producto_codigo,
                producto_nombre: r.producto_nombre,
                und: r.und,
                grupo_codigo: r.grupo_codigo,
                grupo_nombre: r.grupo_nombre,
                precio_costo: parseFloat(r.precio_costo) || 0,
                sobrante_cant: sobranteCant,
                faltante_cant: faltanteCant,
                neto_cant: sobranteCant - faltanteCant,
                sobrante_valor: sobranteValor,
                faltante_valor: faltanteValor,
                neto_valor: sobranteValor - faltanteValor,
                num_tomas: parseInt(r.num_tomas) || 0,
            };
        });

        const serieMensual = serieRes.rows.map(r => {
            const sobranteValor = parseFloat(r.sobrante_valor) || 0;
            const faltanteValor = parseFloat(r.faltante_valor) || 0;
            const sobranteCant = parseFloat(r.sobrante_cant) || 0;
            const faltanteCant = parseFloat(r.faltante_cant) || 0;
            return {
                periodo_key: r.periodo_key,
                sobrante_cant: sobranteCant,
                faltante_cant: faltanteCant,
                neto_cant: sobranteCant - faltanteCant,
                sobrante_valor: sobranteValor,
                faltante_valor: faltanteValor,
                neto_valor: sobranteValor - faltanteValor,
            };
        });

        // ── KPIs ──────────────────────────────────────────────────
        const totalSobrante = productos.reduce((s, p) => s + p.sobrante_valor, 0);
        const totalFaltante = productos.reduce((s, p) => s + p.faltante_valor, 0);
        const neto = totalSobrante - totalFaltante;

        const porFaltante = [...productos].sort((a, b) => b.faltante_valor - a.faltante_valor);
        const porSobrante = [...productos].sort((a, b) => b.sobrante_valor - a.sobrante_valor);
        const mayorFaltante = (porFaltante[0] && porFaltante[0].faltante_valor > 0) ? porFaltante[0] : null;
        const mayorSobrante = (porSobrante[0] && porSobrante[0].sobrante_valor > 0) ? porSobrante[0] : null;

        // Ventas del período (todas las cuentas del CC seleccionado o de la empresa)
        const ventasParams = [String(empresa), desdeDate, hastaDate];
        let ventasCcostoFilter = '';
        if (ccosto) { ventasParams.push(ccosto); ventasCcostoFilter = ` AND ccosto = $${ventasParams.length}`; }
        const ventasRes = await pool.query(
            `SELECT COALESCE(SUM(ventas_netas), 0) AS total_ventas
             FROM ventas
             WHERE empresa = $1 AND fecha >= $2::date AND fecha <= $3::date ${ventasCcostoFilter}`,
            ventasParams
        );
        const totalVentas = parseFloat(ventasRes.rows[0]?.total_ventas || 0);

        res.json({
            success: true,
            periodo: { desde: desdeDate, hasta: hastaDate },
            kpis: {
                totalSobrante, totalFaltante, neto, totalVentas,
                pctFaltanteVentas: totalVentas > 0 ? (totalFaltante / totalVentas) * 100 : null,
                pctNetoVentas: totalVentas > 0 ? (neto / totalVentas) * 100 : null,
                productosAfectados: productos.length,
                mayorFaltante: mayorFaltante ? {
                    producto_codigo: mayorFaltante.producto_codigo,
                    producto_nombre: mayorFaltante.producto_nombre,
                    faltante_valor: mayorFaltante.faltante_valor,
                } : null,
                mayorSobrante: mayorSobrante ? {
                    producto_codigo: mayorSobrante.producto_codigo,
                    producto_nombre: mayorSobrante.producto_nombre,
                    sobrante_valor: mayorSobrante.sobrante_valor,
                } : null,
            },
            productos,
            serieMensual,
            gruposDisponibles: gruposRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-faltantes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/gerencia/analisis-faltantes/producto/:codigo — serie mensual e histórico de un producto
app.get('/api/gerencia/analisis-faltantes/producto/:codigo', async (req, res) => {
    const { empresa, desde, hasta, ccosto } = req.query;
    const { codigo } = req.params;
    if (!empresa || !codigo) return res.status(400).json({ success: false, error: 'empresa y codigo requeridos' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 11);
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    })();

    const params = [String(empresa), codigo, desdeDate, hastaDate];
    let ccostoFilter = '';
    if (ccosto) { params.push(ccosto); ccostoFilter = ` AND di.ccosto = $${params.length}`; }

    const precioExpr = `COALESCE(pce.precio_costo, p.precio_costo, 0)`;

    try {
        const prodRes = await pool.query(
            `SELECT p.codigo, p.nombre, p.und, COALESCE(gp.nombre, 'Sin Grupo') AS grupo_nombre,
                    ${precioExpr} AS precio_costo
             FROM productos p
             LEFT JOIN producto_costo_empresa pce
                    ON pce.codigo = p.codigo AND TRIM(pce.empresa) = TRIM($1::text)
             LEFT JOIN grupo_productos gp ON gp.codigo = p.grupo
             WHERE p.codigo = $2`,
            [String(empresa), codigo]
        );

        // Serie mensual del producto
        const serieRes = await pool.query(
            `SELECT TO_CHAR(di.fecha, 'YYYY-MM') AS periodo_key,
                    ROUND(COALESCE(SUM(di.entrada), 0)::numeric, 4) AS sobrante_cant,
                    ROUND(COALESCE(SUM(di.salida),  0)::numeric, 4) AS faltante_cant,
                    ROUND(COALESCE(SUM(di.entrada * ${precioExpr}), 0)::numeric, 2) AS sobrante_valor,
                    ROUND(COALESCE(SUM(di.salida  * ${precioExpr}), 0)::numeric, 2) AS faltante_valor
             FROM detalle_inventario di
             JOIN productos p ON p.codigo = di.codigo
             LEFT JOIN producto_costo_empresa pce
                    ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
             WHERE di.empresa::text = $1 AND di.codigo = $2
               AND di.fecha >= $3::date AND di.fecha <= $4::date
               AND di.tipo = 'TOMA FISICA' ${ccostoFilter}
             GROUP BY periodo_key
             ORDER BY periodo_key`,
            params
        );

        // Histórico detallado (cada toma)
        const histRes = await pool.query(
            `SELECT di.fecha::date AS fecha, di.ccosto,
                    COALESCE(cc.nombre, di.ccosto) AS ccosto_nombre,
                    ROUND(COALESCE(di.entrada, 0)::numeric, 4) AS sobrante_cant,
                    ROUND(COALESCE(di.salida,  0)::numeric, 4) AS faltante_cant,
                    ${precioExpr} AS precio_costo
             FROM detalle_inventario di
             JOIN productos p ON p.codigo = di.codigo
             LEFT JOIN producto_costo_empresa pce
                    ON pce.codigo = di.codigo AND TRIM(pce.empresa) = TRIM($1::text)
             LEFT JOIN ccostos cc ON cc.codigo = di.ccosto AND cc.empresa = $1
             WHERE di.empresa::text = $1 AND di.codigo = $2
               AND di.fecha >= $3::date AND di.fecha <= $4::date
               AND di.tipo = 'TOMA FISICA' ${ccostoFilter}
             ORDER BY di.fecha ASC, di.ccosto ASC`,
            params
        );

        const pr = prodRes.rows[0];
        const productoInfo = {
            codigo,
            nombre: pr?.nombre || codigo,
            und: pr?.und || null,
            grupo_nombre: pr?.grupo_nombre || null,
            precio_costo: parseFloat(pr?.precio_costo) || 0,
        };

        const serieMensual = serieRes.rows.map(r => {
            const sc = parseFloat(r.sobrante_cant) || 0;
            const fc = parseFloat(r.faltante_cant) || 0;
            const sv = parseFloat(r.sobrante_valor) || 0;
            const fv = parseFloat(r.faltante_valor) || 0;
            return {
                periodo_key: r.periodo_key,
                sobrante_cant: sc, faltante_cant: fc, neto_cant: sc - fc,
                sobrante_valor: sv, faltante_valor: fv, neto_valor: sv - fv,
            };
        });

        const historico = histRes.rows.map(r => {
            const sc = parseFloat(r.sobrante_cant) || 0;
            const fc = parseFloat(r.faltante_cant) || 0;
            const precio = parseFloat(r.precio_costo) || 0;
            return {
                fecha: r.fecha, ccosto: r.ccosto, ccosto_nombre: r.ccosto_nombre,
                sobrante_cant: sc, faltante_cant: fc, neto_cant: sc - fc,
                neto_valor: (sc - fc) * precio,
            };
        });

        const totalSobranteValor = serieMensual.reduce((s, m) => s + m.sobrante_valor, 0);
        const totalFaltanteValor = serieMensual.reduce((s, m) => s + m.faltante_valor, 0);
        const totalSobranteCant = serieMensual.reduce((s, m) => s + m.sobrante_cant, 0);
        const totalFaltanteCant = serieMensual.reduce((s, m) => s + m.faltante_cant, 0);

        res.json({
            success: true,
            producto: productoInfo,
            kpis: {
                totalSobranteValor, totalFaltanteValor,
                netoValor: totalSobranteValor - totalFaltanteValor,
                totalSobranteCant, totalFaltanteCant,
                netoCant: totalSobranteCant - totalFaltanteCant,
                numTomas: historico.length,
            },
            serieMensual,
            historico,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-faltantes/producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GERENCIA: P&G COMPARATIVO POR SEDE ───────────────────────────
// Una fila por centro de costo con la estructura de resultados de un
// restaurante: ventas, food cost, labor cost, prime cost, gastos
// operativos y resultado.
//
// Nota sobre doble conteo: el food cost NO sale de las compras sino de
// valorizar lo vendido al costo de receta (igual que /gerencia/consumo-mp).
// Por eso los gastos de la cuenta de materia prima se excluyen de los
// gastos operativos — si no, la comida se contaría dos veces.
//
// Nota sobre nómina: las liquidaciones son semanales. Cuando el rango
// consultado parte una semana por la mitad, el costo se prorratea por los
// días de esa semana que caen dentro del rango.
app.get('/api/gerencia/pyg-sedes', async (req, res) => {
    const { empresa, desde, hasta } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const hastaDate = desde && hasta ? hasta : new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    })();

    try {
        // Cuentas que NO deben entrar en gastos operativos porque su costo ya
        // se calcula por otra vía: la materia prima sale del costo de receta y
        // la nómina sale de las liquidaciones. Si se dejaran, se contarían dos veces.
        const [cfgRes, fiscalRes] = await Promise.all([
            pool.query(`SELECT cta_materia_prima FROM config_general WHERE empresa = $1`, [parseInt(empresa)]),
            pool.query(
                `SELECT cuenta_nomina FROM nom_config_fiscal
                 WHERE empresa = $1 AND COALESCE(cuenta_nomina,'') <> ''
                 ORDER BY anio DESC LIMIT 1`, [parseInt(empresa)]),
        ]);
        const ctaMP = cfgRes.rows[0]?.cta_materia_prima || null;
        const ctaNomina = fiscalRes.rows[0]?.cuenta_nomina || null;
        const ctasExcluidas = [ctaMP, ctaNomina].filter(Boolean);

        const [ventasRes, foodRes, laborRes, gastosRes, ccostosRes] = await Promise.all([

            // 1. Ventas por sede
            pool.query(`
                SELECT v.ccosto,
                       COALESCE(SUM(v.ventas_netas), 0)  AS ventas_netas,
                       COALESCE(SUM(v.ventas_brutas), 0) AS ventas_brutas,
                       COALESCE(SUM(v.propinas), 0)      AS propinas,
                       COALESCE(SUM(v.descuentos), 0)    AS descuentos,
                       COUNT(DISTINCT v.fecha::date)     AS dias_operados
                FROM ventas v
                WHERE v.empresa::text = $1 AND v.fecha::date BETWEEN $2::date AND $3::date
                GROUP BY v.ccosto`,
                [String(empresa), desdeDate, hastaDate]),

            // 2. Food cost: lo vendido valorizado al costo de receta
            pool.query(`
                SELECT dv.ccosto,
                       COALESCE(SUM(dv.cant * COALESCE(r.valor, 0)), 0) AS food_cost,
                       COUNT(DISTINCT dv.codigo)                        AS platos_distintos,
                       COALESCE(SUM(dv.cant), 0)                        AS unidades_vendidas
                FROM detalle_ventas dv
                LEFT JOIN recetas r ON TRIM(r.codigo) = TRIM(dv.codigo)
                WHERE dv.empresa::text = $1 AND dv.fecha::date BETWEEN $2::date AND $3::date
                GROUP BY dv.ccosto`,
                [String(empresa), desdeDate, hastaDate]),

            // 3. Nómina por sede, prorrateada por días de solape
            pool.query(`
                SELECT lc.ccosto,
                       COALESCE(SUM(
                           lc.costo_total *
                           (GREATEST(0, (LEAST(l.semana_fin, $3::date) - GREATEST(l.semana_inicio, $2::date)) + 1)::numeric
                            / NULLIF((l.semana_fin - l.semana_inicio) + 1, 0))
                       ), 0) AS labor_cost,
                       COALESCE(SUM(
                           lc.horas *
                           (GREATEST(0, (LEAST(l.semana_fin, $3::date) - GREATEST(l.semana_inicio, $2::date)) + 1)::numeric
                            / NULLIF((l.semana_fin - l.semana_inicio) + 1, 0))
                       ), 0) AS horas
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll  ON ll.liquidacion_id = l.id
                JOIN nom_liquidacion_ccosto lc ON lc.linea_id = ll.id
                WHERE l.empresa = $1::int
                  AND l.estado IN ('APROBADA','PAGADA')
                  AND l.semana_inicio <= $3::date AND l.semana_fin >= $2::date
                GROUP BY lc.ccosto`,
                [String(empresa), desdeDate, hastaDate]),

            // 4. Gastos operativos por sede y grupo.
            // Solo grupos de tipo EGRESO: la tabla gastos también guarda
            // movimientos de INGRESO (ventas, otros ingresos) que no son costo.
            // Un grupo sin clasificar se trata como egreso, igual que en el
            // Estado de Resultados.
            pool.query(`
                SELECT g.ccosto,
                       COALESCE(gg.nombre, 'SIN GRUPO') AS grupo,
                       COALESCE(SUM(g.total), 0)        AS total
                FROM gastos g
                LEFT JOIN cuentas c       ON g.cuenta = c.codigo AND c.empresa = g.empresa
                LEFT JOIN grupo_gastos gg ON c.grupo = gg.codigo
                WHERE g.empresa = $1::int
                  AND g.fecha::date BETWEEN $2::date AND $3::date
                  AND COALESCE(TRIM(gg.tipo), 'EGRESO') <> 'INGRESO'
                  AND NOT (g.cuenta = ANY($4::text[]))
                GROUP BY g.ccosto, gg.nombre`,
                [String(empresa), desdeDate, hastaDate, ctasExcluidas]),

            pool.query(
                `SELECT codigo, nombre FROM ccostos WHERE empresa = $1::int AND COALESCE(activo,'SI') <> 'NO'`,
                [String(empresa)]),
        ]);

        const nombreCC = Object.fromEntries(ccostosRes.rows.map(c => [String(c.codigo), c.nombre]));
        const sedes = {};
        const asegurar = (cc) => {
            const k = String(cc || '').trim() || 'SIN CC';
            if (!sedes[k]) sedes[k] = {
                ccosto: k, nombre: nombreCC[k] || k,
                ventas_netas: 0, ventas_brutas: 0, propinas: 0, descuentos: 0, dias_operados: 0,
                food_cost: 0, platos_distintos: 0, unidades_vendidas: 0,
                labor_cost: 0, horas: 0,
                gastos_operativos: 0, gastos_por_grupo: {},
            };
            return sedes[k];
        };

        for (const r of ventasRes.rows) {
            const s = asegurar(r.ccosto);
            s.ventas_netas   = parseFloat(r.ventas_netas) || 0;
            s.ventas_brutas  = parseFloat(r.ventas_brutas) || 0;
            s.propinas       = parseFloat(r.propinas) || 0;
            s.descuentos     = parseFloat(r.descuentos) || 0;
            s.dias_operados  = parseInt(r.dias_operados) || 0;
        }
        for (const r of foodRes.rows) {
            const s = asegurar(r.ccosto);
            s.food_cost         = parseFloat(r.food_cost) || 0;
            s.platos_distintos  = parseInt(r.platos_distintos) || 0;
            s.unidades_vendidas = parseFloat(r.unidades_vendidas) || 0;
        }
        for (const r of laborRes.rows) {
            const s = asegurar(r.ccosto);
            s.labor_cost = parseFloat(r.labor_cost) || 0;
            s.horas      = parseFloat(r.horas) || 0;
        }
        for (const r of gastosRes.rows) {
            const s = asegurar(r.ccosto);
            const monto = parseFloat(r.total) || 0;
            s.gastos_operativos += monto;
            s.gastos_por_grupo[r.grupo] = (s.gastos_por_grupo[r.grupo] || 0) + monto;
        }

        const pct = (parte, base) => base > 0 ? (parte / base) * 100 : null;
        const filas = Object.values(sedes).map(s => {
            const v = s.ventas_netas;
            const prime = s.food_cost + s.labor_cost;
            const resultado = v - prime - s.gastos_operativos;
            return {
                ...s,
                prime_cost: prime,
                resultado,
                food_pct:      pct(s.food_cost, v),
                labor_pct:     pct(s.labor_cost, v),
                prime_pct:     pct(prime, v),
                gastos_pct:    pct(s.gastos_operativos, v),
                margen_pct:    pct(resultado, v),
                venta_dia:     s.dias_operados > 0 ? v / s.dias_operados : null,
                venta_hora:    s.horas > 0 ? v / s.horas : null,
            };
        }).sort((a, b) => b.ventas_netas - a.ventas_netas);

        // Totales consolidados
        const acum = (campo) => filas.reduce((t, f) => t + (f[campo] || 0), 0);
        const tVentas = acum('ventas_netas');
        const tFood   = acum('food_cost');
        const tLabor  = acum('labor_cost');
        const tGastos = acum('gastos_operativos');
        const tPrime  = tFood + tLabor;
        const tResultado = tVentas - tPrime - tGastos;

        const conMargen = filas.filter(f => f.margen_pct !== null);
        const ordenMargen = [...conMargen].sort((a, b) => b.margen_pct - a.margen_pct);

        // El food cost se valoriza con recetas.valor. Si ese costo está mal
        // cargado (p.ej. costo del lote completo en vez de por porción) el %
        // sale disparatado — se avisa en vez de mostrar un número sin contexto.
        const foodSospechoso = pct(tFood, tVentas) !== null && pct(tFood, tVentas) > 60;

        res.json({
            success: true,
            periodo: { desde: desdeDate, hasta: hastaDate },
            excluye_cuenta_mp: ctaMP,
            excluye_cuenta_nomina: ctaNomina,
            food_cost_sospechoso: foodSospechoso,
            totales: {
                ventas_netas: tVentas, food_cost: tFood, labor_cost: tLabor,
                prime_cost: tPrime, gastos_operativos: tGastos, resultado: tResultado,
                food_pct:   pct(tFood, tVentas),
                labor_pct:  pct(tLabor, tVentas),
                prime_pct:  pct(tPrime, tVentas),
                gastos_pct: pct(tGastos, tVentas),
                margen_pct: pct(tResultado, tVentas),
                num_sedes: filas.length,
                mejor: ordenMargen[0] ? { nombre: ordenMargen[0].nombre, margen_pct: ordenMargen[0].margen_pct } : null,
                peor:  ordenMargen.length > 1 ? { nombre: ordenMargen[ordenMargen.length-1].nombre, margen_pct: ordenMargen[ordenMargen.length-1].margen_pct } : null,
            },
            sedes: filas,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/pyg-sedes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GERENCIA: ANÁLISIS DE PROVEEDORES ────────────────────────────
// Mirada centrada en el proveedor (a diferencia de /analisis-costos,
// que mira la evolución de precio por producto): cuánto se le compra a
// cada uno, qué peso tiene en el gasto total, cómo cambió contra el
// período anterior y hace cuánto no se le compra.
app.get('/api/gerencia/analisis-proveedores', async (req, res) => {
    const { empresa, desde, hasta } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 5);
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    })();

    // Período anterior de igual longitud, para comparar
    const msDia = 86400000;
    const dias = Math.max(1, Math.round((new Date(hastaDate) - new Date(desdeDate)) / msDia) + 1);
    const prevHasta = new Date(new Date(desdeDate).getTime() - msDia).toISOString().slice(0, 10);
    const prevDesde = new Date(new Date(desdeDate).getTime() - dias * msDia).toISOString().slice(0, 10);

    // La tabla gastos guarda también movimientos de INGRESO (ventas, otros
    // ingresos), que no son compras a proveedores. Sin este filtro el ranking
    // lo encabeza quien recibe las ventas, no un proveedor real.
    const SOLO_EGRESOS = `
        AND COALESCE(TRIM(gg.tipo), 'EGRESO') <> 'INGRESO'`;
    const JOIN_GRUPO = `
        LEFT JOIN cuentas c       ON g.cuenta = c.codigo AND c.empresa = g.empresa
        LEFT JOIN grupo_gastos gg ON c.grupo = gg.codigo`;
    const PROVEEDOR_VALIDO = `
        AND g.proveedor IS NOT NULL AND TRIM(g.proveedor) <> '' AND TRIM(g.proveedor) <> '0'`;

    try {
        const [actualRes, previoRes, mensualRes, articulosRes] = await Promise.all([

            // 1. Gasto por proveedor en el período
            pool.query(`
                SELECT TRIM(g.proveedor) AS proveedor,
                       COALESCE(MAX(p.nombre), TRIM(g.proveedor)) AS proveedor_nombre,
                       COALESCE(SUM(g.total), 0) AS total,
                       COUNT(*)                  AS num_compras,
                       MIN(g.fecha::date)        AS primera,
                       MAX(g.fecha::date)        AS ultima,
                       COUNT(DISTINCT g.ccosto)  AS num_sedes
                FROM gastos g
                ${JOIN_GRUPO}
                LEFT JOIN proveedores p ON p.codigo = g.proveedor AND p.empresa = g.empresa
                WHERE g.empresa = $1::int
                  AND g.fecha::date BETWEEN $2::date AND $3::date
                  ${PROVEEDOR_VALIDO} ${SOLO_EGRESOS}
                GROUP BY TRIM(g.proveedor)
                ORDER BY total DESC`,
                [String(empresa), desdeDate, hastaDate]),

            // 2. Mismo dato en el período anterior
            pool.query(`
                SELECT TRIM(g.proveedor) AS proveedor,
                       COALESCE(SUM(g.total), 0) AS total,
                       COUNT(*) AS num_compras
                FROM gastos g
                ${JOIN_GRUPO}
                WHERE g.empresa = $1::int
                  AND g.fecha::date BETWEEN $2::date AND $3::date
                  ${PROVEEDOR_VALIDO} ${SOLO_EGRESOS}
                GROUP BY TRIM(g.proveedor)`,
                [String(empresa), prevDesde, prevHasta]),

            // 3. Serie mensual por proveedor (para la tendencia)
            pool.query(`
                SELECT TRIM(g.proveedor) AS proveedor,
                       TO_CHAR(DATE_TRUNC('month', g.fecha::date), 'YYYY-MM') AS mes,
                       COALESCE(SUM(g.total), 0) AS total
                FROM gastos g
                ${JOIN_GRUPO}
                WHERE g.empresa = $1::int
                  AND g.fecha::date BETWEEN $2::date AND $3::date
                  ${PROVEEDOR_VALIDO} ${SOLO_EGRESOS}
                GROUP BY TRIM(g.proveedor), DATE_TRUNC('month', g.fecha::date)
                ORDER BY mes`,
                [String(empresa), desdeDate, hastaDate]),

            // 4. Artículos distintos que entregó cada proveedor
            pool.query(`
                SELECT TRIM(ea.proveedor) AS proveedor,
                       COUNT(DISTINCT dea.articulo) AS articulos_distintos
                FROM entrada_almacen ea
                JOIN detalle_entrada_almacen dea ON dea.codigo = ea.codigo
                WHERE ea.empresa::text = $1
                  AND ea.fecha::date BETWEEN $2::date AND $3::date
                  AND ea.proveedor IS NOT NULL AND TRIM(ea.proveedor) <> ''
                GROUP BY TRIM(ea.proveedor)`,
                [String(empresa), desdeDate, hastaDate]),
        ]);

        const previo = Object.fromEntries(previoRes.rows.map(r => [r.proveedor, parseFloat(r.total) || 0]));
        const articulos = Object.fromEntries(articulosRes.rows.map(r => [r.proveedor, parseInt(r.articulos_distintos) || 0]));
        const meses = [...new Set(mensualRes.rows.map(r => r.mes))].sort();
        const seriePorProv = {};
        for (const r of mensualRes.rows) {
            if (!seriePorProv[r.proveedor]) seriePorProv[r.proveedor] = {};
            seriePorProv[r.proveedor][r.mes] = parseFloat(r.total) || 0;
        }

        const totalGasto = actualRes.rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
        const hoy = new Date();

        const proveedores = actualRes.rows.map(r => {
            const total = parseFloat(r.total) || 0;
            const anterior = previo[r.proveedor] ?? null;
            const diasSinComprar = Math.round((hoy - new Date(r.ultima)) / msDia);
            return {
                proveedor: r.proveedor,
                proveedor_nombre: r.proveedor_nombre,
                total,
                num_compras: parseInt(r.num_compras) || 0,
                ticket_promedio: r.num_compras > 0 ? total / parseInt(r.num_compras) : 0,
                primera: r.primera,
                ultima: r.ultima,
                dias_sin_comprar: diasSinComprar,
                num_sedes: parseInt(r.num_sedes) || 0,
                articulos_distintos: articulos[r.proveedor] || 0,
                pct_del_total: totalGasto > 0 ? (total / totalGasto) * 100 : 0,
                total_anterior: anterior,
                variacion_pct: (anterior && anterior > 0) ? ((total - anterior) / anterior) * 100 : null,
                serie: meses.map(m => seriePorProv[r.proveedor]?.[m] ?? 0),
            };
        });

        // Concentración: cuánto pesan los más grandes
        let acumulado = 0;
        const conAcumulado = proveedores.map(p => {
            acumulado += p.pct_del_total;
            return { ...p, pct_acumulado: acumulado };
        });
        const pctTop = (n) => proveedores.slice(0, n).reduce((s, p) => s + p.pct_del_total, 0);
        // Índice Herfindahl: suma de cuadrados de las participaciones (0-10000).
        // Por encima de 2500 se considera un gasto muy concentrado.
        const hhi = proveedores.reduce((s, p) => s + Math.pow(p.pct_del_total, 2), 0);

        res.json({
            success: true,
            periodo: { desde: desdeDate, hasta: hastaDate },
            periodo_anterior: { desde: prevDesde, hasta: prevHasta },
            meses,
            kpis: {
                total_gasto: totalGasto,
                num_proveedores: proveedores.length,
                total_compras: proveedores.reduce((s, p) => s + p.num_compras, 0),
                pct_top1: pctTop(1),
                pct_top3: pctTop(3),
                pct_top5: pctTop(5),
                hhi,
                concentracion: hhi > 2500 ? 'ALTA' : hhi > 1500 ? 'MEDIA' : 'BAJA',
                inactivos_60d: proveedores.filter(p => p.dias_sin_comprar > 60).length,
            },
            proveedores: conAcumulado,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/analisis-proveedores:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GERENCIA: INGENIERÍA DE MENÚ ─────────────────────────────────
// Método Kasavana-Smith: cada plato se clasifica cruzando popularidad
// (participación en unidades vendidas) contra rentabilidad (margen de
// contribución unitario), usando como umbrales el mix esperado ajustado
// al 70% y el margen promedio ponderado.
//
//   ESTRELLA          popular + rentable   -> proteger, no tocar precio
//   CABALLO DE BATALLA popular + poco rentable -> subir precio o bajar costo
//   ENIGMA            poco popular + rentable  -> promover, reubicar en carta
//   PERRO             poco popular + poco rentable -> candidato a salir
//
// Ojo: la clasificación es RELATIVA (compara cada plato contra la mediana
// del menú), así que sigue siendo útil aunque los costos de receta estén
// escalados de forma pareja. Deja de serlo si unos están por porción y
// otros por lote — por eso se reporta food_cost_sospechoso.
app.get('/api/gerencia/ingenieria-menu', async (req, res) => {
    const { empresa, desde, hasta, ccosto, grupo, incluir_subproductos } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

    const hastaDate = hasta || new Date().toISOString().slice(0, 10);
    const desdeDate = desde || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 2);
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    })();

    const params = [String(empresa), desdeDate, hastaDate];
    let filtros = '';
    if (ccosto && String(ccosto).trim()) {
        params.push(String(ccosto).trim());
        filtros += ` AND dv.ccosto = $${params.length}`;
    }
    if (grupo && String(grupo).trim()) {
        params.push(String(grupo).trim());
        filtros += ` AND r.grupo_receta = $${params.length}`;
    }
    // Los subproductos son componentes de otras recetas, no platos de carta
    if (incluir_subproductos !== 'true') {
        filtros += ` AND COALESCE(r.subproducto, 'NO') <> 'SI'`;
    }

    try {
        const [platosRes, gruposRes, ccostosRes] = await Promise.all([
            pool.query(`
                SELECT TRIM(dv.codigo) AS codigo,
                       MAX(dv.nombre)  AS nombre,
                       COALESCE(SUM(dv.cant), 0)     AS unidades,
                       COALESCE(SUM(dv.subtotal), 0) AS ingresos,
                       MAX(COALESCE(r.valor, 0))     AS costo_unitario,
                       MAX(r.grupo_receta)           AS grupo_receta,
                       MAX(COALESCE(gr.nombre, r.grupo_receta, 'Sin grupo')) AS grupo_nombre,
                       BOOL_OR(r.codigo IS NULL)     AS sin_receta
                FROM detalle_ventas dv
                LEFT JOIN recetas r       ON TRIM(r.codigo) = TRIM(dv.codigo)
                LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
                WHERE dv.empresa::text = $1
                  AND dv.fecha::date BETWEEN $2::date AND $3::date
                  AND COALESCE(TRIM(dv.codigo), '') <> ''
                  ${filtros}
                GROUP BY TRIM(dv.codigo)
                HAVING SUM(dv.cant) > 0`,
                params),

            pool.query(
                `SELECT DISTINCT COALESCE(gr.codigo, r.grupo_receta) AS codigo,
                        COALESCE(gr.nombre, r.grupo_receta) AS nombre
                 FROM recetas r
                 LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
                 WHERE COALESCE(r.grupo_receta,'') <> ''
                 ORDER BY nombre`),

            pool.query(
                `SELECT codigo, nombre FROM ccostos WHERE empresa = $1::int AND COALESCE(activo,'SI') <> 'NO' ORDER BY nombre`,
                [String(empresa)]),
        ]);

        const filas = platosRes.rows.map(r => {
            const unidades = parseFloat(r.unidades) || 0;
            const ingresos = parseFloat(r.ingresos) || 0;
            const costoUnit = parseFloat(r.costo_unitario) || 0;
            const precioProm = unidades > 0 ? ingresos / unidades : 0;
            const margenUnit = precioProm - costoUnit;
            return {
                codigo: r.codigo,
                nombre: r.nombre,
                grupo_receta: r.grupo_receta,
                grupo_nombre: r.grupo_nombre,
                sin_costo: costoUnit <= 0,
                unidades, ingresos,
                costo_unitario: costoUnit,
                costo_total: unidades * costoUnit,
                precio_promedio: precioProm,
                margen_unitario: margenUnit,
                margen_total: margenUnit * unidades,
                food_cost_pct: precioProm > 0 ? (costoUnit / precioProm) * 100 : null,
            };
        });

        // Para clasificar hace falta un costo creíble.
        //  - sin costo cargado: no hay margen que comparar.
        //  - costo por encima del precio de venta: en un restaurante eso no
        //    es un plato que pierde plata, es un costo mal cargado (típico:
        //    el costo del lote completo en vez del de la porción). Si se
        //    dejaran, arrastrarían el umbral de margen a negativo y
        //    empujarían platos sanos al cuadrante equivocado.
        const sinCosto = filas.filter(f => f.sin_costo);
        const costoInvalido = filas.filter(f => !f.sin_costo && f.food_cost_pct !== null && f.food_cost_pct > 100);
        const clasificables = filas.filter(f => !f.sin_costo && !(f.food_cost_pct !== null && f.food_cost_pct > 100));

        const totalUnidades = clasificables.reduce((s, f) => s + f.unidades, 0);
        const totalMargen   = clasificables.reduce((s, f) => s + f.margen_total, 0);
        const totalIngresos = clasificables.reduce((s, f) => s + f.ingresos, 0);
        const totalCosto    = clasificables.reduce((s, f) => s + f.costo_total, 0);
        const n = clasificables.length;

        // Umbrales del método: mix esperado ajustado al 70% y margen medio ponderado
        const umbralPopularidad = n > 0 ? (100 / n) * 0.70 : 0;
        const umbralMargen = totalUnidades > 0 ? totalMargen / totalUnidades : 0;

        const CLASES = {
            ESTRELLA:  { orden: 1, accion: 'Protéjelo: mantén calidad y no le toques el precio' },
            CABALLO:   { orden: 2, accion: 'Sube precio con cuidado o baja su costo de receta' },
            ENIGMA:    { orden: 3, accion: 'Promociónalo o reubícalo en la carta' },
            PERRO:     { orden: 4, accion: 'Candidato a salir de la carta o a rediseñarse' },
        };

        const platos = clasificables.map(f => {
            const mixPct = totalUnidades > 0 ? (f.unidades / totalUnidades) * 100 : 0;
            const popular = mixPct >= umbralPopularidad;
            const rentable = f.margen_unitario >= umbralMargen;
            const clase = popular && rentable ? 'ESTRELLA'
                        : popular && !rentable ? 'CABALLO'
                        : !popular && rentable ? 'ENIGMA'
                        : 'PERRO';
            return {
                ...f,
                mix_pct: mixPct,
                popular, rentable,
                clase,
                accion: CLASES[clase].accion,
                aporte_margen_pct: totalMargen > 0 ? (f.margen_total / totalMargen) * 100 : 0,
            };
        }).sort((a, b) =>
            CLASES[a.clase].orden - CLASES[b.clase].orden || b.margen_total - a.margen_total
        );

        const resumen = {};
        for (const c of Object.keys(CLASES)) {
            const grupo = platos.filter(p => p.clase === c);
            resumen[c] = {
                num: grupo.length,
                unidades: grupo.reduce((s, p) => s + p.unidades, 0),
                ingresos: grupo.reduce((s, p) => s + p.ingresos, 0),
                margen: grupo.reduce((s, p) => s + p.margen_total, 0),
            };
        }

        const foodPctGlobal = totalIngresos > 0 ? (totalCosto / totalIngresos) * 100 : null;

        res.json({
            success: true,
            periodo: { desde: desdeDate, hasta: hastaDate },
            umbrales: {
                popularidad_pct: umbralPopularidad,
                margen_unitario: umbralMargen,
            },
            totales: {
                num_platos: n,
                unidades: totalUnidades,
                ingresos: totalIngresos,
                costo: totalCosto,
                margen: totalMargen,
                food_cost_pct: foodPctGlobal,
                margen_pct: totalIngresos > 0 ? (totalMargen / totalIngresos) * 100 : null,
                sin_costo: sinCosto.length,
                costo_invalido: costoInvalido.length,
            },
            // Un food cost global imposible delata costos de receta mal cargados.
            food_cost_sospechoso: foodPctGlobal !== null && foodPctGlobal > 60,
            resumen,
            platos,
            platos_sin_costo: sinCosto.sort((a, b) => b.ingresos - a.ingresos),
            // Lista de trabajo: recetas cuyo costo supera el precio de venta
            platos_costo_invalido: costoInvalido.sort((a, b) => (b.food_cost_pct || 0) - (a.food_cost_pct || 0)),
            grupos: gruposRes.rows,
            ccostos: ccostosRes.rows,
        });
    } catch (error) {
        console.error('Error en /api/gerencia/ingenieria-menu:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// MÓDULO: RECETAS (Estandarización de Recetas de Restaurante)
// recetas:        codigo, nombre, valor(costo), grupo_receta, subproducto, und, precio_venta
// articulos:      codigo, nombre, und, valor(precio), empresa, grupo, prod_propio
// detalle_recetas:codigo, receta, articulo, cantidad, vr_unit, vr_total
// ================================================================

// ── ARTÍCULOS / INSUMOS ─────────────────────────────────────────
// Columnas reales: codigo, nombre, und, valor, empresa, grupo, prod_propio

// GET /api/articulos/grupos - Listar grupos desde tabla grupo_articulos
app.get('/api/articulos/grupos', async (req, res) => {
    try {
        const result = await pool.query(`SELECT codigo, nombre FROM grupo_articulos ORDER BY nombre`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/articulos/grupos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/articulos/grupos - Crear grupo
app.post('/api/articulos/grupos', async (req, res) => {
    const { codigo, nombre } = req.body;
    if (!codigo?.trim() || !nombre?.trim())
        return res.status(400).json({ success: false, error: 'codigo y nombre son requeridos' });
    try {
        const result = await pool.query(
            `INSERT INTO grupo_articulos (codigo, nombre) VALUES ($1, $2) RETURNING *`,
            [codigo.trim().toUpperCase(), nombre.trim()]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, error: 'El código ya existe' });
        console.error('Error POST /api/articulos/grupos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/articulos/grupos/:codigo - Actualizar grupo
app.put('/api/articulos/grupos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ success: false, error: 'nombre es requerido' });
    try {
        const result = await pool.query(
            `UPDATE grupo_articulos SET nombre = $1 WHERE codigo = $2 RETURNING *`,
            [nombre.trim(), codigo]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Grupo no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/articulos/grupos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/articulos/grupos/:codigo - Eliminar grupo
app.delete('/api/articulos/grupos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        const check = await pool.query(`SELECT COUNT(*) AS cnt FROM articulos WHERE grupo = $1`, [codigo]);
        if (parseInt(check.rows[0].cnt) > 0)
            return res.status(409).json({ success: false, error: `No se puede eliminar: tiene ${check.rows[0].cnt} artículo(s) asociados` });
        const result = await pool.query(`DELETE FROM grupo_articulos WHERE codigo = $1 RETURNING *`, [codigo]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Grupo no encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/articulos/grupos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/articulos - Listar todos los artículos con nombre del grupo y conteo de recetas
app.get('/api/articulos', async (req, res) => {
    // Costo (valor) resuelto por empresa: COALESCE(su capa, valor base del principal).
    const empresa = req.query.empresa || req.headers['x-empresa'] || null;
    try {
        const result = await pool.query(`
            SELECT a.codigo, a.nombre, a.und,
                   COALESCE(ace.valor, a.valor, 0)   AS valor,
                   COALESCE(a.grupo, '')             AS grupo,
                   COALESCE(ga.nombre, a.grupo, '')  AS grupo_nombre,
                   COALESCE(a.prod_propio, '')        AS prod_propio,
                   (SELECT COUNT(DISTINCT dr.receta) FROM detalle_recetas dr
                    WHERE TRIM(dr.articulo) = TRIM(a.codigo))::int AS num_recetas
            FROM articulos a
            LEFT JOIN grupo_articulos ga ON ga.codigo = a.grupo
            LEFT JOIN articulo_costo_empresa ace
                   ON TRIM(ace.codigo) = TRIM(a.codigo) AND TRIM(ace.empresa) = TRIM($1::text)
            ORDER BY ga.nombre NULLS LAST, a.nombre
        `, [empresa]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/articulos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/articulos/:codigo/recetas - Recetas que usan este artículo como ingrediente
app.get('/api/articulos/:codigo/recetas', async (req, res) => {
    const { codigo } = req.params;
    try {
        const result = await pool.query(`
            SELECT r.codigo,
                   r.nombre,
                   COALESCE(r.grupo_receta, '') AS grupo_receta,
                   COALESCE(r.subproducto, 'NO') AS subproducto,
                   dr.cantidad,
                   COALESCE(art.und, '') AS und
            FROM detalle_recetas dr
            JOIN recetas r ON r.codigo = dr.receta
            LEFT JOIN articulos art ON TRIM(art.codigo) = TRIM(dr.articulo)
            WHERE TRIM(dr.articulo) = $1
            ORDER BY r.nombre
        `, [codigo.trim()]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/articulos/:codigo/recetas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/articulos - Crear artículo
app.post('/api/articulos', async (req, res) => {
    const { codigo, nombre, und, valor, grupo } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'nombre es requerido' });
    try {
        let result;
        if (codigo) {
            const exists = await pool.query('SELECT 1 FROM articulos WHERE TRIM(codigo) = $1', [codigo.trim()]);
            if (exists.rows.length > 0) {
                result = await pool.query(`
                    UPDATE articulos SET nombre=$1, und=$2, valor=$3, grupo=$4
                    WHERE TRIM(codigo)=$5 RETURNING *
                `, [nombre.trim(), und || 'UND', parseFloat(valor) || 0, grupo || null, codigo.trim()]);
            } else {
                result = await pool.query(`
                    INSERT INTO articulos (codigo, nombre, und, valor, grupo)
                    VALUES ($1,$2,$3,$4,$5) RETURNING *
                `, [codigo.trim(), nombre.trim(), und || 'UND', parseFloat(valor) || 0, grupo || null]);
            }
        } else {
            // Sin código explícito se genera uno: un artículo con codigo NULL queda
            // inservible — no se puede editar ni borrar (PUT/DELETE filtran por
            // código) y cualquier flujo que lo requiera lo descarta, como la
            // entrada de almacén en Gestión de Gastos.
            const nextRes = await pool.query(`
                SELECT COALESCE(MAX(CASE WHEN TRIM(codigo) ~ '^[0-9]+$'
                                         THEN CAST(TRIM(codigo) AS BIGINT) END), 0) + 1 AS next
                FROM articulos
            `);
            const nuevoCodigo = String(nextRes.rows[0].next);
            result = await pool.query(`
                INSERT INTO articulos (codigo, nombre, und, valor, grupo)
                VALUES ($1,$2,$3,$4,$5) RETURNING *
            `, [nuevoCodigo, nombre.trim(), und || 'UND', parseFloat(valor) || 0, grupo || null]);
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/articulos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/articulos/:codigo - Actualizar artículo
app.put('/api/articulos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, und, valor, grupo } = req.body;
    try {
        const result = await pool.query(`
            UPDATE articulos
            SET nombre = COALESCE($1, nombre),
                und    = COALESCE($2, und),
                valor  = COALESCE($3, valor),
                grupo  = COALESCE($4, grupo)
            WHERE codigo = $5
            RETURNING *
        `, [nombre?.trim() || null, und || null,
            valor != null ? parseFloat(valor) : null, grupo || null, codigo]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/articulos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/articulos/:codigo - Eliminar artículo
app.delete('/api/articulos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        const usoRes = await pool.query(
            `SELECT COUNT(*) AS cnt FROM detalle_recetas WHERE articulo = $1`, [codigo]
        );
        if (parseInt(usoRes.rows[0].cnt) > 0) {
            return res.status(400).json({
                success: false,
                error: `No se puede eliminar. Este artículo se usa en ${usoRes.rows[0].cnt} receta(s).`
            });
        }
        await pool.query('DELETE FROM articulos WHERE codigo = $1', [codigo]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/articulos/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── RECETAS ─────────────────────────────────────────────────────
// Columnas reales: codigo, nombre, valor(costo), grupo_receta, subproducto, und, precio_venta
// subproducto='SI' → es subreceta/producto propio (sincroniza a articulos)

// GET /api/recetas/grupos - Grupos desde tabla grupo_recetas
app.get('/api/recetas/grupos', async (req, res) => {
    try {
        const result = await pool.query(`SELECT codigo, nombre FROM grupo_recetas ORDER BY nombre`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/recetas/grupos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas - Listar todas las recetas
app.get('/api/recetas', async (req, res) => {
    const { grupo } = req.query;
    // Costo (valor) resuelto por empresa: COALESCE(su capa, valor base del principal).
    const empresa = req.query.empresa || req.headers['x-empresa'] || null;
    try {
        const params = [empresa];   // $1 = empresa (capa de costo)
        let sql = `
            SELECT r.codigo,
                   r.nombre,
                   COALESCE(r.grupo_receta, '')          AS grupo_receta,
                   COALESCE(gr.nombre, r.grupo_receta, '') AS grupo_nombre,
                   COALESCE(r.subproducto, '')            AS subproducto,
                   COALESCE(r.und, '')                    AS und,
                   COALESCE(rce.valor, r.valor, 0)        AS valor,
                   COALESCE(r.precio_venta, 0)            AS precio_venta,
                   COALESCE((SELECT COUNT(*) FROM detalle_recetas dr WHERE dr.receta = r.codigo), 0) AS num_ingredientes,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((COALESCE(rce.valor, r.valor, 0) / r.precio_venta * 100)::numeric, 1)
                        ELSE 0 END AS porcentaje_costo
            FROM recetas r
            LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
            LEFT JOIN receta_costo_empresa rce
                   ON TRIM(rce.codigo) = TRIM(r.codigo) AND TRIM(rce.empresa) = TRIM($1::text)
        `;
        if (grupo && grupo !== 'TODOS') {
            params.push(grupo);
            sql += ` WHERE r.grupo_receta = $${params.length}`;
        }
        sql += ' ORDER BY r.nombre';
        const result = await pool.query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/recetas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas/:codigo/productos - Productos de inventario vinculados a esta receta
app.get('/api/recetas/:codigo/productos', async (req, res) => {
    const { codigo } = req.params;
    try {
        const result = await pool.query(`
            SELECT dp.articulo AS codigo,
                   COALESCE(p.nombre, dp.articulo) AS nombre,
                   dp.cant,
                   COALESCE(p.und, '') AS und,
                   COALESCE(p.grupo, '') AS grupo,
                   COALESCE(gp.nombre, p.grupo, '') AS grupo_nombre,
                   COALESCE(p.control, 'NO') AS control
            FROM detalle_productos dp
            LEFT JOIN productos p ON TRIM(p.codigo::text) = TRIM(dp.articulo::text)
            LEFT JOIN grupo_productos gp ON TRIM(gp.codigo::text) = TRIM(p.grupo::text)
            WHERE TRIM(dp.receta::text) = $1
            ORDER BY p.nombre
        `, [codigo]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/recetas/:codigo/productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/recetas/:codigo/productos — vincular producto a receta
app.post('/api/recetas/:codigo/productos', async (req, res) => {
    const { codigo } = req.params;
    const { articulo, cant } = req.body;
    if (!articulo) return res.status(400).json({ success: false, error: 'articulo requerido' });
    try {
        const existe = await pool.query(
            `SELECT 1 FROM detalle_productos WHERE TRIM(receta::text) = $1 AND TRIM(articulo::text) = $2`,
            [codigo, articulo]
        );
        if (existe.rows.length > 0) {
            await pool.query(
                `UPDATE detalle_productos SET cant = $3 WHERE TRIM(receta::text) = $1 AND TRIM(articulo::text) = $2`,
                [codigo, articulo, parseFloat(cant) || 1]
            );
        } else {
            await pool.query(
                `INSERT INTO detalle_productos (receta, articulo, cant) VALUES ($1, $2, $3)`,
                [codigo, articulo, parseFloat(cant) || 1]
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error POST /api/recetas/:codigo/productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/recetas/:codigo/productos/:articulo — desvincular producto de receta
app.delete('/api/recetas/:codigo/productos/:articulo', async (req, res) => {
    const { codigo, articulo } = req.params;
    try {
        await pool.query(
            `DELETE FROM detalle_productos WHERE TRIM(receta::text) = $1 AND TRIM(articulo::text) = $2`,
            [codigo, articulo]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/recetas/:codigo/productos/:articulo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas/valoracion-ventas - Costo real de materia prima ponderado por ventas del período
app.get('/api/recetas/valoracion-ventas', async (req, res) => {
    const { empresa, fechaInicio, fechaFin, ccostos } = req.query;
    if (!empresa || !fechaInicio || !fechaFin)
        return res.status(400).json({ success: false, error: 'empresa, fechaInicio y fechaFin son requeridos' });
    try {
        const params = [parseInt(empresa), fechaInicio, fechaFin];
        let ccostoClause = '';
        if (ccostos) {
            const lista = ccostos.split(',').map(s => s.trim()).filter(Boolean);
            if (lista.length > 0) {
                const placeholders = lista.map((_, i) => `$${params.length + i + 1}`).join(', ');
                params.push(...lista);
                ccostoClause = `AND dv.ccosto IN (${placeholders})`;
            }
        }
        const sql = `
            SELECT
                COALESCE(dv.codigo, '') AS codigo,
                dv.nombre,
                COALESCE(r.grupo_receta, '') AS grupo_receta,
                COALESCE(gr.nombre, r.grupo_receta, 'Sin grupo') AS grupo_nombre,
                COALESCE(r.subproducto, 'NO') AS subproducto,
                ROUND(SUM(dv.cant)::numeric, 4) AS total_cant,
                ROUND((CASE WHEN SUM(dv.cant) > 0 THEN SUM(dv.subtotal) / SUM(dv.cant) ELSE 0 END)::numeric, 2) AS vr_unit_prom,
                ROUND(SUM(dv.subtotal)::numeric, 2) AS total_ventas,
                ROUND(COALESCE(r.valor, 0)::numeric, 4) AS costo_mp_unit,
                ROUND((SUM(dv.cant) * COALESCE(r.valor, 0))::numeric, 2) AS total_costo_mp,
                ROUND((CASE WHEN SUM(dv.subtotal) > 0
                     THEN (SUM(dv.cant) * COALESCE(r.valor, 0)) / SUM(dv.subtotal) * 100
                     ELSE 0 END)::numeric, 2) AS pct_costo_mp
            FROM detalle_ventas dv
            LEFT JOIN recetas r ON TRIM(r.codigo) = TRIM(dv.codigo)
            LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
            WHERE dv.empresa = $1
              AND dv.fecha BETWEEN $2 AND $3
              ${ccostoClause}
              AND COALESCE(dv.codigo, '') <> ''
            GROUP BY dv.codigo, dv.nombre, r.grupo_receta, gr.nombre, r.subproducto, r.valor
            ORDER BY total_ventas DESC
        `;
        const result = await pool.query(sql, params);
        const rows = result.rows;
        const total_ventas   = rows.reduce((s, r) => s + parseFloat(r.total_ventas   || 0), 0);
        const total_costo_mp = rows.reduce((s, r) => s + parseFloat(r.total_costo_mp || 0), 0);
        const total_cant     = rows.reduce((s, r) => s + parseFloat(r.total_cant     || 0), 0);
        const pct_costo_real = total_ventas > 0 ? (total_costo_mp / total_ventas) * 100 : 0;
        res.json({ success: true, data: rows,
            totals: { total_ventas, total_costo_mp, total_cant, pct_costo_real, num_recetas: result.rowCount } });
    } catch (error) {
        console.error('Error GET /api/recetas/valoracion-ventas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas/para-selector - Recetas disponibles como subrecetas (con costo)
app.get('/api/recetas/para-selector', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.codigo, r.nombre, COALESCE(r.valor, 0) AS valor, COALESCE(r.und, 'UND') AS und
            FROM recetas r
            WHERE COALESCE(r.subproducto, 'NO') = 'SI'
            ORDER BY r.nombre
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/recetas/para-selector:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/recetas/:codigo - Obtener receta con sus ingredientes (jerárquico)
app.get('/api/recetas/:codigo', async (req, res) => {
    const { codigo } = req.params;
    // Costos resueltos por empresa (al vuelo): COALESCE(su capa, costo base).
    // El desglose (vr_unit/vr_total) se calcula con el costo de la empresa, no
    // con el desglose compartido almacenado (que es el del principal).
    const empresa = req.query.empresa || req.headers['x-empresa'] || null;
    try {
        const [recetaRes, detalleRes] = await Promise.all([
            pool.query(`
                SELECT r.codigo, r.nombre,
                       COALESCE(r.grupo_receta, '') AS grupo_receta,
                       COALESCE(r.subproducto, '')  AS subproducto,
                       COALESCE(r.und, '')           AS und,
                       COALESCE(rce.valor, r.valor, 0) AS valor,
                       COALESCE(r.precio_venta, 0)   AS precio_venta
                FROM recetas r
                LEFT JOIN receta_costo_empresa rce
                       ON TRIM(rce.codigo) = TRIM(r.codigo) AND TRIM(rce.empresa) = TRIM($2::text)
                WHERE r.codigo = $1
            `, [codigo, empresa]),
            pool.query(`
                SELECT dr.codigo AS id,
                       dr.articulo,
                       dr.cantidad,
                       -- Si el artículo existe como subproducto en recetas → forzar tipo RECETA
                       CASE
                         WHEN r2.codigo IS NOT NULL THEN 'RECETA'
                         ELSE COALESCE(dr.tipo, 'ARTICULO')
                       END AS tipo,
                       COALESCE(r2.nombre, a.nombre, dr.articulo) AS nombre_item,
                       COALESCE(r2.nombre, a.nombre, dr.articulo) AS articulo_nombre,
                       COALESCE(r2.und, a.und, '') AS und,
                       COALESCE(rce2.valor, r2.valor, ace.valor, a.valor, 0) AS precio_unit,
                       COALESCE(rce2.valor, r2.valor, ace.valor, a.valor, 0) AS vr_unit,
                       (COALESCE(rce2.valor, r2.valor, ace.valor, a.valor, 0)) * dr.cantidad AS vr_total,
                       CASE WHEN r2.codigo IS NOT NULL THEN true ELSE false END AS es_subreceta,
                       r2.codigo AS subreceta_codigo
                FROM detalle_recetas dr
                -- Buscar si el artículo existe como subproducto (receta con subproducto=SI)
                LEFT JOIN recetas r2 ON TRIM(r2.codigo) = TRIM(dr.articulo) AND r2.subproducto = 'SI'
                -- Buscar en artículos solo si NO es subproducto
                LEFT JOIN articulos a ON TRIM(a.codigo) = TRIM(dr.articulo) AND r2.codigo IS NULL
                -- Capas de costo por empresa
                LEFT JOIN receta_costo_empresa rce2
                       ON TRIM(rce2.codigo) = TRIM(r2.codigo) AND TRIM(rce2.empresa) = TRIM($2::text)
                LEFT JOIN articulo_costo_empresa ace
                       ON TRIM(ace.codigo) = TRIM(a.codigo) AND TRIM(ace.empresa) = TRIM($2::text)
                WHERE dr.receta = $1
                ORDER BY dr.codigo
            `, [codigo, empresa])
        ]);
        if (recetaRes.rowCount === 0)
            return res.status(404).json({ success: false, error: 'Receta no encontrada' });
        res.json({
            success: true,
            data: { ...recetaRes.rows[0], ingredientes: detalleRes.rows }
        });
    } catch (error) {
        console.error('Error GET /api/recetas/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/recetas - Crear receta
app.post('/api/recetas', async (req, res) => {
    const { codigo, nombre, grupo_receta, subproducto, und, precio_venta } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'nombre es requerido' });
    if (!codigo)  return res.status(400).json({ success: false, error: 'codigo es requerido' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(`
            INSERT INTO recetas (codigo, nombre, grupo_receta, subproducto, und, precio_venta, valor)
            VALUES ($1, $2, $3, $4, $5, $6, 0)
            RETURNING *
        `, [codigo.trim(), nombre.trim(), grupo_receta || null,
            subproducto || 'NO', und || null, parseFloat(precio_venta) || 0]);

        // Si es subproducto → sincronizar a articulos para que pueda usarse como ingrediente
        if (subproducto === 'SI') {
            const exists = await client.query('SELECT 1 FROM articulos WHERE TRIM(codigo) = $1', [codigo.trim()]);
            if (exists.rows.length > 0) {
                await client.query(
                    'UPDATE articulos SET nombre=$1, und=$2, prod_propio=$3 WHERE TRIM(codigo)=$4',
                    [nombre.trim(), und || null, 'SI', codigo.trim()]
                );
            } else {
                await client.query(
                    'INSERT INTO articulos (codigo, nombre, und, valor, prod_propio) VALUES ($1,$2,$3,0,$4)',
                    [codigo.trim(), nombre.trim(), und || null, 'SI']
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/recetas:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/recetas/:codigo - Actualizar receta
app.put('/api/recetas/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, grupo_receta, subproducto, und, precio_venta } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(`
            UPDATE recetas SET
                nombre       = COALESCE($1, nombre),
                grupo_receta = COALESCE($2, grupo_receta),
                subproducto  = COALESCE($3, subproducto),
                und          = COALESCE($4, und),
                precio_venta = COALESCE($5, precio_venta)
            WHERE codigo = $6
            RETURNING *
        `, [nombre?.trim() || null, grupo_receta || null, subproducto || null,
            und || null, precio_venta != null ? parseFloat(precio_venta) : null, codigo]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Receta no encontrada' });
        }

        // Sincronizar nombre/und en articulos si es subproducto
        const esSubprod = subproducto === 'SI' || result.rows[0].subproducto === 'SI';
        if (esSubprod && nombre) {
            await client.query(`
                UPDATE articulos SET nombre = $1, und = COALESCE($2, und)
                WHERE codigo = $3
            `, [nombre.trim(), und || null, codigo]);
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error PUT /api/recetas/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// DELETE /api/recetas/:codigo - Eliminar receta
app.delete('/api/recetas/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const usoRes = await client.query(
            `SELECT COUNT(*) AS cnt FROM detalle_recetas WHERE articulo = $1`, [codigo]
        );
        if (parseInt(usoRes.rows[0].cnt) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: `No se puede eliminar. Esta receta se usa como ingrediente en ${usoRes.rows[0].cnt} receta(s).`
            });
        }
        const subpRes = await client.query('SELECT subproducto FROM recetas WHERE codigo = $1', [codigo]);
        if (subpRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Receta no encontrada' });
        }
        await client.query('DELETE FROM detalle_recetas WHERE receta = $1', [codigo]);
        await client.query('DELETE FROM recetas WHERE codigo = $1', [codigo]);
        if (subpRes.rows[0].subproducto === 'SI') {
            await client.query("DELETE FROM articulos WHERE codigo = $1 AND prod_propio = 'SI'", [codigo]);
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error DELETE /api/recetas/:codigo:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/recetas/:codigo/ingredientes - Guardar ingredientes (reemplaza todo)
// detalle_recetas: codigo(PK), receta, articulo, cantidad, vr_unit, vr_total, tipo (ARTICULO|RECETA)
app.put('/api/recetas/:codigo/ingredientes', async (req, res) => {
    const { codigo } = req.params;
    const { ingredientes } = req.body;
    if (!Array.isArray(ingredientes))
        return res.status(400).json({ success: false, error: 'ingredientes debe ser un array' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Agregar columna tipo si no existe (una sola vez)
        await client.query(`
            ALTER TABLE detalle_recetas
            ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'ARTICULO'
        `);

        await client.query('DELETE FROM detalle_recetas WHERE receta = $1', [codigo]);
        // Obtener max código para generar PK
        const maxRes = await client.query(
            `SELECT MAX(CAST(codigo AS INTEGER)) AS max_cod FROM detalle_recetas WHERE codigo ~ '^[0-9]+$'`
        );
        let nextCod = (parseInt(maxRes.rows[0].max_cod) || 0) + 1;

        for (const ing of ingredientes) {
            if (!ing.articulo || ing.cantidad == null) continue;
            const vrUnit  = parseFloat(ing.precio_unit) || 0;
            const cant    = parseFloat(ing.cantidad) || 0;
            const vrTotal = vrUnit * cant;
            const tipo    = ing.tipo === 'RECETA' ? 'RECETA' : 'ARTICULO';
            await client.query(`
                INSERT INTO detalle_recetas (codigo, receta, articulo, cantidad, vr_unit, vr_total, tipo)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [String(nextCod).padStart(6,'0'), codigo, ing.articulo, cant, vrUnit, vrTotal, tipo]);
            nextCod++;
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error PUT /api/recetas/:codigo/ingredientes:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/recetas/:codigo/calcular-costo - Calcular costo de una receta
app.post('/api/recetas/:codigo/calcular-costo', async (req, res) => {
    const { codigo } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const detalleRes = await client.query(`
            SELECT dr.codigo, dr.articulo, dr.cantidad, COALESCE(dr.tipo, 'ARTICULO') AS tipo
            FROM detalle_recetas dr
            WHERE dr.receta = $1
        `, [codigo]);

        let costoTotal = 0;
        const ignorados = [];
        for (const det of detalleRes.rows) {
            // Protección auto-referencia: ingrediente que apunta a la misma receta
            if (det.tipo === 'RECETA' && det.articulo === codigo) {
                ignorados.push(det.articulo);
                await client.query(
                    'UPDATE detalle_recetas SET vr_unit = 0, vr_total = 0 WHERE codigo = $1',
                    [det.codigo]
                );
                continue;
            }
            let precio = 0;
            if (det.tipo === 'ARTICULO') {
                const artRes = await client.query('SELECT valor FROM articulos WHERE codigo = $1', [det.articulo]);
                precio = artRes.rows.length > 0 ? parseFloat(artRes.rows[0].valor) || 0 : 0;
            } else if (det.tipo === 'RECETA') {
                const recRes = await client.query('SELECT valor FROM recetas WHERE codigo = $1', [det.articulo]);
                precio = recRes.rows.length > 0 ? parseFloat(recRes.rows[0].valor) || 0 : 0;
            }
            const cant = parseFloat(det.cantidad) || 0;
            costoTotal += precio * cant;
            await client.query(
                'UPDATE detalle_recetas SET vr_unit = $1, vr_total = $2 WHERE codigo = $3',
                [precio, precio * cant, det.codigo]
            );
        }

        await client.query('UPDATE recetas SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);

        const subpRes = await client.query('SELECT subproducto FROM recetas WHERE codigo = $1', [codigo]);
        if (subpRes.rowCount > 0 && subpRes.rows[0].subproducto === 'SI') {
            await client.query('UPDATE articulos SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
        }

        await client.query('COMMIT');
        res.json({ success: true, costo: costoTotal, ignorados_autoref: ignorados });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/recetas/:codigo/calcular-costo:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Recalcula el costo de TODAS las recetas en orden topológico de dependencias
// (subrecetas primero), detectando auto-referencias y ciclos. Se usa tanto desde
// el botón manual (POST /api/recetas/recalcular-todos) como desde el job
// silencioso en segundo plano (ver más abajo, sección "RECALCULO AUTOMATICO").
//
// Consciente de empresa (Fase 2):
//   - PRINCIPAL (PROVEEDOR) → lee/escribe los costos BASE (articulos.valor,
//     recetas.valor, y el desglose compartido detalle_recetas.vr_unit/vr_total).
//   - CLIENTE → lee costos con COALESCE(su capa, base) y escribe SOLO en su capa
//     (receta_costo_empresa / articulo_costo_empresa para subproductos), sin
//     tocar el costo base ni el desglose compartido del principal.
// La FÓRMULA (qué ingredientes y cantidades) es compartida: el orden topológico
// se calcula una sola vez sobre detalle_recetas y aplica igual a toda empresa.
async function ejecutarRecalculoTodasRecetas(client, empresa) {
    const teRes = empresa
        ? await client.query(`SELECT tipo_empresa FROM empresas WHERE codigo = $1`, [empresa])
        : { rows: [] };
    const esPrincipal = (teRes.rows[0]?.tipo_empresa || 'PROVEEDOR') === 'PROVEEDOR';

    const recetasRes = await client.query(
        `SELECT codigo, subproducto, nombre FROM recetas ORDER BY nombre`
    );
    const recetas = recetasRes.rows;
    const subprodMap = new Map(recetas.map(r => [r.codigo, r.subproducto]));

    // Grafo: receta -> Set(subrecetas usadas como ingrediente)
    const depsRes = await client.query(`
        SELECT receta, articulo
        FROM detalle_recetas
        WHERE COALESCE(tipo, 'ARTICULO') = 'RECETA'
    `);
    const deps = new Map();
    for (const r of recetas) deps.set(r.codigo, new Set());
    for (const d of depsRes.rows) {
        if (d.articulo === d.receta) continue;  // ignorar auto-referencia
        if (deps.has(d.receta) && deps.has(d.articulo)) {
            deps.get(d.receta).add(d.articulo);
        }
    }

    // Kahn: ordenamos primero las que no dependen de ninguna otra receta
    const indeg = new Map();
    const usadoPor = new Map();
    for (const [cod, set] of deps) {
        indeg.set(cod, set.size);
        for (const sub of set) {
            if (!usadoPor.has(sub)) usadoPor.set(sub, []);
            usadoPor.get(sub).push(cod);
        }
    }
    const orden = [];
    const visitados = new Set();
    const cola = [];
    for (const [cod, n] of indeg) if (n === 0) cola.push(cod);
    while (cola.length > 0) {
        const cod = cola.shift();
        orden.push(cod);
        visitados.add(cod);
        for (const cons of (usadoPor.get(cod) || [])) {
            indeg.set(cons, indeg.get(cons) - 1);
            if (indeg.get(cons) === 0) cola.push(cons);
        }
    }
    // Ciclos: agregamos al final para no perderlas del recálculo
    const ciclos = [];
    for (const r of recetas) {
        if (!visitados.has(r.codigo)) {
            orden.push(r.codigo);
            ciclos.push(r.codigo);
        }
    }

    async function calcularCosto(codigo) {
        const subproducto = subprodMap.get(codigo);
        const detalleRes = await client.query(`
            SELECT dr.codigo, dr.articulo, dr.cantidad, COALESCE(dr.tipo, 'ARTICULO') AS tipo
            FROM detalle_recetas dr
            WHERE dr.receta = $1
        `, [codigo]);

        let costoTotal = 0;
        for (const det of detalleRes.rows) {
            if (det.tipo === 'RECETA' && det.articulo === codigo) {
                // auto-referencia: solo el principal limpia el desglose compartido
                if (esPrincipal) {
                    await client.query(
                        'UPDATE detalle_recetas SET vr_unit = 0, vr_total = 0 WHERE codigo = $1',
                        [det.codigo]
                    );
                }
                continue;
            }
            let precio = 0;
            if (det.tipo === 'ARTICULO') {
                if (esPrincipal) {
                    const artRes = await client.query('SELECT valor FROM articulos WHERE codigo = $1', [det.articulo]);
                    precio = artRes.rows.length > 0 ? parseFloat(artRes.rows[0].valor) || 0 : 0;
                } else {
                    const r = await client.query(
                        `SELECT COALESCE(
                            (SELECT valor FROM articulo_costo_empresa WHERE empresa = $1 AND TRIM(codigo) = TRIM($2)),
                            (SELECT valor FROM articulos WHERE TRIM(codigo) = TRIM($2)),
                            0) AS valor`,
                        [empresa, det.articulo]
                    );
                    precio = parseFloat(r.rows[0].valor) || 0;
                }
            } else if (det.tipo === 'RECETA') {
                if (esPrincipal) {
                    const recRes = await client.query('SELECT valor FROM recetas WHERE codigo = $1', [det.articulo]);
                    precio = recRes.rows.length > 0 ? parseFloat(recRes.rows[0].valor) || 0 : 0;
                } else {
                    const r = await client.query(
                        `SELECT COALESCE(
                            (SELECT valor FROM receta_costo_empresa WHERE empresa = $1 AND codigo = $2),
                            (SELECT valor FROM recetas WHERE codigo = $2),
                            0) AS valor`,
                        [empresa, det.articulo]
                    );
                    precio = parseFloat(r.rows[0].valor) || 0;
                }
            }
            const cant = parseFloat(det.cantidad) || 0;
            costoTotal += precio * cant;
            // Desglose por línea (vr_unit/vr_total) vive en la fila compartida:
            // solo lo escribe el principal (es el desglose base). El desglose por
            // empresa se calcula al vuelo en la Fase 3.
            if (esPrincipal) {
                await client.query(
                    'UPDATE detalle_recetas SET vr_unit = $1, vr_total = $2 WHERE codigo = $3',
                    [precio, precio * cant, det.codigo]
                );
            }
        }

        if (esPrincipal) {
            await client.query('UPDATE recetas SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
            if (subproducto === 'SI') {
                await client.query('UPDATE articulos SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
            }
        } else {
            await client.query(
                `INSERT INTO receta_costo_empresa (empresa, codigo, valor) VALUES ($1, $2, $3)
                 ON CONFLICT (empresa, codigo) DO UPDATE SET valor = EXCLUDED.valor`,
                [empresa, codigo, costoTotal]
            );
            // Subproducto: su costo también alimenta la capa de artículos de la empresa,
            // para que las recetas que lo usan como ingrediente lo tomen actualizado.
            if (subproducto === 'SI') {
                await client.query(
                    `INSERT INTO articulo_costo_empresa (empresa, codigo, valor) VALUES ($1, $2, $3)
                     ON CONFLICT (empresa, codigo) DO UPDATE SET valor = EXCLUDED.valor`,
                    [empresa, codigo, costoTotal]
                );
            }
        }
        return { codigo, costo: costoTotal };
    }

    const resultados = [];
    for (const cod of orden) resultados.push(await calcularCosto(cod));

    return { resultados, ciclos };
}

// POST /api/recetas/recalcular-todos - orden topológico por dependencias + detección auto-referencia y ciclos
app.post('/api/recetas/recalcular-todos', async (req, res) => {
    const client = await pool.connect();
    try {
        // Empresa solicitante: recalcula SU capa de costos. Si no viene, el principal.
        let empresa = req.query.empresa || req.headers['x-empresa'] || req.body?.empresa;
        if (!empresa) {
            const p = await pool.query(`SELECT codigo FROM empresas WHERE tipo_empresa = 'PROVEEDOR' LIMIT 1`);
            empresa = p.rows[0]?.codigo;
        }
        await client.query('BEGIN');
        const { resultados, ciclos } = await ejecutarRecalculoTodasRecetas(client, empresa);
        await client.query('COMMIT');
        res.json({
            success: true,
            empresa,
            recalculadas: resultados.length,
            ciclos_detectados: ciclos,
            detalle: resultados
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/recetas/recalcular-todos:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ================================================================
// RECALCULO AUTOMATICO DE COSTOS DE RECETAS (job silencioso)
// ================================================================
// Corre en segundo plano, sin que el usuario lo note ni tenga que esperar:
// cada hora revisa si ya pasó el intervalo configurado desde la última
// ejecución (persistida en sistema_tareas) y, si toca, recalcula todas las
// recetas. Así el costo de las recetas queda al día con los cambios de
// precio de artículos/productos sin bloquear ninguna pantalla del usuario.
pool.query(`CREATE TABLE IF NOT EXISTS sistema_tareas (
    tarea VARCHAR(50) PRIMARY KEY,
    ultima_ejecucion TIMESTAMP
)`).catch(() => {});

// Intervalo configurable desde Configuración General (empresas.recalculo_recetas_horas).
// Como el catálogo de recetas es único para toda la instalación, se respeta el
// valor más exigente (menor) entre las empresas que lo hayan configurado.
async function obtenerIntervaloRecalculoHoras() {
    try {
        const r = await pool.query(
            `SELECT MIN(COALESCE(recalculo_recetas_horas, 24)) AS horas FROM empresas`
        );
        return parseInt(r.rows[0]?.horas) || 24;
    } catch {
        return 24;
    }
}

async function ejecutarRecalculoRecetasSiToca() {
    try {
        const intervaloHoras = await obtenerIntervaloRecalculoHoras();
        const chk = await pool.query(
            `SELECT ultima_ejecucion FROM sistema_tareas WHERE tarea = 'recalculo_recetas'`
        );
        const ultima = chk.rows[0]?.ultima_ejecucion;
        const horasDesde = ultima ? (Date.now() - new Date(ultima).getTime()) / 3600000 : Infinity;
        if (horasDesde < intervaloHoras) return;

        // Empresas a recalcular: el principal + cada empresa que tenga capa propia
        // de costos de artículos (que es lo que hace variar el costo de sus recetas).
        const empresasRes = await pool.query(`
            SELECT codigo FROM empresas WHERE tipo_empresa = 'PROVEEDOR'
            UNION
            SELECT DISTINCT empresa AS codigo FROM articulo_costo_empresa
        `);
        const empresas = empresasRes.rows.map(r => r.codigo).filter(Boolean);

        let okCount = 0;
        for (const emp of empresas) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const { resultados, ciclos } = await ejecutarRecalculoTodasRecetas(client, emp);
                await client.query('COMMIT');
                okCount++;
                console.log(`[recalculo-recetas] empresa ${emp}: ${resultados.length} recetas, ${ciclos.length} ciclos`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`[recalculo-recetas] Error empresa ${emp}:`, err.message);
            } finally {
                client.release();
            }
        }

        await pool.query(
            `INSERT INTO sistema_tareas (tarea, ultima_ejecucion) VALUES ('recalculo_recetas', NOW())
             ON CONFLICT (tarea) DO UPDATE SET ultima_ejecucion = NOW()`
        );
        console.log(`[recalculo-recetas] Recalculo automatico OK para ${okCount}/${empresas.length} empresa(s)`);
    } catch (err) {
        console.error('[recalculo-recetas] Error verificando ultima ejecucion:', err.message);
    }
}

setInterval(ejecutarRecalculoRecetasSiToca, 60 * 60 * 1000); // revisa cada hora si ya toca
setTimeout(ejecutarRecalculoRecetasSiToca, 5 * 60 * 1000);   // primera revisión poco después de arrancar

// GET /api/recetas-reporte/costos - Reporte de costos
app.get('/api/recetas-reporte/costos', async (req, res) => {
    const { grupo, subproducto } = req.query;
    // Costo resuelto por empresa: COALESCE(su capa, valor base del principal).
    const empresa = req.query.empresa || req.headers['x-empresa'] || null;
    try {
        const params = [empresa];   // $1 = empresa (capa de costo)
        let sql = `
            SELECT r.codigo,
                   r.nombre,
                   COALESCE(r.grupo_receta, '') AS grupo_receta,
                   COALESCE(r.subproducto, '')  AS subproducto,
                   COALESCE(r.und, '')           AS und,
                   COALESCE(r.precio_venta, 0)   AS precio_venta,
                   COALESCE(rce.valor, r.valor, 0) AS costo,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((COALESCE(rce.valor, r.valor, 0) / r.precio_venta * 100)::numeric, 2)
                        ELSE 0 END               AS porcentaje_costo,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((r.precio_venta - COALESCE(rce.valor, r.valor, 0))::numeric, 2)
                        ELSE 0 END               AS margen,
                   (SELECT COUNT(*) FROM detalle_recetas dr WHERE dr.receta = r.codigo) AS num_ingredientes
            FROM recetas r
            LEFT JOIN receta_costo_empresa rce
                   ON TRIM(rce.codigo) = TRIM(r.codigo) AND TRIM(rce.empresa) = TRIM($1::text)
        `;
        const conditions = [];
        if (grupo && grupo !== 'TODOS') {
            params.push(grupo);
            conditions.push(`r.grupo_receta = $${params.length}`);
        }
        if (subproducto && subproducto !== 'TODOS') {
            params.push(subproducto);
            conditions.push(`COALESCE(r.subproducto,'NO') = $${params.length}`);
        }
        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY r.grupo_receta, r.nombre';
        const result = await pool.query(sql, params);

        const rows = result.rows;
        const conPV = rows.filter(r => parseFloat(r.precio_venta) > 0);
        const totals = {
            total_recetas:   rows.length,
            costo_promedio:  rows.length > 0 ? rows.reduce((s,r) => s + parseFloat(r.costo), 0) / rows.length : 0,
            precio_promedio: rows.length > 0 ? rows.reduce((s,r) => s + parseFloat(r.precio_venta), 0) / rows.length : 0,
            margen_promedio: conPV.length > 0 ? conPV.reduce((s,r) => s + parseFloat(r.porcentaje_costo), 0) / conPV.length : 0,
        };
        res.json({ success: true, data: rows, totals });
    } catch (error) {
        console.error('Error GET /api/recetas-reporte/costos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// PERMISOS DE MÓDULOS POR EMPRESA
// ================================================================

// Auto-create tabla permisos_modulos
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS permisos_modulos (
                empresa VARCHAR(50) NOT NULL PRIMARY KEY,
                rutas_deshabilitadas TEXT DEFAULT '[]'
            )
        `);
        // rutas_deshabilitadas: deshabilitado en AMBAS plataformas (legado)
        // rutas_deshabilitadas_movil / _completa: deshabilitado solo en esa plataforma
        await pool.query(`ALTER TABLE permisos_modulos ADD COLUMN IF NOT EXISTS rutas_deshabilitadas_movil TEXT DEFAULT '[]'`);
        await pool.query(`ALTER TABLE permisos_modulos ADD COLUMN IF NOT EXISTS rutas_deshabilitadas_completa TEXT DEFAULT '[]'`);
        console.log('✅ Tabla permisos_modulos lista');
    } catch (err) {
        console.error('❌ Error creando tabla permisos_modulos:', err.message);
    }
})();

// Auto-create tabla permisos_usuarios (permisos individuales por usuario)
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS permisos_usuarios (
                usuario_codigo VARCHAR(20) NOT NULL,
                empresa VARCHAR(50) NOT NULL,
                rutas_deshabilitadas TEXT DEFAULT '[]',
                rutas_deshabilitadas_movil TEXT DEFAULT '[]',
                rutas_deshabilitadas_completa TEXT DEFAULT '[]',
                PRIMARY KEY (usuario_codigo, empresa)
            )
        `);
        console.log('✅ Tabla permisos_usuarios lista');
    } catch (err) {
        console.error('❌ Error creando tabla permisos_usuarios:', err.message);
    }
})();

// Auto-migración: columna tipo en detalle_recetas (subrecetas jerárquicas)
(async () => {
    try {
        await pool.query(`
            ALTER TABLE detalle_recetas
            ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'ARTICULO'
        `);
        console.log('✅ Columna detalle_recetas.tipo lista');
    } catch (err) {
        console.error('❌ Error migrando detalle_recetas.tipo:', err.message);
    }
})();

// Auto-migración: columna lista_precio_id en empresas
(async () => {
    try {
        await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS lista_precio_id INTEGER DEFAULT NULL`);
        await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS bodega_maestra VARCHAR(2) DEFAULT NULL`);
        await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pct_imprevisto_despachos NUMERIC(5,2) DEFAULT 0`);
        await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS formato_etiqueta_produccion VARCHAR(5) DEFAULT '6x4'`);
        await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS recalculo_recetas_horas INTEGER DEFAULT 24`);
        console.log('✅ Columnas empresas listas');
    } catch (e) { console.error('Error migrando empresas ADD:', e.message); }
})();

// Migración separada: ampliar bodega_maestra a VARCHAR(20) usando USING cast
(async () => {
    try {
        await pool.query(`
            ALTER TABLE empresas
            ALTER COLUMN bodega_maestra TYPE VARCHAR(20) USING bodega_maestra::VARCHAR(20)
        `);
        console.log('✅ Columna bodega_maestra ampliada a VARCHAR(20)');
    } catch (e) { console.error('Error ampliando bodega_maestra:', e.message); }
})();

// PUT /api/empresas/clientes/:codigo/lista-precio — asignar lista de precio a cliente
app.put('/api/empresas/clientes/:codigo/lista-precio', async (req, res) => {
    const { codigo } = req.params;
    const { lista_precio_id } = req.body;
    try {
        await pool.query(
            `UPDATE empresas SET lista_precio_id = $1 WHERE codigo = $2`,
            [lista_precio_id || null, parseInt(codigo)]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/empresas/clientes/:codigo/lista-precio:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/empresas/clientes — solo empresas tipo CLIENTE
app.get('/api/empresas/clientes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.codigo, e.nombre, e.tipo_empresa,
                    e.lista_precio_id,
                    clp.lista AS lista_precio_nombre
             FROM empresas e
             LEFT JOIN config_listas_precios clp ON clp.id = e.lista_precio_id
             WHERE e.tipo_empresa = 'CLIENTE' ORDER BY e.nombre`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/empresas/clientes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/empresas/bodega-maestra — obtener la bodega maestra de la empresa
app.get('/api/empresas/bodega-maestra', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const result = await pool.query(
            `SELECT e.codigo, e.nombre, e.bodega_maestra,
                    COALESCE(e.pct_imprevisto_despachos, 0) AS pct_imprevisto_despachos,
                    cc.codigo AS centro_costo_codigo, cc.nombre AS centro_costo_nombre
             FROM empresas e
             LEFT JOIN ccostos cc ON cc.codigo = e.bodega_maestra
             WHERE e.codigo = $1`,
            [empresaCod]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error GET /api/empresas/bodega-maestra:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/empresas/bodega-maestra — actualizar la bodega maestra (asignar centro de costo)
app.put('/api/empresas/bodega-maestra', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        const { bodega_maestra } = req.body; // NULL para desactivar, o código del centro de costo

        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        // Si se proporciona bodega_maestra, validar que existe el centro de costo
        if (bodega_maestra) {
            const ccResult = await pool.query(
                `SELECT codigo FROM ccostos WHERE codigo = $1`,
                [bodega_maestra]
            );
            if (ccResult.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Centro de costo no encontrado' });
            }
        }

        const result = await pool.query(
            `UPDATE empresas SET bodega_maestra = $1 WHERE codigo = $2
             RETURNING codigo, nombre, bodega_maestra`,
            [bodega_maestra || null, empresaCod]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/empresas/bodega-maestra:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/empresas/pct-imprevisto-despachos — % de imprevisto adicional para el promedio de ventas
app.put('/api/empresas/pct-imprevisto-despachos', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        const { pct_imprevisto_despachos } = req.body;

        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const pct = parseFloat(pct_imprevisto_despachos);
        if (isNaN(pct) || pct < 0 || pct > 999) {
            return res.status(400).json({ success: false, error: 'Porcentaje inválido' });
        }

        const result = await pool.query(
            `UPDATE empresas SET pct_imprevisto_despachos = $1 WHERE codigo = $2
             RETURNING codigo, nombre, pct_imprevisto_despachos`,
            [pct, empresaCod]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/empresas/pct-imprevisto-despachos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/empresas/formato-etiqueta-produccion — formato de etiqueta (6x4 o 3x4) configurado
app.get('/api/empresas/formato-etiqueta-produccion', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const result = await pool.query(
            `SELECT COALESCE(formato_etiqueta_produccion, '6x4') AS formato_etiqueta_produccion
             FROM empresas WHERE codigo = $1`,
            [empresaCod]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error GET /api/empresas/formato-etiqueta-produccion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/empresas/formato-etiqueta-produccion — actualizar formato de etiqueta (6x4 o 3x4)
app.put('/api/empresas/formato-etiqueta-produccion', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        const { formato_etiqueta_produccion } = req.body;

        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });
        if (!['6x4', '3x4'].includes(formato_etiqueta_produccion)) {
            return res.status(400).json({ success: false, error: 'Formato inválido. Debe ser 6x4 o 3x4' });
        }

        const result = await pool.query(
            `UPDATE empresas SET formato_etiqueta_produccion = $1 WHERE codigo = $2
             RETURNING codigo, nombre, formato_etiqueta_produccion`,
            [formato_etiqueta_produccion, empresaCod]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/empresas/formato-etiqueta-produccion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/empresas/recalculo-recetas-horas — horas entre recalculos automaticos de costos de recetas
app.get('/api/empresas/recalculo-recetas-horas', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });

        const result = await pool.query(
            `SELECT COALESCE(recalculo_recetas_horas, 24) AS recalculo_recetas_horas
             FROM empresas WHERE codigo = $1`,
            [empresaCod]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error GET /api/empresas/recalculo-recetas-horas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/empresas/recalculo-recetas-horas — actualizar horas entre recalculos automaticos
app.put('/api/empresas/recalculo-recetas-horas', async (req, res) => {
    try {
        const empresaCod = req.query.empresa || req.headers['x-empresa'];
        const horas = parseInt(req.body.recalculo_recetas_horas);

        if (!empresaCod) return res.status(400).json({ success: false, error: 'Empresa requerida' });
        if (![24, 48, 168].includes(horas)) {
            return res.status(400).json({ success: false, error: 'Valor inválido. Debe ser 24, 48 o 168 horas' });
        }

        const result = await pool.query(
            `UPDATE empresas SET recalculo_recetas_horas = $1 WHERE codigo = $2
             RETURNING codigo, nombre, recalculo_recetas_horas`,
            [horas, empresaCod]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/empresas/recalculo-recetas-horas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function parseRutas(raw) {
    return typeof raw === 'string' ? JSON.parse(raw || '[]') : (Array.isArray(raw) ? raw : []);
}

// GET /api/permisos-modulos/:empresa — retorna rutas deshabilitadas para una empresa
app.get('/api/permisos-modulos/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const result = await pool.query(
            'SELECT rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa FROM permisos_modulos WHERE empresa = $1',
            [empresa]
        );
        if (result.rows.length === 0) {
            return res.json({ success: true, data: { rutas_deshabilitadas: [], rutas_deshabilitadas_movil: [], rutas_deshabilitadas_completa: [] } });
        }
        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                rutas_deshabilitadas: parseRutas(row.rutas_deshabilitadas),
                rutas_deshabilitadas_movil: parseRutas(row.rutas_deshabilitadas_movil),
                rutas_deshabilitadas_completa: parseRutas(row.rutas_deshabilitadas_completa),
            },
        });
    } catch (error) {
        console.error('Error GET /api/permisos-modulos/:empresa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/permisos-modulos/:empresa — upsert manual
app.put('/api/permisos-modulos/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const { rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa } = req.body;
        const json = JSON.stringify(Array.isArray(rutas_deshabilitadas) ? rutas_deshabilitadas : []);
        const jsonMovil = JSON.stringify(Array.isArray(rutas_deshabilitadas_movil) ? rutas_deshabilitadas_movil : []);
        const jsonCompleta = JSON.stringify(Array.isArray(rutas_deshabilitadas_completa) ? rutas_deshabilitadas_completa : []);

        const check = await pool.query('SELECT empresa FROM permisos_modulos WHERE empresa = $1', [empresa]);
        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE permisos_modulos SET rutas_deshabilitadas = $1, rutas_deshabilitadas_movil = $2, rutas_deshabilitadas_completa = $3 WHERE empresa = $4',
                [json, jsonMovil, jsonCompleta, empresa]
            );
        } else {
            await pool.query(
                'INSERT INTO permisos_modulos (empresa, rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa) VALUES ($1, $2, $3, $4)',
                [empresa, json, jsonMovil, jsonCompleta]
            );
        }
        res.json({ success: true, message: 'Permisos guardados correctamente' });
    } catch (error) {
        console.error('Error PUT /api/permisos-modulos/:empresa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/permisos-usuarios/:empresa/:usuarioCodigo — permisos individuales de un usuario
app.get('/api/permisos-usuarios/:empresa/:usuarioCodigo', async (req, res) => {
    try {
        const { empresa, usuarioCodigo } = req.params;
        const result = await pool.query(
            'SELECT rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa FROM permisos_usuarios WHERE empresa = $1 AND usuario_codigo = $2',
            [empresa, usuarioCodigo]
        );
        if (result.rows.length === 0) {
            return res.json({ success: true, data: { rutas_deshabilitadas: [], rutas_deshabilitadas_movil: [], rutas_deshabilitadas_completa: [] } });
        }
        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                rutas_deshabilitadas: parseRutas(row.rutas_deshabilitadas),
                rutas_deshabilitadas_movil: parseRutas(row.rutas_deshabilitadas_movil),
                rutas_deshabilitadas_completa: parseRutas(row.rutas_deshabilitadas_completa),
            },
        });
    } catch (error) {
        console.error('Error GET /api/permisos-usuarios/:empresa/:usuarioCodigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/permisos-usuarios/:empresa/:usuarioCodigo — upsert manual
app.put('/api/permisos-usuarios/:empresa/:usuarioCodigo', async (req, res) => {
    try {
        const { empresa, usuarioCodigo } = req.params;
        const { rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa } = req.body;
        const json = JSON.stringify(Array.isArray(rutas_deshabilitadas) ? rutas_deshabilitadas : []);
        const jsonMovil = JSON.stringify(Array.isArray(rutas_deshabilitadas_movil) ? rutas_deshabilitadas_movil : []);
        const jsonCompleta = JSON.stringify(Array.isArray(rutas_deshabilitadas_completa) ? rutas_deshabilitadas_completa : []);

        const check = await pool.query(
            'SELECT usuario_codigo FROM permisos_usuarios WHERE empresa = $1 AND usuario_codigo = $2',
            [empresa, usuarioCodigo]
        );
        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE permisos_usuarios SET rutas_deshabilitadas = $1, rutas_deshabilitadas_movil = $2, rutas_deshabilitadas_completa = $3 WHERE empresa = $4 AND usuario_codigo = $5',
                [json, jsonMovil, jsonCompleta, empresa, usuarioCodigo]
            );
        } else {
            await pool.query(
                'INSERT INTO permisos_usuarios (usuario_codigo, empresa, rutas_deshabilitadas, rutas_deshabilitadas_movil, rutas_deshabilitadas_completa) VALUES ($1, $2, $3, $4, $5)',
                [usuarioCodigo, empresa, json, jsonMovil, jsonCompleta]
            );
        }
        res.json({ success: true, message: 'Permisos guardados correctamente' });
    } catch (error) {
        console.error('Error PUT /api/permisos-usuarios/:empresa/:usuarioCodigo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// MÓDULO: NÓMINA
// ================================================================

// ── Crear tablas si no existen ─────────────────────────────────
async function crearTablasNomina() {
    const sqls = [
        `CREATE TABLE IF NOT EXISTS nom_cargos (
            id SERIAL PRIMARY KEY, empresa INT4,
            nombre VARCHAR(100) NOT NULL, descripcion VARCHAR(500),
            activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_empleados (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            nombre VARCHAR(100) NOT NULL, apellido VARCHAR(100) NOT NULL,
            fecha_nacimiento DATE, email VARCHAR(150), telefono VARCHAR(25),
            direccion VARCHAR(250), ciudad VARCHAR(100), estado_residencia VARCHAR(50),
            pais VARCHAR(50) DEFAULT 'USA', zipcode VARCHAR(10),
            cargo_id INT4, ccosto VARCHAR(3),
            fecha_ingreso DATE, fecha_retiro DATE, motivo_retiro VARCHAR(300),
            estado VARCHAR(15) DEFAULT 'ACTIVO',
            tipo_empleado VARCHAR(5) DEFAULT 'W2',
            tipo_contrato VARCHAR(15) DEFAULT 'FULL_TIME',
            empresa_contratista VARCHAR(150),
            es_por_horas BOOLEAN DEFAULT TRUE,
            valor_hora NUMERIC(10,2), monto_fijo_semanal NUMERIC(10,2),
            frecuencia_pago VARCHAR(10) DEFAULT 'WEEKLY',
            ssn VARCHAR(15), permiso_trabajo VARCHAR(50), fecha_vencimiento_permiso DATE,
            w4_filing_status VARCHAR(25) DEFAULT 'SINGLE',
            w4_multiple_jobs BOOLEAN DEFAULT FALSE,
            w4_claim_dependents NUMERIC(10,2) DEFAULT 0,
            w4_other_income NUMERIC(10,2) DEFAULT 0,
            w4_deductions NUMERIC(10,2) DEFAULT 0,
            w4_extra_withholding NUMERIC(10,2) DEFAULT 0,
            w4_exempt BOOLEAN DEFAULT FALSE,
            wc_rate NUMERIC(6,4), wc_code VARCHAR(20),
            foto BYTEA, foto_nombre VARCHAR(100), notas VARCHAR(1000),
            created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_empleado_historial (
            id SERIAL PRIMARY KEY, empleado_id INT4 NOT NULL,
            tipo VARCHAR(20) NOT NULL, fecha DATE NOT NULL,
            tipo_empleado VARCHAR(5), valor_hora NUMERIC(10,2),
            monto_fijo_semanal NUMERIC(10,2), empresa_contratista VARCHAR(150),
            motivo VARCHAR(300), observaciones VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_horario_config (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            nombre VARCHAR(100) NOT NULL, descripcion VARCHAR(300),
            activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_horario_config_dia (
            id SERIAL PRIMARY KEY, config_id INT4 NOT NULL,
            dia_semana INT NOT NULL,
            hora_inicio TIME, hora_fin TIME,
            cruza_medianoche BOOLEAN DEFAULT FALSE,
            horas_default NUMERIC(4,2), activo BOOLEAN DEFAULT TRUE
        )`,
        `CREATE TABLE IF NOT EXISTS nom_semana (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            semana_inicio DATE NOT NULL, semana_fin DATE NOT NULL,
            estado VARCHAR(20) DEFAULT 'BORRADOR',
            publicado_en TIMESTAMP, notas VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_semana_detalle (
            id SERIAL PRIMARY KEY, semana_id INT4 NOT NULL, empleado_id INT4 NOT NULL,
            fecha DATE NOT NULL, ccosto VARCHAR(3),
            prog_inicio TIME, prog_fin TIME, prog_horas NUMERIC(4,2),
            prog_cruza_medianoche BOOLEAN DEFAULT FALSE,
            real_inicio TIME, real_fin TIME, real_horas NUMERIC(4,2),
            es_dia_libre BOOLEAN DEFAULT FALSE,
            ausencia_tipo VARCHAR(30), notas VARCHAR(300), ajustado BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_liquidacion (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            semana_inicio DATE NOT NULL, semana_fin DATE NOT NULL,
            semana_id INT4, estado VARCHAR(20) DEFAULT 'BORRADOR',
            total_bruto NUMERIC(14,2) DEFAULT 0,
            total_deducciones_emp NUMERIC(14,2) DEFAULT 0,
            total_aportes_er NUMERIC(14,2) DEFAULT 0,
            total_neto NUMERIC(14,2) DEFAULT 0,
            notas VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_liquidacion_linea (
            id SERIAL PRIMARY KEY, liquidacion_id INT4 NOT NULL, empleado_id INT4 NOT NULL,
            tipo_empleado VARCHAR(5),
            horas_regulares NUMERIC(5,2) DEFAULT 0, horas_overtime NUMERIC(5,2) DEFAULT 0,
            valor_hora NUMERIC(10,2), valor_hora_ot NUMERIC(10,2),
            bruto_regular NUMERIC(12,2) DEFAULT 0, bruto_overtime NUMERIC(12,2) DEFAULT 0,
            bruto_base NUMERIC(12,2) DEFAULT 0, monto_adicional NUMERIC(12,2) DEFAULT 0,
            total_bruto NUMERIC(12,2) DEFAULT 0,
            federal_income_tax NUMERIC(10,2) DEFAULT 0,
            social_security_emp NUMERIC(10,2) DEFAULT 0,
            medicare_emp NUMERIC(10,2) DEFAULT 0,
            medicare_adicional NUMERIC(10,2) DEFAULT 0,
            workers_comp NUMERIC(10,2) DEFAULT 0,
            otras_deducciones NUMERIC(10,2) DEFAULT 0,
            total_deducciones NUMERIC(10,2) DEFAULT 0,
            social_security_er NUMERIC(10,2) DEFAULT 0,
            medicare_er NUMERIC(10,2) DEFAULT 0,
            futa NUMERIC(10,2) DEFAULT 0, suta NUMERIC(10,2) DEFAULT 0,
            total_aportes_er NUMERIC(10,2) DEFAULT 0,
            total_neto NUMERIC(12,2) DEFAULT 0,
            empresa_contratista VARCHAR(150), es_monto_fijo BOOLEAN DEFAULT FALSE,
            ytd_bruto NUMERIC(14,2) DEFAULT 0, notas VARCHAR(300),
            created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS nom_liquidacion_ccosto (
            id SERIAL PRIMARY KEY, linea_id INT4 NOT NULL,
            ccosto VARCHAR(3) NOT NULL,
            horas NUMERIC(5,2) DEFAULT 0,
            costo_bruto NUMERIC(12,2) DEFAULT 0,
            costo_total NUMERIC(12,2) DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS nom_config_fiscal (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL, anio INT4 NOT NULL,
            ss_rate NUMERIC(6,5) DEFAULT 0.062,
            ss_wage_base NUMERIC(10,2) DEFAULT 168600,
            medicare_rate NUMERIC(6,5) DEFAULT 0.0145,
            medicare_adicional_rate NUMERIC(6,5) DEFAULT 0.009,
            medicare_adicional_threshold NUMERIC(10,2) DEFAULT 200000,
            futa_rate NUMERIC(6,5) DEFAULT 0.006,
            futa_wage_base NUMERIC(10,2) DEFAULT 7000,
            suta_rate NUMERIC(6,5) DEFAULT 0.027,
            suta_wage_base NUMERIC(10,2) DEFAULT 7000,
            ot_threshold_hours NUMERIC(4,1) DEFAULT 40.0,
            ot_multiplier NUMERIC(4,2) DEFAULT 1.50,
            fl_min_wage NUMERIC(6,2) DEFAULT 13.00,
            wc_default_rate NUMERIC(6,4) DEFAULT 0.0,
            cuenta_nomina VARCHAR(50) DEFAULT '',
            activo BOOLEAN DEFAULT TRUE,
            UNIQUE(empresa, anio)
        )`,
        `CREATE TABLE IF NOT EXISTS nom_propinas (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            anio INT4 NOT NULL, mes INT4 NOT NULL,
            estado VARCHAR(15) DEFAULT 'BORRADOR',
            total_propinas NUMERIC(12,2) DEFAULT 0,
            total_horas NUMERIC(10,2) DEFAULT 0,
            fecha_generacion TIMESTAMP DEFAULT NOW(),
            fecha_pago TIMESTAMP,
            UNIQUE(empresa, anio, mes)
        )`,
        `CREATE TABLE IF NOT EXISTS nom_propinas_detalle (
            id SERIAL PRIMARY KEY, propina_id INT4 NOT NULL REFERENCES nom_propinas(id) ON DELETE CASCADE,
            ccosto VARCHAR(3), ccosto_nombre VARCHAR(150),
            total_propinas_ccosto NUMERIC(12,2) DEFAULT 0,
            total_horas_ccosto NUMERIC(10,2) DEFAULT 0,
            empleado_id INT4 NOT NULL,
            empleado_nombre VARCHAR(200),
            horas NUMERIC(10,2) DEFAULT 0,
            valor_asignado NUMERIC(12,2) DEFAULT 0
        )`
    ];
    for (const sql of sqls) {
        try { await pool.query(sql); } catch(e) { console.error('nom table error:', e.message); }
    }
    console.log('✅ Tablas de nómina verificadas');
}
crearTablasNomina();

// ── Agregar columna faltante a nom_empleados ──
async function agregarColumnasNomina() {
    const queries = [
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS fecha_vencimiento_permiso DATE`,
        `ALTER TABLE nom_config_fiscal ADD COLUMN IF NOT EXISTS cuenta_nomina VARCHAR(50) DEFAULT ''`,
        `ALTER TABLE nom_config_fiscal ADD COLUMN IF NOT EXISTS fit_config JSONB`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(15) DEFAULT 'HORAS'`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS valor_dia NUMERIC(10,2)`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS excluir_wc BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE nom_liquidacion_linea ADD COLUMN IF NOT EXISTS dias_trabajados INT DEFAULT 0`,
        `ALTER TABLE nom_liquidacion_linea ADD COLUMN IF NOT EXISTS es_por_dia BOOLEAN DEFAULT FALSE`
    ];
    for (const sql of queries) {
        try { await pool.query(sql); }
        catch(e) { console.error('Migración nomina:', e.message); }
    }
    console.log('✅ Columnas de nómina verificadas');
}
agregarColumnasNomina();

// ── Cálculo de Federal Income Tax (IRS Pub. 15-T) ──────────────
// Valores por defecto 2025. Se sobreescriben con fit_config de nom_config_fiscal.
const FIT_RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
const FIT_DEFAULTS = {
    sd_single:  15000, sd_mfj: 30000, sd_hoh: 22500,
    brackets_single: [11925, 48475, 103350, 197300, 250525, 626350],
    brackets_mfj:    [23850, 96950, 206700, 394600, 501050, 751600],
    brackets_hoh:    [17000, 64850, 103350, 197300, 250500, 626350]
};

function buildFitBrackets(thresholds) {
    let base = 0, prev = 0;
    const rows = thresholds.map((t, i) => {
        const row = [prev, t, FIT_RATES[i], base];
        base += (t - prev) * FIT_RATES[i];
        prev = t;
        return row;
    });
    rows.push([prev, Infinity, FIT_RATES[thresholds.length], base]);
    return rows;
}

function calcularFederalIncomeTax(brutoAnualizado, filingStatus, fitCfg, step2) {
    if (!filingStatus || filingStatus === 'EXEMPT') return 0;
    const fc = (fitCfg && typeof fitCfg === 'object') ? fitCfg : FIT_DEFAULTS;

    let sd, thresholds;
    if (filingStatus === 'MARRIED_JOINTLY') {
        sd = parseFloat(fc.sd_mfj  || FIT_DEFAULTS.sd_mfj);
        thresholds = fc.brackets_mfj || FIT_DEFAULTS.brackets_mfj;
    } else if (filingStatus === 'HEAD_OF_HOUSEHOLD') {
        sd = parseFloat(fc.sd_hoh  || FIT_DEFAULTS.sd_hoh);
        thresholds = fc.brackets_hoh || FIT_DEFAULTS.brackets_hoh;
    } else {
        sd = parseFloat(fc.sd_single || FIT_DEFAULTS.sd_single);
        thresholds = fc.brackets_single || FIT_DEFAULTS.brackets_single;
    }
    if (step2) sd = sd / 2;   // W-4 Step 2: Multiple Jobs → deducción a la mitad

    const taxableIncome = Math.max(0, brutoAnualizado - sd);
    const brackets = buildFitBrackets(thresholds.map(Number));

    let taxAnual = 0;
    for (const [low, high, rate, baseTax] of brackets) {
        if (taxableIncome > low) {
            taxAnual = baseTax + (Math.min(taxableIncome, high) - low) * rate;
            if (taxableIncome <= high) break;
        }
    }
    return Math.max(0, taxAnual);
}

function calcularRetenciones(empleado, totalBruto, ytdBruto, cfg) {
    if (empleado.tipo_empleado === '1099') {
        return { federal_income_tax:0, social_security_emp:0, medicare_emp:0,
                 medicare_adicional:0, workers_comp:0, otras_deducciones:0, total_deducciones:0,
                 social_security_er:0, medicare_er:0, futa:0, suta:0, total_aportes_er:0 };
    }
    const bruto = parseFloat(totalBruto) || 0;
    const ytd   = parseFloat(ytdBruto)   || 0;
    const ssRate         = parseFloat(cfg.ss_rate || 0.062);
    const ssWageBase     = parseFloat(cfg.ss_wage_base || 168600);
    const medRate        = parseFloat(cfg.medicare_rate || 0.0145);
    const medAdicRate    = parseFloat(cfg.medicare_adicional_rate || 0.009);
    const medAdicThresh  = parseFloat(cfg.medicare_adicional_threshold || 200000);
    const futaRate       = parseFloat(cfg.futa_rate || 0.006);
    const futaBase       = parseFloat(cfg.futa_wage_base || 7000);
    const sutaRate       = parseFloat(cfg.suta_rate || 0.027);
    const sutaBase       = parseFloat(cfg.suta_wage_base || 7000);
    const wcRate         = parseFloat(empleado.wc_rate || cfg.wc_default_rate || 0);

    // Social Security (6.2% employee + 6.2% employer, up to wage base)
    const ssEligible = Math.max(0, Math.min(bruto, ssWageBase - ytd));
    const ss_emp = ssEligible * ssRate;
    const ss_er  = ssEligible * ssRate;

    // Medicare (1.45% employee + 1.45% employer, no limit)
    const med_emp = bruto * medRate;
    const med_er  = bruto * medRate;

    // Additional Medicare (0.9% employee only, over $200K/year)
    const medAdicEligible = Math.max(0, Math.min(bruto, (ytd + bruto) > medAdicThresh
        ? bruto - Math.max(0, medAdicThresh - ytd) : 0));
    const med_adic = medAdicEligible * medAdicRate;

    // FUTA (employer only, 6% effectively 0.6% after credit, first $7000)
    const futaEligible = Math.max(0, Math.min(bruto, futaBase - ytd));
    const futa = futaEligible * futaRate;

    // SUTA - FL Reemployment (employer only, ~2.7% first $7000)
    const sutaEligible = Math.max(0, Math.min(bruto, sutaBase - ytd));
    const suta = sutaEligible * sutaRate;

    // Federal Income Tax
    let fed_tax = 0;
    if (!empleado.w4_exempt) {
        const annualizado = bruto * 52;
        const adj = annualizado
            + parseFloat(empleado.w4_other_income || 0)
            - parseFloat(empleado.w4_deductions || 0);
        const taxAnual = calcularFederalIncomeTax(
            adj,
            empleado.w4_filing_status || 'SINGLE',
            cfg.fit_config || null,
            !!empleado.w4_multiple_jobs
        );
        const weekly = taxAnual / 52;
        const creditAnual = parseFloat(empleado.w4_claim_dependents || 0);
        const creditWeekly = creditAnual / 52;
        fed_tax = Math.max(0, weekly - creditWeekly + parseFloat(empleado.w4_extra_withholding || 0));
    }

    // Workers Comp (employee portion — omitir si excluir_wc=true)
    const workers_comp = empleado.excluir_wc ? 0 : bruto * wcRate;

    const total_deducciones = fed_tax + ss_emp + med_emp + med_adic + workers_comp;
    const total_aportes_er  = ss_er + med_er + futa + suta;

    return {
        federal_income_tax: +fed_tax.toFixed(2),
        social_security_emp: +ss_emp.toFixed(2),
        medicare_emp: +med_emp.toFixed(2),
        medicare_adicional: +med_adic.toFixed(2),
        workers_comp: +workers_comp.toFixed(2),
        otras_deducciones: 0,
        total_deducciones: +total_deducciones.toFixed(2),
        social_security_er: +ss_er.toFixed(2),
        medicare_er: +med_er.toFixed(2),
        futa: +futa.toFixed(2),
        suta: +suta.toFixed(2),
        total_aportes_er: +total_aportes_er.toFixed(2)
    };
}

// ── CARGOS ──────────────────────────────────────────────────────
app.get('/api/nomina/cargos', async (req, res) => {
    const { empresa } = req.query;
    try {
        const r = await pool.query(
            'SELECT * FROM nom_cargos WHERE empresa = $1 AND activo = TRUE ORDER BY nombre',
            [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/api/nomina/cargos', async (req, res) => {
    const { empresa, nombre, descripcion } = req.body;
    try {
        const r = await pool.query(
            'INSERT INTO nom_cargos (empresa, nombre, descripcion) VALUES ($1,$2,$3) RETURNING *',
            [empresa, nombre, descripcion]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/nomina/cargos/:id', async (req, res) => {
    try {
        await pool.query('UPDATE nom_cargos SET activo=FALSE WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── EMPLEADOS ───────────────────────────────────────────────────
app.get('/api/nomina/empleados-basico', async (req, res) => {
    const { empresa } = req.query;
    try {
        const r = await pool.query(
            `SELECT id, nombre, apellido, estado FROM nom_empleados
             WHERE empresa = $1 AND estado != 'INACTIVO'
             ORDER BY apellido, nombre`,
            [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/nomina/empleados', async (req, res) => {
    const { empresa, estado } = req.query;
    try {
        let where = 'WHERE e.empresa = $1';
        const params = [empresa];
        if (estado && estado !== 'TODOS') { where += ' AND e.estado = $2'; params.push(estado); }
        const r = await pool.query(
            `SELECT e.*, c.nombre AS cargo_nombre,
                    COALESCE(cc.nombre, e.ccosto) AS ccosto_nombre
             FROM nom_empleados e
             LEFT JOIN nom_cargos c ON c.id = e.cargo_id
             LEFT JOIN ccostos cc ON cc.codigo = e.ccosto AND cc.empresa = e.empresa
             ${where}
             ORDER BY e.apellido, e.nombre`,
            params
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/nomina/empleados/:id', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT e.*, c.nombre AS cargo_nombre
             FROM nom_empleados e
             LEFT JOIN nom_cargos c ON c.id = e.cargo_id
             WHERE e.id = $1`, [req.params.id]
        );
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/nomina/empleados', async (req, res) => {
    const d = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO nom_empleados (empresa,nombre,apellido,fecha_nacimiento,email,telefono,
             direccion,ciudad,estado_residencia,zipcode,cargo_id,ccosto,
             fecha_ingreso,estado,tipo_empleado,tipo_contrato,empresa_contratista,
             es_por_horas,valor_hora,monto_fijo_semanal,frecuencia_pago,
             ssn,permiso_trabajo,fecha_vencimiento_permiso,w4_filing_status,w4_multiple_jobs,
             w4_claim_dependents,w4_other_income,w4_deductions,
             w4_extra_withholding,w4_exempt,wc_rate,wc_code,notas,
             tipo_pago,valor_dia,excluir_wc)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37)
             RETURNING id`,
            [d.empresa,d.nombre,d.apellido,d.fecha_nacimiento||null,d.email,d.telefono,
             d.direccion,d.ciudad,d.estado_residencia,d.zipcode,
             d.cargo_id||null,d.ccosto,d.fecha_ingreso,d.estado||'ACTIVO',
             d.tipo_empleado||'W2',d.tipo_contrato||'FULL_TIME',d.empresa_contratista,
             d.es_por_horas!==false,d.valor_hora||null,d.monto_fijo_semanal||null,
             d.frecuencia_pago||'WEEKLY',d.ssn,d.permiso_trabajo,d.fecha_vencimiento_permiso||null,
             d.w4_filing_status||'SINGLE',d.w4_multiple_jobs||false,
             d.w4_claim_dependents||0,d.w4_other_income||0,d.w4_deductions||0,
             d.w4_extra_withholding||0,d.w4_exempt||false,
             d.wc_rate||null,d.wc_code,d.notas,
             d.tipo_pago||'HORAS',d.valor_dia||null,d.excluir_wc||false]
        );
        // Registrar en historial
        await pool.query(
            `INSERT INTO nom_empleado_historial (empleado_id,tipo,fecha,tipo_empleado,valor_hora,monto_fijo_semanal,empresa_contratista,motivo)
             VALUES ($1,'INGRESO',$2,$3,$4,$5,$6,'Alta inicial')`,
            [r.rows[0].id, d.fecha_ingreso, d.tipo_empleado||'W2', d.valor_hora||null,
             d.monto_fijo_semanal||null, d.empresa_contratista]
        );
        res.json({ success: true, data: { id: r.rows[0].id } });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/nomina/empleados/:id', async (req, res) => {
    const d = req.body;
    try {
        await pool.query(
            `UPDATE nom_empleados SET
             nombre=$1,apellido=$2,fecha_nacimiento=$3,email=$4,telefono=$5,
             direccion=$6,ciudad=$7,estado_residencia=$8,zipcode=$9,
             cargo_id=$10,ccosto=$11,estado=$12,tipo_empleado=$13,tipo_contrato=$14,
             empresa_contratista=$15,es_por_horas=$16,valor_hora=$17,monto_fijo_semanal=$18,
             frecuencia_pago=$19,ssn=$20,permiso_trabajo=$21,fecha_vencimiento_permiso=$22,
             w4_filing_status=$23,w4_multiple_jobs=$24,w4_claim_dependents=$25,
             w4_other_income=$26,w4_deductions=$27,
             w4_extra_withholding=$28,w4_exempt=$29,
             wc_rate=$30,wc_code=$31,notas=$32,fecha_retiro=$33,motivo_retiro=$34,
             tipo_pago=$35,valor_dia=$36,excluir_wc=$37,
             updated_at=NOW()
             WHERE id=$38`,
            [d.nombre,d.apellido,d.fecha_nacimiento||null,d.email,d.telefono,
             d.direccion,d.ciudad,d.estado_residencia,d.zipcode,
             d.cargo_id||null,d.ccosto,d.estado,d.tipo_empleado,d.tipo_contrato,
             d.empresa_contratista,d.es_por_horas!==false,d.valor_hora||null,
             d.monto_fijo_semanal||null,d.frecuencia_pago||'WEEKLY',d.ssn,d.permiso_trabajo,
             d.fecha_vencimiento_permiso||null,d.w4_filing_status||'SINGLE',
             d.w4_multiple_jobs||false,d.w4_claim_dependents||0,
             d.w4_other_income||0,d.w4_deductions||0,
             d.w4_extra_withholding||0,d.w4_exempt||false,
             d.wc_rate||null,d.wc_code,d.notas,d.fecha_retiro||null,d.motivo_retiro,
             d.tipo_pago||'HORAS',d.valor_dia||null,d.excluir_wc||false,
             req.params.id]
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Foto empleado
app.post('/api/nomina/empleados/:id/foto', async (req, res) => {
    const { fotoBase64, fotoNombre } = req.body;
    try {
        const buf = Buffer.from(fotoBase64, 'base64');
        await pool.query('UPDATE nom_empleados SET foto=$1, foto_nombre=$2 WHERE id=$3',
            [buf, fotoNombre, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/nomina/empleados/:id/foto', async (req, res) => {
    try {
        const r = await pool.query('SELECT foto, foto_nombre FROM nom_empleados WHERE id=$1', [req.params.id]);
        if (!r.rows[0]?.foto) return res.status(404).end();
        const ext = (r.rows[0].foto_nombre||'foto.jpg').split('.').pop().toLowerCase();
        const mime = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp' };
        res.setHeader('Content-Type', mime[ext]||'image/jpeg');
        res.send(r.rows[0].foto);
    } catch(e) { res.status(500).end(); }
});

// Historial
app.get('/api/nomina/empleados/:id/historial', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM nom_empleado_historial WHERE empleado_id=$1 ORDER BY fecha DESC',
            [req.params.id]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/api/nomina/empleados/:id/historial', async (req, res) => {
    const { tipo, fecha, tipo_empleado, valor_hora, monto_fijo_semanal, empresa_contratista, motivo, observaciones } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO nom_empleado_historial
             (empleado_id,tipo,fecha,tipo_empleado,valor_hora,monto_fijo_semanal,empresa_contratista,motivo,observaciones)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [req.params.id, tipo, fecha, tipo_empleado, valor_hora||null, monto_fijo_semanal||null,
             empresa_contratista, motivo, observaciones]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── CONFIGURACIÓN DE HORARIOS ────────────────────────────────────
app.get('/api/nomina/horario-config', async (req, res) => {
    const { empresa } = req.query;
    try {
        const configs = await pool.query(
            'SELECT * FROM nom_horario_config WHERE empresa=$1 AND activo=TRUE ORDER BY nombre', [empresa]
        );
        const ids = configs.rows.map(c => c.id);
        let dias = [];
        if (ids.length) {
            const d = await pool.query(
                `SELECT * FROM nom_horario_config_dia WHERE config_id = ANY($1) ORDER BY config_id, dia_semana`,
                [ids]
            );
            dias = d.rows;
        }
        const data = configs.rows.map(c => ({
            ...c,
            dias: dias.filter(d => d.config_id === c.id)
        }));
        res.json({ success: true, data });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/nomina/horario-config', async (req, res) => {
    const { empresa, nombre, descripcion, dias } = req.body;
    try {
        const r = await pool.query(
            'INSERT INTO nom_horario_config (empresa, nombre, descripcion) VALUES ($1,$2,$3) RETURNING id',
            [empresa, nombre, descripcion]
        );
        const configId = r.rows[0].id;
        if (dias?.length) {
            for (const d of dias) {
                await pool.query(
                    `INSERT INTO nom_horario_config_dia (config_id,dia_semana,hora_inicio,hora_fin,cruza_medianoche,horas_default,activo)
                     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [configId, d.dia_semana, d.hora_inicio||null, d.hora_fin||null,
                     d.cruza_medianoche||false, d.horas_default||null, d.activo!==false]
                );
            }
        }
        res.json({ success: true, data: { id: configId } });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/nomina/horario-config/:id', async (req, res) => {
    const { nombre, descripcion, dias } = req.body;
    try {
        await pool.query('UPDATE nom_horario_config SET nombre=$1, descripcion=$2 WHERE id=$3',
            [nombre, descripcion, req.params.id]);
        if (dias?.length) {
            await pool.query('DELETE FROM nom_horario_config_dia WHERE config_id=$1', [req.params.id]);
            for (const d of dias) {
                await pool.query(
                    `INSERT INTO nom_horario_config_dia (config_id,dia_semana,hora_inicio,hora_fin,cruza_medianoche,horas_default,activo)
                     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [req.params.id, d.dia_semana, d.hora_inicio||null, d.hora_fin||null,
                     d.cruza_medianoche||false, d.horas_default||null, d.activo!==false]
                );
            }
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── SEMANAS ──────────────────────────────────────────────────────
app.get('/api/nomina/semanas', async (req, res) => {
    const { empresa } = req.query;
    try {
        const r = await pool.query(
            'SELECT * FROM nom_semana WHERE empresa=$1 ORDER BY semana_inicio DESC LIMIT 12', [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/nomina/horas-semana — horas de la semana actual agrupadas por
// centro de costo (usa real_horas si existen, si no las programadas).
// Si no hay semana que contenga hoy, usa la más reciente. Para el dashboard.
app.get('/api/nomina/horas-semana', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    try {
        let semana = await pool.query(
            `SELECT id, TO_CHAR(semana_inicio,'YYYY-MM-DD') AS inicio, TO_CHAR(semana_fin,'YYYY-MM-DD') AS fin
             FROM nom_semana
             WHERE empresa = $1 AND CURRENT_DATE BETWEEN semana_inicio AND semana_fin
             ORDER BY semana_inicio DESC LIMIT 1`,
            [empresa]
        );
        if (!semana.rows.length) {
            semana = await pool.query(
                `SELECT id, TO_CHAR(semana_inicio,'YYYY-MM-DD') AS inicio, TO_CHAR(semana_fin,'YYYY-MM-DD') AS fin
                 FROM nom_semana WHERE empresa = $1 ORDER BY semana_inicio DESC LIMIT 1`,
                [empresa]
            );
        }
        if (!semana.rows.length) return res.json({ success: true, semana: null, data: [] });
        const s = semana.rows[0];

        const horas = await pool.query(
            `SELECT
                sd.ccosto,
                COALESCE(cc.nombre, sd.ccosto, 'SIN CC') AS ccosto_nombre,
                SUM(COALESCE(sd.real_horas, sd.prog_horas, 0)) AS horas,
                COUNT(DISTINCT sd.empleado_id) AS empleados
             FROM nom_semana_detalle sd
             LEFT JOIN ccostos cc ON cc.codigo = sd.ccosto AND cc.empresa::text = $2::text
             WHERE sd.semana_id = $1 AND COALESCE(sd.es_dia_libre, false) = false
             GROUP BY sd.ccosto, cc.nombre
             ORDER BY horas DESC`,
            [s.id, empresa]
        );

        res.json({
            success: true,
            semana: s,
            data: horas.rows.map(r => ({
                ...r,
                horas: parseFloat(r.horas) || 0,
                empleados: parseInt(r.empleados) || 0,
            })),
        });
    } catch(e) {
        console.error('Error GET /api/nomina/horas-semana:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/nomina/preliquidacion-actual — Preliquidación en tiempo real
// Calcula la nómina proyectada HASTA HOY (no la semana completa) sin guardar
app.get('/api/nomina/preliquidacion-actual', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Parámetro empresa requerido' });
    try {
        // Obtener la semana actual (o, si no hay ninguna que contenga hoy, la más reciente)
        let semana = await pool.query(
            `SELECT id, semana_inicio, semana_fin
             FROM nom_semana
             WHERE empresa = $1 AND CURRENT_DATE BETWEEN semana_inicio AND semana_fin
             ORDER BY semana_inicio DESC LIMIT 1`,
            [empresa]
        );
        if (!semana.rows.length) {
            semana = await pool.query(
                `SELECT id, semana_inicio, semana_fin
                 FROM nom_semana WHERE empresa = $1 ORDER BY semana_inicio DESC LIMIT 1`,
                [empresa]
            );
        }

        // Si no hay ninguna semana registrada, retornar cero
        if (!semana.rows.length) {
            return res.json({
                success: true,
                semana: null,
                total_bruto: 0,
                total_deducciones: 0,
                total_neto: 0,
                total_aportes_er: 0,
                empleados: []
            });
        }

        const s = semana.rows[0];

        // Obtener config fiscal del año actual
        const anio = new Date(s.semana_fin).getFullYear();
        let cfg = {};
        const cfgR = await pool.query(
            'SELECT * FROM nom_config_fiscal WHERE empresa=$1 AND anio=$2',
            [empresa, anio]
        );
        if (cfgR.rows.length) cfg = cfgR.rows[0];
        else cfg = { ss_rate:0.062, ss_wage_base:168600, medicare_rate:0.0145,
                     medicare_adicional_rate:0.009, medicare_adicional_threshold:200000,
                     futa_rate:0.006, futa_wage_base:7000, suta_rate:0.027, suta_wage_base:7000,
                     ot_threshold_hours:40, ot_multiplier:1.5, wc_default_rate:0, fit_config:null };

        // Obtener horas HASTA HOY SOLAMENTE (no la semana completa)
        const det = await pool.query(
            `SELECT empleado_id, ccosto,
                    SUM(COALESCE(real_horas, prog_horas, 0)) AS horas
             FROM nom_semana_detalle
             WHERE semana_id=$1 AND es_dia_libre=FALSE AND fecha <= (CURRENT_DATE - INTERVAL '1 day')::date
             GROUP BY empleado_id, ccosto`,
            [s.id]
        );

        let horasPorEmpleado = {};
        let empleadosEnSemana = new Set();

        for (const row of det.rows) {
            empleadosEnSemana.add(parseInt(row.empleado_id));
            if (!horasPorEmpleado[row.empleado_id]) horasPorEmpleado[row.empleado_id] = {};
            const cc = row.ccosto || 'GEN';
            horasPorEmpleado[row.empleado_id][cc] = parseFloat(row.horas || 0);
        }

        // Contar días distintos con horas > 0 por empleado (hasta ayer — el
        // servicio es nocturno, así que hoy aún no tiene información completa)
        const diasDet = await pool.query(
            `SELECT empleado_id, COUNT(DISTINCT fecha) AS dias
             FROM nom_semana_detalle
             WHERE semana_id=$1 AND es_dia_libre=FALSE AND fecha <= (CURRENT_DATE - INTERVAL '1 day')::date
               AND COALESCE(real_horas, prog_horas, 0) > 0
             GROUP BY empleado_id`,
            [s.id]
        );

        let diasPorEmpleado = {};
        for (const row of diasDet.rows) {
            diasPorEmpleado[row.empleado_id] = parseInt(row.dias || 0);
        }

        // Obtener empleados que tienen horas esta semana
        let empleados;
        if (empleadosEnSemana.size > 0) {
            const ids = [...empleadosEnSemana];
            empleados = await pool.query(
                `SELECT * FROM nom_empleados WHERE id = ANY($1) ORDER BY apellido, nombre`,
                [ids]
            );
        } else {
            return res.json({
                success: true,
                semana: s,
                total_bruto: 0,
                total_deducciones: 0,
                total_neto: 0,
                total_aportes_er: 0,
                empleados: []
            });
        }

        // Calcular nómina preliquidada
        let totalBruto = 0, totalDed = 0, totalER = 0, totalNeto = 0;
        const otThreshold = parseFloat(cfg.ot_threshold_hours || 40);
        const otMult = parseFloat(cfg.ot_multiplier || 1.5);

        const detallesEmpleado = [];

        for (const emp of empleados.rows) {
            // Get YTD bruto for this employee (current year)
            const ytdR = await pool.query(
                `SELECT COALESCE(SUM(ll.total_bruto),0) AS ytd
                 FROM nom_liquidacion_linea ll
                 JOIN nom_liquidacion l ON l.id=ll.liquidacion_id
                 WHERE ll.empleado_id=$1 AND l.empresa=$2
                   AND EXTRACT(YEAR FROM l.semana_fin)=$3 AND l.estado IN ('APROBADA','PAGADA')`,
                [emp.id, empresa, anio]
            );
            const ytdBruto = parseFloat(ytdR.rows[0].ytd || 0);

            const ccHoras = horasPorEmpleado[emp.id] || {};
            const totalHoras = Object.values(ccHoras).reduce((s, h) => s + h, 0);

            let brutoRegular = 0, brutoOT = 0, brutoBase = 0;
            const tipoPago = emp.tipo_pago || (emp.es_por_horas ? 'HORAS' : 'FIJO_SEMANAL');

            if (tipoPago === 'DIA_LABORADO') {
                const diasTrabajados = diasPorEmpleado[emp.id] || 0;
                brutoBase = diasTrabajados * parseFloat(emp.valor_dia || 0);
            } else if (tipoPago === 'FIJO_MAS_HORAS') {
                brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
                const horasOtrosCC = Object.entries(ccHoras)
                    .filter(([cc]) => String(cc) !== String(emp.ccosto))
                    .reduce((s, [, h]) => s + h, 0);
                const valorHora = parseFloat(emp.valor_hora || 0);
                const valorHoraOT = valorHora * otMult;
                if (horasOtrosCC <= otThreshold) {
                    brutoRegular = horasOtrosCC * valorHora;
                } else {
                    brutoRegular = otThreshold * valorHora;
                    brutoOT = (horasOtrosCC - otThreshold) * valorHoraOT;
                }
            } else if (tipoPago === 'FIJO_SEMANAL' || (emp.tipo_empleado === '1099' && !emp.es_por_horas)) {
                brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
            } else {
                const valorHora = parseFloat(emp.valor_hora || 0);
                const valorHoraOT = valorHora * otMult;
                if (totalHoras <= otThreshold) {
                    brutoRegular = totalHoras * valorHora;
                } else {
                    brutoRegular = otThreshold * valorHora;
                    brutoOT = (totalHoras - otThreshold) * valorHoraOT;
                }
            }

            const totalBrutoEmp = brutoRegular + brutoOT + brutoBase;
            const taxes = calcularRetenciones(emp, totalBrutoEmp, ytdBruto, cfg);
            const netoEmp = totalBrutoEmp - taxes.total_deducciones;

            if (totalBrutoEmp > 0) {
                totalBruto += totalBrutoEmp;
                totalDed += taxes.total_deducciones;
                totalER += taxes.total_aportes_er;
                totalNeto += netoEmp;

                detallesEmpleado.push({
                    empleado_nombre: emp.nombre + ' ' + emp.apellido,
                    horas: totalHoras,
                    bruto: +totalBrutoEmp.toFixed(2),
                    deducciones: +taxes.total_deducciones.toFixed(2),
                    neto: +netoEmp.toFixed(2)
                });
            }
        }

        res.json({
            success: true,
            semana: s,
            total_bruto: +totalBruto.toFixed(2),
            total_deducciones: +totalDed.toFixed(2),
            total_neto: +totalNeto.toFixed(2),
            total_aportes_er: +totalER.toFixed(2),
            empleados: detallesEmpleado
        });
    } catch(e) {
        console.error('Error GET /api/nomina/preliquidacion-actual:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/nomina/semanas', async (req, res) => {
    const { empresa, semana_inicio, semana_fin, notas } = req.body;
    try {
        // Check no duplicate
        const dup = await pool.query(
            'SELECT id FROM nom_semana WHERE empresa=$1 AND semana_inicio=$2', [empresa, semana_inicio]
        );
        if (dup.rows.length) return res.status(400).json({ success: false, error: 'Ya existe una semana para esa fecha' });
        const r = await pool.query(
            'INSERT INTO nom_semana (empresa, semana_inicio, semana_fin, notas) VALUES ($1,$2,$3,$4) RETURNING *',
            [empresa, semana_inicio, semana_fin, notas]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Obtener detalle de una semana
app.get('/api/nomina/semanas/:id/detalle', async (req, res) => {
    try {
        const semana = await pool.query('SELECT * FROM nom_semana WHERE id=$1', [req.params.id]);
        const detalle = await pool.query(
            `SELECT sd.*, e.nombre, e.apellido, e.tipo_empleado, e.es_por_horas,
                    e.valor_hora, e.ccosto AS ccosto_default, e.empresa_contratista,
                    COALESCE(cc.nombre, sd.ccosto) AS ccosto_nombre
             FROM nom_semana_detalle sd
             JOIN nom_empleados e ON e.id = sd.empleado_id
             LEFT JOIN ccostos cc ON cc.codigo = sd.ccosto
             WHERE sd.semana_id = $1
             ORDER BY e.apellido, e.nombre, sd.fecha`,
            [req.params.id]
        );
        res.json({ success: true, semana: semana.rows[0], detalle: detalle.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Generar detalle desde plantilla de empleados activos
// Copiar horario de la semana anterior (todo en SQL para evitar errores de timezone)
app.post('/api/nomina/semanas/:id/copiar-anterior', async (req, res) => {
    const { empresa } = req.body;
    const semanaId = req.params.id;
    try {
        // 1. Verificar que exista la semana actual y obtener fecha de inicio
        const semanaActual = await pool.query(
            `SELECT id, TO_CHAR(semana_inicio, 'YYYY-MM-DD') AS inicio FROM nom_semana WHERE id=$1`,
            [semanaId]
        );
        if (!semanaActual.rows.length) return res.status(404).json({ success: false, error: 'Semana no encontrada' });
        const inicioStr = semanaActual.rows[0].inicio;

        // 2. Buscar la semana anterior usando SQL (7 días antes, sin JavaScript Date)
        const semanaPrevia = await pool.query(
            `SELECT id, TO_CHAR(semana_inicio, 'YYYY-MM-DD') AS inicio
             FROM nom_semana
             WHERE empresa=$1
               AND semana_inicio::date = ($2::date - interval '7 days')::date`,
            [empresa, inicioStr]
        );

        if (!semanaPrevia.rows.length) {
            const prevStr = await pool.query(
                `SELECT TO_CHAR($1::date - interval '7 days', 'DD/MM/YYYY') AS fecha`,
                [inicioStr]
            );
            const fechaDisplay = prevStr.rows[0]?.fecha || '7 días antes';
            return res.status(404).json({
                success: false,
                error: `No existe la semana del ${fechaDisplay} en el sistema. Créala primero para poder copiarla.`
            });
        }

        const semanaAnteriorId = semanaPrevia.rows[0].id;

        // 3. Copiar todos los turnos en un solo INSERT...SELECT con SQL
        //    Las fechas se ajustan +7 días directamente en SQL
        //    Solo inserta donde no exista ya (mismo empleado+fecha+ccosto)
        const insertR = await pool.query(
            `INSERT INTO nom_semana_detalle
               (semana_id, empleado_id, fecha, ccosto,
                prog_inicio, prog_fin, prog_horas, prog_cruza_medianoche,
                real_inicio, real_fin, real_horas,
                es_dia_libre, ausencia_tipo, notas, ajustado)
             SELECT
               $1,
               d.empleado_id,
               (d.fecha::date + interval '7 days')::date,
               d.ccosto,
               COALESCE(d.real_inicio, d.prog_inicio),
               COALESCE(d.real_fin,    d.prog_fin),
               COALESCE(d.real_horas,  d.prog_horas),
               d.prog_cruza_medianoche,
               COALESCE(d.real_inicio, d.prog_inicio),
               COALESCE(d.real_fin,    d.prog_fin),
               COALESCE(d.real_horas,  d.prog_horas),
               d.es_dia_libre,
               d.ausencia_tipo,
               d.notas,
               FALSE
             FROM nom_semana_detalle d
             WHERE d.semana_id = $2
               AND NOT EXISTS (
                 SELECT 1 FROM nom_semana_detalle ex
                 WHERE ex.semana_id    = $1
                   AND ex.empleado_id  = d.empleado_id
                   AND ex.fecha        = (d.fecha::date + interval '7 days')::date
                   AND ex.ccosto       = d.ccosto
               )`,
            [semanaId, semanaAnteriorId]
        );

        const copiados = insertR.rowCount || 0;

        // 4. Contar cuántos se omitieron (ya existían)
        const totalPrevios = await pool.query(
            'SELECT COUNT(*) FROM nom_semana_detalle WHERE semana_id=$1',
            [semanaAnteriorId]
        );
        const omitidos = parseInt(totalPrevios.rows[0].count) - copiados;

        res.json({
            success: true,
            copiados,
            omitidos,
            message: copiados === 0
                ? 'La semana anterior no tenía turnos, o todos ya existían en esta semana.'
                : `✅ ${copiados} turno(s) copiados de la semana anterior.${omitidos > 0 ? ` (${omitidos} ya existían y se conservaron)` : ''}`
        });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/nomina/semanas/:id/generar', async (req, res) => {
    const { empresa, config_id } = req.body;
    try {
        const semana = await pool.query('SELECT * FROM nom_semana WHERE id=$1', [req.params.id]);
        if (!semana.rows.length) return res.status(404).json({ success: false, error: 'Semana no encontrada' });
        const s = semana.rows[0];

        // Get active employees
        const empleados = await pool.query(
            'SELECT * FROM nom_empleados WHERE empresa=$1 AND estado=\'ACTIVO\'', [empresa]
        );

        // Get schedule config (use provided config_id or first active)
        const configQuery = config_id
            ? await pool.query('SELECT * FROM nom_horario_config_dia WHERE config_id=$1 AND activo=TRUE', [config_id])
            : await pool.query(`SELECT d.* FROM nom_horario_config_dia d
                                JOIN nom_horario_config c ON c.id=d.config_id
                                WHERE c.empresa=$1 AND c.activo=TRUE AND d.activo=TRUE
                                ORDER BY c.id LIMIT 7`, [empresa]);
        const diasConfig = configQuery.rows; // dia_semana → 1=Mon..7=Sun

        // Generate dates Mon-Sun
        const inicio = new Date(s.semana_inicio);
        for (const emp of empleados.rows) {
            for (let i = 0; i < 7; i++) {
                const fecha = new Date(inicio);
                fecha.setDate(inicio.getDate() + i);
                const diaSemana = i + 1; // 1=Mon..7=Sun
                const diaConfig = diasConfig.find(d => d.dia_semana === diaSemana);
                const fechaStr = fecha.toISOString().split('T')[0];

                // Skip if already exists
                const exists = await pool.query(
                    'SELECT id FROM nom_semana_detalle WHERE semana_id=$1 AND empleado_id=$2 AND fecha=$3',
                    [s.id, emp.id, fechaStr]
                );
                if (exists.rows.length) continue;

                await pool.query(
                    `INSERT INTO nom_semana_detalle
                     (semana_id, empleado_id, fecha, ccosto, prog_inicio, prog_fin, prog_horas,
                      prog_cruza_medianoche, real_inicio, real_fin, real_horas, es_dia_libre)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                    [s.id, emp.id, fechaStr, emp.ccosto,
                     diaConfig?.hora_inicio||null, diaConfig?.hora_fin||null,
                     diaConfig?.horas_default||null, diaConfig?.cruza_medianoche||false,
                     diaConfig?.hora_inicio||null, diaConfig?.hora_fin||null,
                     diaConfig?.horas_default||null, !diaConfig]
                );
            }
        }
        res.json({ success: true, message: 'Horario generado correctamente' });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Crear un nuevo detalle de turno
app.post('/api/nomina/semanas/detalle', async (req, res) => {
    const { semana_id, empleado_id, fecha, real_inicio, real_fin, real_horas, ccosto, es_dia_libre, ausencia_tipo, notas } = req.body;
    try {
        // 1. Verificar que no exista ya para este empleado + fecha + ccosto (mismo centro)
        const exists = await pool.query(
            'SELECT id FROM nom_semana_detalle WHERE semana_id=$1 AND empleado_id=$2 AND fecha=$3 AND ccosto=$4',
            [semana_id, empleado_id, fecha, ccosto||'']
        );
        if (exists.rows.length) {
            return res.status(400).json({ success: false, error: 'Ya existe un turno para este empleado en esta fecha y centro de costo' });
        }

        // 2. Si no es día libre, verificar que no haya traslape de horario en OTRO centro ese mismo día
        if (!es_dia_libre && real_inicio && real_fin) {
            const otrosTurnos = await pool.query(
                `SELECT id, ccosto, real_inicio, real_fin FROM nom_semana_detalle
                 WHERE semana_id=$1 AND empleado_id=$2 AND fecha=$3
                   AND ccosto != $4 AND NOT es_dia_libre
                   AND real_inicio IS NOT NULL AND real_fin IS NOT NULL`,
                [semana_id, empleado_id, fecha, ccosto||'']
            );

            // Función para convertir HH:MM a minutos (con soporte medianoche)
            const toMins = (t) => {
                const [h, m] = t.slice(0,5).split(':').map(Number);
                return h * 60 + m;
            };
            const newStart = toMins(real_inicio);
            let newEnd = toMins(real_fin);
            if (newEnd <= newStart) newEnd += 24 * 60; // cruza medianoche

            for (const t of otrosTurnos.rows) {
                let exStart = toMins(t.real_inicio);
                let exEnd   = toMins(t.real_fin);
                if (exEnd <= exStart) exEnd += 24 * 60;

                // ¿Se solapan?
                const overlaps = newStart < exEnd && newEnd > exStart;
                if (overlaps) {
                    return res.status(400).json({
                        success: false,
                        error: `Conflicto de horario: el empleado ya tiene turno ${t.real_inicio?.slice(0,5)}-${t.real_fin?.slice(0,5)} en el centro "${t.ccosto}" ese mismo día`
                    });
                }
            }
        }

        const r = await pool.query(
            `INSERT INTO nom_semana_detalle
             (semana_id, empleado_id, fecha, real_inicio, real_fin, real_horas, ccosto, es_dia_libre, ausencia_tipo, notas, ajustado)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
             RETURNING id`,
            [semana_id, empleado_id, fecha, real_inicio||null, real_fin||null, real_horas||null,
             ccosto||'', es_dia_libre||false, ausencia_tipo||'', notas||'']
        );
        res.json({ success: true, data: { id: r.rows[0].id } });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Actualizar un detalle (ajuste de horas)
app.put('/api/nomina/semanas/detalle/:detalleId', async (req, res) => {
    const { real_inicio, real_fin, real_horas, ccosto, es_dia_libre, ausencia_tipo, notas } = req.body;
    try {
        await pool.query(
            `UPDATE nom_semana_detalle SET
             real_inicio=$1, real_fin=$2, real_horas=$3, ccosto=$4,
             es_dia_libre=$5, ausencia_tipo=$6, notas=$7, ajustado=TRUE, updated_at=NOW()
             WHERE id=$8`,
            [real_inicio||null, real_fin||null, real_horas||null, ccosto,
             es_dia_libre||false, ausencia_tipo, notas, req.params.detalleId]
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Eliminar un detalle de turno
// Eliminar semana completa (y todos sus turnos)
app.delete('/api/nomina/semanas/:id', async (req, res) => {
    try {
        // Primero borrar todos los detalles de esa semana
        await pool.query('DELETE FROM nom_semana_detalle WHERE semana_id=$1', [req.params.id]);
        // Luego borrar la semana
        const r = await pool.query('DELETE FROM nom_semana WHERE id=$1 RETURNING id', [req.params.id]);
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'Semana no encontrada' });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/nomina/semanas/detalle/:detalleId', async (req, res) => {
    try {
        await pool.query('DELETE FROM nom_semana_detalle WHERE id=$1', [req.params.detalleId]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Publicar semana
app.put('/api/nomina/semanas/:id/publicar', async (req, res) => {
    try {
        await pool.query(
            'UPDATE nom_semana SET estado=\'PUBLICADO\', publicado_en=NOW() WHERE id=$1', [req.params.id]
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── LIQUIDACIÓN DE NÓMINA ────────────────────────────────────────
app.get('/api/nomina/liquidaciones', async (req, res) => {
    const { empresa } = req.query;
    try {
        const r = await pool.query(
            'SELECT * FROM nom_liquidacion WHERE empresa=$1 ORDER BY semana_inicio DESC LIMIT 24', [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/nomina/liquidaciones', async (req, res) => {
    const { empresa, semana_inicio, semana_fin, semana_id, notas } = req.body;
    try {
        const dup = await pool.query(
            'SELECT id FROM nom_liquidacion WHERE empresa=$1 AND semana_inicio=$2', [empresa, semana_inicio]
        );
        if (dup.rows.length) return res.status(400).json({ success: false, error: 'Ya existe una nómina para esa semana' });
        const r = await pool.query(
            'INSERT INTO nom_liquidacion (empresa,semana_inicio,semana_fin,semana_id,notas) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [empresa, semana_inicio, semana_fin, semana_id||null, notas]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Obtener detalle de una liquidación
app.get('/api/nomina/liquidaciones/:id', async (req, res) => {
    try {
        const liq = await pool.query('SELECT * FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        const lineas = await pool.query(
            `SELECT ll.*, e.nombre, e.apellido, e.tipo_empleado AS tipo_emp_actual
             FROM nom_liquidacion_linea ll
             JOIN nom_empleados e ON e.id = ll.empleado_id
             WHERE ll.liquidacion_id=$1 ORDER BY e.apellido, e.nombre`,
            [req.params.id]
        );
        // Get ccosto breakdown for each line
        const ids = lineas.rows.map(l => l.id);
        const empresaLiq = liq.rows[0]?.empresa;
        let ccostos = [];
        if (ids.length) {
            const cc = await pool.query(
                `SELECT lc.*, COALESCE(cc.nombre, lc.ccosto) AS ccosto_nombre
                 FROM nom_liquidacion_ccosto lc
                 LEFT JOIN ccostos cc ON cc.codigo = lc.ccosto AND cc.empresa = $2
                 WHERE lc.linea_id = ANY($1)`, [ids, empresaLiq]
            );
            ccostos = cc.rows;
        }
        const data = lineas.rows.map(l => ({
            ...l,
            ccostos: ccostos.filter(c => c.linea_id === l.id)
        }));
        res.json({ success: true, liquidacion: liq.rows[0], lineas: data });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Calcular nómina (genera/actualiza líneas)
app.post('/api/nomina/liquidaciones/:id/calcular', async (req, res) => {
    const { empresa } = req.body;
    try {
        const liq = await pool.query('SELECT * FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        if (!liq.rows.length) return res.status(404).json({ success: false, error: 'No encontrada' });
        const l = liq.rows[0];
        if (l.estado === 'APROBADA' || l.estado === 'PAGADA')
            return res.status(400).json({ success: false, error: 'Nómina ya aprobada' });

        // Get fiscal config for current year
        const anio = new Date(l.semana_fin).getFullYear();
        let cfg = {};
        const cfgR = await pool.query(
            'SELECT * FROM nom_config_fiscal WHERE empresa=$1 AND anio=$2', [empresa, anio]
        );
        if (cfgR.rows.length) cfg = cfgR.rows[0];
        else cfg = { ss_rate:0.062, ss_wage_base:168600, medicare_rate:0.0145,
                     medicare_adicional_rate:0.009, medicare_adicional_threshold:200000,
                     futa_rate:0.006, futa_wage_base:7000, suta_rate:0.027, suta_wage_base:7000,
                     ot_threshold_hours:40, ot_multiplier:1.5, wc_default_rate:0 };

        // Obtener horas desde el horario de la semana (deduplicadas por empleado+fecha+ccosto)
        let horasPorEmpleado = {};
        let empleadosEnSemana = new Set(); // empleados que tienen turnos en esta semana

        // Días distintos trabajados por empleado (para tipo DIA_LABORADO)
        let diasPorEmpleado = {};

        if (l.semana_id) {
            // Deduplicar: solo un registro por empleado+fecha+ccosto (tomar el MAX de horas)
            const det = await pool.query(
                `SELECT empleado_id, ccosto,
                        SUM(COALESCE(real_horas, prog_horas, 0)) AS horas
                 FROM (
                   SELECT DISTINCT ON (empleado_id, fecha, ccosto)
                          empleado_id, fecha, ccosto,
                          COALESCE(real_horas, prog_horas, 0) AS real_horas,
                          prog_horas
                   FROM nom_semana_detalle
                   WHERE semana_id=$1 AND es_dia_libre=FALSE
                   ORDER BY empleado_id, fecha, ccosto, updated_at DESC NULLS LAST
                 ) sub
                 GROUP BY empleado_id, ccosto`,
                [l.semana_id]
            );
            for (const row of det.rows) {
                empleadosEnSemana.add(parseInt(row.empleado_id));
                if (!horasPorEmpleado[row.empleado_id]) horasPorEmpleado[row.empleado_id] = {};
                const cc = row.ccosto || 'GEN';
                horasPorEmpleado[row.empleado_id][cc] = parseFloat(row.horas || 0);
            }

            // Contar días distintos con horas > 0 por empleado (para pago por día)
            const diasDet = await pool.query(
                `SELECT empleado_id, COUNT(DISTINCT fecha) AS dias
                 FROM nom_semana_detalle
                 WHERE semana_id=$1 AND es_dia_libre=FALSE
                   AND COALESCE(real_horas, prog_horas, 0) > 0
                 GROUP BY empleado_id`,
                [l.semana_id]
            );
            for (const row of diasDet.rows) {
                diasPorEmpleado[row.empleado_id] = parseInt(row.dias || 0);
            }
        }

        // Obtener empleados:
        // - Si está vinculado a semana: los que tienen turnos en esa semana (sin importar estado actual)
        // - Si no está vinculado: todos los activos de la empresa
        let empleados;
        if (l.semana_id && empleadosEnSemana.size > 0) {
            const ids = [...empleadosEnSemana];
            empleados = await pool.query(
                `SELECT * FROM nom_empleados WHERE id = ANY($1) ORDER BY apellido, nombre`,
                [ids]
            );
        } else {
            empleados = await pool.query(
                `SELECT * FROM nom_empleados WHERE empresa=$1 AND estado='ACTIVO' ORDER BY apellido, nombre`,
                [empresa]
            );
        }

        // Delete existing lines
        await pool.query(
            'DELETE FROM nom_liquidacion_ccosto WHERE linea_id IN (SELECT id FROM nom_liquidacion_linea WHERE liquidacion_id=$1)',
            [req.params.id]
        );
        await pool.query('DELETE FROM nom_liquidacion_linea WHERE liquidacion_id=$1', [req.params.id]);

        let totalBruto = 0, totalDed = 0, totalER = 0, totalNeto = 0;
        const otThreshold = parseFloat(cfg.ot_threshold_hours || 40);
        const otMult = parseFloat(cfg.ot_multiplier || 1.5);

        for (const emp of empleados.rows) {
            // Get YTD bruto for this employee (current year)
            const ytdR = await pool.query(
                `SELECT COALESCE(SUM(ll.total_bruto),0) AS ytd
                 FROM nom_liquidacion_linea ll
                 JOIN nom_liquidacion l ON l.id=ll.liquidacion_id
                 WHERE ll.empleado_id=$1 AND l.empresa=$2
                   AND EXTRACT(YEAR FROM l.semana_fin)=$3 AND l.estado IN ('APROBADA','PAGADA')`,
                [emp.id, empresa, anio]
            );
            const ytdBruto = parseFloat(ytdR.rows[0].ytd || 0);

            let horasRegulares = 0, horasOT = 0;
            const ccHoras = horasPorEmpleado[emp.id] || {};
            const totalHoras = Object.values(ccHoras).reduce((s, h) => s + h, 0);

            let brutoRegular = 0, brutoOT = 0, brutoBase = 0;
            let esMontoFijo = false, esPorDia = false, diasTrabajados = 0;

            const tipoPago = emp.tipo_pago || (emp.es_por_horas ? 'HORAS' : 'FIJO_SEMANAL');

            if (tipoPago === 'DIA_LABORADO') {
                esPorDia = true;
                diasTrabajados = diasPorEmpleado[emp.id] || 0;
                brutoBase = diasTrabajados * parseFloat(emp.valor_dia || 0);
            } else if (tipoPago === 'FIJO_MAS_HORAS') {
                esMontoFijo = true;
                brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
                // Solo contar horas en CCs distintos al CC propio del empleado
                const horasOtrosCC = Object.entries(ccHoras)
                    .filter(([cc]) => String(cc) !== String(emp.ccosto))
                    .reduce((s, [, h]) => s + h, 0);
                const valorHora = parseFloat(emp.valor_hora || 0);
                const valorHoraOT = valorHora * otMult;
                if (horasOtrosCC <= otThreshold) {
                    horasRegulares = horasOtrosCC;
                } else {
                    horasRegulares = otThreshold;
                    horasOT = horasOtrosCC - otThreshold;
                }
                brutoRegular = horasRegulares * valorHora;
                brutoOT = horasOT * valorHoraOT;
            } else if (tipoPago === 'FIJO_SEMANAL' || (emp.tipo_empleado === '1099' && !emp.es_por_horas)) {
                esMontoFijo = true;
                brutoBase = parseFloat(emp.monto_fijo_semanal || 0);
            } else {
                const valorHora = parseFloat(emp.valor_hora || 0);
                const valorHoraOT = valorHora * otMult;
                if (totalHoras <= otThreshold) {
                    horasRegulares = totalHoras;
                } else {
                    horasRegulares = otThreshold;
                    horasOT = totalHoras - otThreshold;
                }
                brutoRegular = horasRegulares * valorHora;
                brutoOT = horasOT * valorHoraOT;
            }

            const totalBrutoEmp = brutoRegular + brutoOT + brutoBase;
            const taxes = calcularRetenciones(emp, totalBrutoEmp, ytdBruto, cfg);
            const netoEmp = totalBrutoEmp - taxes.total_deducciones;  // renombrado para no chocar con let totalNeto

            const lineaR = await pool.query(
                `INSERT INTO nom_liquidacion_linea
                 (liquidacion_id,empleado_id,tipo_empleado,horas_regulares,horas_overtime,
                  valor_hora,valor_hora_ot,bruto_regular,bruto_overtime,bruto_base,es_monto_fijo,
                  es_por_dia,dias_trabajados,
                  total_bruto,federal_income_tax,social_security_emp,medicare_emp,
                  medicare_adicional,workers_comp,otras_deducciones,total_deducciones,
                  social_security_er,medicare_er,futa,suta,total_aportes_er,total_neto,ytd_bruto,
                  empresa_contratista)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
                 RETURNING id`,
                [req.params.id, emp.id, emp.tipo_empleado,
                 horasRegulares, horasOT,
                 emp.valor_hora||0, (emp.valor_hora||0)*otMult,
                 brutoRegular, brutoOT, brutoBase, esMontoFijo,
                 esPorDia, diasTrabajados,
                 totalBrutoEmp, taxes.federal_income_tax, taxes.social_security_emp,
                 taxes.medicare_emp, taxes.medicare_adicional, taxes.workers_comp,
                 taxes.otras_deducciones, taxes.total_deducciones,
                 taxes.social_security_er, taxes.medicare_er, taxes.futa, taxes.suta,
                 taxes.total_aportes_er, netoEmp, ytdBruto, emp.empresa_contratista]
            );
            const lineaId = lineaR.rows[0].id;

            // Insert ccosto breakdown
            for (const [cc, horas] of Object.entries(ccHoras)) {
                const pct = totalHoras > 0 ? horas / totalHoras : 0;
                await pool.query(
                    'INSERT INTO nom_liquidacion_ccosto (linea_id,ccosto,horas,costo_bruto,costo_total) VALUES ($1,$2,$3,$4,$5)',
                    [lineaId, cc, horas, totalBrutoEmp * pct, (totalBrutoEmp + taxes.total_aportes_er) * pct]
                );
            }

            totalBruto += totalBrutoEmp;
            totalDed   += taxes.total_deducciones;
            totalER    += taxes.total_aportes_er;
            totalNeto  += netoEmp;
        }

        // Update liquidacion totals
        await pool.query(
            `UPDATE nom_liquidacion SET total_bruto=$1,total_deducciones_emp=$2,total_aportes_er=$3,
             total_neto=$4,updated_at=NOW() WHERE id=$5`,
            [totalBruto, totalDed, totalER, totalNeto, req.params.id]
        );

        res.json({ success: true, message: 'Nómina calculada correctamente',
                   totales: { totalBruto, totalDed, totalER, totalNeto } });
    } catch(e) {
        console.error('Error calcular nómina:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Eliminar liquidación (solo BORRADOR)
app.delete('/api/nomina/liquidaciones/:id', async (req, res) => {
    try {
        const liq = await pool.query('SELECT estado FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        if (!liq.rows.length) return res.status(404).json({ success: false, error: 'No encontrada' });
        if (liq.rows[0].estado !== 'BORRADOR')
            return res.status(400).json({ success: false, error: 'Solo se pueden eliminar nóminas en BORRADOR' });
        await pool.query('DELETE FROM nom_liquidacion_ccosto WHERE linea_id IN (SELECT id FROM nom_liquidacion_linea WHERE liquidacion_id=$1)', [req.params.id]);
        await pool.query('DELETE FROM nom_liquidacion_linea WHERE liquidacion_id=$1', [req.params.id]);
        await pool.query('DELETE FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// Aprobar nómina — transacción completa
app.put('/api/nomina/liquidaciones/:id/aprobar', async (req, res) => {
    const { empresa, banco, fechaPago } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar estado
        const liq = await client.query('SELECT * FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        if (!liq.rows.length) return res.status(404).json({ success: false, error: 'No encontrada' });
        const l = liq.rows[0];
        if (l.estado !== 'BORRADOR')
            return res.status(400).json({ success: false, error: 'Solo se pueden aprobar nóminas en BORRADOR' });

        // Helper robusto: PostgreSQL devuelve Date objects, no strings
        const toDateStr = (d) => {
            if (!d) return null;
            if (d instanceof Date) {
                const y  = d.getUTCFullYear();
                const m  = String(d.getUTCMonth()+1).padStart(2,'0');
                const dd = String(d.getUTCDate()).padStart(2,'0');
                return `${y}-${m}-${dd}`;
            }
            return String(d).split('T')[0]; // fallback si ya es string
        };
        const fmtDate = (d) => {
            if (d instanceof Date) return toDateStr(d);
            const parts = String(d).split('-');
            return d; // ya es string YYYY-MM-DD
        };
        const fmtLabel = (dateStr) => {
            const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            const [, m, dd] = dateStr.split('-').map(Number);
            return `${dd} ${meses[m-1]}`;
        };

        const inicioStr = toDateStr(l.semana_inicio);
        const finStr    = toDateStr(l.semana_fin);
        const inicio    = new Date(inicioStr + 'T12:00:00');
        const fin       = new Date(finStr    + 'T12:00:00');

        // Obtener cuenta contable configurada para nómina
        const anioLiq = fin.getFullYear() || new Date().getFullYear();
        const cfgR = await client.query(
            'SELECT cuenta_nomina FROM nom_config_fiscal WHERE empresa=$1 AND anio=$2',
            [empresa, anioLiq]
        );
        const cuentaNomina = cfgR.rows[0]?.cuenta_nomina || 'NOMINA';

        const totalCosto = parseFloat(l.total_bruto || 0) + parseFloat(l.total_aportes_er || 0);
        const totalNeto  = parseFloat(l.total_neto  || 0);
        const labelBase = `NOMINA ${fmtLabel(inicioStr)} - ${fmtLabel(finStr)} ${anioLiq}`;

        // 2. Obtener desglose de costos por centro de costos
        const ccR = await client.query(
            `SELECT COALESCE(lc.ccosto,'') AS ccosto, SUM(lc.costo_total) AS costo
             FROM nom_liquidacion_ccosto lc
             JOIN nom_liquidacion_linea ll ON ll.id = lc.linea_id
             WHERE ll.liquidacion_id = $1
             GROUP BY lc.ccosto
             ORDER BY lc.ccosto`,
            [req.params.id]
        );
        let costosPorCcosto = ccR.rows.map(r => ({ ccosto: r.ccosto || '', costo: parseFloat(r.costo || 0) }));
        if (costosPorCcosto.length === 0) {
            costosPorCcosto = [{ ccosto: '', costo: totalCosto }];
        }

        // 3. Calcular distribución por mes (1 o 2 segmentos)
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const segmentos = []; // [{ fecha, label, ratio }]
        if (inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()) {
            segmentos.push({ fecha: fmtDate(fin), label: labelBase, ratio: 1 });
        } else {
            let diasMes1 = 0;
            let cursor = new Date(inicio);
            while (cursor.getMonth() === inicio.getMonth()) {
                diasMes1++;
                cursor.setDate(cursor.getDate() + 1);
            }
            const diasMes2 = 7 - diasMes1;
            const ultMes1 = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth()+1, 0));
            segmentos.push({
                fecha: fmtDate(ultMes1),
                label: `${labelBase} (${diasMes1}d ${meses[inicio.getMonth()]})`,
                ratio: diasMes1 / 7
            });
            segmentos.push({
                fecha: fmtDate(fin),
                label: `${labelBase} (${diasMes2}d ${meses[fin.getMonth()]})`,
                ratio: diasMes2 / 7
            });
        }

        // 4. Construir entries: cada combinación segmento × ccosto = 1 gasto
        const entries = [];
        for (const seg of segmentos) {
            for (const cc of costosPorCcosto) {
                entries.push({
                    fecha:   seg.fecha,
                    concepto: seg.label,   // sin sufijo de ccosto
                    ccosto:  cc.ccosto,
                    costo:   parseFloat((cc.costo * seg.ratio).toFixed(2))
                });
            }
        }

        // 5. Movimientos bancarios: uno por segmento (suma del neto del mes)
        const movibanEntries = segmentos.map(seg => ({
            fecha:    seg.fecha,
            concepto: seg.label,
            neto:     parseFloat((totalNeto * seg.ratio).toFixed(2))
        }));

        // 6. Códigos siguientes
        const codR = await client.query(
            `SELECT COALESCE(MAX(CASE WHEN codigo ~ '^[0-9]+$' THEN CAST(codigo AS BIGINT) ELSE 0 END), 0)+1 AS n
             FROM gastos WHERE empresa=$1`,
            [empresa]
        );
        let codNum = parseInt(codR.rows[0]?.n) || 1;
        if (isNaN(codNum) || codNum < 1) codNum = 1;

        const numR = await client.query(
            `SELECT COALESCE(MAX(CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS BIGINT) ELSE 0 END), 0)+1 AS n
             FROM moviban WHERE empresa=$1`, [empresa]
        );
        let movNum = parseInt(numR.rows[0]?.n) || 1;
        if (isNaN(movNum) || movNum < 1) movNum = 1;

        // 7. Preparar valores SAFE para campos VARCHAR cortos
        //    forma_pago = código de la cuenta bancaria (debe caber en su columna)
        //    cuenta = código contable configurado (debe caber en su columna VARCHAR(3) probable)
        //    ccosto = código del centro de costos
        const truncate = (s, n) => s ? String(s).substring(0, n) : '';
        const formaPago = truncate(banco, 3); // gastos.forma_pago suele ser VARCHAR(3)
        const cuentaContable = (cuentaNomina && cuentaNomina !== 'NOMINA') ? truncate(cuentaNomina, 3) : null;

        // 8. Insertar gastos
        // fechaPago: fecha indicada por el usuario (cuando realmente pagó via ADP)
        // entry.fecha: fecha contable del período (para prorrateo mensual de P&G)
        const fechaGasto = fechaPago || finStr; // usar fecha de pago si existe, sino fin período
        const gastosCreados = [];
        for (const entry of entries) {
            const codigo = String(codNum).padStart(10, '0');
            codNum++;
            const ccostoSafe = truncate(entry.ccosto, 3);

            try {
                await client.query(
                    `INSERT INTO gastos (codigo, fecha, factura, proveedor, ccosto,
                                         forma_pago, cuenta, concepto, subtotal, impuestos, total, empresa, estado)
                     VALUES ($1, $2, NULL, NULL, $3, $4, $5, $6, $7, 0, $7, $8, 'PENDIENTE')`,
                    [codigo, fechaGasto, ccostoSafe, formaPago, cuentaContable,
                     entry.concepto, entry.costo, l.empresa]
                );
                gastosCreados.push({ codigo, fecha: entry.fecha, ccosto: ccostoSafe, total: entry.costo });
            } catch(eGasto) {
                console.error('=== ERROR INSERT GASTO ===');
                console.error('Mensaje:', eGasto.message);
                console.error('Valores:', JSON.stringify({
                    codigo, codigo_len: codigo.length,
                    fecha: entry.fecha,
                    ccosto: ccostoSafe, ccosto_len: ccostoSafe.length,
                    forma_pago: formaPago, forma_pago_len: formaPago.length,
                    cuenta: cuentaContable, cuenta_len: cuentaContable?.length,
                    concepto: entry.concepto, concepto_len: entry.concepto?.length,
                    empresa: l.empresa
                }));
                throw new Error(`Error al insertar gasto. Valores: codigo='${codigo}'(${codigo.length}c), ccosto='${ccostoSafe}'(${ccostoSafe.length}c), forma_pago='${formaPago}'(${formaPago.length}c), cuenta='${cuentaContable}'(${cuentaContable?.length||0}c). DB error: ${eGasto.message}`);
            }
        }

        // 9. Insertar movibanes (solo si se seleccionó cuenta bancaria)
        if (banco && banco !== '') {
            for (const mov of movibanEntries) {
                try {
                    const numStr = String(movNum).padStart(10, '0');
                    movNum++;
                    await client.query(
                        `INSERT INTO moviban (tipo, numero, fecha, concepto, cheque, ingreso, egreso,
                                             banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                         VALUES ('EGR', $1, $2, $3, NULL, 0, $4, $5, 'NO', $6, NULL, NULL, NULL, '')`,
                        [numStr, fechaGasto, mov.concepto, mov.neto, banco, l.empresa]
                    );
                } catch(eMoviban) {
                    console.error('=== ERROR INSERT MOVIBAN ===');
                    console.error('Mensaje:', eMoviban.message);
                    throw new Error('Error al insertar movimiento bancario: ' + eMoviban.message);
                }
            }
        }

        // 10. Cambiar estado a APROBADA
        await client.query(
            "UPDATE nom_liquidacion SET estado='APROBADA', updated_at=NOW() WHERE id=$1",
            [req.params.id]
        );

        // 11. Cerrar la semana del horario vinculada
        if (l.semana_id) {
            await client.query(
                "UPDATE nom_semana SET estado='CERRADO' WHERE id=$1", [l.semana_id]
            );
        }

        await client.query('COMMIT');
        const numCcostos = costosPorCcosto.length;
        const numMeses = segmentos.length;
        let msg = `Nómina aprobada. ${entries.length} gasto(s) contables creado(s)`;
        if (numCcostos > 1) msg += ` (${numCcostos} centros de costo`;
        if (numMeses > 1) msg += `${numCcostos > 1 ? ', ' : ' ('}prorrateado en ${numMeses} meses`;
        if (numCcostos > 1 || numMeses > 1) msg += ')';
        msg += '.';
        if (banco) msg += ` ${numMeses} movimiento(s) bancario(s) creado(s).`;

        res.json({
            success: true,
            message: msg,
            gastos: gastosCreados
        });
    } catch(e) {
        await client.query('ROLLBACK');
        console.error('Error al aprobar nómina:', e.message);
        res.status(500).json({ success: false, error: e.message });
    } finally { client.release(); }
});

// PUT /api/nomina/liquidaciones/:id/desaprobar — revierte aprobación: borra gastos/movibanes y vuelve a BORRADOR
app.put('/api/nomina/liquidaciones/:id/desaprobar', async (req, res) => {
    const { empresa } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const liq = await client.query('SELECT * FROM nom_liquidacion WHERE id=$1', [req.params.id]);
        if (!liq.rows.length) return res.status(404).json({ success: false, error: 'No encontrada' });
        const l = liq.rows[0];
        if (l.estado !== 'APROBADA')
            return res.status(400).json({ success: false, error: 'Solo se pueden desaprobar nóminas en estado APROBADA' });

        const toDateStr = (d) => {
            if (!d) return null;
            if (d instanceof Date) {
                const y  = d.getUTCFullYear();
                const m  = String(d.getUTCMonth()+1).padStart(2,'0');
                const dd = String(d.getUTCDate()).padStart(2,'0');
                return `${y}-${m}-${dd}`;
            }
            return String(d).split('T')[0];
        };
        const fmtLabel = (dateStr) => {
            const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            const [, m, dd] = dateStr.split('-').map(Number);
            return `${dd} ${meses[m-1]}`;
        };

        const inicioStr = toDateStr(l.semana_inicio);
        const finStr    = toDateStr(l.semana_fin);
        const fin       = new Date(finStr + 'T12:00:00');
        const anioLiq   = fin.getFullYear();
        const labelBase = `NOMINA ${fmtLabel(inicioStr)} - ${fmtLabel(finStr)} ${anioLiq}`;

        // Eliminar gastos contables creados por esta aprobación
        const delGastos = await client.query(
            `DELETE FROM gastos WHERE empresa=$1 AND concepto LIKE $2`,
            [l.empresa, labelBase + '%']
        );

        // Eliminar movimientos bancarios creados por esta aprobación
        const delMoviban = await client.query(
            `DELETE FROM moviban WHERE empresa=$1 AND tipo='EGR' AND concepto LIKE $2`,
            [l.empresa, labelBase + '%']
        );

        // Borrar líneas calculadas para que vuelva al paso 1 (sin cálculo)
        await client.query(
            `DELETE FROM nom_liquidacion_ccosto WHERE linea_id IN
             (SELECT id FROM nom_liquidacion_linea WHERE liquidacion_id=$1)`,
            [req.params.id]
        );
        await client.query(
            'DELETE FROM nom_liquidacion_linea WHERE liquidacion_id=$1',
            [req.params.id]
        );

        // Revertir estado y totales a BORRADOR limpio
        await client.query(
            `UPDATE nom_liquidacion
             SET estado='BORRADOR', total_bruto=0, total_deducciones_emp=0,
                 total_aportes_er=0, total_neto=0, updated_at=NOW()
             WHERE id=$1`,
            [req.params.id]
        );

        // Reabrir la semana del horario vinculada
        if (l.semana_id) {
            await client.query(
                "UPDATE nom_semana SET estado='PUBLICADO' WHERE id=$1",
                [l.semana_id]
            );
        }

        await client.query('COMMIT');
        res.json({
            success: true,
            message: `Nómina revertida a BORRADOR. ${delGastos.rowCount} gasto(s) eliminado(s), ${delMoviban.rowCount} movimiento(s) bancario(s) eliminado(s). Líneas borradas — puedes recalcular.`,
            gastosEliminados: delGastos.rowCount,
            movibaneliminados: delMoviban.rowCount
        });
    } catch(e) {
        await client.query('ROLLBACK');
        console.error('Error al desaprobar nómina:', e.message);
        res.status(500).json({ success: false, error: e.message });
    } finally { client.release(); }
});

// ── REPORTE DE NÓMINA ────────────────────────────────────────────
// GET /api/nomina/reporte — resumen analítico por período
// Parámetros: empresa, fechaInicio, fechaFin, vista (periodo|empleado|ccosto|impuestos)
app.get('/api/nomina/reporte', async (req, res) => {
    const { empresa, fechaInicio, fechaFin, vista = 'periodo' } = req.query;
    if (!empresa || !fechaInicio || !fechaFin)
        return res.status(400).json({ success: false, error: 'empresa, fechaInicio y fechaFin son requeridos' });
    try {
        // KPIs globales siempre
        const kpiRes = await pool.query(`
            SELECT
                COUNT(DISTINCT l.id)                           AS total_nominas,
                COUNT(DISTINCT ll.empleado_id)                  AS total_empleados,
                COALESCE(SUM(ll.total_bruto), 0)               AS total_bruto,
                COALESCE(SUM(ll.total_deducciones), 0)         AS total_deducciones,
                COALESCE(SUM(ll.total_aportes_er), 0)          AS total_aportes_er,
                COALESCE(SUM(ll.total_neto), 0)                AS total_neto,
                COALESCE(SUM(ll.federal_income_tax), 0)        AS federal_income_tax,
                COALESCE(SUM(ll.social_security_emp), 0)       AS social_security_emp,
                COALESCE(SUM(ll.social_security_er), 0)        AS social_security_er,
                COALESCE(SUM(ll.medicare_emp), 0)              AS medicare_emp,
                COALESCE(SUM(ll.medicare_er), 0)               AS medicare_er,
                COALESCE(SUM(ll.futa), 0)                      AS futa,
                COALESCE(SUM(ll.suta), 0)                      AS suta,
                COALESCE(SUM(ll.workers_comp), 0)              AS workers_comp,
                COALESCE(SUM(ll.total_bruto + ll.total_aportes_er), 0) AS costo_total_empresa
            FROM nom_liquidacion l
            JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
            WHERE l.empresa = $1
              AND l.estado = 'APROBADA'
              AND l.semana_inicio >= $2
              AND l.semana_fin   <= $3
        `, [empresa, fechaInicio, fechaFin]);

        let rows = [];

        if (vista === 'periodo') {
            // Por nómina/período
            const r = await pool.query(`
                SELECT
                    l.id,
                    TO_CHAR(l.semana_inicio,'YYYY-MM-DD') AS semana_inicio,
                    TO_CHAR(l.semana_fin,   'YYYY-MM-DD') AS semana_fin,
                    COUNT(DISTINCT ll.empleado_id)          AS empleados,
                    COALESCE(SUM(ll.total_bruto),0)         AS total_bruto,
                    COALESCE(SUM(ll.total_deducciones),0)   AS total_deducciones,
                    COALESCE(SUM(ll.total_aportes_er),0)    AS total_aportes_er,
                    COALESCE(SUM(ll.total_neto),0)          AS total_neto,
                    COALESCE(SUM(ll.total_bruto+ll.total_aportes_er),0) AS costo_empresa
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                WHERE l.empresa=$1 AND l.estado='APROBADA'
                  AND l.semana_inicio>=$2 AND l.semana_fin<=$3
                GROUP BY l.id, l.semana_inicio, l.semana_fin
                ORDER BY l.semana_inicio DESC
            `, [empresa, fechaInicio, fechaFin]);
            rows = r.rows;

        } else if (vista === 'empleado') {
            // Por empleado
            const r = await pool.query(`
                SELECT
                    e.id AS empleado_id,
                    COALESCE(e.nombre||' '||e.apellido, e.nombre, 'Empleado '||ll.empleado_id) AS nombre,
                    COALESCE(e.tipo_empleado, ll.tipo_empleado, '—') AS tipo_empleado,
                    COUNT(DISTINCT l.id)                         AS total_nominas,
                    COALESCE(SUM(ll.horas_regulares),0)          AS horas_regulares,
                    COALESCE(SUM(ll.horas_overtime),0)           AS horas_overtime,
                    COALESCE(SUM(ll.total_bruto),0)              AS total_bruto,
                    COALESCE(SUM(ll.total_deducciones),0)        AS total_deducciones,
                    COALESCE(SUM(ll.federal_income_tax),0)       AS federal_income_tax,
                    COALESCE(SUM(ll.social_security_emp),0)      AS social_security_emp,
                    COALESCE(SUM(ll.medicare_emp),0)             AS medicare_emp,
                    COALESCE(SUM(ll.workers_comp),0)             AS workers_comp,
                    COALESCE(SUM(ll.total_aportes_er),0)         AS total_aportes_er,
                    COALESCE(SUM(ll.total_neto),0)               AS total_neto,
                    COALESCE(SUM(ll.total_bruto+ll.total_aportes_er),0) AS costo_empresa
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                LEFT JOIN nom_empleados e ON e.id = ll.empleado_id
                WHERE l.empresa=$1 AND l.estado='APROBADA'
                  AND l.semana_inicio>=$2 AND l.semana_fin<=$3
                GROUP BY e.id, e.nombre, e.apellido, e.tipo_empleado, ll.tipo_empleado, ll.empleado_id
                ORDER BY total_bruto DESC
            `, [empresa, fechaInicio, fechaFin]);
            rows = r.rows;

        } else if (vista === 'ccosto') {
            // Por centro de costo
            const r = await pool.query(`
                SELECT
                    lc.ccosto,
                    COALESCE(cc.nombre, lc.ccosto) AS ccosto_nombre,
                    COUNT(DISTINCT ll.empleado_id)       AS empleados,
                    COALESCE(SUM(lc.horas),0)            AS horas,
                    COALESCE(SUM(lc.costo_bruto),0)      AS costo_bruto,
                    COALESCE(SUM(lc.costo_total),0)      AS costo_total
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll  ON ll.liquidacion_id = l.id
                JOIN nom_liquidacion_ccosto lc ON lc.linea_id = ll.id
                LEFT JOIN ccostos cc ON cc.codigo = lc.ccosto AND cc.empresa = l.empresa
                WHERE l.empresa=$1 AND l.estado='APROBADA'
                  AND l.semana_inicio>=$2 AND l.semana_fin<=$3
                GROUP BY lc.ccosto, cc.nombre
                ORDER BY costo_total DESC
            `, [empresa, fechaInicio, fechaFin]);
            rows = r.rows;

        } else if (vista === 'impuestos') {
            // Por tipo de impuesto/deducción — resumen en columnas
            const r = await pool.query(`
                SELECT
                    TO_CHAR(l.semana_inicio,'YYYY-MM-DD') AS semana_inicio,
                    TO_CHAR(l.semana_fin,   'YYYY-MM-DD') AS semana_fin,
                    COALESCE(SUM(ll.federal_income_tax),0)   AS federal_income_tax,
                    COALESCE(SUM(ll.social_security_emp),0)  AS ss_emp,
                    COALESCE(SUM(ll.social_security_er),0)   AS ss_er,
                    COALESCE(SUM(ll.medicare_emp),0)         AS medicare_emp,
                    COALESCE(SUM(ll.medicare_er),0)          AS medicare_er,
                    COALESCE(SUM(ll.futa),0)                 AS futa,
                    COALESCE(SUM(ll.suta),0)                 AS suta,
                    COALESCE(SUM(ll.workers_comp),0)         AS workers_comp,
                    COALESCE(SUM(ll.total_deducciones),0)    AS total_deducciones,
                    COALESCE(SUM(ll.total_aportes_er),0)     AS total_aportes_er,
                    COALESCE(SUM(ll.federal_income_tax+ll.social_security_emp+ll.social_security_er+ll.medicare_emp+ll.medicare_er+ll.futa+ll.suta+ll.workers_comp),0) AS total_impuestos
                FROM nom_liquidacion l
                JOIN nom_liquidacion_linea ll ON ll.liquidacion_id = l.id
                WHERE l.empresa=$1 AND l.estado='APROBADA'
                  AND l.semana_inicio>=$2 AND l.semana_fin<=$3
                GROUP BY l.id, l.semana_inicio, l.semana_fin
                ORDER BY l.semana_inicio DESC
            `, [empresa, fechaInicio, fechaFin]);
            rows = r.rows;
        }

        res.json({ success: true, kpis: kpiRes.rows[0], data: rows, vista });
    } catch (error) {
        console.error('Error GET /api/nomina/reporte:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── CONFIGURACIÓN FISCAL ─────────────────────────────────────────
app.get('/api/nomina/config-fiscal', async (req, res) => {
    const { empresa } = req.query;
    const anio = req.query.anio || new Date().getFullYear();
    try {
        const r = await pool.query(
            'SELECT * FROM nom_config_fiscal WHERE empresa=$1 AND anio=$2', [empresa, anio]
        );
        if (r.rows.length) return res.json({ success: true, data: r.rows[0] });
        // Return defaults
        res.json({ success: true, data: {
            empresa, anio, ss_rate:0.062, ss_wage_base:168600,
            medicare_rate:0.0145, medicare_adicional_rate:0.009, medicare_adicional_threshold:200000,
            futa_rate:0.006, futa_wage_base:7000, suta_rate:0.027, suta_wage_base:7000,
            ot_threshold_hours:40, ot_multiplier:1.5, fl_min_wage:13.00, wc_default_rate:0,
            cuenta_nomina:'', fit_config: null
        }});
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/nomina/config-fiscal', async (req, res) => {
    const d = req.body;
    try {
        const fitJson = d.fit_config ? JSON.stringify(d.fit_config) : null;
        await pool.query(
            `INSERT INTO nom_config_fiscal (empresa,anio,ss_rate,ss_wage_base,medicare_rate,
             medicare_adicional_rate,medicare_adicional_threshold,futa_rate,futa_wage_base,
             suta_rate,suta_wage_base,ot_threshold_hours,ot_multiplier,fl_min_wage,wc_default_rate,cuenta_nomina,fit_config)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             ON CONFLICT (empresa,anio) DO UPDATE SET
             ss_rate=$3,ss_wage_base=$4,medicare_rate=$5,medicare_adicional_rate=$6,
             medicare_adicional_threshold=$7,futa_rate=$8,futa_wage_base=$9,
             suta_rate=$10,suta_wage_base=$11,ot_threshold_hours=$12,ot_multiplier=$13,
             fl_min_wage=$14,wc_default_rate=$15,cuenta_nomina=$16,fit_config=$17`,
            [d.empresa,d.anio,d.ss_rate,d.ss_wage_base,d.medicare_rate,
             d.medicare_adicional_rate,d.medicare_adicional_threshold,
             d.futa_rate,d.futa_wage_base,d.suta_rate,d.suta_wage_base,
             d.ot_threshold_hours,d.ot_multiplier,d.fl_min_wage,d.wc_default_rate,
             d.cuenta_nomina||'', fitJson]
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── GESTIÓN DE PROPINAS ──────────────────────────────────────────
// Reparte las propinas del mes (registradas en `gastos` con la cuenta
// contable configurada como "CUENTA CONTABLE INGRESO PROPINAS") entre
// los empleados, proporcionalmente a las horas trabajadas por cada uno
// dentro de su centro de costo ese mes.

// GET /api/nomina/propinas?empresa=&anio=&mes= — trae el registro guardado (si existe)
app.get('/api/nomina/propinas', async (req, res) => {
    const { empresa, anio, mes } = req.query;
    if (!empresa || !anio || !mes)
        return res.status(400).json({ success: false, error: 'empresa, anio y mes son requeridos' });
    try {
        const cab = await pool.query(
            'SELECT * FROM nom_propinas WHERE empresa=$1 AND anio=$2 AND mes=$3', [empresa, anio, mes]
        );
        if (!cab.rows.length) return res.json({ success: true, data: null });
        const det = await pool.query(
            `SELECT * FROM nom_propinas_detalle WHERE propina_id=$1
             ORDER BY ccosto_nombre, empleado_nombre`, [cab.rows[0].id]
        );
        res.json({ success: true, data: { ...cab.rows[0], detalle: det.rows } });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/nomina/propinas/historial?empresa= — lista de meses generados
app.get('/api/nomina/propinas/historial', async (req, res) => {
    const { empresa } = req.query;
    try {
        const r = await pool.query(
            `SELECT * FROM nom_propinas WHERE empresa=$1 ORDER BY anio DESC, mes DESC LIMIT 24`, [empresa]
        );
        res.json({ success: true, data: r.rows });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/nomina/propinas/generar { empresa, anio, mes }
// Calcula la distribución y la guarda como BORRADOR (reemplaza el borrador anterior si existe).
app.post('/api/nomina/propinas/generar', async (req, res) => {
    const { empresa, anio, mes } = req.body;
    if (!empresa || !anio || !mes)
        return res.status(400).json({ success: false, error: 'empresa, anio y mes son requeridos' });
    const client = await pool.connect();
    try {
        const existente = await client.query(
            'SELECT * FROM nom_propinas WHERE empresa=$1 AND anio=$2 AND mes=$3', [empresa, anio, mes]
        );
        if (existente.rows.length && existente.rows[0].estado === 'PAGADO') {
            return res.status(400).json({ success: false, error: 'Este mes ya fue marcado como PAGADO y no se puede regenerar' });
        }

        const cfg = await client.query('SELECT cta_propinas FROM config_general WHERE empresa=$1', [empresa]);
        const ctaPropinas = cfg.rows[0]?.cta_propinas;
        if (!ctaPropinas) {
            return res.status(400).json({ success: false, error: 'Configure la "CUENTA CONTABLE INGRESO PROPINAS" en Configuración General antes de continuar' });
        }

        // 1. Propinas del mes por centro de costo (tabla gastos)
        const propinasPorCcosto = await client.query(
            `SELECT g.ccosto, COALESCE(cc.nombre, g.ccosto, 'SIN CC') AS ccosto_nombre,
                    COALESCE(SUM(g.total),0) AS total_propinas
             FROM gastos g
             LEFT JOIN ccostos cc ON cc.codigo = g.ccosto AND cc.empresa = g.empresa
             WHERE g.empresa=$1 AND g.cuenta=$2
               AND EXTRACT(YEAR FROM g.fecha)=$3 AND EXTRACT(MONTH FROM g.fecha)=$4
             GROUP BY g.ccosto, cc.nombre`,
            [empresa, ctaPropinas, anio, mes]
        );

        // 2. Horas trabajadas del mes por empleado y centro de costo (tabla nom_semana_detalle)
        const horasPorEmpleado = await client.query(
            `SELECT sd.ccosto, e.id AS empleado_id,
                    COALESCE(e.nombre||' '||e.apellido, 'Empleado '||e.id) AS empleado_nombre,
                    SUM(COALESCE(sd.real_horas, sd.prog_horas, 0)) AS horas
             FROM nom_semana_detalle sd
             JOIN nom_semana sem ON sem.id = sd.semana_id
             JOIN nom_empleados e ON e.id = sd.empleado_id
             WHERE sem.empresa=$1
               AND EXTRACT(YEAR FROM sd.fecha)=$2 AND EXTRACT(MONTH FROM sd.fecha)=$3
               AND COALESCE(sd.es_dia_libre,false) = false
             GROUP BY sd.ccosto, e.id, e.nombre, e.apellido
             HAVING SUM(COALESCE(sd.real_horas, sd.prog_horas, 0)) > 0`,
            [empresa, anio, mes]
        );

        // 3. Combinar: por cada ccosto con propinas, repartir proporcional a horas de ese ccosto
        const horasPorCcosto = {};
        for (const h of horasPorEmpleado.rows) {
            const key = h.ccosto || 'SIN CC';
            if (!horasPorCcosto[key]) horasPorCcosto[key] = [];
            horasPorCcosto[key].push(h);
        }

        const detalleFinal = [];
        let totalPropinas = 0, totalHoras = 0;

        for (const cc of propinasPorCcosto.rows) {
            const key = cc.ccosto || 'SIN CC';
            const totalPropinasCc = parseFloat(cc.total_propinas) || 0;
            const empleadosCc = horasPorCcosto[key] || [];
            const totalHorasCc = empleadosCc.reduce((s, e) => s + (parseFloat(e.horas) || 0), 0);

            totalPropinas += totalPropinasCc;
            totalHoras += totalHorasCc;

            if (!empleadosCc.length || totalHorasCc <= 0) {
                // No hay horas registradas para repartir estas propinas — se deja constancia sin empleado asignado
                detalleFinal.push({
                    ccosto: cc.ccosto, ccosto_nombre: cc.ccosto_nombre,
                    total_propinas_ccosto: totalPropinasCc, total_horas_ccosto: 0,
                    empleado_id: null, empleado_nombre: '(Sin horas registradas — no se pudo repartir)',
                    horas: 0, valor_asignado: 0
                });
                continue;
            }

            for (const emp of empleadosCc) {
                const horas = parseFloat(emp.horas) || 0;
                const valor = totalPropinasCc * (horas / totalHorasCc);
                detalleFinal.push({
                    ccosto: cc.ccosto, ccosto_nombre: cc.ccosto_nombre,
                    total_propinas_ccosto: totalPropinasCc, total_horas_ccosto: totalHorasCc,
                    empleado_id: emp.empleado_id, empleado_nombre: emp.empleado_nombre,
                    horas, valor_asignado: Math.round(valor * 100) / 100
                });
            }
        }

        await client.query('BEGIN');
        let propinaId;
        if (existente.rows.length) {
            propinaId = existente.rows[0].id;
            await client.query('DELETE FROM nom_propinas_detalle WHERE propina_id=$1', [propinaId]);
            await client.query(
                `UPDATE nom_propinas SET total_propinas=$1, total_horas=$2, estado='BORRADOR', fecha_generacion=NOW() WHERE id=$3`,
                [totalPropinas, totalHoras, propinaId]
            );
        } else {
            const ins = await client.query(
                `INSERT INTO nom_propinas (empresa, anio, mes, total_propinas, total_horas)
                 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
                [empresa, anio, mes, totalPropinas, totalHoras]
            );
            propinaId = ins.rows[0].id;
        }

        for (const d of detalleFinal) {
            await client.query(
                `INSERT INTO nom_propinas_detalle
                    (propina_id, ccosto, ccosto_nombre, total_propinas_ccosto, total_horas_ccosto,
                     empleado_id, empleado_nombre, horas, valor_asignado)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [propinaId, d.ccosto, d.ccosto_nombre, d.total_propinas_ccosto, d.total_horas_ccosto,
                 d.empleado_id, d.empleado_nombre, d.horas, d.valor_asignado]
            );
        }
        await client.query('COMMIT');

        const cabFinal = await pool.query('SELECT * FROM nom_propinas WHERE id=$1', [propinaId]);
        res.json({ success: true, data: { ...cabFinal.rows[0], detalle: detalleFinal } });
    } catch(e) {
        await client.query('ROLLBACK').catch(()=>{});
        console.error('Error POST /api/nomina/propinas/generar:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally { client.release(); }
});

// PUT /api/nomina/propinas/:id/pagar — marca el mes como pagado (ya no se puede regenerar)
app.put('/api/nomina/propinas/:id/pagar', async (req, res) => {
    try {
        const r = await pool.query(
            `UPDATE nom_propinas SET estado='PAGADO', fecha_pago=NOW() WHERE id=$1 RETURNING *`,
            [req.params.id]
        );
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        res.json({ success: true, data: r.rows[0] });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/nomina/propinas/reporte — propinas pagadas a empleados en un rango de fechas (por mes)
// Parámetros: empresa, fechaInicio, fechaFin (YYYY-MM-DD), empleadoId (opcional)
app.get('/api/nomina/propinas/reporte', async (req, res) => {
    const { empresa, fechaInicio, fechaFin, empleadoId } = req.query;
    if (!empresa || !fechaInicio || !fechaFin)
        return res.status(400).json({ success: false, error: 'empresa, fechaInicio y fechaFin son requeridos' });
    try {
        const [yIni, mIni] = fechaInicio.split('-').map(Number);
        const [yFin, mFin] = fechaFin.split('-').map(Number);
        const claveIni = yIni * 100 + mIni;
        const claveFin = yFin * 100 + mFin;

        const params = [empresa, claveIni, claveFin];
        let filtroEmpleado = '';
        if (empleadoId) {
            params.push(empleadoId);
            filtroEmpleado = ` AND d.empleado_id = $${params.length}`;
        }

        const r = await pool.query(
            `SELECT p.anio, p.mes, p.estado, p.fecha_pago,
                    d.empleado_id, d.empleado_nombre, d.ccosto, d.ccosto_nombre,
                    d.horas, d.valor_asignado
             FROM nom_propinas_detalle d
             JOIN nom_propinas p ON p.id = d.propina_id
             WHERE p.empresa = $1
               AND (p.anio*100 + p.mes) BETWEEN $2 AND $3
               AND d.empleado_id IS NOT NULL
               ${filtroEmpleado}
             ORDER BY p.anio, p.mes, d.empleado_nombre`,
            params
        );

        res.json({ success: true, data: r.rows });
    } catch(e) {
        console.error('Error GET /api/nomina/propinas/reporte:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE /api/nomina/propinas/:id — solo permite borrar borradores (para poder regenerar limpio)
app.delete('/api/nomina/propinas/:id', async (req, res) => {
    try {
        const chk = await pool.query('SELECT estado FROM nom_propinas WHERE id=$1', [req.params.id]);
        if (!chk.rows.length) return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        if (chk.rows[0].estado === 'PAGADO') return res.status(400).json({ success: false, error: 'No se puede eliminar un registro ya PAGADO' });
        await pool.query('DELETE FROM nom_propinas WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// ================================================================
// MÓDULO DETALLE INVENTARIO - ANÁLISIS DE STOCK Y CONSUMO
// ================================================================

// GET /api/detalle-inventario/analisis/:codigo
// Calcula stock actual y consumo basado en:
// 1. Si hay ventas ayer → analiza últimos 8 días
// 2. Busca en detalle_inventario ese rango, filtrando por empresa y bodega maestra
// 3. Usa mapeo receta_producto para obtener el codigo_producto real si es una receta
// 4. Retorna: saldo_inicial, ingresos, salidas, saldo_final, consumo_7_dias, stock_actual
app.get('/api/detalle-inventario/analisis/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const empresa = req.body?.empresa || req.headers['x-empresa'] || 1;

    if (!codigo) {
        return res.status(400).json({
            success: false,
            error: 'Código de producto requerido'
        });
    }

    try {
        // 0. Obtener bodega_maestra de la tabla empresas
        const empresaRes = await pool.query(
            'SELECT bodega_maestra FROM empresas WHERE codigo = $1',
            [empresa]
        );

        if (empresaRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Empresa no encontrada'
            });
        }

        const ccosto = empresaRes.rows[0].bodega_maestra;

        if (!ccosto) {
            return res.status(400).json({
                success: false,
                error: 'La empresa no tiene bodega maestra configurada'
            });
        }

        // Buscar el código_producto mapeado desde la receta (si existe mapeo)
        let codigo_inventario = codigo;
        try {
            const mapeoRes = await pool.query(
                'SELECT codigo_producto FROM receta_producto WHERE codigo_receta = $1',
                [codigo]
            );
            if (mapeoRes.rows.length > 0) {
                codigo_inventario = mapeoRes.rows[0].codigo_producto;
            }
        } catch (err) {
            // Si no existe el mapeo, usar el codigo original
            console.log(`No hay mapeo para receta ${codigo}, usando código original`);
        }

        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toISOString().split('T')[0];

        // 1. Verificar si hay registros en ventas ayer
        const ventasYerQuery = `
            SELECT COUNT(*) as cnt
            FROM ventas
            WHERE fecha = $1 AND empresa = $2
        `;
        const ventasYerRes = await pool.query(ventasYerQuery, [ayerStr, empresa]);
        const hayVentasYer = ventasYerRes.rows[0]?.cnt > 0;

        // 2. Definir rango de fechas
        let fechaInicio = new Date(hoy);
        if (hayVentasYer) {
            // Si hay ventas ayer, analizar los últimos 8 días (8 al 16 de junio si hoy es 17)
            fechaInicio.setDate(fechaInicio.getDate() - 8);
        } else {
            // Si no hay ventas, usar los últimos 7 días
            fechaInicio.setDate(fechaInicio.getDate() - 7);
        }
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
        const fechaFinStr = ayerStr;

        // 3. Obtener saldo inicial (último movimiento antes del rango)
        const saldoInicialQuery = `
            SELECT COALESCE(SUM(CAST(entrada AS NUMERIC)), 0) - COALESCE(SUM(CAST(salida AS NUMERIC)), 0) as saldo
            FROM detalle_inventario
            WHERE codigo = $1
              AND empresa = $2
              AND ccosto = $3
              AND fecha < $4
        `;
        const saldoInicialRes = await pool.query(saldoInicialQuery, [codigo_inventario, empresa, ccosto, fechaInicioStr]);
        let saldo_inicial = parseFloat(saldoInicialRes.rows[0]?.saldo) || 0;

        // 4. Buscar movimientos en el rango en detalle_inventario
        const movimientosQuery = `
            SELECT
                codigo,
                fecha,
                tipo,
                COALESCE(CAST(entrada AS NUMERIC), 0) as entrada,
                COALESCE(CAST(salida AS NUMERIC), 0) as salida
            FROM detalle_inventario
            WHERE codigo = $1
              AND empresa = $2
              AND ccosto = $3
              AND fecha >= $4
              AND fecha <= $5
            ORDER BY fecha ASC
        `;
        const movRes = await pool.query(movimientosQuery, [codigo_inventario, empresa, ccosto, fechaInicioStr, fechaFinStr]);

        // 5. Calcular saldos acumulativamente
        let saldo_actual = saldo_inicial;
        let total_entrada = 0;
        let total_salida = 0;
        let consumo_7_dias = 0;

        for (const mov of movRes.rows) {
            const entrada = parseFloat(mov.entrada) || 0;
            const salida = parseFloat(mov.salida) || 0;

            // Acumular totales
            total_entrada += entrada;
            total_salida += salida;

            // Calcular saldo actual = saldo anterior + entrada - salida
            saldo_actual = saldo_actual + entrada - salida;

            // Contar consumo (salidas de almacén, bajas, traslados)
            if (['SALIDA DE ALMACEN', 'SALIDA POR BAJA', 'SALIDA POR TRASLADO'].includes(mov.tipo)) {
                consumo_7_dias += salida;
            }
        }

        const saldo_final = saldo_actual;
        const stock_actual = saldo_final;

        res.json({
            success: true,
            data: {
                codigo,
                codigo_inventario,
                empresa,
                ccosto,
                hay_ventas_ayer: hayVentasYer,
                fecha_inicio: fechaInicioStr,
                fecha_fin: fechaFinStr,
                saldo_inicial,
                total_entrada,
                total_salida,
                saldo_final,
                stock_actual,
                consumo_7_dias,
                total_movimientos: movRes.rows.length
            }
        });

    } catch (error) {
        console.error('Error GET /api/detalle-inventario/analisis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ── PRODUCTOS ENDPOINT ───────────────────────────────────────────
// GET /api/productos - obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT codigo, nombre
            FROM productos
            ORDER BY nombre ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── RECETA-PRODUCTO MAPPING ──────────────────────────────────────
// GET /api/produccion/receta-producto - obtener todos los mapeos
app.get('/api/produccion/receta-producto', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rp.codigo_receta, rp.codigo_producto, rp.created_at,
                   COALESCE(r.nombre, '') AS receta_nombre,
                   COALESCE(r.und, '')    AS receta_und,
                   COALESCE(p.nombre, '') AS producto_nombre,
                   COALESCE(p.und, '')    AS producto_und
            FROM receta_producto rp
            LEFT JOIN recetas   r ON TRIM(r.codigo::text) = TRIM(rp.codigo_receta::text)
            LEFT JOIN productos p ON TRIM(p.codigo::text) = TRIM(rp.codigo_producto::text)
            ORDER BY rp.codigo_receta ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/produccion/receta-producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/produccion/receta-producto/:codigo_receta - obtener un mapeo
app.get('/api/produccion/receta-producto/:codigo_receta', async (req, res) => {
    const { codigo_receta } = req.params;
    try {
        const result = await pool.query(`
            SELECT codigo_receta, codigo_producto
            FROM receta_producto
            WHERE codigo_receta = $1
        `, [codigo_receta]);
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        console.error('Error GET /api/produccion/receta-producto/:codigo_receta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/produccion/receta-producto - crear un mapeo
app.post('/api/produccion/receta-producto', async (req, res) => {
    const { codigo_receta, codigo_producto } = req.body;
    if (!codigo_receta || !codigo_producto) {
        return res.status(400).json({ success: false, error: 'codigo_receta y codigo_producto son requeridos' });
    }
    try {
        const result = await pool.query(`
            INSERT INTO receta_producto (codigo_receta, codigo_producto)
            VALUES ($1, $2)
            ON CONFLICT (codigo_receta) DO UPDATE SET codigo_producto = $2
            RETURNING codigo_receta, codigo_producto
        `, [codigo_receta, codigo_producto]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error POST /api/produccion/receta-producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/produccion/receta-producto/:codigo_receta - eliminar un mapeo
app.delete('/api/produccion/receta-producto/:codigo_receta', async (req, res) => {
    const { codigo_receta } = req.params;
    try {
        await pool.query(`
            DELETE FROM receta_producto WHERE codigo_receta = $1
        `, [codigo_receta]);
        res.json({ success: true, message: 'Mapeo eliminado' });
    } catch (error) {
        console.error('Error DELETE /api/produccion/receta-producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// MÓDULO: CONTROL DE ASISTENCIA NFC
// Ver docs/ASISTENCIA-NFC.md para el diseño completo.
// Marcaje sin cámara: tag NFC + celular enrolado + PIN adaptativo ante
// anomalía. Con ASISTENCIA_MODO_PRUEBA=true el tap se acepta sin firma
// para poder probar el ciclo antes de comprar los tags; en producción
// se exige la firma SUN del NTAG 424 DNA (Fase 2).
// ================================================================

const nfcSdm = require('./lib/nfc-sdm.js');

const ASISTENCIA_MODO_PRUEBA = process.env.ASISTENCIA_MODO_PRUEBA === 'true';
const ASISTENCIA_FRONTEND_URL = process.env.ASISTENCIA_FRONTEND_URL
    || 'https://heartfelt-moxie-a79307.netlify.app/completa/';
const ASISTENCIA_VENTANA_TURNO_MIN = 30; // minutos de tolerancia alrededor del turno programado
const ASISTENCIA_RAFAGA_SEGUNDOS = 15;
const ASISTENCIA_RAFAGA_MIN_REINCIDENCIAS = 3; // coincidencias/semana para considerar una pareja sospechosa

// ── Tablas ──────────────────────────────────────────────────────
async function crearTablasAsistencia() {
    const sqls = [
        `CREATE TABLE IF NOT EXISTS nom_nfc_tag (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL,
            tag_uid VARCHAR(32) NOT NULL, etiqueta VARCHAR(60),
            ccosto VARCHAR(3) NOT NULL, aes_key_cif VARCHAR(200),
            ultimo_contador INT4 DEFAULT 0, activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE (empresa, tag_uid)
        )`,
        `CREATE TABLE IF NOT EXISTS nom_dispositivo_empleado (
            id SERIAL PRIMARY KEY, empleado_id INT4 NOT NULL,
            token_hash VARCHAR(64) NOT NULL, etiqueta VARCHAR(80),
            user_agent VARCHAR(300), enrolado_en TIMESTAMP DEFAULT NOW(),
            ultimo_uso TIMESTAMP, activo BOOLEAN DEFAULT TRUE,
            revocado_en TIMESTAMP, revocado_por VARCHAR(50),
            UNIQUE (token_hash)
        )`,
        `CREATE TABLE IF NOT EXISTS nom_asistencia_marcaje (
            id SERIAL PRIMARY KEY, empresa INT4 NOT NULL, empleado_id INT4 NOT NULL,
            tipo VARCHAR(10) NOT NULL, momento TIMESTAMPTZ NOT NULL,
            ccosto VARCHAR(3) NOT NULL, origen VARCHAR(12) NOT NULL,
            tag_id INT4, tag_contador INT4, dispositivo_id INT4,
            pin_verificado BOOLEAN DEFAULT FALSE,
            estado VARCHAR(12) DEFAULT 'VALIDO', anomalias VARCHAR(300),
            corrige_a INT4, creado_por VARCHAR(50) DEFAULT 'EMPLEADO',
            notas VARCHAR(300), created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS ix_marcaje_emp_fecha ON nom_asistencia_marcaje (empleado_id, momento)`,
        `CREATE INDEX IF NOT EXISTS ix_marcaje_empresa_fecha ON nom_asistencia_marcaje (empresa, momento)`,
        `CREATE TABLE IF NOT EXISTS nom_enrolamiento_intento (
            id SERIAL PRIMARY KEY, empleado_id INT4, ip VARCHAR(45),
            exito BOOLEAN DEFAULT FALSE, momento TIMESTAMP DEFAULT NOW()
        )`
    ];
    for (const sql of sqls) {
        try { await pool.query(sql); } catch(e) { console.error('asistencia table error:', e.message); }
    }
    console.log('✅ Tablas de asistencia NFC verificadas');
}
crearTablasAsistencia();

async function agregarColumnasAsistencia() {
    const queries = [
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(160)`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_generado_en TIMESTAMP`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_usado_en TIMESTAMP`,
        `ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS marcaje_activo BOOLEAN DEFAULT TRUE`
    ];
    for (const sql of queries) {
        try { await pool.query(sql); }
        catch(e) { console.error('Migración asistencia:', e.message); }
    }
    console.log('✅ Columnas de asistencia verificadas');
}
agregarColumnasAsistencia();

// ── PIN: generación, hash (scrypt), verificación en tiempo constante ──
// El PIN no es de un solo uso: sirve para enrolar el celular y también
// para los desafíos que se piden cuando un marcaje dispara una anomalía.
function generarPin() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}
function hashPin(pin) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(pin), salt, 32);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
function verificarPin(pin, almacenado) {
    if (!almacenado || !pin) return false;
    const [saltHex, hashHex] = String(almacenado).split(':');
    if (!saltHex || !hashHex) return false;
    try {
        const hash = crypto.scryptSync(String(pin), Buffer.from(saltHex, 'hex'), 32);
        const stored = Buffer.from(hashHex, 'hex');
        if (hash.length !== stored.length) return false;
        return crypto.timingSafeEqual(hash, stored);
    } catch { return false; }
}

// ── Token de dispositivo: aleatorio, en la BD solo se guarda su SHA-256 ──
function generarTokenDispositivo() {
    return crypto.randomBytes(32).toString('hex');
}
function hashTokenDispositivo(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// ── Punto temporal: contexto (empresa/ccosto/tag) entre el tap y el marcaje.
// Vive ~5 minutos; un Map en memoria basta para un solo proceso Node.
const puntosTemp = new Map(); // codigo -> { empresa, ccosto, tag_id, tag_uid, expira }
function crearPuntoTemp(datos) {
    const codigo = crypto.randomBytes(12).toString('hex');
    puntosTemp.set(codigo, { ...datos, expira: Date.now() + 5 * 60 * 1000 });
    return codigo;
}
function leerPuntoTemp(codigo) {
    const p = puntosTemp.get(codigo);
    if (!p) return null;
    if (Date.now() > p.expira) { puntosTemp.delete(codigo); return null; }
    return p;
}
setInterval(() => {
    const ahora = Date.now();
    for (const [k, v] of puntosTemp.entries()) if (ahora > v.expira) puntosTemp.delete(k);
}, 60 * 1000);

// ── Rate limit de enrolamiento (por empleado y por IP) ──
async function rateLimitEnrolamiento(empleadoId, ip) {
    const desde = new Date(Date.now() - 60 * 60 * 1000);
    const porEmp = await pool.query(
        `SELECT COUNT(*) AS cnt FROM nom_enrolamiento_intento WHERE empleado_id=$1 AND exito=FALSE AND momento > $2`,
        [empleadoId, desde]
    );
    if (parseInt(porEmp.rows[0].cnt) >= 5) return 'Demasiados intentos para este empleado. Intenta de nuevo en una hora.';
    const porIp = await pool.query(
        `SELECT COUNT(*) AS cnt FROM nom_enrolamiento_intento WHERE ip=$1 AND exito=FALSE AND momento > $2`,
        [ip, desde]
    );
    if (parseInt(porIp.rows[0].cnt) >= 10) return 'Demasiados intentos desde esta red. Intenta más tarde.';
    return null;
}

// ── Identidad a partir del token de dispositivo (header X-Dispositivo-Token) ──
async function resolverDispositivo(req) {
    const token = req.headers['x-dispositivo-token'];
    if (!token) return null;
    const hash = hashTokenDispositivo(token);
    const r = await pool.query(
        `SELECT d.id AS dispositivo_id, d.ultimo_uso, e.*
         FROM nom_dispositivo_empleado d
         JOIN nom_empleados e ON e.id = d.empleado_id
         WHERE d.token_hash = $1 AND d.activo = TRUE`,
        [hash]
    );
    return r.rows[0] || null;
}

function ipDeRequest(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'desconocida';
}

// ── Redondeo neutral (FLSA): al múltiplo de 5 minutos más cercano ──
function redondearHoras(horas) {
    const minutos = horas * 60;
    return Math.round(minutos / 5) * 5 / 60;
}

// ── Consolidación: vuelca los marcajes VALIDO del día a nom_semana_detalle.
// Nunca sobrescribe una fila que el supervisor ya ajustó a mano.
async function consolidarDia(empresa, empleadoId, fecha, ccosto) {
    const marcajes = await pool.query(
        `SELECT tipo, momento FROM nom_asistencia_marcaje
         WHERE empleado_id=$1 AND ccosto=$2 AND estado='VALIDO'
           AND momento::date = $3::date
         ORDER BY momento ASC`,
        [empleadoId, ccosto, fecha]
    );
    if (!marcajes.rows.length) return { consolidado: false, motivo: 'Sin marcajes válidos' };

    let horas = 0, primeraEntrada = null, ultimaSalida = null, entradaAbierta = null;
    for (const m of marcajes.rows) {
        if (m.tipo === 'ENTRADA') {
            entradaAbierta = new Date(m.momento);
            if (!primeraEntrada) primeraEntrada = entradaAbierta;
        } else if (m.tipo === 'SALIDA' && entradaAbierta) {
            const salida = new Date(m.momento);
            horas += (salida - entradaAbierta) / 3600000;
            ultimaSalida = salida;
            entradaAbierta = null;
        }
    }
    if (!ultimaSalida) return { consolidado: false, motivo: 'Turno abierto, falta la salida' };
    horas = redondearHoras(horas);

    const semana = await pool.query(
        `SELECT id FROM nom_semana WHERE empresa=$1 AND $2::date BETWEEN semana_inicio AND semana_fin LIMIT 1`,
        [empresa, fecha]
    );
    if (!semana.rows.length) return { consolidado: false, motivo: 'No existe semana de nómina para esta fecha' };
    const semanaId = semana.rows[0].id;

    const toHHMM = (d) => d.toISOString().slice(11, 16);
    const existente = await pool.query(
        `SELECT id, ajustado FROM nom_semana_detalle WHERE semana_id=$1 AND empleado_id=$2 AND fecha=$3 AND ccosto=$4`,
        [semanaId, empleadoId, fecha, ccosto]
    );
    if (existente.rows.length && existente.rows[0].ajustado) {
        return { consolidado: false, motivo: 'El supervisor ya ajustó esta fila a mano' };
    }
    if (existente.rows.length) {
        await pool.query(
            `UPDATE nom_semana_detalle SET real_inicio=$1, real_fin=$2, real_horas=$3, updated_at=NOW() WHERE id=$4`,
            [toHHMM(primeraEntrada), toHHMM(ultimaSalida), horas, existente.rows[0].id]
        );
    } else {
        await pool.query(
            `INSERT INTO nom_semana_detalle (semana_id, empleado_id, fecha, ccosto, real_inicio, real_fin, real_horas, ajustado)
             VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)`,
            [semanaId, empleadoId, fecha, ccosto, toHHMM(primeraEntrada), toHHMM(ultimaSalida), horas]
        );
    }
    return { consolidado: true, horas };
}

// ── GET /api/asistencia/tap — hit directo del navegador al acercar el celular
// al tag NFC. Resuelve el tag, crea el contexto temporal y redirige al SPA.
app.get('/api/asistencia/tap', async (req, res) => {
    // El NTAG 424 DNA con SDM imprime uid + contador + firma en cada toque.
    // Los nombres de parámetro varían según cómo se configure el mirror.
    const uid = req.query.uid || req.query.picc_uid;
    const ctr = req.query.ctr || req.query.c;
    const cmac = req.query.cmac || req.query.mac;
    if (!uid) return res.status(400).send('Falta el identificador del tag.');
    try {
        const tagR = await pool.query(
            `SELECT * FROM nom_nfc_tag WHERE tag_uid = $1 AND activo = TRUE`,
            [String(uid).trim().toUpperCase()]
        );
        if (!tagR.rows.length) {
            return res.status(404).send('Tag no reconocido. Contacta a tu supervisor.');
        }
        const tag = tagR.rows[0];

        let contador;
        if (ASISTENCIA_MODO_PRUEBA && !tag.aes_key_cif) {
            // Tag de prueba (sin clave): el contador solo avanza para dejar rastro.
            contador = tag.ultimo_contador + 1;
        } else {
            if (!tag.aes_key_cif) {
                return res.status(500).send('Este tag no tiene clave AES registrada. Contacta a tu supervisor.');
            }
            if (!ctr || !cmac) {
                return res.status(400).send('Tap inválido: falta la firma del tag.');
            }
            let claveSdm;
            try {
                claveSdm = nfcSdm.descifrarClaveTag(tag.aes_key_cif);
            } catch (e) {
                console.error('Error descifrando clave del tag', tag.id, e.message);
                return res.status(500).send('Error de configuración del servidor.');
            }
            const verif = nfcSdm.verificarSun(claveSdm, String(uid).trim(), String(ctr).trim(), String(cmac).trim());
            if (!verif.valido) {
                console.warn(`Tap con firma inválida en tag ${tag.tag_uid}`);
                return res.status(403).send('Tap no válido. Vuelve a acercar el celular al tag.');
            }
            // Antirreplay: el contador del chip solo sube, nunca se repite.
            if (verif.contador <= tag.ultimo_contador) {
                console.warn(`REPLAY detectado en tag ${tag.tag_uid}: contador ${verif.contador} <= ${tag.ultimo_contador}`);
                return res.status(409).send('Este enlace ya fue usado. Vuelve a acercar el celular al tag.');
            }
            contador = verif.contador;
        }

        await pool.query(`UPDATE nom_nfc_tag SET ultimo_contador=$1 WHERE id=$2`, [contador, tag.id]);

        const codigo = crearPuntoTemp({
            empresa: tag.empresa, ccosto: tag.ccosto,
            tag_id: tag.id, tag_uid: tag.tag_uid, contador,
        });
        res.redirect(302, `${ASISTENCIA_FRONTEND_URL}#/marcar?punto=${codigo}`);
    } catch (error) {
        console.error('Error GET /api/asistencia/tap:', error);
        res.status(500).send('Error del servidor. Intenta de nuevo.');
    }
});

// ── POST /api/asistencia/enrolar — primera vez que el empleado usa su celular ──
app.post('/api/asistencia/enrolar', async (req, res) => {
    const { empleado_id, pin } = req.body;
    const ip = ipDeRequest(req);
    if (!empleado_id || !pin) return res.status(400).json({ success: false, error: 'Código de empleado y PIN requeridos' });
    try {
        const bloqueo = await rateLimitEnrolamiento(empleado_id, ip);
        if (bloqueo) return res.status(429).json({ success: false, error: bloqueo });

        const empR = await pool.query(
            `SELECT id, nombre, apellido, estado, marcaje_activo, pin_hash, pin_generado_en, pin_usado_en
             FROM nom_empleados WHERE id=$1`,
            [empleado_id]
        );
        if (!empR.rows.length) {
            await pool.query(`INSERT INTO nom_enrolamiento_intento (empleado_id, ip, exito) VALUES ($1,$2,FALSE)`, [empleado_id, ip]);
            return res.status(404).json({ success: false, error: 'Código de empleado no encontrado' });
        }
        const emp = empR.rows[0];
        if (emp.estado !== 'ACTIVO' || emp.marcaje_activo === false) {
            return res.status(403).json({ success: false, error: 'Este empleado no tiene el marcaje habilitado' });
        }
        if (!emp.pin_hash) {
            return res.status(400).json({ success: false, error: 'Aún no tienes un PIN generado. Pide al administrador que te genere uno.' });
        }
        if (!emp.pin_usado_en && emp.pin_generado_en) {
            const horasDesdeGeneracion = (Date.now() - new Date(emp.pin_generado_en).getTime()) / 3600000;
            if (horasDesdeGeneracion > 72) {
                return res.status(400).json({ success: false, error: 'Tu PIN expiró. Pide al administrador que te genere uno nuevo.' });
            }
        }

        const ok = verificarPin(pin, emp.pin_hash);
        await pool.query(`INSERT INTO nom_enrolamiento_intento (empleado_id, ip, exito) VALUES ($1,$2,$3)`, [empleado_id, ip, ok]);
        if (!ok) return res.status(401).json({ success: false, error: 'PIN incorrecto' });

        // Un segundo celular no se enrola solo con el PIN: el gerente debe
        // revocar el dispositivo activo primero (ver docs/ASISTENCIA-NFC.md §3.3).
        const activoR = await pool.query(
            `SELECT id FROM nom_dispositivo_empleado WHERE empleado_id=$1 AND activo=TRUE LIMIT 1`,
            [empleado_id]
        );
        if (activoR.rows.length) {
            return res.status(409).json({ success: false, error: 'Ya tienes un celular vinculado. Pide al administrador que lo revoque antes de vincular uno nuevo.' });
        }

        const token = generarTokenDispositivo();
        const tokenHash = hashTokenDispositivo(token);
        await pool.query(
            `INSERT INTO nom_dispositivo_empleado (empleado_id, token_hash, user_agent) VALUES ($1,$2,$3)`,
            [empleado_id, tokenHash, req.headers['user-agent'] || null]
        );
        if (!emp.pin_usado_en) {
            await pool.query(`UPDATE nom_empleados SET pin_usado_en=NOW() WHERE id=$1`, [empleado_id]);
        }

        res.json({ success: true, data: { token, empleado: { id: emp.id, nombre: emp.nombre, apellido: emp.apellido } } });
    } catch (error) {
        console.error('Error POST /api/asistencia/enrolar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/asistencia/estado — ¿el celular ya está enrolado? ¿el empleado está dentro o fuera? ──
app.get('/api/asistencia/estado', async (req, res) => {
    try {
        const dispositivo = await resolverDispositivo(req);
        if (!dispositivo) return res.json({ success: true, data: { enrolado: false } });

        const ultimoR = await pool.query(
            `SELECT tipo, momento, estado FROM nom_asistencia_marcaje
             WHERE empleado_id=$1 AND estado != 'ANULADO'
             ORDER BY momento DESC LIMIT 1`,
            [dispositivo.id]
        );
        const ultimo = ultimoR.rows[0] || null;
        const estadoActual = (ultimo && ultimo.tipo === 'ENTRADA') ? 'DENTRO' : 'FUERA';

        res.json({
            success: true,
            data: {
                enrolado: true,
                empleado: { id: dispositivo.id, nombre: dispositivo.nombre, apellido: dispositivo.apellido },
                estadoActual,
                ultimoMarcaje: ultimo,
            },
        });
    } catch (error) {
        console.error('Error GET /api/asistencia/estado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── POST /api/asistencia/marcar — registra ENTRADA o SALIDA ──
// El tipo lo decide el servidor (alterna según el último marcaje), no el
// cliente: así una doble-entrada es estructuralmente imposible.
app.post('/api/asistencia/marcar', async (req, res) => {
    const { punto, pin, forzar } = req.body;
    try {
        const dispositivo = await resolverDispositivo(req);
        if (!dispositivo) return res.status(401).json({ success: false, error: 'Celular no reconocido. Enrólalo primero.' });
        if (dispositivo.estado !== 'ACTIVO' || dispositivo.marcaje_activo === false) {
            return res.status(403).json({ success: false, error: 'Tu marcaje no está habilitado. Contacta a tu supervisor.' });
        }

        const ctx = punto ? leerPuntoTemp(punto) : null;
        if (!ctx) return res.status(400).json({ success: false, error: 'El código expiró. Vuelve a acercar el celular al tag.' });
        if (String(ctx.empresa) !== String(dispositivo.empresa)) {
            return res.status(403).json({ success: false, error: 'Este tag no pertenece a tu empresa' });
        }

        const ultimoR = await pool.query(
            `SELECT tipo FROM nom_asistencia_marcaje WHERE empleado_id=$1 AND estado != 'ANULADO' ORDER BY momento DESC LIMIT 1`,
            [dispositivo.id]
        );
        const tipo = (ultimoR.rows[0]?.tipo === 'ENTRADA') ? 'SALIDA' : 'ENTRADA';

        // ── Anomalías ──
        const anomalias = [];
        const progR = await pool.query(
            `SELECT sd.prog_inicio, sd.prog_fin FROM nom_semana_detalle sd
             JOIN nom_semana s ON s.id = sd.semana_id
             WHERE sd.empleado_id=$1 AND sd.fecha = CURRENT_DATE AND sd.ccosto=$2 AND s.empresa=$3
             LIMIT 1`,
            [dispositivo.id, ctx.ccosto, ctx.empresa]
        );
        if (!progR.rows.length) {
            anomalias.push('FUERA_DE_TURNO');
        } else {
            const prog = progR.rows[0];
            const ahora = new Date();
            const minutosDesdeMedianoche = ahora.getHours() * 60 + ahora.getMinutes();
            const toMin = (t) => { const [h, m] = String(t).slice(0, 5).split(':').map(Number); return h * 60 + m; };
            if (tipo === 'ENTRADA' && prog.prog_inicio) {
                if (minutosDesdeMedianoche < toMin(prog.prog_inicio) - ASISTENCIA_VENTANA_TURNO_MIN) anomalias.push('ENTRADA_ANTICIPADA');
            }
            if (tipo === 'SALIDA' && prog.prog_fin) {
                if (minutosDesdeMedianoche > toMin(prog.prog_fin) + ASISTENCIA_VENTANA_TURNO_MIN) anomalias.push('SALIDA_TARDIA');
            }
        }
        if (dispositivo.ultimo_uso === null) anomalias.push('DISPOSITIVO_NUEVO');
        const rafagaR = await pool.query(
            `SELECT 1 FROM nom_asistencia_marcaje
             WHERE tag_id=$1 AND empleado_id != $2 AND estado != 'ANULADO'
               AND momento > NOW() - INTERVAL '${ASISTENCIA_RAFAGA_SEGUNDOS} seconds'
             LIMIT 1`,
            [ctx.tag_id, dispositivo.id]
        );
        if (rafagaR.rows.length) anomalias.push('RAFAGA');

        const requierePin = anomalias.length > 0;
        if (requierePin && !pin && !forzar) {
            // No se guarda nada todavía: se le da al empleado la oportunidad de escribir el PIN.
            return res.json({ success: true, data: { requierePin: true, anomalias } });
        }

        const pinOk = requierePin && pin ? verificarPin(pin, dispositivo.pin_hash) : false;
        const estadoFinal = !requierePin ? 'VALIDO' : (pinOk ? 'VALIDO' : 'SOSPECHOSO');

        const insertR = await pool.query(
            `INSERT INTO nom_asistencia_marcaje
             (empresa, empleado_id, tipo, momento, ccosto, origen, tag_id, tag_contador, dispositivo_id, pin_verificado, estado, anomalias, creado_por)
             VALUES ($1,$2,$3,NOW(),$4,'NFC',$5,$6,$7,$8,$9,$10,'EMPLEADO')
             RETURNING id, momento`,
            [ctx.empresa, dispositivo.id, tipo, ctx.ccosto, ctx.tag_id, ctx.contador || null,
             dispositivo.dispositivo_id, pinOk, estadoFinal, anomalias.join(',') || null]
        );
        await pool.query(`UPDATE nom_dispositivo_empleado SET ultimo_uso=NOW() WHERE id=$1`, [dispositivo.dispositivo_id]);

        let consolidacion = { consolidado: false };
        if (estadoFinal === 'VALIDO') {
            const fecha = insertR.rows[0].momento.toISOString().slice(0, 10);
            consolidacion = await consolidarDia(ctx.empresa, dispositivo.id, fecha, ctx.ccosto);
        }

        res.json({
            success: true,
            data: {
                id: insertR.rows[0].id, tipo, momento: insertR.rows[0].momento,
                estado: estadoFinal, anomalias, consolidado: consolidacion.consolidado,
            },
        });
    } catch (error) {
        console.error('Error POST /api/asistencia/marcar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Administración: tags NFC (requiere sesión de administrador en el frontend) ──
app.get('/api/asistencia/tags', async (req, res) => {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
    try {
        // Nunca se expone aes_key_cif: solo si el tag tiene clave o no.
        const r = await pool.query(
            `SELECT t.id, t.tag_uid, t.etiqueta, t.ccosto, COALESCE(cc.nombre, t.ccosto) AS ccosto_nombre,
                    t.ultimo_contador, t.activo, t.created_at,
                    (t.aes_key_cif IS NOT NULL) AS tiene_clave
             FROM nom_nfc_tag t
             LEFT JOIN ccostos cc ON cc.codigo = t.ccosto AND cc.empresa::text = t.empresa::text
             WHERE t.empresa = $1
             ORDER BY t.created_at DESC`,
            [empresa]
        );
        res.json({ success: true, data: r.rows, modo_prueba: ASISTENCIA_MODO_PRUEBA });
    } catch (error) {
        console.error('Error GET /api/asistencia/tags:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/asistencia/tags', async (req, res) => {
    const { empresa, tag_uid, etiqueta, ccosto, aes_key } = req.body;
    if (!empresa || !tag_uid || !ccosto) return res.status(400).json({ success: false, error: 'Empresa, UID del tag y centro de costo son requeridos' });

    // Sin clave AES el tag solo sirve en modo prueba: no hay firma que verificar.
    if (!aes_key && !ASISTENCIA_MODO_PRUEBA) {
        return res.status(400).json({ success: false, error: 'La clave AES del tag es obligatoria en producción' });
    }

    let claveCifrada = null;
    if (aes_key) {
        const limpia = String(aes_key).trim().replace(/\s|:/g, '');
        if (!/^[0-9a-fA-F]{32}$/.test(limpia)) {
            return res.status(400).json({ success: false, error: 'La clave AES debe ser de 16 bytes en hexadecimal (32 caracteres)' });
        }
        try {
            claveCifrada = nfcSdm.cifrarClaveTag(limpia);
        } catch (e) {
            return res.status(500).json({ success: false, error: `No se pudo cifrar la clave: ${e.message}` });
        }
    }

    try {
        const r = await pool.query(
            `INSERT INTO nom_nfc_tag (empresa, tag_uid, etiqueta, ccosto, aes_key_cif) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [empresa, String(tag_uid).trim().toUpperCase(), etiqueta || null, ccosto, claveCifrada]
        );
        res.json({ success: true, data: { id: r.rows[0].id } });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ success: false, error: 'Ya existe un tag con ese UID en esta empresa' });
        console.error('Error POST /api/asistencia/tags:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/asistencia/tags/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE nom_nfc_tag SET activo=FALSE WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/asistencia/tags/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Administración: PIN y dispositivos del empleado ──
app.post('/api/nomina/empleados/:id/pin', async (req, res) => {
    try {
        const pin = generarPin();
        const hash = hashPin(pin);
        await pool.query(
            `UPDATE nom_empleados SET pin_hash=$1, pin_generado_en=NOW(), pin_usado_en=NULL WHERE id=$2`,
            [hash, req.params.id]
        );
        res.json({ success: true, data: { pin } });
    } catch (error) {
        console.error('Error POST /api/nomina/empleados/:id/pin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/nomina/empleados/:id/dispositivos', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT id, etiqueta, user_agent, enrolado_en, ultimo_uso, activo
             FROM nom_dispositivo_empleado WHERE empleado_id=$1 ORDER BY enrolado_en DESC`,
            [req.params.id]
        );
        res.json({ success: true, data: r.rows });
    } catch (error) {
        console.error('Error GET /api/nomina/empleados/:id/dispositivos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/nomina/empleados/:id/dispositivos/:dispositivoId', async (req, res) => {
    try {
        await pool.query(
            `UPDATE nom_dispositivo_empleado SET activo=FALSE, revocado_en=NOW() WHERE id=$1 AND empleado_id=$2`,
            [req.params.dispositivoId, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /api/nomina/empleados/:id/dispositivos/:dispositivoId:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================
// ASISTENCIA — FASE 3: SUPERVISIÓN
// Panel del día, excepciones, correcciones auditadas, auto-cierre y
// reporte de parejas reincidentes en ráfaga.
// ================================================================

// ── GET /api/asistencia/dia — marcajes de una fecha, para el supervisor ──
app.get('/api/asistencia/dia', async (req, res) => {
    const { empresa, fecha } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
    const dia = fecha || new Date().toISOString().slice(0, 10);
    try {
        const r = await pool.query(
            `SELECT m.id, m.tipo, m.momento, m.ccosto, m.origen, m.estado, m.anomalias,
                    m.pin_verificado, m.tag_contador, m.corrige_a, m.creado_por, m.notas,
                    e.nombre, e.apellido,
                    COALESCE(cc.nombre, m.ccosto) AS ccosto_nombre,
                    t.etiqueta AS tag_etiqueta
             FROM nom_asistencia_marcaje m
             JOIN nom_empleados e ON e.id = m.empleado_id
             LEFT JOIN ccostos cc ON cc.codigo = m.ccosto AND cc.empresa::text = m.empresa::text
             LEFT JOIN nom_nfc_tag t ON t.id = m.tag_id
             WHERE m.empresa = $1 AND m.momento::date = $2::date
             ORDER BY m.momento DESC`,
            [empresa, dia]
        );
        res.json({ success: true, fecha: dia, data: r.rows });
    } catch (error) {
        console.error('Error GET /api/asistencia/dia:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/asistencia/excepciones — lo que necesita decisión del supervisor ──
app.get('/api/asistencia/excepciones', async (req, res) => {
    const { empresa, dias } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
    const ventana = parseInt(dias) || 14;
    try {
        const r = await pool.query(
            `SELECT m.id, m.tipo, m.momento, m.ccosto, m.origen, m.estado, m.anomalias,
                    m.pin_verificado, m.notas,
                    e.nombre, e.apellido,
                    COALESCE(cc.nombre, m.ccosto) AS ccosto_nombre
             FROM nom_asistencia_marcaje m
             JOIN nom_empleados e ON e.id = m.empleado_id
             LEFT JOIN ccostos cc ON cc.codigo = m.ccosto AND cc.empresa::text = m.empresa::text
             WHERE m.empresa = $1
               AND m.estado = 'SOSPECHOSO'
               AND m.momento > NOW() - ($2 || ' days')::interval
             ORDER BY m.momento DESC`,
            [empresa, String(ventana)]
        );
        res.json({ success: true, data: r.rows });
    } catch (error) {
        console.error('Error GET /api/asistencia/excepciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── POST /api/asistencia/marcaje/:id/aprobar — el supervisor valida un sospechoso ──
app.post('/api/asistencia/marcaje/:id/aprobar', async (req, res) => {
    const { usuario, notas } = req.body;
    try {
        const r = await pool.query(
            `UPDATE nom_asistencia_marcaje
             SET estado='VALIDO', notas=COALESCE($1, notas)
             WHERE id=$2 AND estado='SOSPECHOSO'
             RETURNING empresa, empleado_id, ccosto, momento`,
            [notas ? `Aprobado por ${usuario || 'supervisor'}: ${notas}` : `Aprobado por ${usuario || 'supervisor'}`, req.params.id]
        );
        if (!r.rows.length) return res.status(404).json({ success: false, error: 'Marcaje no encontrado o ya resuelto' });

        const m = r.rows[0];
        const fecha = new Date(m.momento).toISOString().slice(0, 10);
        const consolidacion = await consolidarDia(m.empresa, m.empleado_id, fecha, m.ccosto);
        res.json({ success: true, data: consolidacion });
    } catch (error) {
        console.error('Error POST /api/asistencia/marcaje/:id/aprobar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── POST /api/asistencia/marcaje/:id/anular — corrección auditada ──
// Los marcajes nunca se editan ni se borran: se anula el original y, si
// se indica un momento nuevo, se crea otro que apunta a él con corrige_a.
app.post('/api/asistencia/marcaje/:id/anular', async (req, res) => {
    const { usuario, motivo, momento_corregido } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orig = await client.query(
            `SELECT * FROM nom_asistencia_marcaje WHERE id=$1 AND estado != 'ANULADO' FOR UPDATE`,
            [req.params.id]
        );
        if (!orig.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Marcaje no encontrado o ya anulado' });
        }
        const m = orig.rows[0];

        await client.query(
            `UPDATE nom_asistencia_marcaje SET estado='ANULADO', notas=$1 WHERE id=$2`,
            [`Anulado por ${usuario || 'supervisor'}${motivo ? ': ' + motivo : ''}`, m.id]
        );

        let nuevoId = null;
        if (momento_corregido) {
            const nuevo = await client.query(
                `INSERT INTO nom_asistencia_marcaje
                 (empresa, empleado_id, tipo, momento, ccosto, origen, estado, corrige_a, creado_por, notas)
                 VALUES ($1,$2,$3,$4,$5,'MANUAL','VALIDO',$6,$7,$8)
                 RETURNING id`,
                [m.empresa, m.empleado_id, m.tipo, momento_corregido, m.ccosto, m.id,
                 usuario || 'supervisor', `Corrige el marcaje #${m.id}`]
            );
            nuevoId = nuevo.rows[0].id;
        }
        await client.query('COMMIT');

        const fecha = new Date(momento_corregido || m.momento).toISOString().slice(0, 10);
        const consolidacion = await consolidarDia(m.empresa, m.empleado_id, fecha, m.ccosto);
        res.json({ success: true, data: { anulado: m.id, nuevo: nuevoId, ...consolidacion } });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/asistencia/marcaje/:id/anular:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ── POST /api/asistencia/marcaje-manual — respaldo cuando falló el celular ──
app.post('/api/asistencia/marcaje-manual', async (req, res) => {
    const { empresa, empleado_id, tipo, momento, ccosto, usuario, motivo } = req.body;
    if (!empresa || !empleado_id || !tipo || !momento || !ccosto) {
        return res.status(400).json({ success: false, error: 'Empresa, empleado, tipo, momento y centro de costo son requeridos' });
    }
    if (!['ENTRADA', 'SALIDA'].includes(tipo)) {
        return res.status(400).json({ success: false, error: 'El tipo debe ser ENTRADA o SALIDA' });
    }
    try {
        const r = await pool.query(
            `INSERT INTO nom_asistencia_marcaje
             (empresa, empleado_id, tipo, momento, ccosto, origen, estado, anomalias, creado_por, notas)
             VALUES ($1,$2,$3,$4,$5,'MANUAL','VALIDO','MANUAL',$6,$7)
             RETURNING id`,
            [empresa, empleado_id, tipo, momento, ccosto, usuario || 'supervisor', motivo || null]
        );
        const fecha = new Date(momento).toISOString().slice(0, 10);
        const consolidacion = await consolidarDia(empresa, empleado_id, fecha, ccosto);
        res.json({ success: true, data: { id: r.rows[0].id, ...consolidacion } });
    } catch (error) {
        console.error('Error POST /api/asistencia/marcaje-manual:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── POST /api/asistencia/consolidar — fuerza el volcado de un día ──
app.post('/api/asistencia/consolidar', async (req, res) => {
    const { empresa, fecha } = req.body;
    if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
    const dia = fecha || new Date().toISOString().slice(0, 10);
    try {
        const pares = await pool.query(
            `SELECT DISTINCT empleado_id, ccosto FROM nom_asistencia_marcaje
             WHERE empresa=$1 AND momento::date = $2::date AND estado='VALIDO'`,
            [empresa, dia]
        );
        const resultados = [];
        for (const p of pares.rows) {
            const r = await consolidarDia(empresa, p.empleado_id, dia, p.ccosto);
            resultados.push({ empleado_id: p.empleado_id, ccosto: p.ccosto, ...r });
        }
        res.json({ success: true, fecha: dia, data: resultados });
    } catch (error) {
        console.error('Error POST /api/asistencia/consolidar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/asistencia/rafagas — parejas reincidentes ──
// Un RAFAGA suelto es ruido (dos compañeros que llegaron juntos). Lo que
// delata es la misma pareja repitiendo, semana tras semana.
app.get('/api/asistencia/rafagas', async (req, res) => {
    const { empresa, dias } = req.query;
    if (!empresa) return res.status(400).json({ success: false, error: 'Empresa requerida' });
    const ventana = parseInt(dias) || 7;
    try {
        const r = await pool.query(
            `WITH eventos AS (
                SELECT m.id, m.empleado_id, m.momento, m.tag_id
                FROM nom_asistencia_marcaje m
                WHERE m.empresa = $1
                  AND m.anomalias LIKE '%RAFAGA%'
                  AND m.estado != 'ANULADO'
                  AND m.momento > NOW() - ($2 || ' days')::interval
            )
            SELECT LEAST(a.empleado_id, b.empleado_id)    AS empleado_a,
                   GREATEST(a.empleado_id, b.empleado_id) AS empleado_b,
                   COUNT(*) AS coincidencias,
                   MAX(a.momento) AS ultima
            FROM eventos a
            JOIN nom_asistencia_marcaje b
              ON b.tag_id = a.tag_id
             AND b.empleado_id != a.empleado_id
             AND b.estado != 'ANULADO'
             AND b.momento BETWEEN a.momento - ($3 || ' seconds')::interval
                               AND a.momento + ($3 || ' seconds')::interval
            GROUP BY 1, 2
            HAVING COUNT(*) >= $4
            ORDER BY coincidencias DESC`,
            [empresa, String(ventana), String(ASISTENCIA_RAFAGA_SEGUNDOS), ASISTENCIA_RAFAGA_MIN_REINCIDENCIAS]
        );

        // Resolver nombres solo de los empleados involucrados
        const ids = [...new Set(r.rows.flatMap(x => [x.empleado_a, x.empleado_b]))];
        let nombres = {};
        if (ids.length) {
            const nR = await pool.query(
                `SELECT id, nombre, apellido FROM nom_empleados WHERE id = ANY($1::int[])`, [ids]
            );
            nombres = Object.fromEntries(nR.rows.map(e => [e.id, `${e.apellido}, ${e.nombre}`]));
        }
        res.json({
            success: true,
            data: r.rows.map(x => ({
                ...x,
                empleado_a_nombre: nombres[x.empleado_a] || x.empleado_a,
                empleado_b_nombre: nombres[x.empleado_b] || x.empleado_b,
                coincidencias: parseInt(x.coincidencias),
            })),
        });
    } catch (error) {
        console.error('Error GET /api/asistencia/rafagas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Auto-cierre de turnos abiertos ──────────────────────────────
// Si alguien olvidó marcar salida, se cierra en su hora programada de fin
// (o a las 23:59 si no tenía turno) y queda con anomalía SIN_SALIDA para
// que el supervisor lo revise. Nunca se inventan horas en silencio.
async function autoCerrarTurnosAbiertos() {
    try {
        const abiertos = await pool.query(
            `SELECT DISTINCT ON (m.empleado_id, m.ccosto)
                    m.id, m.empresa, m.empleado_id, m.ccosto, m.momento
             FROM nom_asistencia_marcaje m
             WHERE m.estado = 'VALIDO'
               AND m.momento::date < CURRENT_DATE
             ORDER BY m.empleado_id, m.ccosto, m.momento DESC`
        );

        for (const a of abiertos.rows) {
            // Solo interesa si el último marcaje de ese día fue una ENTRADA
            const ultimo = await pool.query(
                `SELECT tipo FROM nom_asistencia_marcaje
                 WHERE empleado_id=$1 AND ccosto=$2 AND estado='VALIDO'
                   AND momento::date = $3::date
                 ORDER BY momento DESC LIMIT 1`,
                [a.empleado_id, a.ccosto, a.momento]
            );
            if (ultimo.rows[0]?.tipo !== 'ENTRADA') continue;

            const fecha = new Date(a.momento).toISOString().slice(0, 10);
            const prog = await pool.query(
                `SELECT sd.prog_fin FROM nom_semana_detalle sd
                 JOIN nom_semana s ON s.id = sd.semana_id
                 WHERE sd.empleado_id=$1 AND sd.fecha=$2 AND sd.ccosto=$3 AND s.empresa=$4
                 LIMIT 1`,
                [a.empleado_id, fecha, a.ccosto, a.empresa]
            );
            const horaCierre = prog.rows[0]?.prog_fin || '23:59:00';

            await pool.query(
                `INSERT INTO nom_asistencia_marcaje
                 (empresa, empleado_id, tipo, momento, ccosto, origen, estado, anomalias, creado_por, notas)
                 VALUES ($1,$2,'SALIDA',($3::date + $4::time),$5,'AUTO_CIERRE','SOSPECHOSO','SIN_SALIDA','SISTEMA',
                         'Cierre automático: el empleado no marcó salida')`,
                [a.empresa, a.empleado_id, fecha, horaCierre, a.ccosto]
            );
            console.log(`Auto-cierre: empleado ${a.empleado_id} en ${a.ccosto} el ${fecha}`);
        }
    } catch (error) {
        console.error('Error en autoCerrarTurnosAbiertos:', error.message);
    }
}
setInterval(autoCerrarTurnosAbiertos, 60 * 60 * 1000); // cada hora

// ── GET /api/asistencia/diagnostico — estado del módulo, para depurar ──
app.get('/api/asistencia/diagnostico', async (req, res) => {
    const { empresa } = req.query;
    try {
        const out = {
            modo_prueba: ASISTENCIA_MODO_PRUEBA,
            frontend_url: ASISTENCIA_FRONTEND_URL,
            master_key_configurada: !!process.env.ASISTENCIA_MASTER_KEY,
            puntos_temp_vivos: puntosTemp.size,
        };
        if (empresa) {
            const [tags, disp, marc] = await Promise.all([
                pool.query(`SELECT COUNT(*) c FROM nom_nfc_tag WHERE empresa=$1 AND activo=TRUE`, [empresa]),
                pool.query(`SELECT COUNT(*) c FROM nom_dispositivo_empleado d JOIN nom_empleados e ON e.id=d.empleado_id WHERE e.empresa=$1 AND d.activo=TRUE`, [empresa]),
                pool.query(`SELECT COUNT(*) c FROM nom_asistencia_marcaje WHERE empresa=$1`, [empresa]),
            ]);
            out.tags_activos = parseInt(tags.rows[0].c);
            out.celulares_vinculados = parseInt(disp.rows[0].c);
            out.marcajes_totales = parseInt(marc.rows[0].c);
        }
        res.json({ success: true, data: out });
    } catch (error) {
        console.error('Error GET /api/asistencia/diagnostico:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── FIN MÓDULO NÓMINA ────────────────────────────────────────────

// ================================================================
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, async () => {
    console.log(`\n🚀 Servidor MODULAR corriendo en puerto ${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Arquitectura: Modular v2.0 - Archivo único`);
    console.log(`📂 Módulos: Auth, CCostos, Inventario, Movimientos, Tesorería, Gastos, Órdenes\n`);

    // Crear columna cc_relacion si no existe
    try {
        await pool.query(`
            ALTER TABLE detalle_inventario
            ADD COLUMN IF NOT EXISTS cc_relacion varchar(10)
        `);
        console.log('✅ Columna cc_relacion verificada/creada');
    } catch (err) {
        console.error('⚠️  Error al crear columna cc_relacion:', err.message);
    }

    // despacho_id: vincula cada movimiento con la orden de despacho que lo generó,
    // para poder reversar una orden confirmada sin tener que adivinar sus filas
    // por texto de observaciones.
    try {
        await pool.query(`
            ALTER TABLE detalle_inventario
            ADD COLUMN IF NOT EXISTS despacho_id integer
        `);
        console.log('✅ Columna despacho_id verificada/creada');
    } catch (err) {
        console.error('⚠️  Error al crear columna despacho_id:', err.message);
    }

    // Crear tabla receta_producto (mapeo 1:1)
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS receta_producto (
                codigo_receta VARCHAR(20) PRIMARY KEY,
                codigo_producto VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla receta_producto verificada/creada');
    } catch (err) {
        console.error('⚠️  Error al crear tabla receta_producto:', err.message);
    }

    // Crear tablas de despachos de bodega
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ordenes_despacho (
                id           SERIAL PRIMARY KEY,
                empresa      VARCHAR(20) NOT NULL,
                fecha        DATE NOT NULL,
                cc_origen    VARCHAR(10) NOT NULL,
                cc_destino   VARCHAR(10) NOT NULL,
                estado       VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
                observaciones TEXT,
                creado_por   VARCHAR(100),
                creado_en    TIMESTAMP DEFAULT NOW(),
                fecha_completado TIMESTAMP
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ordenes_despacho_detalle (
                id              SERIAL PRIMARY KEY,
                orden_id        INTEGER NOT NULL REFERENCES ordenes_despacho(id) ON DELETE CASCADE,
                producto_codigo VARCHAR(20) NOT NULL,
                cant_requerida  NUMERIC(12,4) DEFAULT 0,
                cant_picking    NUMERIC(12,4) DEFAULT 0,
                cant_packing    NUMERIC(12,4) DEFAULT 0
            )
        `);
        console.log('✅ Tablas ordenes_despacho verificadas/creadas');
    } catch (err) {
        console.error('⚠️  Error al crear tablas ordenes_despacho:', err.message);
    }

    // Crear tabla producto_barcodes si no existe
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS producto_barcodes (
                id             SERIAL PRIMARY KEY,
                empresa        VARCHAR(20) NOT NULL,
                producto_codigo VARCHAR(20) NOT NULL,
                barcode        VARCHAR(100) NOT NULL,
                descripcion    VARCHAR(200),
                es_principal   BOOLEAN DEFAULT FALSE,
                factor         NUMERIC(10,4) NOT NULL DEFAULT 1,
                creado_en      TIMESTAMP DEFAULT NOW(),
                UNIQUE(empresa, barcode)
            )
        `);
        // Migración: agregar columna factor si no existe en BD existente
        await pool.query(`
            ALTER TABLE producto_barcodes
            ADD COLUMN IF NOT EXISTS factor NUMERIC(10,4) NOT NULL DEFAULT 1
        `).catch(() => {});
        console.log('✅ Tabla producto_barcodes verificada/creada');
    } catch (err) {
        console.error('⚠️  Error al crear tabla producto_barcodes:', err.message);
    }
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
