<template>
  <MainLayout>
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido de vuelta</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ currentDate }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="text-3xl mb-3">📦</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Inventario</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Gestión de productos</p>
          <div class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <div class="text-2xl font-bold text-blue-600">1,250</div>
              <div class="text-xs text-gray-500 uppercase">Productos</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-orange-600">45</div>
              <div class="text-xs text-gray-500 uppercase">Bajo Stock</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="text-3xl mb-3">📋</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Órdenes</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Órdenes de compra</p>
          <div class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <div class="text-2xl font-bold text-blue-600">28</div>
              <div class="text-xs text-gray-500 uppercase">Pendientes</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-blue-600">156</div>
              <div class="text-xs text-gray-500 uppercase">Este Mes</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="text-3xl mb-3">💰</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Gastos</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Registros contables</p>
          <div class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <div class="text-2xl font-bold text-green-600">$45K</div>
              <div class="text-xs text-gray-500 uppercase">Este Mes</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-green-600">12</div>
              <div class="text-xs text-gray-500 uppercase">Transacciones</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="text-3xl mb-3">🏦</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Tesorería</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Movimientos bancarios</p>
          <div class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <div class="text-2xl font-bold text-purple-600">$120K</div>
              <div class="text-xs text-gray-500 uppercase">Saldo</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-purple-600">8</div>
              <div class="text-xs text-gray-500 uppercase">Cuentas</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🚀 Acciones Rápidas</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button class="btn-primary text-left">➕ Nueva Orden</button>
          <button class="btn-primary text-left">📥 Registrar Entrega</button>
          <button class="btn-primary text-left">💾 Nuevo Gasto</button>
          <button class="btn-primary text-left">📊 Ver Reportes</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'

const currentDate = ref('')

onMounted(() => {
  const today = new Date()
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  currentDate.value = today.toLocaleDateString('es-ES', options)
})
</script>
