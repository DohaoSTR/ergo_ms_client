import router from '@/js/routers.js'
import '@/js/utils/authGuard.js' // Подключаем защиту аутентификации

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@he-tree/vue/style/default.css'
import '@he-tree/vue/style/material-design.css'
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle.min.js'


import '@/scss/styles.scss'

import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import VueApexCharts from 'vue3-apexcharts'
import { setupCalendar } from 'v-calendar'
import { plugin as Slicksort } from 'vue-slicksort'
import Toast from 'vue-toastification'
import { createYmaps } from 'vue-yandex-maps'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'

const app = createApp(App)
const pinia = createPinia()

app.directive('tooltip', {
  mounted(el) {
    new Tooltip(el, { trigger: 'hover' })
  },
})

app.use(pinia)
app.use(router)
app.use(PerfectScrollbarPlugin)
app.use(autoAnimatePlugin)
app.use(VueApexCharts)
app.use(Slicksort)

app.use(Toast, {
  position: 'top-center',
  maxToasts: 3,
  timeout: 2000,
  showCloseButtonOnHover: true,
})

app.use(setupCalendar, {
  color: 'red',
})

try {
  app.use(
    createYmaps({
      apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
    }),
  )
} catch (error) {
 //console.error('Ошибка при инициализации Yandex Maps:', error)
}

app.mount('#app')
