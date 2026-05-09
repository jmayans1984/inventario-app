// ================================================================
// RUTAS - ÓRDENES DE COMPRA Y RECEPCIÓN
// ================================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/ordenes-compra - Listar órdenes de un cliente específico
router.get('/ordenes-compra', async (req, res) => {
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
router.get('/ordenes-compra/todas', async (req, res) => {
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
router.get('/ordenes-compra/:codigo', async (req, res) => {
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
router.get('/ordenes-compra/:codigo/detalle', async (req, res) => {
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
router.post('/soportes-entrega/subir', async (req, res) => {
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
router.get('/soportes-entrega/:orden', async (req, res) => {
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
router.get('/soportes-entrega/archivo/:id', async (req, res) => {
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
router.put('/ordenes-compra/:codigo/procesar-recepcion', async (req, res) => {
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

module.exports = router;
