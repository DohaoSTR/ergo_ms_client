<!-- pages/projects/ProjectDetails.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const project = ref(null)
const isLoading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await fetch(`/api/projects/${route.params.id}/`)
    if (response.ok) {
      project.value = await response.json()
    } else {
      error.value = 'Проект не найден'
    }
  } catch (error) {
    error.value = 'Ошибка загрузки проекта'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="project-details">
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>{{ project.name }}</h1>
      <p>Дата создания: {{ project.dateofcreation }}</p>
      <!-- Дополнительная информация о проекте -->
    </div>
  </div>
</template>

<style scoped>
.project-details {
  padding: 20px;
}
.loading, .error {
  text-align: center;
  padding: 20px;
}
</style>