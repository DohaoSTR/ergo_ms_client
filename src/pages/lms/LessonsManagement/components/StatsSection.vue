<template>
  <!-- Статистика -->
  <div class="row mb-4 stats-container">
    <div class="col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h4 class="text-primary mb-0">{{ stats.totalCourses }}</h4>
          <small class="text-muted">Курсов</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h4 class="text-success mb-0">{{ stats.totalThemes }}</h4>
          <small class="text-muted">Тем</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h4 class="text-info mb-0">{{ stats.totalLessons }}</h4>
          <small class="text-muted">Уроков</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h4 class="text-warning mb-0">{{ stats.visibleLessons }}</h4>
          <small class="text-muted">Видимых</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* Стили для статистики */
.stats-container .card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stats-container .card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Анимации карточек */
.stats-card {
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
</style> 