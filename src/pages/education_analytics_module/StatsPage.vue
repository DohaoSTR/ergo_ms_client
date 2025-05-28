<template>
  <div>
    <h2 style="color: var(--color-accent);">Статистика</h2>
    <router-view /> <!-- Здесь будут отображаться подразделы -->
  </div>

  <div class="section">
    <h3>Визуализации</h3>
    <div class="row">
      <div class="col-md-6 mb-4"><TechnologyPopularityChart /></div>
      <div class="col-md-6 mb-4"><EmployerRatingChart /></div>
    </div>
  </div>

  <div class="section">
    <h3>Данные</h3>
    <div class="row">
      <div class="col-md-6 mb-4"><TechnologiesCard /></div>
      <div class="col-md-6 mb-4"><EmployersList /></div>
    </div>
  </div>
</template>

<script setup>
  import TechnologyPopularityChart from '@/pages/education_analytics_module/charts/TechnologyPopularityChart.vue';
  import EmployerRatingChart from '@/pages/education_analytics_module/charts/EmployerRatingChart.vue';
  import TechnologiesCard from '@/pages/education_analytics_module/cards/TechnologiesCard.vue';
  import EmployersList from '@/pages/education_analytics_module/cards/EmployersList.vue';
</script>

<style scoped>
.section {
  margin-bottom: 2rem;
}

.section h3 {
  color: var(--color-secondary-text);
  font-size: 1.25rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
</style>
