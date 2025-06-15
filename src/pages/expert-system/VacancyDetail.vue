<template>
  <div class="vacancy-detail">
    <div class="d-flex align-items-center mb-5">
      <button class="btn btn-outline-secondary me-3 rounded-circle d-flex align-items-center justify-content-center"
        @click="$router.back()" aria-label="Назад" style="width: 40px; height: 40px;">
        <ArrowLeftCircle class="text-primary" />
      </button>
      <h4 class="text-primary fw-bold mb-0">Назад</h4>
    </div>

    <div v-if="loading" class="text-center my-5 py-5">
      <div class="mb-3">
        <Loader />
      </div>
      <h5 class="text-muted">Загружаем информацию о вакансии...</h5>
    </div>

    <div v-else-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <AlertTriangle class="me-2" />
      <div class="fw-medium">{{ error }}</div>
    </div>

    <div v-else class="container px-0">
      <div class="vacancy-banner mb-4 p-4 rounded-4 position-relative overflow-hidden">
        <div class="position-relative z-1">
          <h2 class="h3 title-block mb-3 text-white">{{ vacancy.title }}</h2>
          <div class="d-flex align-items-center">
            <Building class="text-white me-2" />
            <router-link :to="`/company/${vacancy.employer}`" class="text-decoration-none text-secondary title-block">
              {{ vacancy.employer_name }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Описание -->
        <div class="col-md-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-primary bg-opacity-10 text-primary me-3">
                  <FileText :size="30" />
                </div>
                <h5 class="mb-0 title-block">Описание</h5>
              </div>
              <p class="card-text bg-light p-3 rounded-3">{{ vacancy.description || 'Нет описания' }}</p>
            </div>
          </div>
        </div>

        <!-- Требуемые навыки + match_score -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-primary bg-opacity-10 text-primary me-3">
                  <Lightbulb :size="30" />
                </div>
                <h5 class="mb-0 fw-semibold">Требуемые навыки</h5>
              </div>
              <div class="d-flex flex-wrap gap-1 mt-3 mb-4">
                <span v-for="skill in vacancy.required_skills_info" :key="skill.id"
                  class="badge badge-skill select-none">
                  {{ skill.name }}
                </span>
                <span v-if="!vacancy.required_skills_info.length" class="text-muted fst-italic">
                  Навыки не указаны
                </span>
              </div>

              <!-- Спидометр с match_score -->
              <div class="d-flex flex-column align-items-center">
                <apexchart
                  type="radialBar"
                  height="120"
                  width="120"
                  :options="apexOptions"
                  :series="[matchScore]"
                  class="mb-1"
                ></apexchart>
                <small class="text-muted">Ваш уровень соответствия</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="d-flex flex-column flex-md-row gap-3 pt-4">
        <button class="btn" :class="isApplied ? 'btn-danger' : 'btn-gradient-success'" :disabled="loadingApply"
          @click="toggleApply">
          <span v-if="loadingApply">
            <Loader class="me-2" :size="18" />
          </span>
          <Send v-if="!isApplied" class="me-2" :size="18" />
          <span>
            {{ isApplied ? 'Убрать отклик' : 'Откликнуться на вакансию' }}
          </span>
        </button>

        <button class="btn btn-outline-primary px-4 py-3 d-flex align-items-center justify-content-center flex-grow-1"
          @click="shareVacancy">
          <ExternalLink class="me-2" width="18" height="18" />
          <span class="fw-medium">Поделиться</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import {
  ArrowLeftCircle, Loader, AlertTriangle, Building,
  FileText, Lightbulb, Send, ExternalLink
} from 'lucide-vue-next'

const route = useRoute()

const vacancy = ref(null)
const loading = ref(true)
const error = ref(null)
const loadingApply = ref(false)
const appliedApplication = ref(null) // Отклик на вакансию (объект с match_score)
const mySkills = ref([]) // Навыки пользователя

const isApplied = computed(() => !!appliedApplication.value)

// Получаем вакансию и её данные
async function fetchVacancy() {
  loading.value = true
  error.value = null
  try {
    const res = await apiClient.get(
      endpoints.expert_system.vacancies + route.params.id + '/'
    )
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    vacancy.value = { ...res.data, required_skills_info: res.data.required_skills_info || [] }
  } catch (err) {
    error.value = 'Не удалось загрузить данные вакансии'
    console.error('Ошибка загрузки вакансии:', err)
  } finally {
    loading.value = false
  }
}

// Получаем свои навыки
async function fetchMySkills() {
  try {
    const res = await apiClient.get(endpoints.expert_system.getUserSkills)
    if (res.success) {
      mySkills.value = res.data.map((s) => s.skill_id)
    }
  } catch {
    mySkills.value = []
  }
}

// Получаем свои отклики
async function fetchMyApplications() {
  try {
    const res = await apiClient.get(endpoints.expert_system.applications + '?my=1')
    if (res.success) {
      const found = res.data.find(app => app.vacancy === Number(route.params.id))
      appliedApplication.value = found || null
    }
  } catch {
    appliedApplication.value = null
  }
}

// Считаем match_score на основе своих навыков и требуемых
const matchScore = computed(() => {
  const required = vacancy.value?.required_skills_info?.map(s => s.id) || []
  if (!required.length || !mySkills.value.length) return 0
  const matched = required.filter(id => mySkills.value.includes(id))
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
          offsetY: 10,
          fontSize: '20px',
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

// Отклик/отмена отклика
async function toggleApply() {
  if (!vacancy.value) return
  loadingApply.value = true
  error.value = null
  if (isApplied.value) {
    // Удаляем отклик
    try {
      const res = await apiClient.delete(
        endpoints.expert_system.applications + `${appliedApplication.value.id}/`
      )
      if (!res.success) throw new Error(JSON.stringify(res.errors))
      appliedApplication.value = null
    } catch {
      error.value = 'Не удалось убрать отклик'
    } finally {
      loadingApply.value = false
    }
  } else {
    // Делаем отклик и передаем match_score
    try {
      const res = await apiClient.post(endpoints.expert_system.applications, {
        vacancy: vacancy.value.id,
        match_score: matchScore.value
      })
      if (!res.success) throw new Error(JSON.stringify(res.errors))
      appliedApplication.value = res.data
    } catch {
      error.value = 'Не удалось откликнуться на вакансию'
    } finally {
      loadingApply.value = false
    }
  }
}

function shareVacancy() {
  if (navigator.share) {
    navigator.share({
      title: vacancy.value.title,
      text: `Интересная вакансия: ${vacancy.value.title}`,
      url: window.location.href
    }).catch(console.error)
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Ссылка скопирована в буфер обмена'))
      .catch(() => alert('Не удалось скопировать ссылку'))
  }
}

onMounted(async () => {
  await fetchVacancy()
  await fetchMySkills()
  await fetchMyApplications()
})
</script>

<style scoped>
.title-block {
  font-weight: bold;
}

.vacancy-banner {
  background: linear-gradient(135deg, #ff0011 0%, #42aaff 100%);
  box-shadow: 0 0.5rem 1.5rem rgba(13, 110, 253, 0.3);
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-skill {
  background: linear-gradient(45deg, rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.2));
  color: black;
  border-radius: 2rem;
  padding: 0.5em 1em;
  font-weight: 600;
  transition: all 0.3s ease;
}

.badge-skill:hover {
  transform: translateY(-2px);
  background: linear-gradient(45deg, rgba(13, 110, 253, 0.2), rgba(13, 110, 253, 0.3));
}

.btn-gradient-success {
  background: linear-gradient(45deg, #198754, #28a745);
  border: none;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 0.25rem 1rem rgba(40, 167, 69, 0.3);
  transition: all 0.3s ease;
}

.btn-gradient-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1.5rem rgba(40, 167, 69, 0.4);
}

.btn-outline-primary {
  border-width: 2px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  box-shadow: 0 0.5rem 1.5rem rgba(167, 167, 167, 0.4);
}

.btn-danger {
  background: #dc3545;
  color: #fff;
  border: none;
}

.btn-danger:hover {
  background: #a81d2b;
}
</style>
