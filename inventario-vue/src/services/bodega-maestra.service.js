import api from './api'

export const bodegaMaestraService = {

  async obtenerBodegaMaestra() {
    const res = await api.get('/empresas/bodega-maestra')
    return res.data
  },

  async actualizarBodegaMaestra(bodega_maestra) {
    const res = await api.put('/empresas/bodega-maestra', { bodega_maestra })
    return res.data
  },
}

export default bodegaMaestraService
