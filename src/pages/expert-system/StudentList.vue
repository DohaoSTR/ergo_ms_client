<template>
  <section class="student-list-root">
    <h4 class="mb-4 fs-2 text-gradient">Студенты — поиск для работодателя</h4>
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
                id="filter-confirmed-only"
                v-model="onlyConfirmed"
              />
              <label class="form-check-label" for="filter-confirmed-only">
                Только подтверждённые навыки
              </label>
            </li>
            <li class="form-check mb-2">
              <select class="form-select" v-model="selectedVacancyId">
                <option disabled value="">Выберите вакансию</option>
                <option v-for="vac in myVacancies" :key="vac.id" :value="vac.id">
                  {{ vac.title }}
                </option>
              </select>
              <div v-if="selectedVacancySkills.length" class="mt-2">
                <span
                  v-for="skill in selectedVacancySkills"
                  :key="skill.id"
                  class="badge bg-primary-subtle text-primary me-1 mb-1"
                >
                  {{ skill.name }}
                </span>
              </div>
            </li>
            <li v-if="!selectedVacancyId" class="form-text text-muted small">
              Выберите вакансию, чтобы фильтровать студентов по её навыкам.
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
            <p class="mt-2">Загрузка студентов…</p>
          </li>
          <li v-else-if="!filteredStudents.length" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 text-secondary"></i>
            <p class="mt-2">Нет подходящих студентов.</p>
          </li>
          <li
            v-for="student in sortedFilteredStudents"
            :key="student.id"
            class="card border-0 shadow-sm mb-4 rounded-3 overflow-hidden student-card"
          >
            <div class="card-body d-flex flex-column flex-md-row gap-4 align-items-center">
              <div class="flex-grow-1">
                <h6 class="mb-2 fw-semibold fs-4">
                  <router-link
                    :to="`/student/${student.id}`"
                    class="text-decoration-none text-dark hover-link"
                  >
                    {{ student.first_name }} {{ student.last_name }}
                  </router-link>
                </h6>
                <div class="mb-2">
                  <span class="text-muted small"><i class="bi bi-people"></i> Группа: {{ student.group_name || '—' }}</span>
                  <span class="text-muted small ms-3"><i class="bi bi-laptop"></i> Опыт в IT: <b>{{ student.has_experience ? 'Есть' : 'Нет' }}</b></span>
                </div>
                <div>
                  <span
                    v-for="skill in student.skills"
                    :key="skill.skill"
                    class="badge me-1 mb-1"
                    :class="{
                      'bg-success-subtle text-success border border-success': skill.status === 'confirmed',
                      'bg-warning-subtle text-warning border border-warning': skill.status === 'unconfirmed',
                      'bg-info-subtle text-info border border-info': skill.status === 'in_progress',
                      'border border-secondary': true
                    }"
                  >
                    {{ getSkillName(skill.skill) }}
                  </span>
                  <span v-if="!student.skills.length" class="text-muted small">Нет навыков</span>
                </div>
                <div class="mt-2">
                  <span class="text-muted small"><i class="bi bi-envelope"></i> Email: {{ student.email || '—' }}</span>
                  <span class="text-muted small ms-3"><i class="bi bi-telephone"></i> Телефон: {{ student.phone || '—' }}</span>
                </div>
              </div>
              <div class="d-flex flex-column align-items-center justify-content-center">
                <apexchart
                  v-if="selectedVacancySkills.length"
                  type="radialBar"
                  height="100"
                  width="100"
                  :options="getApexOptions(student.match_score)"
                  :series="[student.match_score]"
                  class="mb-1"
                ></apexchart>
                <div class="small text-muted mt-1">Совпадение: <b>{{ student.match_score }}%</b></div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const students = ref([])
const userSkills = ref([])
const allSkills = ref([])
const myVacancies = ref([])
const selectedVacancyId = ref('')
const onlyConfirmed = ref(true)
const loading = ref(true)

async function fetchStudents() {
  const res = await apiClient.get(endpoints.expert_system.students)
  students.value = res.data || []
}
async function fetchUserSkills() {
  const res = await apiClient.get(endpoints.expert_system.userSkills)
  userSkills.value = res.data || []
}
async function fetchSkills() {
  const res = await apiClient.get(endpoints.expert_system.skills)
  allSkills.value = res.data || []
}
async function fetchMyVacancies() {
  const res = await apiClient.get(endpoints.expert_system.myVacancies)
  myVacancies.value = res.data || []
  if (!selectedVacancyId.value && myVacancies.value.length) {
    selectedVacancyId.value = myVacancies.value[0].id
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchStudents(), fetchUserSkills(), fetchSkills(), fetchMyVacancies()])
  loading.value = false
})

const getSkillName = (id) => {
  const skill = allSkills.value.find(s => s.id === id)
  return skill ? skill.name : 'Навык'
}

const studentSkillsMap = computed(() => {
  const map = {}
  userSkills.value.forEach(skill => {
    if (!map[skill.user]) map[skill.user] = []
    map[skill.user].push(skill)
  })
  return map
})

const selectedVacancySkills = computed(() => {
  const vac = myVacancies.value.find(v => v.id === selectedVacancyId.value)
  return vac?.required_skills_info || []
})
const requiredSkillIds = computed(() => selectedVacancySkills.value.map(s => s.id))

const studentsWithSkills = computed(() =>
  students.value.map(student => {
    // навык = { id, user, skill, status }
    const skills = (studentSkillsMap.value[student.id] || [])
    return { ...student, skills }
  })
)

const filteredStudents = computed(() => {
  if (!selectedVacancyId.value) return []
  return studentsWithSkills.value
    .map(student => {
      // Оставляем только нужные навыки, если стоит фильтр
      const skills = onlyConfirmed.value
        ? student.skills.filter(s => s.status === 'confirmed')
        : student.skills
      const studentSkillIds = new Set(skills.map(s => s.skill))
      const matched = requiredSkillIds.value.filter(id => studentSkillIds.has(id))
      const match_score = requiredSkillIds.value.length
        ? Math.round((matched.length / requiredSkillIds.value.length) * 100)
        : 0
      return { ...student, skills, match_score }
    })
    .filter(student => student.match_score > 0)
})

const sortedFilteredStudents = computed(() =>
  [...filteredStudents.value].sort((a, b) => b.match_score - a.match_score)
)

function getApexOptions(score) {
  const color = score >= 75 ? '#4CAF50' : score >= 50 ? '#FFA726' : '#EF5350'
  return {
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
            fontSize: '18px',
            fontWeight: 700,
            formatter: () => `${score} %`,
          },
        },
      },
    },
    fill: { colors: [color] },
    stroke: { lineCap: 'round' },
    labels: ['Совпадение'],
  }
}

watch(myVacancies, val => {
  if (val.length && !selectedVacancyId.value) selectedVacancyId.value = val[0].id
})
</script>

<style scoped>
.student-list-root {
  font-family: 'Segoe UI', sans-serif;
}
.student-card {
  transition: transform 0.3s;
}
.student-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 8px 36px #007bff0f, 0 2px 4px #0090ff0a;
}
.hover-link:hover {
  color: #007bff !important;
  text-decoration: underline;
}
.bg-primary-subtle {
  background-color: #e3f1ff;
}
.bg-success-subtle {
  background-color: #ebfaed;
}
.bg-warning-subtle {
  background-color: #fffbe4;
}
.bg-info-subtle {
  background-color: #e6f8ff;
}
</style>
