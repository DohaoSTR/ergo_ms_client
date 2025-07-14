<template>
  <div class="pb-2 px-0">
    <div class="profile-info-block card shadow rounded-4 position-relative overflow-hidden">
      <div class="d-flex flex-wrap align-items-center justify-content-between px-3 py-4">
        <div>
          <h1 class="profile-name ps-2">
            {{ student.first_name }} {{ student.last_name }}
            <span class="badge bg-light text-primary ms-2" v-if="student.group_name">{{ student.group_name }}</span>
          </h1>
          <div class="profile-meta mb-1">
            <i class="bi bi-laptop me-2"></i>
            <span>Опыт в IT:
              <b :class="student.has_experience ? 'text-success' : 'text-danger'">
                {{ student.has_experience ? 'Есть' : 'Нет' }}
              </b>
            </span>
          </div>
          <div class="profile-contacts mt-3 d-flex flex-wrap gap-4">
            <div class="contact-item" v-tooltip="'Email для связи с кандидатом'">
              <i class="bi bi-envelope-at contact-icon text-info"></i>
              <div class="contact-label">Email для связи:</div>
              <span class="contact-value">{{ student.email || 'не указан' }}</span>
            </div>
            <div class="contact-item" v-tooltip="'Телефон для оперативного контакта'">
              <i class="bi bi-telephone contact-icon text-info"></i>
              <div class="contact-label">Телефон для связи:</div>
              <span class="contact-value">{{ student.phone || 'не указан' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 align-items-start">
      <div class="col-lg-12">
        <div class="card shadow-sm rounded-4 mb-4">
          <div class="card-body">
            <h5 class="mb-3 fw-bolder">
              <i class="bi bi-lightbulb-fill text-primary"></i>Навыки
            </h5>
            <div v-if="studentSkillsFull.length" class="skills-list">
              <div v-for="skill in studentSkillsFull" :key="skill.id"
                class="skill-badge-2 d-inline-flex align-items-center gap-2 mb-2 me-2"
                :class="{
                  'border-primary bg-opacity-10': skill.status === 'confirmed',
                  'border-warning bg-opacity-10': skill.status === 'unconfirmed',
                  'border-info bg-opacity-10': skill.status === 'in_progress',
                }"
                style="border:1.5px solid; background:#fff">
                <span>{{ skill.name }}</span>
                <span class="ms-2 text-secondary small fst-italic">
                  {{ statusText(skill.status) }}
                </span>
              </div>
            </div>
            <div v-else class="text-muted fst-italic">Нет навыков</div>
          </div>
        </div>
        <div class="card shadow-sm rounded-4 mb-4">
          <div class="card-body d-flex flex-column flex-md-row align-items-start justify-content-between">
            <div class="flex-grow-1 mb-4 mb-md-0">
              <div class="d-flex align-items-center gap-1 mb-2">
                <i class="bi bi-briefcase text-success"></i>
                <h5 class="mb-0 fw-bolder">Сравнение с вакансией</h5>
                <select v-if="vacancies.length" v-model="selectedVacancyId"
                  class="form-select form-select-sm w-auto ms-3">
                  <option v-for="vac in vacancies" :key="vac.id" :value="vac.id">
                    {{ vac.title }}
                  </option>
                </select>
              </div>
              <ul class="list-group mt-2 mb-0">
                <li v-for="skill in selectedVacancySkills" :key="skill.id"
                  class="list-group-item d-flex align-items-center justify-content-between border-0 px-2 py-2"
                  :class="studentSkillsSet.has(skill.id) ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'">
                  <span class="fw-medium">{{ skill.name }}</span>
                  <span>
                    <i v-if="studentSkillsSet.has(skill.id)" class="bi bi-check-circle-fill text-success"
                      title="Навык есть у студента"></i>
                    <i v-else class="bi bi-x-circle-fill text-danger" title="Навыка нет"></i>
                  </span>
                </li>
                <li v-if="!selectedVacancySkills.length" class="list-group-item text-muted">
                  Нет навыков в вакансии
                </li>
              </ul>
            </div>
            <div class="ms-md-4 d-flex flex-column align-items-center justify-content-center">
              <apexchart v-if="selectedVacancySkills.length" type="radialBar" height="140" width="140"
                :options="apexOptions" :series="[matchScore]" class="mb-1"></apexchart>
              <div v-else class="text-muted small py-5">Выберите вакансию</div>
              <div class="mt-2 text-center">
                <div class="text-muted small">
                  <span v-if="currentApplication && currentApplication.match_score !== undefined">
                    Из заявки: совпадение по навыкам
                    <br>
                    <span class="text-secondary">
                      ({{ formatDate(currentApplication.applied_at) }})
                    </span>
                  </span>
                  <span v-else>Текущий уровень совпадения</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const statusText = status => {
  switch (status) {
    case 'confirmed': return 'Подтверждён'
    case 'unconfirmed': return 'Не подтверждён'
    default: return 'Неизвестно'
  }
}

const formatDate = dt => {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5)
}

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const student = ref({})
const studentSkillsRaw = ref([])
const allSkills = ref([])
const vacancies = ref([])
const selectedVacancyId = ref(null)
const applications = ref([])

async function fetchStudent() {
  loading.value = true
  error.value = null
  try {
    const res = await apiClient.get(`${endpoints.expert_system.students}${route.params.id}/`)
    if (!res.success) throw new Error('Не удалось загрузить профиль студента')
    student.value = res.data
  } catch (e) {
    error.value = e.message || 'Ошибка при загрузке профиля'
  } finally {
    loading.value = false
  }
}
async function fetchStudentSkills() {
  try {
    const res = await apiClient.get(`${endpoints.expert_system.userSkills}?user=${route.params.id}`)
    studentSkillsRaw.value = res.success ? res.data : []
  } catch {
    studentSkillsRaw.value = []
  }
}
async function fetchAllSkills() {
  try {
    const res = await apiClient.get(endpoints.expert_system.skills)
    allSkills.value = res.success ? res.data : []
  } catch {
    allSkills.value = []
  }
}
async function fetchVacancies() {
  try {
    const res = await apiClient.get(endpoints.expert_system.vacancies)
    vacancies.value = res.success ? res.data : []
    if (vacancies.value.length && !selectedVacancyId.value)
      selectedVacancyId.value = vacancies.value[0].id
  } catch {
    vacancies.value = []
  }
}
async function fetchApplications() {
  try {
    const res = await apiClient.get(endpoints.expert_system.applications, { user: route.params.id })
    applications.value = res.success ? res.data : []
  } catch {
    applications.value = []
  }
}

const studentSkillsSet = computed(() => new Set(studentSkillsRaw.value.map(s => s.skill)))
const studentSkillsFull = computed(() =>
  studentSkillsRaw.value
    .map(s => {
      const skillObj = allSkills.value.find(skill => skill.id === s.skill)
      return skillObj ? { ...skillObj, status: s.status } : null
    })
    .filter(Boolean)
)
const selectedVacancySkills = computed(() => {
  const vac = vacancies.value.find(v => v.id === selectedVacancyId.value)
  return vac?.required_skills_info || []
})

const currentApplication = computed(() =>
  applications.value.find(app => app.vacancy === selectedVacancyId.value)
)

const matchScore = computed(() => {
  if (currentApplication.value && currentApplication.value.match_score !== undefined)
    return Math.round(currentApplication.value.match_score)
  if (!selectedVacancySkills.value.length) return 0
  const required = selectedVacancySkills.value.map(s => s.id)
  const matched = required.filter(id => studentSkillsSet.value.has(id))
  return Math.round((matched.length / required.length) * 100)
})
const apexOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      track: { background: '#e0e0e0' },
      dataLabels: {
        show: true,
        name: { show: false },
        value: {
          offsetY: 8,
          fontSize: '24px',
          fontWeight: 700,
          formatter: () => `${matchScore.value} %`,
        },
      },
    },
  },
  fill: { colors: [getMatchColor(matchScore.value)] },
  stroke: { lineCap: 'round' },
  labels: ['Соответствие'],
}))
function getMatchColor(score) {
  if (score >= 75) return '#4CAF50'
  if (score >= 50) return '#FFA726'
  return '#EF5350'
}
onMounted(async () => {
  await fetchStudent()
  await fetchStudentSkills()
  await fetchAllSkills()
  await fetchVacancies()
  await fetchApplications()
})
watch(vacancies, (val) => {
  if (val.length && !selectedVacancyId.value) selectedVacancyId.value = val[0].id
})
</script>

<style scoped>
.profile-info-block {
  position: relative;
  margin-bottom: 1.3rem;
  box-shadow: 0 0.5rem 1.5rem 0 #9ae2ff13, 0 1.2rem 1.2rem -1rem #1ec4e60d;
}

.profile-name {
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: -1px;
}
.profile-meta {
  font-size: 1.12rem;
  color: #555b77;
  margin-bottom: 0.25rem;
}
.badge.bg-light {
  font-size: 1.01rem;
  vertical-align: middle;
  background: #eaf7ff !important;
  border-radius: 0.8rem;
  padding: 0.22rem 0.85rem;
  font-weight: 600;
}

.profile-contacts {
  color: #252d37;
  font-size: 1.09rem;
  margin-top: 0.2rem;
}
.contact-item {
  background: #f6fbfe;
  border-radius: 1rem;
  padding: 0.45rem 1.1rem 0.45rem 0.8rem;
  min-width: 200px;
  box-shadow: 0 2px 9px #90d8ff16;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: box-shadow .2s, background .18s;
}
.contact-item:hover {
  background: #eaf7ff;
  box-shadow: 0 3px 16px #90d8ff44;
}
.contact-icon {
  font-size: 1.32rem;
  margin-right: 0.24rem;
  margin-bottom: 0.13rem;
  opacity: 0.92;
}
.contact-label {
  font-size: 0.99rem;
  color: #228be6;
  font-weight: 500;
  margin-bottom: 0.01rem;
}
.contact-value {
  color: #21344b;
  font-size: 1.13rem;
  font-weight: 600;
  word-break: break-all;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1rem;
}
.skill-badge-2 {
  min-width: 120px;
  background: #fff;
  font-size: 1em;
  border-radius: 20px;
  border: 1.5px solid #dee2e6;
  padding: 0.4rem 1rem;
}
.list-group-item {
  border-radius: 0.5rem !important;
  border: none !important;
  margin-bottom: 0.18rem;
  font-size: 1em;
}
</style>
