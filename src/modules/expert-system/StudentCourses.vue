<template>
  <section class="student-courses-list">
    <h4 class="mb-4 fs-2 text-gradient">Курсы для студентов</h4>
    <div class="row g-4">
      <aside class="col-md-3">
        <div class="card border-0 shadow-lg rounded-4 p-4">
          <h6 class="fw-bold mb-3 fs-4 text-primary d-flex align-items-center">
            <i class="bi bi-list-task"></i> Профессии
          </h6>
          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="only-my-role"
              v-model="onlyMyRole"
            />
            <label class="form-check-label" for="only-my-role">
              Только по моей профессии
            </label>
          </div>
          <ul class="list-unstyled mb-3 ps-2">
            <li v-for="role in roles" :key="role.id" class="form-check mb-2 ps-1">
              <input
                class="form-check-input"
                type="checkbox"
                :id="`role-check-${role.id}`"
                :value="role.id"
                v-model="selectedRoleIds"
                :disabled="onlyMyRole && role.id !== userRoleId"
              />
              <label
                class="form-check-label"
                :for="`role-check-${role.id}`"
                :class="{
                  'fw-bold text-primary': userRoleId === role.id,
                  'text-muted': onlyMyRole && role.id !== userRoleId
                }"
              >
                {{ role.name }}
                <span v-if="role.id === userRoleId" class="badge bg-success ms-2">Моя профессия</span>
              </label>
            </li>
          </ul>
        </div>
      </aside>
      <div class="col-md-9">
        <ul class="list-unstyled">
          <li v-if="loading" class="text-center text-muted py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2">Загрузка курсов…</p>
          </li>
          <li v-else-if="!filteredCourses.length" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 text-secondary"></i>
            <p class="mt-2">Нет доступных курсов по выбранным профессиям.</p>
          </li>
          <li
            v-for="course in filteredCourses"
            :key="course.id"
            class="card border-0 shadow-sm mb-4 rounded-3 overflow-hidden"
          >
            <div class="card-body d-flex flex-column flex-md-row gap-4">
              <div class="course-info flex-grow-1">
                <h6 class="mb-2 fw-semibold fs-4">
                  {{ course.title }}
                </h6>
                <div class="text-muted mb-3" style="font-size:0.9rem;">
                  {{ course.description }}
                </div>
              </div>
              <div class="d-flex align-items-center">
                <router-link
                  :to="`/course/${course.id}`"
                  class="btn btn-primary text-light px-3 py-2 rounded-pill"
                >
                  Подробнее
                </router-link>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const roles = ref([])
const courses = ref([])
const loading = ref(false)
const userRoleId = ref(null)
const onlyMyRole = ref(true)
const selectedRoleIds = ref([])


async function loadRoles() {
  const resp = await apiClient.get(endpoints.expert_system.roles)
  if (resp.success) roles.value = resp.data
}


async function loadStudentProfile() {
  const resp = await apiClient.get(endpoints.expert_system.studentsMe)
  if (resp.success && resp.data.role) {
    userRoleId.value = resp.data.role

    selectedRoleIds.value = [resp.data.role]
  }
}

async function loadCourses() {
  loading.value = true
  courses.value = []
  try {
    const resp = await apiClient.get(endpoints.expert_system.courses)
    if (resp.success) courses.value = resp.data
  } finally {
    loading.value = false
  }
}


watch(onlyMyRole, (val) => {
  if (val && userRoleId.value) {
    selectedRoleIds.value = [userRoleId.value]
  }
})

watch(userRoleId, (val) => {
  if (onlyMyRole.value && val) {
    selectedRoleIds.value = [val]
  }
})

const filteredCourses = computed(() => {

  if (!selectedRoleIds.value.length) return courses.value
  return courses.value.filter(course => selectedRoleIds.value.includes(course.role))
})

onMounted(async () => {
  await Promise.all([loadRoles(), loadStudentProfile(), loadCourses()])
})
</script>

<style scoped>
.student-courses-list {
  font-family: 'Segoe UI', sans-serif;
}
.bg-primary {
  background-color: #0d6efd !important;
}
.text-gradient {
  background: linear-gradient(90deg,#1a2980,#26d0ce);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.card .badge.bg-success {
  font-size: 0.78em;
  vertical-align: middle;
}
</style>
