<script setup>
import { ref, onMounted } from 'vue'
import CardMonthStats from './cards/CardMonthStats.vue'
import CardPriorityChart from './cards/CardPriorityChart.vue'
import CardSectionDistribution from './cards/CardSectionDistribution.vue'
import CardCalendarActivity from './cards/CardCalendarActivity.vue'
import CardDeadlineAnalysis from './cards/CardDeadlineAnalysis.vue'
import CardProjectTimeline from './cards/CardProjectTimeline.vue'
import CardTaskCreationTrend from './cards/CardTaskCreationTrend.vue'
import CardUserProductivity from './cards/CardUserProductivity.vue'

const components = [
  { comp: CardMonthStats, delay: 1000 },
  { comp: CardPriorityChart, delay: 3000 },
  { comp: CardProjectTimeline, delay: 5000 },
  { comp: CardDeadlineAnalysis, delay: 7000 },
  { comp: CardTaskCreationTrend, delay: 9000 },
  { comp: CardUserProductivity, delay: 11000 },
  { comp: CardSectionDistribution, delay: 13000 },
  { comp: CardCalendarActivity, delay: 15000 }
]

const visibleComponents = ref([])

onMounted(() => {
  components.forEach((item, index) => {
    setTimeout(() => {
      visibleComponents.value.push(item.comp)
    }, item.delay)
  })
})
</script>

<template>
  <div class="dashboard-container">
    <h1 class="page-title mb-4">Аналитика CRM</h1>
    <p class="page-description mb-4">Комплексная статистика по задачам, проектам и активности</p>

    <div v-if="visibleComponents.length === 0" class="loading-indicator">
      Загрузка данных...
    </div>

    <div v-else class="row g-4">
      <template v-for="(Component, index) in visibleComponents" :key="index">
        <div :class="[
          'col-12',
          { 'col-md-6': index === 1 || index === 2 },
          { 'col-md-4': index >= 3 && index <= 5 }
        ]">
          <component :is="Component" />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  padding: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.loading-indicator, .error-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error-message {
  color: red;
}
</style>