// ================================================================
// API BACKEND - INVENTARIO CON AUTENTICACIÓN (MODULAR v2.0)
// Node.js + Express + PostgreSQL (Aiven)
// Todo en un solo archivo - organizado por secciones
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

app.use(cors({
    origin: [
        'https://jmayans1984.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa']
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
            `SELECT codigo, nombre FROM grupo_productos ORDER BY nombre`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error GET /api/almacen/grupo-productos:', error);
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
                   p.descripcion
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
            `SELECT codigo, nombre FROM ccostos WHERE empresa = $1 ORDER BY nombre`,
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
            // Para TRASLADO verificamos el ccOrigen con tipo SALIDA POR TRASLADO
            const dupRes = await client.query(
                `SELECT COUNT(*) AS cnt FROM detalle_inventario
                 WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4`,
                [fecha, ccOrigen, emp, mapa.origen]
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

// ── FIN GESTIÓN DE INVENTARIO ─────────────────────────────────────

// ── AJUSTE DE INVENTARIO (TOMA FÍSICA) ──────────────────────────

// GET /api/almacen/ajuste-inventario/stock
// Devuelve todos los productos con control='SI' y su stock actual en ese CC
app.get('/api/almacen/ajuste-inventario/stock', async (req, res) => {
    const { empresa, ccosto } = req.query;
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

        // Bodega maestra → control = 'SI' (activo) | Punto de venta → visible_operacional = 'SI'
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

// POST /api/almacen/ajuste-inventario
// Guarda los ajustes en detalle_inventario
app.post('/api/almacen/ajuste-inventario', async (req, res) => {
    const { empresa, fecha, ccosto, observaciones, ajustes, mode } = req.body;
    // ajustes: [{ codigo, diferencia }]  diferencia = fisico - actual
    // mode: 'new' | 'replace' | 'add'

    if (!empresa || !fecha || !ccosto || !ajustes || ajustes.length === 0) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios' });
    }

    const emp = parseInt(empresa);
    const obs = (observaciones || '').trim().toUpperCase();
    const TIPO = 'AJUSTE DE INVENTARIO';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Detectar conflicto (modo 'new')
        if (!mode || mode === 'new') {
            const dup = await client.query(
                `SELECT COUNT(*) AS cnt FROM detalle_inventario
                 WHERE fecha=$1 AND ccosto=$2 AND empresa=$3 AND tipo=$4`,
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

        // Insertar ajustes
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

        await client.query('COMMIT');

        // Generar notificaciones de stock para cada producto ajustado
        for (const aj of ajustes) {
            if (aj.codigo) {
                await verificarYGenerarNotificacionesStock(aj.codigo, ccosto, empresa);
            }
        }

        res.json({ success: true, registros });
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
        const nextNum = numRes.rows[0].next_num || 1;
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
            concepto || '',
            beneficia || '',
            cheque || '',
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
                concepto || '',
                beneficia || '',
                cheque || '',
                egresoVal,  // Lo que egresa de origen es ingreso en destino
                ingresoVal,
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
        await client.query('ROLLBACK');
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

        // 7. Insertar factura_venta
        await client.query(
            `INSERT INTO factura_venta
             (codigo, fecha, cliente, orden_compra, subtotal, impuestos, total, estado, observaciones, fecha_vencimiento, valor_pagado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', $8, $9, 0)`,
            [codigoFactura, fechaHoy, orden.cliente, codigo, subtotal, impuestos, total,
             orden.observaciones || '', fechaVencimiento]
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
        const empresaActivaFact = req.headers['x-empresa'] || String(orden.empresa);
        const empResFact = await client.query(
            `SELECT bodega_maestra FROM empresas WHERE codigo::text = $1`,
            [String(empresaActivaFact)]
        );
        const bodegaMaestraFact = empResFact.rows[0]?.bodega_maestra;
        const fechaDescarga = new Date().toISOString().split('T')[0];

        if (bodegaMaestraFact) {
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

// GET /api/contabilidad/proveedores/:codigo - Obtener un proveedor
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

// GET /api/contabilidad/proveedores/proximo-codigo
app.get('/api/contabilidad/proveedores/proximo-codigo', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        const result = await pool.query(
            `SELECT codigo FROM proveedores WHERE empresa = $1 ORDER BY codigo DESC`,
            [empresa]
        );
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

        const query = `
            INSERT INTO proveedores (codigo, nombre, direccion, telefono1, departamen, empresa)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING codigo, nombre, direccion, telefono1, departamen, empresa
        `;

        const result = await pool.query(query, [
            codigo || null,
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
            `SELECT codigo, nombre, empresa, square_location_id
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
            `SELECT codigo, nombre, empresa, square_location_id
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
            `INSERT INTO ccostos (codigo, nombre, empresa, square_location_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
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
        const { nombre, empresa, square_location_id } = req.body;
        if (!nombre) return res.status(400).json({ success: false, error: 'nombre es requerido' });

        const result = await pool.query(
            `UPDATE ccostos SET nombre = $1, square_location_id = $2
             WHERE codigo = $3 AND empresa = $4 RETURNING *`,
            [nombre.trim(), square_location_id || '', codigo, empresa]
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
        'cta_egresos_propinas', 'tipo_moviban_ventas', 'cuenta_efectivo'
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

        const movibanRecords = [
            { concepto: `VENTAS EFECTIVO - ${nombreCcosto}`, ingreso: valorEfectivo, banco: ctaEfectivo || null },
            { concepto: `VENTAS TARJETA - ${nombreCcosto}`,  ingreso: valorTarjeta,  banco: ctaSquare  || null },
            { concepto: `VENTAS OTROS - ${nombreCcosto}`,    ingreso: valorOtros,    banco: ctaOtros   || null },
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

app.get('/api/produccion/productos-venta', async (req, res) => {
    const { grupo, control } = req.query;
    try {
        const params = [];
        const conds = [];
        if (grupo) { params.push(grupo); conds.push(`pv.grupo = $${params.length}`); }
        if (control) { params.push(control.toUpperCase()); conds.push(`UPPER(pv.control) = $${params.length}`); }
        const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
        const r = await pool.query(
            `SELECT pv.codigo, pv.nombre, pv.descripcion, pv.unidad, pv.grupo,
                    gpv.nombre AS grupo_nombre, pv.precio_costo,
                    pv.precio_venta1, pv.precio_venta2, pv.precio_venta3,
                    COALESCE(pv.stock_minimo, 0) AS stock_minimo,
                    COALESCE(pv.activo, 'SI') AS activo,
                    COALESCE(pv.control, 'SI') AS control
             FROM productos_venta pv
             LEFT JOIN grupo_productos_venta gpv ON gpv.codigo = pv.grupo
             ${where} ORDER BY pv.grupo, pv.nombre`,
            params
        );
        res.json({ success: true, data: r.rows });
    } catch (e) {
        console.error('Error GET /api/produccion/productos-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/produccion/productos-venta', async (req, res) => {
    const { codigo, nombre, descripcion, unidad, grupo, precio_costo,
            precio_venta1, precio_venta2, precio_venta3, stock_minimo, control } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ success: false, error: 'codigo y nombre son requeridos' });
    try {
        await pool.query(
            `INSERT INTO productos_venta
               (codigo, nombre, descripcion, unidad, grupo, precio_costo,
                precio_venta1, precio_venta2, precio_venta3, stock_minimo, control)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [codigo.toUpperCase(), nombre, descripcion || '', unidad || 'UND',
             grupo || null, parseFloat(precio_costo) || 0,
             parseFloat(precio_venta1) || 0, parseFloat(precio_venta2) || 0,
             parseFloat(precio_venta3) || 0, parseFloat(stock_minimo) || 0,
             control || 'SI']
        );
        const r = await pool.query(
            `SELECT pv.codigo, pv.nombre, pv.descripcion, pv.unidad, pv.grupo,
                    gpv.nombre AS grupo_nombre, pv.precio_costo,
                    pv.precio_venta1, pv.precio_venta2, pv.precio_venta3, pv.control
             FROM productos_venta pv
             LEFT JOIN grupo_productos_venta gpv ON gpv.codigo = pv.grupo
             WHERE pv.codigo = $1`,
            [codigo.toUpperCase()]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, error: 'El código ya existe' });
        console.error('Error POST /api/produccion/productos-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/produccion/productos-venta/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, descripcion, unidad, grupo, precio_costo,
            precio_venta1, precio_venta2, precio_venta3, stock_minimo, control } = req.body;
    try {
        await pool.query(
            `UPDATE productos_venta SET nombre=$1, descripcion=$2, unidad=$3, grupo=$4,
             precio_costo=$5, precio_venta1=$6, precio_venta2=$7, precio_venta3=$8,
             stock_minimo=$9, control=$10
             WHERE codigo=$11`,
            [nombre, descripcion || '', unidad || 'UND', grupo || null,
             parseFloat(precio_costo) || 0, parseFloat(precio_venta1) || 0,
             parseFloat(precio_venta2) || 0, parseFloat(precio_venta3) || 0,
             parseFloat(stock_minimo) || 0, control || 'SI', codigo]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Error PUT /api/produccion/productos-venta:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/produccion/productos-venta/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        await pool.query(`DELETE FROM productos_venta WHERE codigo = $1`, [codigo]);
        res.json({ success: true });
    } catch (e) {
        console.error('Error DELETE /api/produccion/productos-venta:', e);
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

// POST /api/produccion/productos-venta/recalcular-precios
// Recalcula los 3 niveles de precio en una sola operación
// Body: { lista_id_1, lista_id_2, lista_id_3 } (cualquiera puede ser null = no actualizar)
app.post('/api/produccion/productos-venta/recalcular-precios', async (req, res) => {
    const { lista_id_1, lista_id_2, lista_id_3 } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let actualizados = 0;
        const detalle = [];

        for (const [nivel, listaId] of [[1, lista_id_1], [2, lista_id_2], [3, lista_id_3]]) {
            if (!listaId) continue;
            const cfg = await client.query(
                `SELECT margen, nivel, lista FROM config_listas_precios WHERE id=$1`,
                [parseInt(listaId)]
            );
            if (!cfg.rows.length) continue;
            const { margen, lista } = cfg.rows[0];
            const m = parseFloat(margen) || 0;
            if (m <= 0 || m >= 1) continue;

            const campo = `precio_venta${nivel}`;
            const r = await client.query(
                `UPDATE productos_venta
                 SET ${campo} = ROUND(precio_costo / (1.0 - $1::numeric), 2)
                 WHERE precio_costo > 0
                 RETURNING codigo`,
                [m]
            );
            actualizados = Math.max(actualizados, r.rowCount);
            detalle.push({ nivel, campo, lista, margen: m, actualizados: r.rowCount });
        }

        await client.query('COMMIT');
        res.json({ success: true, actualizados, detalle });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/produccion/productos-venta/recalcular-precios:', e);
        res.status(500).json({ success: false, error: e.message });
    } finally { client.release(); }
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
    try {
        const result = await pool.query(`
            SELECT a.codigo, a.nombre, a.und,
                   COALESCE(a.valor, 0)             AS valor,
                   COALESCE(a.grupo, '')             AS grupo,
                   COALESCE(ga.nombre, a.grupo, '')  AS grupo_nombre,
                   COALESCE(a.prod_propio, '')        AS prod_propio,
                   (SELECT COUNT(DISTINCT dr.receta) FROM detalle_recetas dr
                    WHERE TRIM(dr.articulo) = TRIM(a.codigo))::int AS num_recetas
            FROM articulos a
            LEFT JOIN grupo_articulos ga ON ga.codigo = a.grupo
            ORDER BY ga.nombre NULLS LAST, a.nombre
        `);
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
            result = await pool.query(`
                INSERT INTO articulos (nombre, und, valor, grupo)
                VALUES ($1,$2,$3,$4) RETURNING *
            `, [nombre.trim(), und || 'UND', parseFloat(valor) || 0, grupo || null]);
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
    try {
        let sql = `
            SELECT r.codigo,
                   r.nombre,
                   COALESCE(r.grupo_receta, '')          AS grupo_receta,
                   COALESCE(gr.nombre, r.grupo_receta, '') AS grupo_nombre,
                   COALESCE(r.subproducto, '')            AS subproducto,
                   COALESCE(r.und, '')                    AS und,
                   COALESCE(r.valor, 0)                   AS valor,
                   COALESCE(r.precio_venta, 0)            AS precio_venta,
                   COALESCE((SELECT COUNT(*) FROM detalle_recetas dr WHERE dr.receta = r.codigo), 0) AS num_ingredientes,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((COALESCE(r.valor, 0) / r.precio_venta * 100)::numeric, 1)
                        ELSE 0 END AS porcentaje_costo
            FROM recetas r
            LEFT JOIN grupo_recetas gr ON gr.codigo = r.grupo_receta
        `;
        const params = [];
        if (grupo && grupo !== 'TODOS') {
            sql += ' WHERE r.grupo_receta = $1';
            params.push(grupo);
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
    try {
        const [recetaRes, detalleRes] = await Promise.all([
            pool.query(`
                SELECT r.codigo, r.nombre,
                       COALESCE(r.grupo_receta, '') AS grupo_receta,
                       COALESCE(r.subproducto, '')  AS subproducto,
                       COALESCE(r.und, '')           AS und,
                       COALESCE(r.valor, 0)          AS valor,
                       COALESCE(r.precio_venta, 0)   AS precio_venta
                FROM recetas r WHERE r.codigo = $1
            `, [codigo]),
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
                       COALESCE(r2.valor, a.valor, 0) AS precio_unit,
                       COALESCE(dr.vr_unit, r2.valor, a.valor, 0) AS vr_unit,
                       COALESCE(dr.vr_total,
                         (COALESCE(r2.valor, a.valor, 0)) * dr.cantidad
                       ) AS vr_total,
                       CASE WHEN r2.codigo IS NOT NULL THEN true ELSE false END AS es_subreceta,
                       r2.codigo AS subreceta_codigo
                FROM detalle_recetas dr
                -- Buscar si el artículo existe como subproducto (receta con subproducto=SI)
                LEFT JOIN recetas r2 ON TRIM(r2.codigo) = TRIM(dr.articulo) AND r2.subproducto = 'SI'
                -- Buscar en artículos solo si NO es subproducto
                LEFT JOIN articulos a ON TRIM(a.codigo) = TRIM(dr.articulo) AND r2.codigo IS NULL
                WHERE dr.receta = $1
                ORDER BY dr.codigo
            `, [codigo])
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

// POST /api/recetas/:codigo/calcular-costo - Calcular costo de una receta (RECURSIVO con jerárquico)
app.post('/api/recetas/:codigo/calcular-costo', async (req, res) => {
    const { codigo } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Función recursiva para calcular costo expandiendo subrecetas
        async function calcularCostoRecursivo(recetaCod) {
            const detalleRes = await client.query(`
                SELECT dr.codigo, dr.articulo, dr.cantidad, COALESCE(dr.tipo, 'ARTICULO') AS tipo
                FROM detalle_recetas dr
                WHERE dr.receta = $1
            `, [recetaCod]);

            let costoTotal = 0;
            for (const det of detalleRes.rows) {
                let precio = 0;
                if (det.tipo === 'ARTICULO') {
                    // Obtener precio del artículo
                    const artRes = await client.query('SELECT valor FROM articulos WHERE codigo = $1', [det.articulo]);
                    precio = artRes.rows.length > 0 ? parseFloat(artRes.rows[0].valor) || 0 : 0;
                } else if (det.tipo === 'RECETA') {
                    // Obtener costo de la receta (ya calculado)
                    const recRes = await client.query('SELECT valor FROM recetas WHERE codigo = $1', [det.articulo]);
                    precio = recRes.rows.length > 0 ? parseFloat(recRes.rows[0].valor) || 0 : 0;
                }
                costoTotal += precio * parseFloat(det.cantidad);
                // Actualizar vr_unit y vr_total en detalle
                await client.query(`
                    UPDATE detalle_recetas SET vr_unit = $1, vr_total = $2
                    WHERE codigo = $3
                `, [precio, precio * parseFloat(det.cantidad), det.codigo]);
            }
            return costoTotal;
        }

        const costoTotal = await calcularCostoRecursivo(codigo);

        // Guardar costo en recetas.valor
        await client.query('UPDATE recetas SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);

        // Si es subproducto → actualizar su precio en articulos
        const subpRes = await client.query('SELECT subproducto FROM recetas WHERE codigo = $1', [codigo]);
        if (subpRes.rowCount > 0 && subpRes.rows[0].subproducto === 'SI') {
            await client.query('UPDATE articulos SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
        }

        await client.query('COMMIT');
        res.json({ success: true, costo: costoTotal });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/recetas/:codigo/calcular-costo:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/recetas/recalcular-todos - 3 pasadas: directas → subrecetas → finales (jerárquico)
app.post('/api/recetas/recalcular-todos', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const recetasRes = await client.query(
            `SELECT codigo, subproducto FROM recetas ORDER BY nombre`
        );
        const recetas = recetasRes.rows;
        const resultados = [];

        // Función para calcular costo recursivo
        async function calcularCosto(codigo, subproducto) {
            const detalleRes = await client.query(`
                SELECT dr.codigo, dr.articulo, dr.cantidad, COALESCE(dr.tipo, 'ARTICULO') AS tipo
                FROM detalle_recetas dr
                WHERE dr.receta = $1
            `, [codigo]);

            let costoTotal = 0;
            for (const det of detalleRes.rows) {
                let precio = 0;
                if (det.tipo === 'ARTICULO') {
                    const artRes = await client.query('SELECT valor FROM articulos WHERE codigo = $1', [det.articulo]);
                    precio = artRes.rows.length > 0 ? parseFloat(artRes.rows[0].valor) || 0 : 0;
                } else if (det.tipo === 'RECETA') {
                    const recRes = await client.query('SELECT valor FROM recetas WHERE codigo = $1', [det.articulo]);
                    precio = recRes.rows.length > 0 ? parseFloat(recRes.rows[0].valor) || 0 : 0;
                }
                costoTotal += precio * parseFloat(det.cantidad);
                await client.query(
                    'UPDATE detalle_recetas SET vr_unit = $1, vr_total = $2 WHERE codigo = $3',
                    [precio, precio * parseFloat(det.cantidad), det.codigo]
                );
            }

            await client.query('UPDATE recetas SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
            if (subproducto === 'SI') {
                await client.query('UPDATE articulos SET valor = $1 WHERE codigo = $2', [costoTotal, codigo]);
            }
            return { codigo, costo: costoTotal };
        }

        // Pasada 1: Recetas que SOLO usan artículos directos (sin subrecetas como ingredientes)
        for (const r of recetas) {
            const usaSubrecs = await client.query(
                `SELECT COUNT(*) AS cnt FROM detalle_recetas WHERE receta = $1 AND tipo = 'RECETA'`,
                [r.codigo]
            );
            if (parseInt(usaSubrecs.rows[0].cnt) === 0) {
                resultados.push(await calcularCosto(r.codigo, r.subproducto));
            }
        }

        // Pasada 2: Subrecetas (pueden usar otras subrecetas pero están marcadas como SI)
        for (const r of recetas) {
            if (r.subproducto === 'SI') {
                const yaCalc = resultados.find(x => x.codigo === r.codigo);
                if (!yaCalc) resultados.push(await calcularCosto(r.codigo, r.subproducto));
            }
        }

        // Pasada 3: El resto (recetas finales que ya ven todos los precios actualizados)
        for (const r of recetas) {
            const yaCalc = resultados.find(x => x.codigo === r.codigo);
            if (!yaCalc) resultados.push(await calcularCosto(r.codigo, r.subproducto));
        }

        await client.query('COMMIT');
        res.json({ success: true, recalculadas: resultados.length, detalle: resultados });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/recetas/recalcular-todos:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/recetas-reporte/costos - Reporte de costos
app.get('/api/recetas-reporte/costos', async (req, res) => {
    const { grupo, subproducto } = req.query;
    try {
        let sql = `
            SELECT r.codigo,
                   r.nombre,
                   COALESCE(r.grupo_receta, '') AS grupo_receta,
                   COALESCE(r.subproducto, '')  AS subproducto,
                   COALESCE(r.und, '')           AS und,
                   COALESCE(r.precio_venta, 0)   AS precio_venta,
                   COALESCE(r.valor, 0)           AS costo,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((COALESCE(r.valor,0) / r.precio_venta * 100)::numeric, 2)
                        ELSE 0 END               AS porcentaje_costo,
                   CASE WHEN COALESCE(r.precio_venta, 0) > 0
                        THEN ROUND((r.precio_venta - COALESCE(r.valor,0))::numeric, 2)
                        ELSE 0 END               AS margen,
                   (SELECT COUNT(*) FROM detalle_recetas dr WHERE dr.receta = r.codigo) AS num_ingredientes
            FROM recetas r
        `;
        const params = [];
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
        console.log('✅ Tabla permisos_modulos lista');
    } catch (err) {
        console.error('❌ Error creando tabla permisos_modulos:', err.message);
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

// GET /api/permisos-modulos/:empresa — retorna rutas deshabilitadas para una empresa
app.get('/api/permisos-modulos/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const result = await pool.query(
            'SELECT rutas_deshabilitadas FROM permisos_modulos WHERE empresa = $1',
            [empresa]
        );
        if (result.rows.length === 0) {
            return res.json({ success: true, data: { rutas_deshabilitadas: [] } });
        }
        const raw = result.rows[0].rutas_deshabilitadas;
        const rutas = typeof raw === 'string' ? JSON.parse(raw || '[]') : (Array.isArray(raw) ? raw : []);
        res.json({ success: true, data: { rutas_deshabilitadas: rutas } });
    } catch (error) {
        console.error('Error GET /api/permisos-modulos/:empresa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/permisos-modulos/:empresa — upsert manual
app.put('/api/permisos-modulos/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const { rutas_deshabilitadas } = req.body;
        const json = JSON.stringify(Array.isArray(rutas_deshabilitadas) ? rutas_deshabilitadas : []);

        const check = await pool.query('SELECT empresa FROM permisos_modulos WHERE empresa = $1', [empresa]);
        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE permisos_modulos SET rutas_deshabilitadas = $1 WHERE empresa = $2',
                [json, empresa]
            );
        } else {
            await pool.query(
                'INSERT INTO permisos_modulos (empresa, rutas_deshabilitadas) VALUES ($1, $2)',
                [empresa, json]
            );
        }
        res.json({ success: true, message: 'Permisos guardados correctamente' });
    } catch (error) {
        console.error('Error PUT /api/permisos-modulos/:empresa:', error);
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

// ── Cálculo de Federal Income Tax (IRS Percentage Method 2024) ──
function calcularFederalIncomeTax(brutoAnualizado, filingStatus) {
    if (!filingStatus || filingStatus === 'EXEMPT') return 0;
    // Standard deductions 2024
    const stdDeductions = {
        'SINGLE': 14600, 'HEAD_OF_HOUSEHOLD': 21900,
        'MARRIED_JOINTLY': 29200, 'MARRIED_SEPARATELY': 14600
    };
    const deduccion = stdDeductions[filingStatus] || 14600;
    const taxableIncome = Math.max(0, brutoAnualizado - deduccion);

    // Tax brackets 2024 — Single & Married Separately
    const bracketsSingle = [
        [0, 11600, 0.10, 0],
        [11600, 47150, 0.12, 1160],
        [47150, 100525, 0.22, 5426],
        [100525, 191950, 0.24, 17168.50],
        [191950, 243725, 0.32, 39110.50],
        [243725, 609350, 0.35, 55678.50],
        [609350, Infinity, 0.37, 183647.25]
    ];
    // MFJ brackets (approximately double)
    const bracketsMFJ = [
        [0, 23200, 0.10, 0],
        [23200, 94300, 0.12, 2320],
        [94300, 201050, 0.22, 10852],
        [201050, 383900, 0.24, 34337],
        [383900, 487450, 0.32, 78221],
        [487450, 731200, 0.35, 111357],
        [731200, Infinity, 0.37, 196669.50]
    ];
    const bracketsHoH = [
        [0, 16550, 0.10, 0],
        [16550, 63100, 0.12, 1655],
        [63100, 100500, 0.22, 7241],
        [100500, 191950, 0.24, 15469],
        [191950, 243700, 0.32, 37417],
        [243700, 609350, 0.35, 54951],
        [609350, Infinity, 0.37, 183254.75]
    ];
    let brackets = bracketsSingle;
    if (filingStatus === 'MARRIED_JOINTLY') brackets = bracketsMFJ;
    else if (filingStatus === 'HEAD_OF_HOUSEHOLD') brackets = bracketsHoH;

    let taxAnual = 0;
    for (const [low, high, rate, baseTax] of brackets) {
        if (taxableIncome > low) {
            const amt = Math.min(taxableIncome, high) - low;
            taxAnual = baseTax + amt * rate;
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
        const taxAnual = calcularFederalIncomeTax(adj, empleado.w4_filing_status || 'SINGLE');
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
             ssn,permiso_trabajo,fecha_vencimiento_permiso,w4_filing_status,w4_claim_dependents,
             w4_extra_withholding,w4_exempt,wc_rate,wc_code,notas,
             tipo_pago,valor_dia,excluir_wc)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
             RETURNING id`,
            [d.empresa,d.nombre,d.apellido,d.fecha_nacimiento||null,d.email,d.telefono,
             d.direccion,d.ciudad,d.estado_residencia,d.zipcode,
             d.cargo_id||null,d.ccosto,d.fecha_ingreso,d.estado||'ACTIVO',
             d.tipo_empleado||'W2',d.tipo_contrato||'FULL_TIME',d.empresa_contratista,
             d.es_por_horas!==false,d.valor_hora||null,d.monto_fijo_semanal||null,
             d.frecuencia_pago||'WEEKLY',d.ssn,d.permiso_trabajo,d.fecha_vencimiento_permiso||null,
             d.w4_filing_status||'SINGLE',d.w4_claim_dependents||0,
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
             w4_filing_status=$23,w4_claim_dependents=$24,w4_extra_withholding=$25,w4_exempt=$26,
             wc_rate=$27,wc_code=$28,notas=$29,fecha_retiro=$30,motivo_retiro=$31,
             tipo_pago=$32,valor_dia=$33,excluir_wc=$34,
             updated_at=NOW()
             WHERE id=$35`,
            [d.nombre,d.apellido,d.fecha_nacimiento||null,d.email,d.telefono,
             d.direccion,d.ciudad,d.estado_residencia,d.zipcode,
             d.cargo_id||null,d.ccosto,d.estado,d.tipo_empleado,d.tipo_contrato,
             d.empresa_contratista,d.es_por_horas!==false,d.valor_hora||null,
             d.monto_fijo_semanal||null,d.frecuencia_pago||'WEEKLY',d.ssn,d.permiso_trabajo,
             d.fecha_vencimiento_permiso||null,d.w4_filing_status||'SINGLE',
             d.w4_claim_dependents||0,d.w4_extra_withholding||0,d.w4_exempt||false,
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
            cuenta_nomina:''
        }});
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/nomina/config-fiscal', async (req, res) => {
    const d = req.body;
    try {
        await pool.query(
            `INSERT INTO nom_config_fiscal (empresa,anio,ss_rate,ss_wage_base,medicare_rate,
             medicare_adicional_rate,medicare_adicional_threshold,futa_rate,futa_wage_base,
             suta_rate,suta_wage_base,ot_threshold_hours,ot_multiplier,fl_min_wage,wc_default_rate,cuenta_nomina)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (empresa,anio) DO UPDATE SET
             ss_rate=$3,ss_wage_base=$4,medicare_rate=$5,medicare_adicional_rate=$6,
             medicare_adicional_threshold=$7,futa_rate=$8,futa_wage_base=$9,
             suta_rate=$10,suta_wage_base=$11,ot_threshold_hours=$12,ot_multiplier=$13,
             fl_min_wage=$14,wc_default_rate=$15,cuenta_nomina=$16`,
            [d.empresa,d.anio,d.ss_rate,d.ss_wage_base,d.medicare_rate,
             d.medicare_adicional_rate,d.medicare_adicional_threshold,
             d.futa_rate,d.futa_wage_base,d.suta_rate,d.suta_wage_base,
             d.ot_threshold_hours,d.ot_multiplier,d.fl_min_wage,d.wc_default_rate,
             d.cuenta_nomina||'']
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
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
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
