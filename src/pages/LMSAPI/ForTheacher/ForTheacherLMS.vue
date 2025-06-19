<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import LastActivityLMS from './LastActivityLMS.vue'
import TheacherInfoLMS from './TheacherInfoLMS.vue'
import StatsForTheacherLMS from './StatsForTheacherLMS.vue'

const teacherData = ref(null)
const stats = ref(null)
const activities = ref([])

const fetchData = async () => {
  try {
    const [teacherResponse, statsResponse, activitiesResponse] = await Promise.all([
      axios.get('/api/lms/teacher/'),
      axios.get('/api/lms/analytics/teacher_stats/'),
      axios.get('/api/lms/activities/')
    ])
    teacherData.value = teacherResponse.data
    stats.value = statsResponse.data
    activities.value = activitiesResponse.data
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
            <TheacherInfoLMS v-if="teacherData" :teacher="teacherData" :stats="stats" />
            <StatsForTheacherLMS v-if="stats" :stats="stats" />
        </div>
        <div class="sidebar">
            <LastActivityLMS v-if="activities.length" :activities="activities" />
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
