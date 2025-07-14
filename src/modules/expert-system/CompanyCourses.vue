<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <button class="btn btn-outline-primary btn-sm" @click="showCreate = true">
        + Создать курс
      </button>
      <input
        v-model="searchTerm"
        type="text"
        class="form-control fs-5 form-control-sm search-input"
        placeholder="Поиск курсов..."
      />
    </div>

    <div class="row mt-4 gy-4 mx-auto cards-container">
      <div
        class="col-lg-4 col-md-6 d-flex"
        v-for="course in filteredCourses"
        :key="course.id"
      >
        <div class="card h-100 shadow-lg border-danger course-card flex-fill">
          <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fs-4">{{ course.title }}</h5>
            <span class="badge bg-light text-danger">{{ getRoleName(course.role) }}</span>
          </div>
          <div class="card-body d-flex flex-column">
            <p class="card-text mb-3">{{ course.description }}</p>
            <div class="mt-auto d-flex justify-content-end gap-2">
              <button class="btn btn-success btn-sm text-white" @click="openEdit(course)">
                Редактировать
              </button>
              <button class="btn btn-danger btn-sm" @click="remove(course)">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!filteredCourses.length" class="col-12 text-center text-muted py-5">
        Курсы не найдены.
      </div>
    </div>

    <div v-if="showEdit" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-content p-4 bg-white">
          <button type="button" class="btn-close float-end" @click="closeEdit" />
          <h5 class="mb-3">Редактировать курс</h5>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
          <form @submit.prevent="onEdit">
            <div class="mb-2">
              <label class="form-label">Название</label>
              <input v-model="editForm.title" class="form-control" required />
            </div>
            <div class="mb-2">
              <label class="form-label">Профессия</label>
              <select v-model="editForm.role" class="form-control" required>
                <option disabled value="">Выберите профессию</option>
                <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Описание</label>
              <textarea v-model="editForm.description" class="form-control" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Сохраняем...' : 'Сохранить' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <CreateCourse v-if="showCreate" @created="onCreated" @close="showCreate = false" :roles="roles" :employer-id="employerId" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import CreateCourse from './CreateCourse.vue'

const courses = ref([])
const roles = ref([])
const employerId = ref(null)
const loading = ref(false)
const error = ref(null)
const searchTerm = ref('')
const showCreate = ref(false)
const showEdit = ref(false)
const currentId = ref(null)
const editForm = ref({ title: '', description: '', role: '' })

function getRoleName(roleId) {
  const r = roles.value.find(r => r.id === roleId)
  return r ? r.name : 'Не указано'
}

const filteredCourses = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return courses.value
  return courses.value.filter(course =>
    course.title.toLowerCase().includes(term) ||
    course.description.toLowerCase().includes(term) ||
    getRoleName(course.role).toLowerCase().includes(term)
  )
})

async function fetchCourses() {
  loading.value = true
  try {
    const res = await apiClient.get(endpoints.expert_system.courses)
    courses.value = res.data || []
  } catch {
    courses.value = []
  } finally {
    loading.value = false
  }
}
async function fetchRoles() {
  try {
    const res = await apiClient.get(endpoints.expert_system.roles)
    roles.value = res.data || []
  } catch {
    roles.value = []
  }
}
async function fetchEmployer() {
  try {
    const res = await apiClient.get(endpoints.expert_system.companiesMe)
    employerId.value = res.data.id
  } catch {
    employerId.value = null
  }
}

onMounted(() => {
  fetchCourses()
  fetchRoles()
  fetchEmployer()
})

function openEdit(course) {
  showEdit.value = true
  error.value = null
  currentId.value = course.id
  editForm.value = { title: course.title, description: course.description, role: course.role }
}

function closeEdit() {
  showEdit.value = false
  error.value = null
  currentId.value = null
}

async function onEdit() {
  error.value = null
  loading.value = true
  try {
    const payload = {
      ...editForm.value,
      employer: employerId.value
    }
    const res = await apiClient.put(endpoints.expert_system.courses + currentId.value + '/', payload)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    await fetchCourses()
    closeEdit()
  } catch (err) {
    error.value = err.message || 'Ошибка'
  } finally {
    loading.value = false
  }
}

async function remove(course) {
  if (!confirm('Удалить курс?')) return
  try {
    await apiClient.delete(endpoints.expert_system.courses + course.id + '/')
    await fetchCourses()
  } catch {
    error.value = 'Ошибка удаления'
  }
}

function onCreated() {
  showCreate.value = false
  fetchCourses()
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-white {
  background: #fff !important;
}
</style>
