import api from './api'

const BASE = '/almacen/productos'

export const productosAlmacenService = {

  async getProductos(params = {}) {
    const res = await api.get(BASE, { params })
    return res.data
  },

  async getGrupos() {
    const res = await api.get('/almacen/grupo-productos')
    return res.data
  },

  async getProximoCodigo() {
    const res = await api.get(`${BASE}/proximo-codigo`)
    return res.data
  },

  async crearProducto(data) {
    const res = await api.post(BASE, data)
    return res.data
  },

  async actualizarProducto(codigo, data) {
    const res = await api.put(`${BASE}/${codigo}`, data)
    return res.data
  },

  async toggleControl(codigo) {
    const res = await api.patch(`${BASE}/${codigo}/toggle-control`)
    return res.data
  },

  async toggleParaVenta(codigo) {
    const res = await api.patch(`${BASE}/${codigo}/toggle-para-venta`)
    return res.data
  },

  async toggleVisibleOperacional(codigo) {
    const res = await api.patch(`${BASE}/${codigo}/toggle-visible-operacional`)
    return res.data
  },

  async getListasPrecios() {
    const res = await api.get('/produccion/lista-precios')
    return res.data
  },
}

export default productosAlmacenService
