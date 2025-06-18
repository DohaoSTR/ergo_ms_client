<script setup>
import { computed,ref } from 'vue'

const props = defineProps({
  selectedCompetence: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      name: 'Не выбрана',
      description: 'Выберите компетенцию для просмотра статистики',
      indicatorsCount: 0,
      averageMastery: 0
    })
  },
  studentsData: {
    type: Object,
    default: () => ({
      competenceId: null,
      competenceName: '',
      indicatorsCount: 0,
      averageMastery: 0,
      students: []
    })
  }
})

const selectedGroup = ref('')

// Извлекаем уникальные группы из данных студентов
const availableGroups = computed(() => {
  const groups = new Set()
  props.studentsData.students?.forEach(student => {
    // Предполагаем, что группа есть в ФИО (например, "Иванов Иван (Группа 101)")
    const groupMatch = student.studentFio.match(/\((.+?)\)/)
    if (groupMatch) {
      groups.add(groupMatch[1])
    }
  })
  return Array.from(groups).sort()
})

// Фильтруем студентов по выбранной группе
const filteredStudents = computed(() => {
  if (!selectedGroup.value) return props.studentsData.students || []
  
  return props.studentsData.students?.filter(student => {
    const groupMatch = student.studentFio.match(/\((.+?)\)/)
    return groupMatch && groupMatch[1] === selectedGroup.value
  }) || []
})

// Классы для отображения уровня освоения
const getMasteryClass = (level) => {
  if (level >= 80) return 'bg-success'
  if (level >= 50) return 'bg-warning text-dark'
  return 'bg-danger'
}

const getProgressBarClass = (level) => {
  if (level >= 80) return 'bg-success'
  if (level >= 50) return 'bg-warning'
  return 'bg-danger'
}

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return 'Нет данных'
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('ru-RU', options)
}
</script>

<template>
  <div class="competence-stats-container">
    <div class="stats-header mb-4">
      <h2 class="mb-3">Статистика освоения компетенции</h2>
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div class="group-filter">
          <label for="groupFilter" class="form-label">Фильтр по группам:</label>
          <select 
            id="groupFilter" 
            class="form-select" 
            v-model="selectedGroup"
          >
            <option value="">Все группы</option>
            <option v-for="group in availableGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>
        <div class="competence-info">
          <h4>{{ studentsData.competenceName }}</h4>
          <p class="text-muted mb-1">
            Средний уровень освоения: 
            <span class="fw-bold">{{ studentsData.averageMastery }}%</span>
          </p>
          <p class="text-muted mb-0">
            Количество индикаторов: {{ studentsData.indicatorsCount }}
          </p>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>№</th>
            <th>Студент</th>
            <th>Уровень освоения</th>
            <th>Прогресс</th>
            <th>Предметы</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student.studentId">
            <td>{{ index + 1 }}</td>
            <td>{{ student.studentFio }}</td>
            <td>
              <span class="badge" :class="getMasteryClass(student.totalMastery)">
                {{ student.totalMastery }}%
              </span>
            </td>
            <td>
              <div class="progress">
                <div 
                  class="progress-bar" 
                  :class="getProgressBarClass(student.totalMastery)"
                  role="progressbar" 
                  :style="{ width: student.totalMastery + '%' }"
                  :aria-valuenow="student.totalMastery"
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  {{ student.totalMastery }}%
                </div>
              </div>
            </td>
            <td>
              <div class="subject-list">
                <div 
                  v-for="subject in student.subjects" 
                  :key="subject.subjectId"
                  class="subject-item"
                >
                  <span class="subject-name">{{ subject.subjectName }}</span>:
                  <span class="subject-grade">{{ subject.grade }} баллов</span>
                  <span class="subject-contribution">({{ subject.masteryContribution }}%)</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredStudents.length === 0" class="no-results text-center py-5">
      <p>Нет данных для отображения</p>
    </div>
  </div>
</template>

<style scoped>
.competence-stats-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stats-header {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-filter {
  width: 250px;
}

.competence-info h4 {
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.competence-info p {
  margin-bottom: 0;
}

.table {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.table th {
  font-weight: 600;
  color: #495057;
  border-top: none;
}

.table td {
  vertical-align: middle;
}

.progress {
  height: 24px;
  border-radius: 4px;
}

.no-results {
  background-color: white;
  border-radius: 8px;
  color: #6c757d;
}

.badge {
  font-size: 0.85em;
  padding: 0.35em 0.65em;
  border-radius: 4px;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subject-item {
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.subject-name {
  font-weight: 500;
}

.subject-grade {
  color: #0d6efd;
  font-weight: 500;
}

.subject-contribution {
  color: #6c757d;
  font-size: 0.8em;
}
</style>