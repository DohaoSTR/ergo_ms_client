<template>
  <div class="competence-mastery">
    <!-- Заголовок и выбор компетенции -->
    <div class="header">
      <h1>Анализ освоения компетенции</h1>
      <div class="select-wrapper">
        <select v-model="selectedCompetenceId" @change="loadData">
          <option value="">Выберите компетенцию</option>
          <option v-for="comp in competences" :value="comp.id" :key="comp.id">
            {{ comp.name }}
          </option>
        </select>
        <div class="select-arrow"></div>
      </div>
    </div>

    <!-- Название выбранной компетенции -->
    <div v-if="data" class="competence-header">
      <div class="competence-badge">
        <h2>{{ data.competence_name }}</h2>
        <div class="competence-stats">
          <div class="stat-item">
            <span class="stat-label">Средний уровень</span>
            <span class="stat-value">{{ data.average_mastery.toFixed(1) }}/100</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Индикаторы</span>
            <span class="stat-value">{{ data.indicators_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- График и сводка -->
    <div v-if="data" class="dashboard">
      <!-- Блок с обучающими ресурсами -->
      <div class="learning-resources">
        <h3>Обучающие ресурсы</h3>
        <div class="resources-list">
          <div v-for="(resource, index) in learningResources" :key="index" class="resource-card">
            <a :href="resource.link" target="_blank" class="resource-link">
              <div class="resource-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13.5,17H10.5V15.5H13.5V17M13.5,13H10.5V7H13.5V13Z" />
                </svg>
              </div>
              <div class="resource-content">
                <h4>{{ resource.title }}</h4>
                <p>{{ resource.description }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Список студентов -->
      <div class="student-list">
    <h4>Рейтинг студентов ({{ data.students.length }})</h4>
    <div class="student-card" v-for="(student, index) in data.students" :key="student.student_id">
      <div class="student-rank">{{ index + 1 }}</div>
      <div class="student-info">
        <div class="student-name">{{ student.student_fio }}</div>
        <div class="progress-wrapper">
          <span class="mastery-value">{{ student.total_mastery.toFixed(1) }}%</span>
          <div class="progress-container">
            <div class="progress-bar"
                 :style="{ width: `${student.total_mastery}%` }"
                 :class="getProgressClass(student.total_mastery)">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    </div>

    <!-- Сообщение при загрузке/ошибке -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Загрузка данных...</span>
    </div>

    <div v-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { Chart } from 'chart.js/auto'

const MAX_MASTERY_LEVEL = 100

const competences = ref([])
const selectedCompetenceId = ref('')
const data = ref(null)
const loading = ref(false)
const error = ref('')
const radarChart = ref(null)
const API_CONFIG = {
  BASE_URL: '', // или 'http://ваш-домен' для кросс-доменных запросов
  ENDPOINTS: {
    COMPETENCIES: 'http://localhost:8000/api/expsys_module/allcompetencies/',
    COMPETENCE_MASTERY: 'http://localhost:8000/api/expsys_module/information-competence/'
  }
};
const learningResources = ref([
  {
    title: "Основы программирования",
    description: "Полный курс по основам программирования на Codecademy",
    link: "https://www.codecademy.com/learn/introduction-to-programming"
  },
  {
    title: "ООП для начинающих",
    description: "Изучение объектно-ориентированного программирования",
    link: "https://www.coursera.org/learn/object-oriented-programming"
  },
  {
    title: "Паттерны проектирования",
    description: "Современные паттерны проектирования в программировании",
    link: "https://refactoring.guru/design-patterns"
  }
])
const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.text();
    try {

      const jsonError = JSON.parse(errorData);
      throw new Error(jsonError.message || 'Unknown server error');
    } catch {

      if (errorData.startsWith('<!doctype')) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData || 'Network error');
    }
  }
  return response.json();
};
onMounted(async () => {
  try {
    loading.value = true;
    const response = await fetch(API_CONFIG.ENDPOINTS.COMPETENCIES);
    const responseData = await handleApiError(response);

    // Проверяем наличие данных и их структуру
    if (responseData.data && Array.isArray(responseData.data)) {
      competences.value = responseData.data.map(comp => ({
        id: comp.id,
        name: comp.name,
        // description и category можно добавить если нужны
      }));

    } else {
      throw new Error('Некорректный формат данных');
    }
  } catch (err) {
    error.value = `Ошибка загрузки компетенций: ${err.message}`;
    console.error('API Error:', err);
  } finally {
    loading.value = false;
  }
});

const loadData = async () => {
  if (!selectedCompetenceId.value) return;

  try {
    loading.value = true;
    error.value = '';
    data.value = null;

    const response = await fetch(
      `${API_CONFIG.ENDPOINTS.COMPETENCE_MASTERY}?competence_id=${selectedCompetenceId.value}`
    );

    const result = await handleApiError(response);

    if (result?.data?.students) {
      data.value = {
        competence_id: result.data.competence_id,
        competence_name: result.data.competence_name,
        indicators_count: result.data.indicators_count,
        average_mastery: result.data.average_mastery,
        students: result.data.students.map(student => ({
          student_id: student.student_id,
          student_fio: student.student_fio,
          total_mastery: student.total_mastery,
          subjects: student.subjects || []
        }))
      };
      renderChart();
    } else {
      throw new Error('Неверная структура данных');
    }
  } catch (err) {
    error.value = `Ошибка загрузки: ${err.message}`;
    console.error('Ошибка:', err);
  } finally {
    loading.value = false;
  }
};

// Визуализация радар-чарта
const renderChart = () => {
 try {
    if (!data.value?.students?.length || !radarChart.value) return

    // Удаляем предыдущий график если существует
    if (radarChart.value.chart) {
      radarChart.value.chart.destroy()
    }

    const ctx = radarChart.value.getContext('2d')
    const labels = data.value.students
      .slice(0, 5)
      .map(s => s.student_name)

    const values = data.value.students
      .slice(0, 5)
      .map(s => (s.mastery_level / 100) * MAX_MASTERY_LEVEL)

    radarChart.value.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: `Уровень освоения (макс. ${MAX_MASTERY_LEVEL})`,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: MAX_MASTERY_LEVEL,
            ticks: { stepSize: MAX_MASTERY_LEVEL / 5 }
          }
        }
      }
    })
  } catch (err) {
    console.error('Ошибка отрисовки графика:', err)
  }
}
// Добавляем новые методы для безопасной обработки данных
//const getMasteryLevel = (student) => {
 // return student?.mastery_level || 0; // Возвращаем 0 если значение отсутствует
//};

//const formatMasteryLevel = (level) => {
  //return Number(level).toFixed(1); // Безопасное преобразование
//};

// Цвет прогресс-бара в зависимости от уровня
const getProgressClass = (level) => {
  const normalized = (level / 100) * MAX_MASTERY_LEVEL
  if (normalized >= MAX_MASTERY_LEVEL * 0.8) return 'excellent'
  if (normalized >= MAX_MASTERY_LEVEL * 0.5) return 'good'
  return 'weak'
}


</script>

<style lang="scss">

.competence-mastery {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #2d3748;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
    color: #1a202c;
  }
}

.select-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;

  select {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background-color: white;
    font-size: 1rem;
    color: #4a5568;
    appearance: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
    }
  }

  .select-arrow {
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #718096;
    pointer-events: none;
  }
}

.competence-header {
  margin-bottom: 2rem;
}

.competence-badge {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
  }
}

.competence-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;

  .stat-label {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #4a5568;
  }
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: #718096;
  }
}

.student-list {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .student-count {
    font-size: 0.875rem;
    color: #718096;
  }
}

.student-card {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #edf2f7;

  &:last-child {
    border-bottom: none;
  }
}

.student-rank {
  position: relative;
  width: 36px;
  height: 36px;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    position: relative;
    z-index: 2;
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
  }

  .rank-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #4299e1;
    border-radius: 50%;
    z-index: 1;
  }
}

.student-info {
  flex-grow: 1;
}

.student-name {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mastery-value {
  min-width: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.progress-container {
  flex-grow: 1;
  height: 8px;
  background: #edf2f7;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  min-width: 8px;
  transition: width 0.3s ease;

  &.excellent { background: #48bb78; }
  &.good { background: #f6ad55; }
  &.weak { background: #f56565; }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  span {
    color: #4a5568;
    font-size: 1rem;
  }
}

.error-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 8px;
  color: #c53030;

  .error-icon {
    width: 24px;
    height: 24px;
  }

  span {
    font-size: 1rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .competence-mastery {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .competence-stats {
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
.learning-resources {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);

  h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }
}

.resources-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.resource-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.resource-link {
  display: flex;
  text-decoration: none;
  color: inherit;
  padding: 1rem;
}

.resource-icon {
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  flex-shrink: 0;
  color: #4299e1;

  svg {
    width: 100%;
    height: 100%;
  }
}

.resource-content {
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #718096;
    line-height: 1.5;
  }
}

@media (max-width: 768px) {
  .resources-list {
    grid-template-columns: 1fr;
  }
}
</style>
