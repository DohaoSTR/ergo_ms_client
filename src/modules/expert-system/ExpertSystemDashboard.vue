<script setup>
import { ref, onMounted } from 'vue'
import {
  RotateCcw, BookOpen, TestTube2, Users,
  Briefcase, Info, BarChart3, TrendingUp
} from 'lucide-vue-next'

// Импорт компонентов карточек
import ExpertTopSkillsCard from '@/modules/expert-system/DashboardCards/ExpertSystemMetricsCard.vue'
import ExpertStudentsStatsCard from '@/modules/expert-system/DashboardCards/ExpertStudentsStatsCard.vue'
import ExpertTestingDataCard from '@/modules/expert-system/DashboardCards/ExpertTestingDataCard.vue'
import ExpertTopSkillsCard from '@/modules/expert-system/DashboardCards/ExpertTopSkillsCard.vue'
import ExpertSkillsAnalyticsCard from '@/modules/expert-system/DashboardCards/ExpertSkillsAnalyticsCard.vue'

const isRefreshing = ref(false)
const lastUpdated = ref('')
const refreshKey = ref(0)

const refreshAllData = async () => {
  isRefreshing.value = true
  try {
    // Принудительно обновляем все компоненты
    refreshKey.value += 1
    lastUpdated.value = new Date().toLocaleString('ru-RU')

    // Имитируем небольшую задержку для UX
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Error refreshing dashboard:', error)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  lastUpdated.value = new Date().toLocaleString('ru-RU')
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Заголовок дашборда -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="dashboard-title">Дашборд экспертной системы</h1>
          <p class="dashboard-subtitle">Аналитика и метрики платформы профориентации</p>
        </div>
        <div class="header-actions">
          <button
            @click="refreshAllData"
            :disabled="isRefreshing"
            class="refresh-button"
            :class="{ 'refreshing': isRefreshing }"
          >
            <RotateCcw :class="['refresh-icon', { 'spinning': isRefreshing }]" />
            <span>{{ isRefreshing ? 'Обновление...' : 'Обновить все' }}</span>
          </button>
          <div class="last-update">
            <span class="update-label">Обновлено:</span>
            <span class="update-time">{{ lastUpdated }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Основные метрики -->
    <div class="metrics-section">
      <div class="section-header">
        <BarChart3 class="section-icon" />
        <h2 class="section-title">Основные показатели</h2>
      </div>
      <div class="metrics-grid">
        <div class="metric-card-wrapper">
          <ExpertStudentsStatsCard :key="`students-${refreshKey}`" />
        </div>
        <div class="metric-card-wrapper">
          <ExpertSystemMetricsCard :key="`metrics-${refreshKey}`" />
        </div>
        <div class="metric-card-wrapper">
          <ExpertTestingDataCard :key="`testing-${refreshKey}`" />
        </div>
      </div>
    </div>

    <!-- Аналитика навыков -->
    <div class="analytics-section">
      <div class="section-header">
        <TrendingUp class="section-icon" />
        <h2 class="section-title">Аналитика навыков</h2>
      </div>
      <div class="analytics-grid">
        <div class="analytics-card-wrapper wide">
          <ExpertTopSkillsCard :key="`top-skills-${refreshKey}`" />
        </div>
        <div class="analytics-card-wrapper full">
          <ExpertSkillsAnalyticsCard :key="`skills-analytics-${refreshKey}`" />
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="actions-section">
      <div class="section-header">
        <Briefcase class="section-icon" />
        <h2 class="section-title">Быстрые действия</h2>
      </div>
      <div class="actions-grid">
        <router-link
          to="/expert-system/skills"
          class="action-card skills"
        >
          <div class="action-icon">
            <BookOpen class="icon" />
          </div>
          <div class="action-content">
            <h3 class="action-title">Управление навыками</h3>
            <p class="action-description">Редактирование и добавление навыков в систему</p>
          </div>
          <div class="action-arrow">→</div>
        </router-link>

        <router-link
          to="/expert-system/all-tests"
          class="action-card tests"
        >
          <div class="action-icon">
            <TestTube2 class="icon" />
          </div>
          <div class="action-content">
            <h3 class="action-title">Управление тестами</h3>
            <p class="action-description">Создание и редактирование тестов для навыков</p>
          </div>
          <div class="action-arrow">→</div>
        </router-link>

        <router-link
          to="/students"
          class="action-card students"
        >
          <div class="action-icon">
            <Users class="icon" />
          </div>
          <div class="action-content">
            <h3 class="action-title">Студенты</h3>
            <p class="action-description">Просмотр профилей и статистики студентов</p>
          </div>
          <div class="action-arrow">→</div>
        </router-link>

        <router-link
          to="/expert-system/vacancies"
          class="action-card vacancies"
        >
          <div class="action-icon">
            <Briefcase class="icon" />
          </div>
          <div class="action-content">
            <h3 class="action-title">Вакансии</h3>
            <p class="action-description">Управление вакансиями и заявками</p>
          </div>
          <div class="action-arrow">→</div>
        </router-link>
      </div>
    </div>

    <!-- Информационный блок -->
    <div class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <Info class="icon" />
        </div>
        <div class="info-content">
          <h3 class="info-title">О дашборде экспертной системы</h3>
          <p class="info-description">
            Данный дашборд предоставляет комплексную аналитику работы экспертной системы профориентации,
            включая метрики по студентам, навыкам, результатам тестирования и общую статистику использования платформы.
            Все данные обновляются в режиме реального времени для обеспечения актуального мониторинга системы.
          </p>
          <div class="info-features">
            <div class="feature-item">
              <div class="feature-dot primary"></div>
              <span class="feature-text">Системные метрики и общая статистика</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot success"></div>
              <span class="feature-text">Детальная аналитика по студентам</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot warning"></div>
              <span class="feature-text">Результаты тестирования и успеваемость</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot info"></div>
              <span class="feature-text">Анализ популярности и эффективности навыков</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--color-secondary-background);
  padding: 24px;
}

/* Заголовок дашборда */
.dashboard-header {
  background: var(--color-primary-background);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.header-text {
  flex: 1;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.dashboard-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-accent-hover, #2563eb);
  transform: translateY(-1px);
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.refresh-button.refreshing {
  background: var(--color-accent-active, #1d4ed8);
}

.refresh-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.spinning {
  animation: spin 1s linear infinite;
}

.last-update {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
}

.update-label {
  color: var(--color-text-secondary);
}

.update-time {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Секции */
.metrics-section,
.analytics-section,
.actions-section,
.info-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* Сетки */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  gap: 24px;
}

.metric-card-wrapper:first-child {
  /* Первый компонент */
}

.metric-card-wrapper:nth-child(2) {
  /* Второй компонент */
}

.analytics-card-wrapper.wide {
  /* Третий компонент */
}

.analytics-card-wrapper.full {
  /* Четвёртый компонент */
}

/* Быстрые действия */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-primary-background);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--color-accent);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-card.skills .action-icon {
  background: #eff6ff;
  color: #3b82f6;
}

.action-card.tests .action-icon {
  background: #f5f3ff;
  color: #8b5cf6;
}

.action-card.students .action-icon {
  background: #f0fdf4;
  color: #10b981;
}

.action-card.vacancies .action-icon {
  background: #fffbeb;
  color: #f59e0b;
}

.action-icon .icon {
  width: 24px;
  height: 24px;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.action-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.action-arrow {
  font-size: 20px;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  color: var(--color-accent);
}

/* Информационный блок */
.info-section {
  margin-top: 40px;
}

.info-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, var(--color-accent-light, #eff6ff), var(--color-secondary-background));
  border-radius: 12px;
  border: 1px solid var(--color-accent-border, #dbeafe);
}

.info-icon {
  width: 48px;
  height: 48px;
  background: var(--color-accent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon .icon {
  width: 24px;
  height: 24px;
  color: white;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.info-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.info-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-dot.primary { background: #3b82f6; }
.feature-dot.success { background: #10b981; }
.feature-dot.warning { background: #f59e0b; }
.feature-dot.info { background: #8b5cf6; }

.feature-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Адаптивность */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .dashboard-title {
    font-size: 24px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    flex-direction: column;
    gap: 16px;
  }

  .info-features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .action-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
  }

  .action-arrow {
    align-self: flex-end;
  }
}
</style>