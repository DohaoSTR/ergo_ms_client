import { fileURLToPath, URL } from 'node:url' // Импорт функций для работы с URL и путями

import vue from '@vitejs/plugin-vue' // Импорт плагина Vue для Vite
import { defineConfig } from 'vite' // Импорт функции для определения конфигурации Vite
import vueDevTools from 'vite-plugin-vue-devtools' // Импорт плагина Vue DevTools для Vite

import dotenv from 'dotenv'
import path from 'path'

// Получение абсолютного пути к файлу .env, находящемуся на одну папку выше
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Загрузка переменных окружения из файла .env, находящегося на одну папку выше
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Определение конфигурации Vite
export default defineConfig({
  // Подключение плагинов
  plugins: [
    vue(), // Подключение плагина Vue для Vite
    //vueDevTools(), // Подключение плагина Vue DevTools для Vite
  ],

  // Настройка разрешения путей
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Создание псевдонима '@' для пути './src'
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },

  // Настройка обработки CSS
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/scss/_mixins.scss"; // Импорт миксинов SCSS
          @import "@/scss/_variables.scss"; // Импорт переменных SCSS
        `,
      },
    },
  },

  // Настройка сервера разработки
  server: {
    port: parseInt(process.env.CLIENT_PORT, 10) || 8001, // Установка порта для сервера разработки
    host: process.env.CLIENT_HOST || 'localhost', // Установка хоста для сервера разработки
    https: false, // Отключение HTTPS для сервера разработки
  },

  // Экспорт переменных окружения в клиентский код
  define: {
    'import.meta.env.VITE_API_HOST': JSON.stringify(process.env.API_HOST),
    'import.meta.env.VITE_API_PORT': JSON.stringify(process.env.API_PORT),
  },
})
