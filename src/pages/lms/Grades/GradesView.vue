<script setup>
import { ref, onMounted } from 'vue'
import { BarChart, TrendingUp, Award } from 'lucide-vue-next'
import RoleGuard from '../components/RoleGuard.vue'

const grades = ref([])

function fetchGrades() {
  grades.value = [
    {
      id: 1,
      course: 'Основы веб-разработки',
      assignment: 'HTML/CSS проект',
      grade: 85,
      maxGrade: 100,
      date: '2024-01-12',
      type: 'assignment'
    },
    {
      id: 2,
      course: 'Python для начинающих',
      assignment: 'Тест по синтаксису',
      grade: 92,
      maxGrade: 100,
      date: '2024-01-10',
      type: 'test'
    }
  ]
}

function getGradeClass(grade, maxGrade) {
  const percentage = (grade / maxGrade) * 100
  if (percentage >= 90) return 'text-success'
  if (percentage >= 70) return 'text-warning'
  return 'text-danger'
}

onMounted(fetchGrades)
</script>

<template>
  <RoleGuard 
    :required-roles="['student']" 
    fallback-message="Раздел оценок доступен только студентам"
  >
    <div class="grades-view">
    <h3 class="mb-4">Мои оценки</h3>
    
    <div class="row">
      <div v-for="grade in grades" :key="grade.id" class="col-lg-6 mb-4">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h6>{{ grade.assignment }}</h6>
                <small class="text-muted">{{ grade.course }}</small>
              </div>
              <span :class="`fw-bold ${getGradeClass(grade.grade, grade.maxGrade)}`">
                {{ grade.grade }}/{{ grade.maxGrade }}
              </span>
            </div>
            <small class="text-muted">{{ new Date(grade.date).toLocaleDateString('ru') }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
  </RoleGuard>
</template>

<style scoped>
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 