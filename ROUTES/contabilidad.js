// ================================================================
// RUTAS - CONTABILIDAD (PROVEEDORES)
// ================================================================

const express = require('express');
const router = express.Router();
const pool = require('../CONFIG/database');

// ================================================================
// GET /api/contabilidad/proveedores - Listar proveedores
// ================================================================
router.get('/proveedores', async (req, res) => {
    try {
        const {
            empresa,
            page = 1,
            limit = 20,
            search = '',
            sortBy = 'nombre',
            sortOrder = 'asc'
        } = req.query;

        // Validar que empresa sea requerido
        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        // Campos permitidos para ordenamiento (prevención de SQL injection)
        const camposPermitidos = ['codigo', 'nombre', 'direccion', 'telefono1', 'departamen'];
        const sortByLimpio = camposPermitidos.includes(sortBy) ? sortBy : 'nombre';
        const sortOrderLimpio = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        // Construir query de búsqueda
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

        // Contar total de registros
        const countQuery = `SELECT COUNT(*) as total FROM proveedores ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex > 2 ? paramIndex : 1));
        const total = parseInt(countResult.rows[0].total);

        // Calcular offset para paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Query principal con paginación y ordenamiento
        const query = `
            SELECT
                id,
                codigo,
                nombre,
                direccion,
                telefono1,
                departamen,
                empresa,
                estado,
                created_at,
                updated_at
            FROM proveedores
            ${whereClause}
            ORDER BY ${sortByLimpio} ${sortOrderLimpio}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);

        const result = await pool.query(query, queryParams);

        res.json({
            success: true,
            data: result.rows,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        console.error('Error en GET /api/contabilidad/proveedores:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proveedores',
            details: error.message
        });
    }
});

// ================================================================
// GET /api/contabilidad/proveedores/:id - Obtener un proveedor
// ================================================================
router.get('/proveedores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { empresa } = req.query;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        const query = `
            SELECT
                id, codigo, nombre, direccion, telefono1,
                departamen, empresa, estado, created_at, updated_at
            FROM proveedores
            WHERE id = $1 AND empresa = $2
        `;

        const result = await pool.query(query, [id, empresa]);

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
// POST /api/contabilidad/proveedores - Crear proveedor
// ================================================================
router.post('/proveedores', async (req, res) => {
    try {
        const { codigo, nombre, direccion, telefono1, departamen, empresa } = req.body;

        // Validar campos requeridos
        if (!nombre || !empresa) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: nombre, empresa'
            });
        }

        // Verificar que el código sea único (si se proporciona)
        if (codigo) {
            const checkQuery = `SELECT id FROM proveedores WHERE codigo = $1 AND empresa = $2`;
            const checkResult = await pool.query(checkQuery, [codigo, empresa]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El código de proveedor ya existe en esta empresa'
                });
            }
        }

        // Insertar proveedor
        const query = `
            INSERT INTO proveedores (codigo, nombre, direccion, telefono1, departamen, empresa, estado, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVO', NOW(), NOW())
            RETURNING *
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

// ================================================================
// PUT /api/contabilidad/proveedores/:id - Actualizar proveedor
// ================================================================
router.put('/proveedores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, nombre, direccion, telefono1, departamen, empresa } = req.body;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        // Verificar que el proveedor existe
        const checkQuery = `SELECT id FROM proveedores WHERE id = $1 AND empresa = $2`;
        const checkResult = await pool.query(checkQuery, [id, empresa]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proveedor no encontrado'
            });
        }

        // Actualizar proveedor
        const query = `
            UPDATE proveedores
            SET
                codigo = COALESCE($1, codigo),
                nombre = COALESCE($2, nombre),
                direccion = COALESCE($3, direccion),
                telefono1 = COALESCE($4, telefono1),
                departamen = COALESCE($5, departamen),
                updated_at = NOW()
            WHERE id = $6 AND empresa = $7
            RETURNING *
        `;

        const result = await pool.query(query, [
            codigo || null,
            nombre || null,
            direccion || null,
            telefono1 || null,
            departamen || null,
            id,
            empresa
        ]);

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

// ================================================================
// DELETE /api/contabilidad/proveedores/:id - Eliminar proveedor
// ================================================================
router.delete('/proveedores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { empresa } = req.query;

        if (!empresa) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro "empresa" es requerido'
            });
        }

        const query = `
            DELETE FROM proveedores
            WHERE id = $1 AND empresa = $2
            RETURNING id
        `;

        const result = await pool.query(query, [id, empresa]);

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

// ================================================================
// POST /api/contabilidad/proveedores/batch/eliminar - Eliminar múltiples
// ================================================================
router.post('/proveedores/batch/eliminar', async (req, res) => {
    try {
        const { ids, empresa } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0 || !empresa) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren: ids (array), empresa'
            });
        }

        // Crear placeholders para evitar SQL injection
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const query = `
            DELETE FROM proveedores
            WHERE id IN (${placeholders}) AND empresa = $${ids.length + 1}
            RETURNING id
        `;

        const result = await pool.query(query, [...ids, empresa]);

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

// ================================================================
// GET /api/contabilidad/proveedores/buscar - Búsqueda
// ================================================================
router.get('/proveedores/buscar', async (req, res) => {
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
            SELECT id, codigo, nombre, direccion, telefono1, departamen, empresa
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

module.exports = router;
