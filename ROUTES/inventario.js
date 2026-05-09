// ================================================================
// RUTAS - INVENTARIO
// ================================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/inventario - Obtener inventario
router.get('/', async (req, res) => {
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
router.get('/stats', async (req, res) => {
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
router.post('/movimientos', async (req, res) => {
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

module.exports = router;
