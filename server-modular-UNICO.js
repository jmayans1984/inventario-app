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

// GET /api/inventario - Obtener productos con control = SI y stock por ccosto y empresa
app.get('/api/inventario', async (req, res) => {
    const { ccosto, empresa } = req.query;

    try {
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
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.ccosto = $1 AND di.empresa = $2`;
            params.push(ccosto, empresa);
        } else if (ccosto) {
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo AND di.ccosto = $1`;
            params.push(ccosto);
        } else {
            query += ` LEFT JOIN detalle_inventario di ON p.codigo = di.codigo`;
        }

        query += `
            WHERE UPPER(p.control) = 'SI'
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

// GET /api/gastos/reporte - Reporte de gastos
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
        res.json({
            success: false,
            error: 'Error al obtener reporte',
            details: error.message
        });
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
    const { entrega_completa } = req.body;
    
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
            const fechaHoy = new Date().toISOString().split('T')[0];
            
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
                [fechaHoy, observacionesLimpias, codigo]
            );
            
            const productosQuery = await client.query(
                `SELECT producto_venta, cantidad 
                 FROM detalle_ordenes 
                 WHERE orden = $1`,
                [codigo]
            );
            
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

// GET /api/ordenes-compra/:codigo/detalles - Obtener detalles de orden
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
                pv.nombre as producto_nombre,
                pv.codigo as producto_codigo
            FROM detalle_ordenes d
            LEFT JOIN productos_venta pv ON d.producto_venta = pv.codigo
            WHERE d.orden = $1
            ORDER BY d.id
        `;

        const ordenResult = await pool.query(ordenQuery, [codigo]);
        const detallesResult = await pool.query(detallesQuery, [codigo]);

        console.log(`GET /api/ordenes-compra/${codigo}/detalles`);
        console.log('Detalles obtenidos:', detallesResult.rows);

        if (ordenResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada'
            });
        }

        res.json({
            success: true,
            orden: ordenResult.rows[0],
            detalles: detallesResult.rows
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
            SELECT estado
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

        // Actualizar la orden
        const updateQuery = `
            UPDATE ordenes_compra
            SET fecha_entrega = $1, estado = $2, observaciones = $3, total = $4
            WHERE codigo = $5
            RETURNING codigo
        `;

        await client.query(updateQuery, [
            fecha_entrega || null,
            estado,
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

                // Validar que el producto existe en productos_venta
                const productoCheck = await client.query(
                    `SELECT codigo FROM productos_venta WHERE codigo = $1`,
                    [detalle.producto_venta]
                );

                if (productoCheck.rows.length === 0) {
                    throw new Error(`Producto ${detalle.producto_venta} no existe en productos_venta`);
                }

                const insertDetalleQuery = `
                    INSERT INTO detalle_ordenes
                    (orden, producto_venta, cantidad, precio_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `;

                const subtotal = detalle.cantidad * detalle.precio_unitario;
                await client.query(insertDetalleQuery, [
                    codigo,
                    detalle.producto_venta,
                    detalle.cantidad,
                    detalle.precio_unitario,
                    subtotal
                ]);
            }
            console.log(`Detalles insertados correctamente`);
        }

        await client.query('COMMIT');

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

// POST /api/ordenes-compra/crear - Crear orden de compra con detalles
app.post('/api/ordenes-compra/crear', async (req, res) => {
    const { empresa, tipo_precio, fecha_entrega, dias_credito, observaciones, detalles, total } = req.body;

    if (!empresa || !tipo_precio || !detalles || detalles.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros obligatorios'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Mapear tipo_precio a formato PRECIO1, PRECIO2, PRECIO3
        const tipoPrecioMapeado = tipo_precio === 'precio_venta1' ? 'PRECIO1' :
                                  tipo_precio === 'precio_venta2' ? 'PRECIO2' : 'PRECIO3';

        // Obtener máximo consecutivo de orden para esta empresa
        const codigoResult = await client.query(`
            SELECT COALESCE(MAX(CAST(SUBSTRING(codigo, LENGTH(codigo) - 4) AS INTEGER)), 0) + 1 as numero_orden
            FROM ordenes_compra
            WHERE empresa = $1 AND codigo LIKE 'OC-%'
        `, [empresa]);

        const numeroOrden = String(codigoResult.rows[0].numero_orden).padStart(5, '0');
        const codigoOrden = `OC-${empresa}-${numeroOrden}`;

        // Validar longitud del código
        if (codigoOrden.length > 20) {
            throw new Error('Código de orden excede longitud máxima (20 caracteres)');
        }

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
            empresa,
            tipoPrecioMapeado,
            dias_credito || 0,
            total,
            observaciones || '',
            empresa
        ]);

        const codigoOrdenGuardado = ordenResult.rows[0].codigo;

        // Insertar detalles de la orden (solo con cantidad > 0)
        let detallesCreados = 0;
        for (const detalle of detalles) {
            const cantidad = parseFloat(detalle.cantidad) || 0;

            // Solo guardar si cantidad es diferente a 0, null o blanco
            if (cantidad > 0) {
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

    console.log(`GET /api/soportes-entrega - Buscando soportes para orden: ${orden}`);

    try {
        const query = `
            SELECT id, orden, archivo_data, nombre_archivo, fecha_subida
            FROM soportes_entrega
            WHERE orden = $1
            ORDER BY fecha_subida DESC
        `;

        console.log(`Query: ${query}, Parámetro: ${orden}`);

        const result = await pool.query(query, [orden]);

        console.log(`Resultado: ${result.rows.length} soportes encontrados`);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No hay comprobantes de entrega para esta orden'
            });
        }

        // Convertir archivo_data (buffer) a base64 para TODOS los soportes
        const soportes = result.rows.map(soporte => {
            try {
                if (soporte.archivo_data) {
                    const base64Data = Buffer.from(soporte.archivo_data).toString('base64');
                    soporte.archivo_data = 'data:image/png;base64,' + base64Data;
                    console.log(`Soporte ${soporte.id} - Imagen convertida a base64, tamaño:`, base64Data.length);
                }
            } catch (conversionError) {
                console.error('Error convirtiendo a base64:', conversionError);
            }
            return soporte;
        });

        res.json({
            success: true,
            data: soportes
        });
    } catch (error) {
        console.error('Error en /api/soportes-entrega/:orden:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener comprobantes de entrega',
            details: error.message
        });
    }
});

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

// GET /api/contabilidad/gastos - Listar gastos (sin JOINs por ahora)
app.get('/api/contabilidad/gastos', async (req, res) => {
    try {
        const empresa = req.query.empresa || req.headers['x-empresa'];
        if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });

        console.log(`[DEBUG] GET /api/contabilidad/gastos - Empresa: ${empresa}`);

        // Consulta con LEFT JOINs para obtener nombres de proveedores y centros de costos
        // Filtrar JOINs por empresa para obtener los nombres correctos de cada empresa
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
                g.forma_pago,
                g.estado,
                g.entrada_almacen,
                g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
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

        // 2. Obtener próximo código (10 dígitos) — seguro porque la tabla está bloqueada
        const codigoRes = await client.query(
            'SELECT MAX(CAST(codigo AS INTEGER)) as max_codigo FROM gastos WHERE empresa = $1',
            [empresa]
        );
        const proximoCodigo = String((parseInt(codigoRes.rows[0].max_codigo) || 0) + 1).padStart(10, '0');

        // 2. Insertar gasto
        const gastoRes = await client.query(
            `INSERT INTO gastos (codigo, fecha, factura, proveedor, ccosto,
                                forma_pago, cuenta, concepto, subtotal, impuestos, total, empresa)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [proximoCodigo, fecha, factura || null, proveedor, ccosto,
             forma_pago, cuenta, concepto.toUpperCase(), subtotal, impuestos || 0, total, empresa]
        );

        // 3. Crear entry en MOVIBAN (solo si forma_pago es CONTADO o si hay cuenta bancaria asociada)
        if (forma_pago === 'CONTADO' && total > 0) {
            // Aquí necesitamos saber qué cuenta bancaria usar
            // Por ahora, registramos el movimiento del gasto
            await client.query(
                `INSERT INTO movimientos (fecha, tipo_movimiento, descripcion, valor, gasto_codigo, empresa)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [fecha, 'EGRESO', `Pago gasto: ${concepto}`, total, proximoCodigo, empresa]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ success: true, data: gastoRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error POST /api/contabilidad/gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// PUT /api/contabilidad/gastos/:codigo - Actualizar gasto
app.put('/api/contabilidad/gastos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { fecha, factura, proveedor, ccosto, forma_pago,
                cuenta, concepto, subtotal, impuestos, total, empresa } = req.body;

        const result = await pool.query(
            `UPDATE gastos
             SET fecha=$1, factura=$2, proveedor=$3, ccosto=$4, forma_pago=$5,
                 cuenta=$6, concepto=$7, subtotal=$8, impuestos=$9, total=$10
             WHERE codigo=$11 AND empresa=$12
             RETURNING *`,
            [fecha, factura || null, proveedor, ccosto, forma_pago,
             cuenta, concepto.toUpperCase(), subtotal, impuestos || 0, total, codigo, empresa]
        );

        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error PUT /api/contabilidad/gastos:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/contabilidad/gastos/:codigo - Eliminar gasto
app.delete('/api/contabilidad/gastos/:codigo', async (req, res) => {
    const client = await pool.connect();
    try {
        const { codigo } = req.params;
        const empresa = req.query.empresa || req.headers['x-empresa'];

        await client.query('BEGIN');

        // 1. Eliminar movimientos asociados
        await client.query(
            'DELETE FROM movimientos WHERE gasto_codigo = $1 AND empresa = $2',
            [codigo, empresa]
        );

        // 2. Eliminar gasto
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
                    g.ccosto, cc.nombre as ccosto_nombre, g.forma_pago,
                    g.cuenta, cta.nombre as cuenta_nombre,
                    g.concepto, g.subtotal, g.impuestos, g.total, g.empresa, g.created_at,
                    g.estado, g.entrada_almacen, g.origen
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_contables cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
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
                    g.cuenta, cta.nombre as cuenta_nombre,
                    g.concepto, g.subtotal, g.impuestos, g.total, g.empresa, g.created_at
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_contables cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
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
                    cta.nombre as cuenta_contable, g.concepto, g.subtotal, g.impuestos, g.total
             FROM gastos g
             LEFT JOIN proveedores p ON g.proveedor = p.codigo AND p.empresa = g.empresa
             LEFT JOIN ccostos cc ON g.ccosto = cc.codigo AND cc.empresa = g.empresa
             LEFT JOIN cuentas_contables cta ON g.cuenta = cta.codigo AND cta.empresa = g.empresa
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
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor MODULAR corriendo en puerto ${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Arquitectura: Modular v2.0 - Archivo único`);
    console.log(`📂 Módulos: Auth, CCostos, Inventario, Movimientos, Tesorería, Gastos, Órdenes\n`);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});
