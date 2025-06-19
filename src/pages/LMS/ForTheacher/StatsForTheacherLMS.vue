<template>
  <div class="students-container">
    <!-- Фиксированный контейнер для фильтров -->
    <div class="filters-header">
      <div class="filter-item">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск..."
            class="search-input"
          />
          <span class="search-icon"></span>
        </div>
      </div>
      <div class="filter-item">
        <select v-model="groupFilter" class="filter-select">
          <option value="">Все</option>
          <option v-for="group in uniqueGroups" :key="group" :value="group">{{ group }}</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="courseFilter" class="filter-select">
          <option value="">Все курсы</option>
          <option v-for="course in uniqueCourses" :key="course" :value="course">{{ course }}</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="progressFilter" class="filter-select">
          <option value="">Весь прогресс</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>
      <div class="filter-item">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Все</option>
          <option value="Активен">Активен</option>
          <option value="Неактивен">Неактивен</option>
        </select>
      </div>
    </div>

    <!-- Фиксированные заголовки таблицы -->
    <div class="table-headers">
      <div class="header-cell" @click="sortBy('name')">Студент</div>
      <div class="header-cell" @click="sortBy('group')">Группа</div>
      <div class="header-cell" @click="sortBy('course')">Курс</div>
      <div class="header-cell" @click="sortBy('progress')">Прогресс</div>
      <div class="header-cell" @click="sortBy('status')">Статус</div>
    </div>

    <!-- Прокручиваемое содержимое таблицы -->
    <div class="table-scroll-wrapper">
      <div class="table-content">
        <div class="table-row" v-for="(student, index) in filteredStudents" :key="index">
          <div class="table-cell">
            <div class="student-name">
              <img :src="student.avatar" alt="Аватар" class="student-avatar" />
              <span>{{ student.name }}</span>
            </div>
          </div>
          <div class="table-cell">{{ student.group }}</div>
          <div class="table-cell">{{ student.course }}</div>
          <div class="table-cell">
            <progress :value="student.progress" max="100"></progress>
            {{ student.progress }}%
          </div>
          <div class="table-cell">
            <span
              :class="[
                'student-status',
                student.status === 'Активен' ? 'status-active' : 'status-inactive',
              ]"
            >
              {{ student.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.students-container {
  width: 97.2%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Стили для фиксированного заголовка с фильтрами */
.filters-header {
  display: flex;
  width: 100%;
  background: white;
  padding: 8px 0;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 3;
}

.filter-item {
  flex: 1;
  padding: 0 8px;
  min-width: 0;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 8px 15px 8px 35px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #4caf50;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  font-size: 14px;
  pointer-events: none;
}

.filter-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-select:focus {
  border-color: #4caf50;
}

/* Стили для фиксированных заголовков таблицы */
.table-headers {
  display: flex;
  width: 99.88%;
  background: white;
  position: sticky;
  top: 57px; /* Высота filters-header */
  z-index: 2;
  border-bottom: 1px solid #e0e0e0;
}

.header-cell {
  flex: 1;
  padding: 12px 15px;
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-cell:last-child {
  border-right: none;
}

/* Стили для прокручиваемого содержимого таблицы */
.table-scroll-wrapper {
  max-height: 367px;
  overflow-y: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 0 0 8px 8px;
  border: 1px solid #e0e0e0;
  border-top: none;
}

.table-content {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.table-row {
  display: flex;
  background: white;
  
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  flex: 1;
  padding: 12px 15px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid #f0f0f0;
}

.student-name {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.student-status {
  text-align: center;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background: #ffebee;
  color: #c62828;
}

progress {
  width: 80%;
  height: 6px;
  border-radius: 3px;
  background-color: #eee;
}

progress::-webkit-progress-bar {
  background-color: #eee;
}
progress::-webkit-progress-value {
  background: #4caf50;
  border-radius: 3px;
}
progress::-moz-progress-bar {
  background: #4caf50;
}

.table-scroll-wrapper::-webkit-scrollbar {
  width: 10px;
}

.table-scroll-wrapper::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-bottom-right-radius: 8px;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: #a0a0a0;
}

.table-scroll-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f5f5f5;
  border-bottom-right-radius: 8px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters-header,
  .table-headers,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  }
  
  .filter-item,
  .header-cell,
  .table-cell {
    padding: 8px;
    font-size: 13px;
  }
  
  .student-avatar {
    width: 24px;
    height: 24px;
    margin-right: 6px;
  }
  
  progress {
    width: 100%;
  }
}
</style>

<script setup>
import { ref, computed } from 'vue'

const students = ref([
  {
    name: 'Иванов Алексей',
    group: 'ИАС-22',
    course: 'Веб-разработка',
    progress: 75,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Петрова Мария',
    group: 'БАС-23',
    course: 'Машинное обучение',
    progress: 42,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Сидоров Дмитрий',
    group: 'ПРИ-21',
    course: 'Алгоритмы и структуры данных',
    progress: 90,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
  },
  {
    name: 'Кузнецова Анна',
    group: 'ИВТ-23',
    course: 'Базы данных',
    progress: 15,
    status: 'Неактивен',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
  },
  {
    name: 'Федоров Максим',
    group: 'ИАС-21',
    course: 'Python для анализа данных',
    progress: 68,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
  },
  {
    name: 'Смирнова Ольга',
    group: 'ИАС-22',
    course: 'Веб-разработка',
    progress: 55,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
  {
    name: 'Козлов Андрей',
    group: 'БАС-23',
    course: 'Машинное обучение',
    progress: 80,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    name: 'Николаева Светлана',
    group: 'ПРИ-21',
    course: 'Алгоритмы и структуры данных',
    progress: 35,
    status: 'Неактивен',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    name: 'Волков Евгений',
    group: 'ИВТ-23',
    course: 'Базы данных',
    progress: 20,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/men/77.jpg',
  },
  {
    name: 'Орлова Дарья',
    group: 'ИАС-21',
    course: 'Python для анализа данных',
    progress: 92,
    status: 'Активен',
    avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
  },
  {
    name: 'Морозов Илья',
    group: 'ИАС-22',
    course: 'Веб-разработка',
    progress: 33,
    status: 'Неактивен',
    avatar: 'https://randomuser.me/api/portraits/men/29.jpg',
  },
])

const sortKey = ref('')
const sortAsc = ref(true)
const searchQuery = ref('')
const groupFilter = ref('')
const courseFilter = ref('')
const progressFilter = ref('')
const statusFilter = ref('')

const uniqueGroups = computed(() => {
  const groups = new Set(students.value.map(student => student.group))
  return Array.from(groups).sort()
})

const uniqueCourses = computed(() => {
  const courses = new Set(students.value.map(student => student.course))
  return Array.from(courses).sort()
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedStudents = computed(() => {
  return [...students.value].sort((a, b) => {
    const order = sortAsc.value ? 1 : -1

    if (sortKey.value === 'progress') {
      return order * (a.progress - b.progress)
    }

    if (sortKey.value === 'status') {
      const getStatusScore = (s) => (s === 'Активен' ? 1 : 0)
      return order * (getStatusScore(a.status) - getStatusScore(b.status))
    }

    const valA = a[sortKey.value]?.toLowerCase?.() ?? ''
    const valB = b[sortKey.value]?.toLowerCase?.() ?? ''
    return order * valA.localeCompare(valB, 'ru')
  })
})

const filteredStudents = computed(() => {
  return sortedStudents.value.filter(student => {
    const nameMatch = student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const groupMatch = groupFilter.value ? student.group === groupFilter.value : true
    const courseMatch = courseFilter.value ? student.course === courseFilter.value : true
    let progressMatch = true
    if (progressFilter.value === 'high') {
      progressMatch = student.progress >= 75
    } else if (progressFilter.value === 'medium') {
      progressMatch = student.progress >= 30 && student.progress < 75
    } else if (progressFilter.value === 'low') {
      progressMatch = student.progress < 30
    }
    const statusMatch = statusFilter.value ? student.status === statusFilter.value : true
    
    return nameMatch && groupMatch && courseMatch && progressMatch && statusMatch
  })
})
</script>
