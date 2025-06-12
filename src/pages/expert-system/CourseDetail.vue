<template>
  <div class="container py-5">
    <div v-if="loading" class="d-flex justify-content-center align-items-center" style="min-height: 40vh;">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger text-center">{{ error }}</div>
    <div v-else-if="course" class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-lg border-0 rounded-4">
          <div class="card-body p-4">
            <h2 class="card-title fw-bold mb-3 text-primary">{{ course.title }}</h2>
            <h6 class="mb-3 text-secondary">Профессия: <span class="fw-semibold">{{ course.role_name }}</span></h6>
            <p class="card-text mb-4" style="font-size: 1.13rem;">{{ course.description || 'Описание курса отсутствует.' }}</p>
            <div class="mb-2">
              <span class="badge bg-info text-dark me-2" v-for="tag in course.tags || []" :key="tag">{{ tag }}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between align-items-center">
              <button class="btn btn-outline-primary" @click="goBack">
                <i class="bi bi-arrow-left"></i> Назад к курсам
              </button>
              <span class="text-muted small">
                ID: {{ course.id }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-muted py-5">Курс не найден.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const course = ref(null)

function goBack() {
  router.back()
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const id = route.params.id
    const resp = await apiClient.get(endpoints.expert_system.courses + id + '/')
    if (resp.success) {
      course.value = resp.data
    } else {
      error.value = 'Не удалось загрузить курс'
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки курса'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.card-title {
  letter-spacing: -1px;
}
.bg-info {
  background-color: #d1ecf1 !important;
}
</style>
