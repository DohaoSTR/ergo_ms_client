<template>
  <section class="student-vacancies-list">
    <h4 class="mb-4 fs-2 text-gradient">Вакансии для студентов</h4>
    <div class="row g-4">
      <aside class="col-md-3">
        <div class="card border-0 shadow-lg rounded-4 p-4">
          <h6 class="fw-bold mb-3 fs-4 text-primary d-flex align-items-center">
            <i class="bi bi-funnel"></i> Фильтр по навыкам
          </h6>
          <ul class="list-unstyled mb-3 ps-2">
            <li class="form-check mb-2">
              <input
                class="form-check-input custom-checkbox"
                type="checkbox"
                id="filter-my-skills"
                v-model="useMySkills"
              />
              <label class="form-check-label" for="filter-my-skills">
                Использовать мои навыки
              </label>
            </li>
            <li v-for="skill in sortedSkills" :key="skill.id" class="form-check ps-3 mb-1">
              <input
                class="form-check-input custom-checkbox"
                type="checkbox"
                :id="`filter-skill-${skill.id}`"
                :value="skill.id"
                v-model="manualSelected"
                :disabled="useMySkills"
              />
              <label class="form-check-label small" :for="`filter-skill-${skill.id}`">
                {{ skill.name }}
              </label>
            </li>
          </ul>
          <button class="btn btn-outline-secondary btn-sm w-100 rounded-pill" @click="clearFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Сбросить
          </button>
        </div>
      </aside>
      <div class="col-md-9">
        <ul class="list-unstyled">
          <li v-if="loading" class="text-center text-muted py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2">Загрузка вакансий…</p>
          </li>
          <li v-else-if="!vacancies.length" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 text-secondary"></i>
            <p class="mt-2">Нет доступных вакансий.</p>
          </li>
          <li
            v-for="vac in vacancies"
            :key="vac.id"
            class="card card-company border-0 shadow-sm mb-4 rounded-3 overflow-hidden"
          >
            <div class="card-body d-flex flex-column flex-md-row gap-4">
              <div class="vacancy-info flex-grow-1">
                <h6 class="mb-2 fw-semibold fs-4">
                  <router-link
                    :to="`/vacancy/${vac.id}`"
                    class="text-decoration-none text-dark hover-link"
                  >
                    {{ vac.title }}
                  </router-link>
                </h6>
                <small class="d-block text-muted mb-3">
                  Компания:
                  <router-link
                    :to="`/company/${vac.employer}`"
                    class="text-decoration-none text-primary fw-medium"
                  >
                    {{ vac.employer_name }}
                  </router-link>
                </small>
                <div class="vacancy-skills mb-3">
                  <span
                    v-for="skill in vac.required_skills_info"
                    :key="skill.id"
                    class="badge bg-soft-primary text-primary me-1 mb-1 clickable-skill"
                    :class="{ 'active-skill': isSkillSelected(skill.id) }"
                    @click="toggleSkill(skill.id)"
                    style="font-size: 0.75rem"
                    :title="`Выбрать навык: ${skill.name}`"
                    data-bs-toggle="tooltip"
                  >
                    {{ skill.name }}
                  </span>
                  <span v-if="!vac.required_skills_info.length" class="text-muted small">
                    Нет навыков
                  </span>
                </div>
              </div>
              <div class="match-score-chart d-flex align-items-center justify-content-center">
                <apexchart
                  type="radialBar"
                  height="100"
                  width="100"
                  :options="{
                    chart: { toolbar: { show: false } },
                    plotOptions: {
                      radialBar: {
                        startAngle: -90,
                        endAngle: 90,
                        track: {
                          background: '#e0e0e0',
                        },
                        dataLabels: {
                          show: true,
                          name: { show: false },
                          value: {
                            offsetY: 10,
                            fontSize: '18px',
                            fontWeight: 600,
                            formatter: () => `${vac.match_score} %`,
                          },
                        },
                      },
                    },
                    fill: { colors: [getMatchColor(vac.match_score)] },
                    stroke: { lineCap: 'round' },
                    labels: ['Соответствие'],
                  }"
                  :series="[vac.match_score]"
                ></apexchart>
              </div>
              <div class="d-flex align-items-center">
                <button
                  class="btn btn-success text-light px-3 py-2 rounded-pill"
                  :disabled="applied.includes(vac.id)"
                  @click="applyVacancy(vac.id)"
                >
                  <i class="bi bi-send me-1"></i>
                  {{ applied.includes(vac.id) ? 'Откликнуто' : 'Откликнуться' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, watch, watchEffect } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const emit = defineEmits(['error'])
const skills = ref([])
const vacancies = ref([])
const manualSelected = ref([])
const useMySkills = ref(true)
const mySkills = ref([])
const applied = ref([])
const loading = ref(false)

const sortedSkills = computed(() => {
  return [...skills.value].sort((a, b) => {
    const aSelected = manualSelected.value.includes(a.id)
    const bSelected = manualSelected.value.includes(b.id)
    if (aSelected === bSelected) {
      return a.name.localeCompare(b.name)
    }
    return aSelected ? -1 : 1
  })
})

async function fetchSkills() {
  try {
    const res = await apiClient.get(endpoints.expert_system.skills)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    skills.value = res.data.sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить навыки')
  }
}

const isSkillSelected = computed(() => (skillId) => {
  return manualSelected.value.includes(skillId)
})

async function fetchMySkills() {
  try {
    const res = await apiClient.get(endpoints.expert_system.getUserSkills)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    mySkills.value = res.data.map((s) => s.skill_id)
    if (useMySkills.value) {
      manualSelected.value = [...mySkills.value]
    }
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить мои навыки')
  }
}

async function fetchAppliedVacancies() {
  try {
    const res = await apiClient.get(endpoints.expert_system.applications + '?my=1')
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    applied.value = res.data.map((a) => a.vacancy)
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить отклики')
  }
}

async function fetchVacancies() {
  loading.value = true
  try {
    const sel = useMySkills.value ? mySkills.value : manualSelected.value
    const params = new URLSearchParams()
    sel.forEach((id) => params.append('required_skills', id))
    if (sel.length) params.append('search', '')
    const url = endpoints.expert_system.vacancies + '?' + params.toString()
    const res = await apiClient.get(url)
    if (!res.success) throw new Error(JSON.stringify(res.errors))

    vacancies.value = res.data
      .map((vac) => {
        vac.required_skills_info.sort((a, b) => a.name.localeCompare(b.name))
        const reqIds = vac.required_skills_info.map((s) => s.id)
        const matchedCount = reqIds.filter((id) => sel.includes(id)).length
        const score = reqIds.length ? Math.round((matchedCount / reqIds.length) * 100) : 0
        return { ...vac, match_score: score }
      })
      .sort((a, b) => b.match_score - a.match_score)
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить вакансии')
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  useMySkills.value = false
  manualSelected.value = []
}

function toggleSkill(skillId) {
  const index = manualSelected.value.indexOf(skillId)
  if (index === -1) {
    manualSelected.value.push(skillId)
  } else {
    manualSelected.value.splice(index, 1)
  }
  useMySkills.value = false
}

async function applyVacancy(id) {
  try {
    const vac = vacancies.value.find(v => v.id === id)
    if (!vac) throw new Error('Вакансия не найдена')

    const requiredSkillIds = vac.required_skills_info.map(s => s.id)
    const studentSkillIds = mySkills.value

    let matchedCount = requiredSkillIds.filter(id => studentSkillIds.includes(id)).length
    let match_score = requiredSkillIds.length ? Math.round((matchedCount / requiredSkillIds.length) * 100) : 0

    const res = await apiClient.post(endpoints.expert_system.applications, {
      vacancy: id,
      match_score
    })
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    applied.value.push(id)
  } catch (err) {
    emit('error', err.message || 'Не удалось откликнуться')
  }
}


const getMatchColor = (score) => {
  if (score >= 75) return '#4CAF50'
  if (score >= 50) return '#FFA726'
  return '#EF5350'
}

watch(useMySkills, async (val) => {
  if (val) {
    await fetchMySkills()
    manualSelected.value = [...mySkills.value]
    manualSelected.value = []
  }
  await fetchVacancies()
})

watchEffect(fetchVacancies)

onMounted(async () => {
  await Promise.all([fetchSkills(), fetchMySkills(), fetchAppliedVacancies()])
  await fetchVacancies()
})
</script>

<style scoped>
.student-vacancies-list {
  font-family: 'Segoe UI', sans-serif;
}

.card-company {
  transition: transform 0.4s ease;
}

.card-company:hover {
  transform: translateY(-5px);
}

.custom-checkbox {
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid #6c757d;
  border-radius: 0.25rem;
  background-color: white;
  position: relative;
  transition: all 0.2s ease;
}

.custom-checkbox:checked {
  background-color: red;
  border-color: red;
}

.badge.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
}

.hover-link:hover {
  color: #007bff !important;
  transition: color 0.3s ease;
}

.btn-success {
  background-color: #28a745;
  border: none;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background-color: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.btn-success:disabled {
  background-color: #70c770;
  cursor: not-allowed;
}

.clickable-skill {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-skill:hover {
  background-color: #007bff !important;
  color: white !important;
  transform: scale(1.05);
}

.active-skill {
  background-color: #007bff !important;
  color: white !important;
}
</style>
