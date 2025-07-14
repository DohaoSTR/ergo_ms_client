<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <CreateVacancy @created="fetchVacancies" @error="$emit('error', $event)" />
      <input v-model="searchTerm" type="text" class="form-control fs-5 form-control-sm w-50 mt-2"
        placeholder="Поиск вакансий..." />
    </div>

    <div class="row mt-2 gy-4">
      <div class="col-md-4" v-for="vac in filteredVacancies" :key="vac.id">
        <div class="card h-100 shadow-lg border-success vacancy-card">
          <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fs-4">{{ vac.title }}</h5>
            <button class="btn btn-outline-light btn-sm" @click="openApplications(vac)">
              Отклики
              <span class="badge bg-warning text-dark ms-1">
                {{ vac.applications_count || 0 }}
              </span>
            </button>
          </div>
          <div class="card-body d-flex flex-column">
            <p class="card-text mb-4">{{ vac.description }}</p>
            <div class="mb-4">
              <strong>Навыки:</strong>
              <div class="mt-2">
                <span v-for="skill in vac.required_skills_info" :key="skill.id" class="badge bg-success me-1 mb-1">
                  {{ skill.name }}
                </span>
                <span v-if="!vac.required_skills_info.length" class="text-muted">
                  нет
                </span>
              </div>
            </div>
            <div class="mt-auto d-flex justify-content-end gap-2">
              <EditVacancy :vacancy="vac" @updated="fetchVacancies" @error="$emit('error', $event)" />
              <button class="btn btn-danger btn-sm" @click="deleteVacancy(vac.id)">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredVacancies.length" class="col-12 text-center text-muted py-5">
        Вакансии не найдены.
      </div>
    </div>

    <div
      v-if="showApplications"
      class="modal-backdrop"
      @click.self="closeApplicationsModal"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content p-4">
          <button type="button" class="btn-close float-end" @click="closeApplicationsModal"></button>
          <h5 class="mb-3">Отклики на вакансию: {{ selectedVacancy?.title }}</h5>
          <div v-if="loadingApplications" class="text-center my-4">
            <div class="spinner-border text-success"></div>
            <div class="mt-2 text-muted">Загрузка откликов...</div>
          </div>
          <div v-else-if="applications.length === 0" class="text-muted text-center my-4">
            Откликов нет.
          </div>
          <ul class="list-group" v-else>
            <li v-for="app in applications" :key="app.id"
                class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <b>Кандидат:</b>
                <router-link v-if="app.candidate" :to="`/student/${app.candidate}`" class="link-primary fw-semibold" style="text-decoration: underline;">
                  {{ app.candidate_name || `ID: ${app.candidate}` }}
                </router-link>
                <span v-else class="text-muted">Неизвестно</span>
                <br>
                <small class="text-muted">Отклик: {{ formatDate(app.applied_at) }}</small>
              </div>
              <span class="badge bg-info text-dark ms-2">
                {{ app.match_score || 0 }}%
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import CreateVacancy from '@/modules/expert-system/CreateVacancy.vue'
import EditVacancy from '@/modules/expert-system/EditVacancy.vue'

const emit = defineEmits(['error'])
const vacancies = ref([])
const searchTerm = ref('')
const applications = ref([])
const loadingApplications = ref(false)
const selectedVacancy = ref(null)
const showApplications = ref(false)

function handleEsc(e) {
  if (e.key === 'Escape' && showApplications.value) closeApplicationsModal()
}
onMounted(() => window.addEventListener('keydown', handleEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEsc))

async function fetchVacancies() {
  try {
    const res = await apiClient.get(endpoints.expert_system.vacancies)
    if (res.success) {
      const allVacancies = res.data
      for (const vac of allVacancies) {
        vac.applications_count = await fetchApplicationsCount(vac.id)
      }
      vacancies.value = allVacancies
    } else throw new Error(JSON.stringify(res.errors))
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить вакансии')
  }
}

async function fetchApplicationsCount(vacancyId) {
  try {
    const res = await apiClient.get(endpoints.expert_system.applications, { vacancy: vacancyId })
    return res.success ? res.data.length : 0
  } catch {
    return 0
  }
}

async function deleteVacancy(id) {
  try {
    const res = await apiClient.delete(`${endpoints.expert_system.vacancies}${id}/`)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    await fetchVacancies()
  } catch (err) {
    emit('error', err.message || 'Ошибка при удалении')
  }
}

const filteredVacancies = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return vacancies.value
  return vacancies.value.filter(v =>
    v.title.toLowerCase().includes(term) ||
    v.description.toLowerCase().includes(term) ||
    v.required_skills_info.some(s =>
      s.name.toLowerCase().includes(term)
    )
  )
})

async function openApplications(vacancy) {
  selectedVacancy.value = vacancy
  applications.value = []
  loadingApplications.value = true
  try {
    const res = await apiClient.get(endpoints.expert_system.applications, { vacancy: vacancy.id })
    if (res.success) {
      applications.value = res.data.map(app => ({
        ...app,
        candidate_name: app.candidate_full_name || app.candidate_name || null,
      }))
    } else {
      applications.value = []
    }
  } catch {
    applications.value = []
  }
  loadingApplications.value = false
  showApplications.value = true
}
function closeApplicationsModal() {
  showApplications.value = false
  selectedVacancy.value = null
}

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5)
}

onMounted(fetchVacancies)
</script>

<style scoped>
.vacancy-card {
  padding: 0;
  border: 2px solid green;
  transition: transform .2s, box-shadow .2s;
}

.vacancy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.5rem 1rem rgba(0, 128, 0, 0.3);
}

.card-header h5 {
  font-size: 1.1rem;
}

.badge {
  font-size: 0.8rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-dialog {
  background: #fff;
  border-radius: .7rem;
  max-width: 600px;
  width: 98vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 0 16px 0 #15572422;
  position: relative;
  animation: fadeIn .2s;
}
.modal-dialog-scrollable {
  overflow-y: auto;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95);}
  to   { opacity: 1; transform: scale(1);}
}
</style>
