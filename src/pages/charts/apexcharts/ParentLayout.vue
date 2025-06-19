<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

import RecentEvents from '@/pages/charts/apexcharts/RecentEvents.vue'
import MarketLeaders from '@/pages/charts/apexcharts/MarketLeaders.vue'
import DatabaseLoad from '@/pages/charts/apexcharts/DatabaseLoad.vue'
import BudgetCompany from '@/pages/charts/apexcharts/BudgetCompany.vue'
import DailySales from '@/pages/charts/apexcharts/DailySales.vue'
import ActiveStatistics from '@/pages/charts/apexcharts/ActiveStatistics.vue'
import MobileComparison from '@/pages/charts/apexcharts/MobileComparison.vue'
import ExpenseRatio from '@/pages/charts/apexcharts/ExpenseRatio.vue'
import TechnologyData from '@/pages/charts/apexcharts/TechnologyData.vue'
import StocksPrices from '@/pages/charts/apexcharts/StocksPrices.vue'

// Получение текущей темы
const currentTheme = ref('light')
let observer

onMounted(() => {
  // Слежка за изменениями атрибута data-bs-theme
  observer = new MutationObserver(() => {
    currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light'
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  })

  // Установка текущее значение
  currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light'
})
onUnmounted(() => {
  if (observer) observer.disconnect()
})

console.log(currentTheme.value)
</script>

<template>
  <div class="card mb-4">
    <h4 class="mb-3">Последние события</h4>
    <RecentEvents :theme="currentTheme" />
  </div>
  <div class="card mb-4">
    <h4 class="mb-3">Лидеры рынка</h4>
    <MarketLeaders :theme="currentTheme" />
  </div>
  <div class="card mb-4">
    <h4 class="mb-3">Данные о технологиях</h4>
    <TechnologyData :theme="currentTheme" />
  </div>
  <div class="card mb-4">
    <h4 class="mb-3">Нагрузка БД</h4>
    <DatabaseLoad :theme="currentTheme" />
  </div>
  <div class="row row-gap-4">
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Бюджет компании</h4>
        <BudgetCompany :theme="currentTheme" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Цены на акции</h4>
        <StocksPrices :theme="currentTheme" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Ежедневные продажи</h4>
        <DailySales :theme="currentTheme" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Статистика активности</h4>
        <ActiveStatistics :theme="currentTheme" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Сравнение мобильных устройств</h4>
        <MobileComparison :theme="currentTheme" />
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Соотношение расходов</h4>
        <ExpenseRatio :theme="currentTheme" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
