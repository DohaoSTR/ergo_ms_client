<template>
  <div class="students-container">
    <div class="table-scroll-wrapper">
      <table class="students-table">
        <thead>
          <tr>
            <th @click="sortBy('course')">Курс</th>
            <th @click="sortBy('progress')">Прогресс</th>
            <th @click="sortBy('grade')">Оценка</th>
            <th @click="sortBy('deadline')">Сроки</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, index) in sortedCourses" :key="index">
            <td>{{ course.course }}</td>
            <td>
              <progress :value="course.progress" max="100"></progress>
              {{ course.progress }}%
            </td>
            <td>{{ course.grade }}</td>
            <td>{{ course.deadline }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
.students-container {
  width: 97.2%;
}

.table-scroll-wrapper {
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 800px;
}

.students-table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
  cursor: pointer;
  padding: 10px 15px;
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #f0f0f0;
}

.students-table td {
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  vertical-align: middle;
  text-align: center;
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
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
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
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

@media (max-width: 768px) {
  .students-table {
    display: block;
    overflow-x: auto;
  }
  progress {
    width: 100%;
  }
}
</style>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const sortKey = ref('')
const sortAsc = ref(true)

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const courses = computed(() => {
  if (!props.stats?.subjects) return []
  
  return props.stats.subjects.map(subject => ({
    course: subject.name,
    progress: subject.progress || 0,
    grade: subject.grade || 0,
    deadline: subject.deadline || 'Нет срока'
  }))
})

const sortedCourses = computed(() => {
  return [...courses.value].sort((a, b) => {
    const order = sortAsc.value ? 1 : -1

    if (sortKey.value === 'progress') {
      return order * (a.progress - b.progress)
    }

    if (sortKey.value === 'grade') {
      return order * (a.grade - b.grade)
    }

    if (sortKey.value === 'deadline') {
      const dateA = new Date(a.deadline.split('.').reverse().join('-'))
      const dateB = new Date(b.deadline.split('.').reverse().join('-'))
      return order * (dateA - dateB)
    }

    const valA = a[sortKey.value]?.toLowerCase?.() ?? ''
    const valB = b[sortKey.value]?.toLowerCase?.() ?? ''
    return order * valA.localeCompare(valB, 'ru')
  })
})
</script>