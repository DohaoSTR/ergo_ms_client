<script setup>
import {
  BookMarkedIcon,
  UsersIcon,
  ListIcon,
  PlusCircleIcon
} from 'lucide-vue-next';
import router from '@/js/routers';

const props = defineProps({
  teacher: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    required: true
  }
});

const goToPage = () => {
  router.push({
    name: 'CreateLesson'
  });
};
</script>

<template>
  <div class="row">
    <div class="card-item">
      <div class="stats-card">
        <div class="stats-icon bg-primary">
          <BookMarkedIcon :size="30" />
        </div>
        <div class="stats-info">
          <div class="stats-number">{{ stats?.total_subjects || 0 }}</div>
          <div class="stats-text">Курсы</div>
        </div>
      </div>
    </div>

    <div class="card-item">
      <div class="stats-card">
        <div class="stats-icon bg-secondary">
          <UsersIcon :size="30" />
        </div>
        <div class="stats-info">
          <div class="stats-number">{{ stats?.total_students || 0 }}</div>
          <div class="stats-text">Студенты</div>
        </div>
      </div>
    </div>

    <div class="card-item">
      <div class="stats-card">
        <div class="stats-icon bg-warning">
          <ListIcon :size="30" />
        </div>
        <div class="stats-info">
          <div class="stats-number">{{ stats?.active_tests || 0 }}</div>
          <div class="stats-text">Тесты</div>
        </div>
      </div>
    </div>

    <div class="card-item">
      <div class="stats-card" v-on:click="goToPage()">
        <div class="stats-icon bg-success">
          <PlusCircleIcon :size="30" />
        </div>
        <div class="stats-info">
          <div class="stats-number">Создать</div>
          <div class="stats-text">Урок</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.row {
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 25px;
  width: 100%;
  gap: -10px;
}

.card-item {
  flex: 1;
  min-width: 0;
}

.stats-card {
  cursor: pointer;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stats-info .stats-number {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.stats-info .stats-text {
  font-size: 14px;
  color: #777;
}

.small-text {
  font-size: 12px;
  font-weight: 500;
  color: #555;
}

.bg-primary {
  background-color: var(--primary, #1976d2);
}

.bg-secondary {
  background-color: var(--secondary, #9c27b0);
}

.bg-warning {
  background-color: var(--warning, #ff9800);
}

.bg-success {
  background-color: #4caf50;
}
</style>
