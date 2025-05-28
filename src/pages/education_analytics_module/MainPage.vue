<template>
    <div class="education-analytics-page">
      <header class="page-header">
        <p class="page-subtitle">Инвестируйте в своё будущее!</p>
      </header>
  
      <!-- Основное содержимое -->
      <main class="page-content">
        <RecomendationsCard />
      </main>   
    </div>
</template>
  
<script setup>
import RecomendationsCard from '@/pages/education_analytics_module/cards/RecomendationsCard.vue';    
</script>

<style>
p {
    color: var(--color-text);
}

.page-subtitle {
    color: var(--color-secondary-text);
    font-style: italic;
    margin-top: 0.5rem;
    font-size: 1.1em;
    letter-spacing: 0.5px;
}
</style>
