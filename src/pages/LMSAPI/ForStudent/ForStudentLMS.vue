<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import GrapsInLearningLMS from './GrapsInLearningLMS.vue'
import StudentInfoLMS from './StudentInfoLMS.vue'
import StatsForStudentLMS from './StatsForStudentLMS.vue'

const studentData = ref(null)
const stats = ref(null)
const gaps = ref([])

const fetchData = async () => {
  try {
    const [studentResponse, statsResponse] = await Promise.all([
      axios.get('/api/lms/student/'),
      axios.get('/api/lms/analytics/student_stats/')
    ])
    studentData.value = studentResponse.data
    stats.value = statsResponse.data
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
    <div class="dashboard-container">
        <div class="main-content">
            <StudentInfoLMS v-if="studentData" :student="studentData" :stats="stats" />
            <StatsForStudentLMS v-if="stats" :stats="stats" />
        </div>
        <div class="sidebar">
            <GrapsInLearningLMS v-if="stats" :stats="stats" />
        </div>
    </div>
</template>

<style>
    .dashboard-container {
        display: flex;
        width: 100%;
    }

    .main-content {
        flex: 1;
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .sidebar {
        position: relative;
    }
</style>