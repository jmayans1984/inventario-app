// ================================================================
// API BACKEND - INVENTARIO CON AUTENTICACIÓN
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
// RUTAS - AUTENTICACIÓN
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
        // Buscar usuario
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
        
        // Usuario encontrado - obtener todas sus empresas
        const empresasQuery = `
            SELECT DISTINCT u.empresa, e.nombre as empresa_nombre
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
// RUTAS - CENTROS DE COSTO
// ================================================================

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
        
        // Intentar obtener tipo si existe la columna
        let tipo = 'CLIENTE'; // Default
        try {
            const tipoQuery = `
                SELECT tipo
                FROM empresas
                WHERE codigo = $1
            `;
            const tipoResult = await pool.query(tipoQuery, [empresa]);
            if (tipoResult.rows.length > 0 && tipoResult.rows[0].tipo) {
                tipo = tipoResult.rows[0].tipo;
            }
        } catch (e) {
            // Si no existe la columna tipo, usar default
            console.log('Campo tipo no existe en empresas, usando CLIENTE por defecto');
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

// ================================================================
// RUTAS - INVENTARIO
// ================================================================

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
                p.grupo,
                gp.codigo as grupo_codigo,
                gp.nombre as grupo_nombre,
                SUM(COALESCE(di.entrada, 0)) as total_entradas,
                SUM(COALESCE(di.salida, 0)) as total_salidas,
                SUM(COALESCE(di.entrada, 0)) - SUM(COALESCE(di.salida, 0)) as stock_actual,
                COUNT(*) as movimientos
            FROM detalle_inventario di
            INNER JOIN productos p ON di.codigo = p.codigo
            LEFT JOIN grupo_productos gp ON p.grupo = gp.codigo
            WHERE di.empresa = $1
            AND UPPER(p.control) = 'SI'
        `;
        
        const params = [empresa];
        
        if (ccosto) {
            params.push(ccosto);
            query += ` AND di.ccosto = $2`;
        }
        
        query += `
            GROUP BY p.codigo, p.nombre, p.und, p.grupo, gp.codigo, gp.nombre
            HAVING SUM(COALESCE(di.entrada, 0)) - SUM(COALESCE(di.salida, 0)) <> 0
            ORDER BY gp.codigo, p.nombre
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
            AND UPPER(p.control) = 'SI'
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

// POST /api/inventario/movimientos - Guardar movimientos de inventario
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
// RUTAS - TESORERÍA
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
            SELECT codigo, nombre_banco, nombre_cta, tipo_cuenta
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
        // Calcular saldo inicial (antes de fecha_inicial)
        const saldoInicialQuery = `
            SELECT COALESCE(SUM(ingreso), 0) - COALESCE(SUM(egreso), 0) as saldo
            FROM moviban
            WHERE empresa = $1
            AND banco = $2
            AND fecha < $3
        `;
        
        const saldoInicialResult = await pool.query(saldoInicialQuery, [empresa, cuenta, fecha_inicial]);
        const saldoInicial = parseFloat(saldoInicialResult.rows[0].saldo || 0);
        
        // Obtener movimientos del período
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
        
        // Calcular totales
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
        
        // Obtener consecutivo
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
            // INGRESO
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
            // EGRESO
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
            // TRANSFERENCIA - 2 registros
            
            // 1. EGRESO de cuenta origen
            const queryEgreso = `
                INSERT INTO moviban 
                (tipo, numero, fecha, concepto, cheque, ingreso, egreso, banco, conciliado, empresa, gasto, beneficia, origen, ccosto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            
            await client.query(queryEgreso, [
                tipo, numero, fecha, concepto, null, 0, valor, cuenta_origen, 'NO', empresa, null, null, null, null
            ]);
            
            // 2. INGRESO a cuenta destino (mismo número)
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

// GET /api/facturas-compra - Obtener facturas de compra (cliente)
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
        
        // Filtro de estado
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

// GET /api/facturas-compra/detalle - Obtener detalle de una factura
app.get('/api/facturas-compra/detalle', async (req, res) => {
    const { factura } = req.query;
    
    if (!factura) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro factura requerido'
        });
    }
    
    try {
        // Obtener datos de la factura
        const facturaQuery = `
            SELECT *
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
        
        // Obtener detalle con nombres de productos
        const detalleQuery = `
            SELECT 
                d.id,
                d.factura,
                d.producto_venta,
                pv.nombre as producto_nombre,
                d.cantidad,
                d.precio_unitario,
                d.subtotal
            FROM detalle_factura_venta d
            LEFT JOIN productos_venta pv ON d.producto_venta = pv.codigo
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

// GET /api/facturas-compra/detalle - Obtener detalle de factura de compra
app.get('/api/facturas-compra/detalle', async (req, res) => {
    const { factura } = req.query;
    
    if (!factura) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro factura requerido'
        });
    }
    
    try {
        // Obtener encabezado de factura
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
        
        // Obtener detalle de factura con nombres de productos
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
        
        // Extraer extensión del archivo
        const extension = nombre_archivo.split('.').pop().toLowerCase();
        const tipoArchivo = `.${extension}`;
        
        // Extraer el base64 puro (sin el prefijo data:image/jpeg;base64,)
        let base64Puro = archivo_base64;
        if (archivo_base64.includes('base64,')) {
            base64Puro = archivo_base64.split('base64,')[1];
        }
        
        // Convertir base64 a Buffer para BYTEA
        const buffer = Buffer.from(base64Puro, 'base64');
        
        // Insertar soporte de pago con BYTEA
        const insertQuery = `
            INSERT INTO soportes_pago (pago, nombre_archivo, archivo_data, tipo_archivo, fecha_subida)
            VALUES ($1, $2, $3, $4, NOW())
        `;
        
        await client.query(insertQuery, [factura, nombre_archivo, buffer, tipoArchivo]);
        
        // Actualizar estado de factura a POR VERIFICAR
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
        
        // Convertir BYTEA a base64
        let archivoBase64 = '';
        if (soporte.archivo_data) {
            // Si es un Buffer (BYTEA), convertir a base64
            if (Buffer.isBuffer(soporte.archivo_data)) {
                archivoBase64 = `data:image/jpeg;base64,${soporte.archivo_data.toString('base64')}`;
            } else {
                // Si ya es string, solo agregar prefijo si no lo tiene
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
// MÓDULO GASTOS
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

// GET /api/gastos/ccostos - Obtener centros de costo
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

// GET /api/gastos/cuentas-bancarias - Obtener cuentas bancarias
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

// GET /api/gastos/siguiente-codigo - Generar siguiente código de gasto
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

// POST /api/gastos/crear - Crear gasto y movimiento bancario
app.post('/api/gastos/crear', async (req, res) => {
    const { fecha, proveedor, cuenta, factura, subtotal, impuestos, total, ccosto, forma_pago, codigo_banco, empresa } = req.body;
    const concepto = req.body.concepto || ''; // Puede estar vacío
    
    if (!fecha || !proveedor || !cuenta || !ccosto || !forma_pago || !codigo_banco) {
        return res.status(400).json({
            success: false,
            error: 'Faltan campos obligatorios'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Generar código de gasto
        const codigoQuery = `
            SELECT COALESCE(MAX(CAST(codigo AS BIGINT)), 0) + 1 as siguiente
            FROM gastos
            WHERE empresa = $1
        `;
        const codigoResult = await client.query(codigoQuery, [empresa]);
        const codigoGasto = codigoResult.rows[0].siguiente.toString().padStart(10, '0');
        
        // 2. Insertar gasto
        const insertGastoQuery = `
            INSERT INTO gastos (codigo, fecha, proveedor, concepto, cuenta, factura, subtotal, impuestos, total, ccosto, forma_pago, estado, empresa)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDIENTE', $12)
        `;
        
        await client.query(insertGastoQuery, [
            codigoGasto, fecha, proveedor, concepto, cuenta, factura, 
            subtotal, impuestos, total, ccosto, forma_pago, empresa
        ]);
        
        // 3. Generar número de movimiento bancario
        const numeroQuery = `
            SELECT COALESCE(MAX(CAST(numero AS BIGINT)), 0) + 1 as siguiente
            FROM moviban
            WHERE empresa = $1
        `;
        const numeroResult = await client.query(numeroQuery, [empresa]);
        const numeroMovimiento = numeroResult.rows[0].siguiente.toString().padStart(10, '0');
        
        // 4. Insertar movimiento bancario
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

// ================================================================
// GET /api/gastos/reporte - Obtener reporte de gastos filtrado
// ================================================================

app.get('/api/gastos/reporte', async (req, res) => {
    const { empresa, fechaInicial, fechaFinal, centroCosto, cuentaContable } = req.query;
    
    if (!empresa || !fechaInicial || !fechaFinal) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros obligatorios'
        });
    }
    
    try {
        let query = `
            SELECT 
                g.codigo,
                g.fecha,
                g.proveedor,
                p.nombre as proveedor_nombre,
                g.concepto,
                g.cuenta,
                cu.cuenta as cuenta_nombre,
                g.factura,
                g.subtotal,
                g.impuestos,
                g.total,
                g.ccosto,
                cc.nombre as ccosto_nombre,
                g.forma_pago,
                cb.nombre_cta as forma_pago_nombre,
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
        
        if (centroCosto) {
            query += ` AND g.ccosto = $${paramIndex}`;
            params.push(centroCosto);
            paramIndex++;
        }
        
        if (cuentaContable) {
            query += ` AND g.cuenta = $${paramIndex}`;
            params.push(cuentaContable);
            paramIndex++;
        }
        
        query += ' ORDER BY g.fecha ASC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            gastos: result.rows
        });
        
    } catch (error) {
        console.error('Error en /api/gastos/reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener reporte',
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

// ================================================================
// RUTAS - ÓRDENES DE COMPRA Y RECEPCIÓN
// ================================================================

// POST /api/ordenes-compra - Crear nueva orden de compra
app.post('/api/ordenes-compra', async (req, res) => {
    const { empresa, fecha, dias_credito, observaciones, total, productos } = req.body;
    
    if (!empresa || !fecha || !productos || productos.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Faltan datos obligatorios'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Generar consecutivo por empresa: OC-{empresa}-00001, OC-{empresa}-00002, etc.
        const maxQuery = await client.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM LENGTH($1) + 5) AS INT)), 0) + 1 as siguiente
             FROM ordenes_compra 
             WHERE codigo LIKE $2`,
            [`OC-${empresa}`, `OC-${empresa}-%`]
        );
        
        const siguiente = maxQuery.rows[0].siguiente;
        const codigo = `OC-${empresa}-${String(siguiente).padStart(5, '0')}`;
        
        console.log(`Generando orden para empresa ${empresa}: ${codigo}`);
        
        // Insertar orden
        await client.query(
            `INSERT INTO ordenes_compra (codigo, fecha, empresa, dias_credito, observaciones, total, estado)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE')`,
            [codigo, fecha, empresa, dias_credito, observaciones || null, total]
        );
        
        // Insertar detalle
        for (const producto of productos) {
            await client.query(
                `INSERT INTO detalle_ordenes (orden, producto_venta, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [codigo, producto.producto_venta, producto.cantidad, producto.precio_unitario, producto.subtotal]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            codigo: codigo,
            message: 'Orden creada exitosamente'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando orden:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear orden de compra'
        });
    } finally {
        client.release();
    }
});

// PUT /api/ordenes-compra/:codigo - Editar orden de compra
app.put('/api/ordenes-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { empresa, fecha, dias_credito, observaciones, total, productos } = req.body;
    
    if (!empresa || !fecha || !productos || productos.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Faltan datos obligatorios'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Verificar que esté PENDIENTE
        const estadoQuery = await client.query(
            'SELECT estado FROM ordenes_compra WHERE codigo = $1',
            [codigo]
        );
        
        if (estadoQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada'
            });
        }
        
        if (estadoQuery.rows[0].estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                error: 'Solo se pueden editar órdenes PENDIENTES'
            });
        }
        
        // Actualizar orden
        await client.query(
            `UPDATE ordenes_compra 
             SET empresa = $1, fecha = $2, dias_credito = $3, observaciones = $4, total = $5
             WHERE codigo = $6`,
            [empresa, fecha, dias_credito, observaciones || null, total, codigo]
        );
        
        // Borrar detalle anterior
        await client.query('DELETE FROM detalle_ordenes WHERE orden = $1', [codigo]);
        
        // Insertar nuevo detalle
        for (const producto of productos) {
            await client.query(
                `INSERT INTO detalle_ordenes (orden, producto_venta, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [codigo, producto.producto_venta, producto.cantidad, producto.precio_unitario, producto.subtotal]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Orden actualizada exitosamente'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando orden:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar orden de compra'
        });
    } finally {
        client.release();
    }
});

// GET /api/ordenes-compra - Listar órdenes de un cliente específico
app.get('/api/ordenes-compra', async (req, res) => {
    const { empresa, estado } = req.query;
    
    if (!empresa) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro empresa requerido'
        });
    }
    
    try {
        let query = `
            SELECT oc.codigo, oc.fecha, oc.fecha_entrega, oc.fecha_vencimiento,
                   oc.cliente, oc.tipo_precio, oc.dias_credito, oc.estado,
                   oc.total, oc.observaciones, oc.empresa,
                   e.nombre as empresa_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas e ON oc.empresa = e.codigo
            WHERE oc.empresa = $1
        `;
        
        const params = [empresa];
        
        if (estado) {
            query += ` AND oc.estado = $2`;
            params.push(estado);
        }
        
        query += ` ORDER BY oc.fecha DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener órdenes de compra'
        });
    }
});

// GET /api/ordenes-compra/todas - Listar TODAS las órdenes (para PROVEEDOR)
app.get('/api/ordenes-compra/todas', async (req, res) => {
    const { estado } = req.query;
    
    try {
        let query = `
            SELECT oc.codigo, oc.fecha, oc.fecha_entrega, oc.fecha_vencimiento,
                   oc.cliente, oc.tipo_precio, oc.dias_credito, oc.estado,
                   oc.total, oc.observaciones, oc.empresa,
                   e.nombre as empresa_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas e ON oc.empresa = e.codigo
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

// GET /api/ordenes-compra/:codigo - Detalle de una orden específica
app.get('/api/ordenes-compra/:codigo', async (req, res) => {
    const { codigo } = req.params;
    
    try {
        const query = `
            SELECT oc.codigo, oc.fecha, oc.fecha_entrega, oc.fecha_vencimiento,
                   oc.cliente, oc.tipo_precio, oc.dias_credito, oc.estado,
                   oc.total, oc.observaciones, oc.empresa,
                   e.nombre as empresa_nombre
            FROM ordenes_compra oc
            LEFT JOIN empresas e ON oc.empresa = e.codigo
            WHERE oc.codigo = $1
        `;
        
        const result = await pool.query(query, [codigo]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Orden de compra no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo detalle de orden:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle de orden'
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

// POST /api/soportes-entrega/subir - Subir soporte de entrega
app.post('/api/soportes-entrega/subir', async (req, res) => {
    const { orden, archivo_base64, nombre_archivo, tipo_archivo } = req.body;
    
    if (!orden || !archivo_base64 || !nombre_archivo) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros: orden, archivo_base64 y nombre_archivo requeridos'
        });
    }
    
    try {
        // Convertir base64 a buffer
        const base64Data = archivo_base64.split(',')[1] || archivo_base64;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Obtener empresa y estado de la orden
        const ordenQuery = await pool.query(
            'SELECT empresa, estado FROM ordenes_compra WHERE codigo = $1',
            [orden]
        );
        
        if (ordenQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Orden de compra no encontrada'
            });
        }
        
        const { empresa, estado } = ordenQuery.rows[0];
        
        // BLOQUEAR si la orden ya está ENTREGADA
        if (estado === 'ENTREGADA') {
            return res.status(403).json({
                success: false,
                error: 'No se pueden agregar soportes a órdenes ya ENTREGADAS'
            });
        }
        
        // Calcular número del soporte (siguiente número)
        const maxNumQuery = await pool.query(
            'SELECT COALESCE(MAX(numero_soporte), 0) + 1 as siguiente FROM soportes_entrega WHERE orden = $1',
            [orden]
        );
        
        const numeroSoporte = maxNumQuery.rows[0].siguiente;
        
        // Insertar nuevo soporte (SIEMPRE insert, nunca update)
        await pool.query(
            `INSERT INTO soportes_entrega (orden, nombre_archivo, tipo_archivo, archivo_data, empresa, numero_soporte)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orden, nombre_archivo, tipo_archivo, buffer, empresa, numeroSoporte]
        );
        
        res.json({
            success: true,
            message: 'Soporte cargado exitosamente',
            numero_soporte: numeroSoporte
        });
    } catch (error) {
        console.error('Error subiendo soporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar soporte de entrega'
        });
    }
});

// GET /api/soportes-entrega/:orden - Listar todos los soportes de una orden
app.get('/api/soportes-entrega/:orden', async (req, res) => {
    const { orden } = req.params;
    
    try {
        const query = `
            SELECT id, orden, nombre_archivo, tipo_archivo, fecha_subida, numero_soporte
            FROM soportes_entrega
            WHERE orden = $1
            ORDER BY numero_soporte ASC
        `;
        
        const result = await pool.query(query, [orden]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'No existen soportes para esta orden',
                data: []
            });
        }
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error verificando soportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar soportes'
        });
    }
});

// GET /api/soportes-entrega/archivo/:id - Descargar archivo específico del soporte
app.get('/api/soportes-entrega/archivo/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = `
            SELECT archivo_data, tipo_archivo, nombre_archivo
            FROM soportes_entrega
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Soporte no encontrado'
            });
        }
        
        const { archivo_data, tipo_archivo, nombre_archivo } = result.rows[0];
        
        res.setHeader('Content-Type', tipo_archivo);
        res.setHeader('Content-Disposition', `inline; filename="${nombre_archivo}"`);
        res.send(archivo_data);
    } catch (error) {
        console.error('Error descargando soporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error al descargar soporte'
        });
    }
});

// PUT /api/ordenes-compra/:codigo/procesar-recepcion - Procesar recepción completa o incompleta
app.put('/api/ordenes-compra/:codigo/procesar-recepcion', async (req, res) => {
    const { codigo } = req.params;
    const { entrega_completa } = req.body;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Obtener datos de la orden
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
            // ============================================================
            // CASO 1: ENTREGA COMPLETA
            // ============================================================
            
            const fechaHoy = new Date().toISOString().split('T')[0];
            
            // Limpiar observaciones si tiene [ORDEN INCOMPLETA]
            let observacionesLimpias = orden.observaciones || '';
            if (observacionesLimpias.startsWith('[ORDEN INCOMPLETA] ')) {
                observacionesLimpias = observacionesLimpias.replace('[ORDEN INCOMPLETA] ', '');
            }
            
            // 1A. Actualizar orden: estado ENTREGADA + calcular fecha_vencimiento + limpiar observaciones
            await client.query(
                `UPDATE ordenes_compra 
                 SET estado = 'ENTREGADA',
                     fecha_entrega = $1,
                     fecha_vencimiento = $1::date + dias_credito,
                     observaciones = $2
                 WHERE codigo = $3`,
                [fechaHoy, observacionesLimpias, codigo]
            );
            
            // 1B. Obtener productos de la orden
            const productosQuery = await client.query(
                `SELECT producto_venta, cantidad 
                 FROM detalle_ordenes 
                 WHERE orden = $1`,
                [codigo]
            );
            
            // 1C. Registrar SALIDAS en detalle_inventario_venta (sin campo empresa)
            for (const producto of productosQuery.rows) {
                await client.query(
                    `INSERT INTO detalle_inventario_venta 
                     (fecha, codigo, entrada, salida, tipo, referencia, observaciones)
                     VALUES ($1, $2, 0, $3, $4, $5, $6)`,
                    [
                        fechaHoy,
                        producto.producto_venta,
                        producto.cantidad,
                        'SALIDA POR VENTA',
                        codigo,
                        'Entrega de orden de compra'
                    ]
                );
            }
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Orden marcada como ENTREGADA e inventario descargado'
            });
            
        } else {
            // ============================================================
            // CASO 2: ENTREGA INCOMPLETA
            // ============================================================
            
            console.log('=== ENTREGA INCOMPLETA ===');
            console.log('Observaciones actuales:', orden.observaciones);
            
            // 2A. Agregar [ORDEN INCOMPLETA] solo si NO existe ya
            const observacionesActuales = orden.observaciones || '';
            let nuevasObservaciones;
            
            if (observacionesActuales.startsWith('[ORDEN INCOMPLETA] ')) {
                // Ya tiene [ORDEN INCOMPLETA], no agregarlo de nuevo
                nuevasObservaciones = observacionesActuales;
                console.log('Ya tiene [ORDEN INCOMPLETA], no se agrega de nuevo');
            } else {
                // No lo tiene, agregarlo
                nuevasObservaciones = '[ORDEN INCOMPLETA] ' + observacionesActuales;
            }
            
            console.log('Nuevas observaciones:', nuevasObservaciones);
            
            const updateResult = await client.query(
                `UPDATE ordenes_compra 
                 SET observaciones = $1
                 WHERE codigo = $2
                 RETURNING observaciones`,
                [nuevasObservaciones, codigo]
            );
            
            console.log('Update result:', updateResult.rows[0]);
            
            // Estado sigue siendo PENDIENTE (no se cambia)
            
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
// ALIAS TEMPORAL - /api/movimientos/registrar
// El frontend viejo llama a este endpoint, redirecciona a /api/inventario/movimientos
// ================================================================

app.post('/api/movimientos/registrar', async (req, res) => {
    const { empresa, fecha, tipo, ccOrigen, ccDestino, observaciones, productos } = req.body;
    
    // Validar datos
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
        
        // Procesar según tipo de operación
        if (tipo === 'ENTRADA A ALMACEN') {
            // ENTRADA: registrar en ccOrigen como ENTRADA
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
            // SALIDA: registrar en ccOrigen como SALIDA
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
            // TRANSFERENCIA: SALIDA de ccOrigen + ENTRADA a ccDestino
            if (!ccDestino) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere centro de costo destino para transferencias'
                });
            }
            
            for (const prod of productos) {
                // 1. SALIDA del origen
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
                
                // 2. ENTRADA al destino
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
// RUTAS - RAÍZ
// ================================================================

app.get('/', (req, res) => {
    res.json({
        message: 'API de Inventario con Autenticación',
        endpoints: {
            health: '/health',
            login: 'POST /api/auth/login',
            ccostos: '/api/ccostos?empresa=123456789',
            inventario: '/api/inventario?empresa=123456789&ccosto=002',
            stats: '/api/inventario/stats?empresa=123456789'
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
