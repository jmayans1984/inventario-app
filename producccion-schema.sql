-- ============================================
-- MÓDULO PRODUCCIÓN - TABLAS
-- ============================================

-- ÓRDENES DE PRODUCCIÓN
CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(50),
  producto_id INTEGER NOT NULL,
  cantidad_planeada DECIMAL(12,2) NOT NULL,
  cantidad_real DECIMAL(12,2),
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  estado VARCHAR(30) DEFAULT 'PENDIENTE', -- PENDIENTE, EN_PROCESO, COMPLETADA, CANCELADA
  costo_total DECIMAL(15,2),
  precio_unitario_calculado DECIMAL(10,4),
  observaciones TEXT,
  usuario_creador VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DETALLES DE PRODUCCIÓN (Ingredientes por orden)
CREATE TABLE IF NOT EXISTS detalles_produccion (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  articulo_id INTEGER NOT NULL,
  cantidad_necesaria DECIMAL(12,4),
  cantidad_usada DECIMAL(12,4),
  unidad_medida VARCHAR(20),
  costo_unitario_fecha DECIMAL(10,4),
  costo_total DECIMAL(15,2),
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (articulo_id) REFERENCES articulos(id)
);

-- LOTES DE PRODUCCIÓN
CREATE TABLE IF NOT EXISTS lotes_produccion (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(50),
  orden_id INTEGER NOT NULL REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  codigo_lote VARCHAR(50) UNIQUE NOT NULL, -- Auto-generado: PROD-20260617-001
  fecha_produccion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cantidad_producida DECIMAL(12,2),
  estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, VENCIDO, CANCELADO
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETIQUETAS PARA IMPRIMIR (4x6)
CREATE TABLE IF NOT EXISTS etiquetas_produccion (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL REFERENCES lotes_produccion(id) ON DELETE CASCADE,
  orden_id INTEGER NOT NULL REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL,
  codigo_barras VARCHAR(50) UNIQUE,
  cantidad_impresa INTEGER DEFAULT 1,
  estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, IMPRESA, USADA
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- MOVIMIENTOS DE PRODUCCIÓN (Auditoría)
CREATE TABLE IF NOT EXISTS movimientos_produccion (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(50), -- CREADA, INGREDIENTE_REGISTRADO, PRODUCCION_COMPLETADA, ETIQUETAS_GENERADAS, PRECIO_ACTUALIZADO
  descripcion TEXT,
  usuario VARCHAR(100),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_ordenes_estado ON ordenes_produccion(estado);
CREATE INDEX idx_ordenes_producto ON ordenes_produccion(producto_id);
CREATE INDEX idx_lotes_orden ON lotes_produccion(orden_id);
CREATE INDEX idx_detalles_orden ON detalles_produccion(orden_id);
CREATE INDEX idx_etiquetas_lote ON etiquetas_produccion(lote_id);

-- ============================================
-- ACTUALIZAR TABLA PRODUCTOS
-- ============================================
-- Agregar columnas si no existen
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_producto_propio BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,4);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS margen_porcentaje DECIMAL(5,2) DEFAULT 0;
