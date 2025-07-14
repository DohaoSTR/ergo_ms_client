<template>
  <div class="container py-2 d-flex flex-column align-items-center justify-content-center" v-if="loaded" style="min-height: 80vh">
    <h2 class="fw-bold mb-4 text-center fs-1" style="letter-spacing: -1px; color: #16192C;">{{ testName }}</h2>

 
    <div v-if="!started" class="w-100 d-flex flex-column align-items-center justify-content-center" style="min-height: 50vh;">
      <div
        v-if="studentProfile?.role"
        class="alert alert-success border fs-5 mb-5 text-center shadow-sm"
        style="max-width: 480px;"
      >
        Вы уже выбрали профессию: <b>{{ getRoleName(studentProfile.role) }}</b><br>
        Пройти тест повторно нельзя.
      </div>
      <div
        v-else
        class="alert alert-light border fs-5 mb-5 text-center shadow-sm"
        style="max-width: 480px;"
      >
        Ответьте на вопросы, чтобы узнать, какая IT-профессия вам ближе!
      </div>
      <button
        class="btn btn-success btn-lg px-5 py-3 text-white fw-semibold shadow-sm"
        style="border-radius: 8px; font-size: 1.35rem; min-width: 220px; box-shadow: none; letter-spacing: 1px;"
        @click="startTest"
        :disabled="!!studentProfile?.role"
      >
        Пройти тест
      </button>
    </div>

 
    <div v-else-if="step < questions.length" class="w-100" style="max-width: 520px;">
      <div class="card mb-4 border shadow-sm" style="border-radius: 10px;">
        <div class="card-body px-4 py-4">
          <div class="mb-3 text-muted">
            <div class="d-flex align-items-center justify-content-between">
              <span class="fs-6 fw-semibold text-uppercase">Вопрос {{ step + 1 }} из {{ questions.length }}</span>
            </div>
            <div class="fs-5 fw-bold mb-3 mt-1 text-center">
              {{ questions[step]?.text }}
            </div>
          </div>
          <div class="mb-3">
            <div
              class="form-check d-flex align-items-center mb-2 px-0"
              :class="{'bg-body-tertiary': isChecked(answer.id)}"
              v-for="answer in currentAnswers"
              :key="answer.id"
              style="border-radius: 6px; transition: background 0.18s;"
            >
              <input
                class="form-check-input me-2"
                type="checkbox"
                :id="'answer-'+answer.id"
                :value="answer.id"
                v-model="selectedAnswers[questions[step].id]"
                style="width:1.2em; height:1.2em; border: 2px solid green;"
              />
              <label class="form-check-label fs-5 fw-normal" :for="'answer-'+answer.id" style="cursor:pointer;">
                {{ answer.text }}
              </label>
            </div>
          </div>
          <div class="d-flex justify-content-end">
            <button
              class="btn btn-success px-4 py-2 fw-semibold text-white"
              style="font-size:1.08rem; border-radius: 6px;"
              @click="nextStep"
              :disabled="!selectedAnswers[questions[step].id] || selectedAnswers[questions[step].id].length === 0"
            >
              {{ step === questions.length - 1 ? 'Завершить' : 'Далее' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    
    <div v-else class="w-100">
      <h4 class="mb-4 text-center fw-bold" style="letter-spacing:1px;">Результаты теста</h4>
      <div v-if="roles.length">
        <div v-if="bestRoleId !== null" class="mb-5">
          <div class="alert alert-success text-center fs-4 mb-4 shadow-sm border-0" style="border-radius: 8px; background: #eafbee; color: #155724;">
            Ваша профессия: <span class="fw-bold">{{ getRoleName(bestRoleId) }}</span>
          </div>
          <div class="d-flex justify-content-center mb-3">
            <button
              
              class="btn btn-success btn-lg text-light px-5 fw-semibold"
              v-if="!roleSaved"
              @click="chooseProfession"
            >
              Выбрать профессию
            </button>
            <span v-else class="alert alert-success mb-0 py-2 px-4" style="font-size:1.13rem;">
              Вы выбрали: <b>{{ getRoleName(bestRoleId) }}</b>
            </span>
          </div>
          <div v-if="recommendedCourses.length" class="mt-4">
            <h5 class="text-center mb-3 fw-bold">Рекомендуемые курсы:</h5>
            <ul class="list-group mx-auto" style="max-width: 440px;">
              <li class="list-group-item" v-for="c in recommendedCourses" :key="c.id">
                {{ c.name }}
              </li>
            </ul>
          </div>
        </div>
 
        <div class="row g-3 justify-content-center">
          <div
            class="col-12 col-md-6 col-lg-4"
            v-for="role in roles"
            :key="role.id"
          >
            <div class="card border-0 shadow-sm h-100"
                :class="{'border-success': bestRoleId === role.id}"
                style="border-radius: 10px; background: #fafbfc;">
              <div class="card-body px-4 py-4 text-center">
                <div class="fw-bold fs-5 mb-2 text-dark" style="letter-spacing: 0.5px;">
                  {{ role.name }}
                </div>
                <div class="fs-4 fw-semibold mb-2" style="color:#218838;">
                  {{ getRolePercent(role.id) }}%
                </div>
                <div class="fs-6" style="color: #888;">
                  (Баллы: {{ getRoleScore(role.id) }})
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 d-flex justify-content-center">
          <button class="btn btn-success btn-lg text-light px-5 fw-semibold" style="border-radius: 8px;" @click="restart">
            Пройти снова
          </button>
        </div>
      </div>
      <div v-else class="alert alert-warning text-center shadow-sm border-0" style="border-radius: 8px;">
        Нет профессий в системе.
      </div>
    </div>
  </div>
  <div v-else class="d-flex align-items-center justify-content-center" style="min-height: 80vh">
    <span class="spinner-border text-success" role="status"></span>
    <span class="ms-3">Загрузка…</span>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { useRoute } from 'vue-router'

const route = useRoute()
const testId = route.params.testId || 1

const testName = ref('')
const questions = ref([])
const answers = ref([])
const roles = ref([])
const loaded = ref(false)
const step = ref(0)
const started = ref(false)

const selectedAnswers = reactive({})
const bestRoleId = ref(null)
const bestRoleScore = ref(0)
const scoresByRole = ref({}) // roleId: баллы
const totalScore = ref(0)

const roleSaved = ref(false)
const recommendedCourses = ref([])

const studentProfile = ref(null)

const currentAnswers = computed(() => {
  if (!questions.value.length) return []
  return answers.value.filter(a => a.question === questions.value[step.value].id)
})

function isChecked(answerId) {
  const arr = selectedAnswers[questions.value[step.value].id]
  return arr && arr.includes(answerId)
}

async function loadStudentProfile() {
  const resp = await apiClient.get(endpoints.expert_system.studentsMe)
  if (resp.success) {
    studentProfile.value = resp.data
  }
}

async function load() {
  loaded.value = false

  const qres = await apiClient.get(endpoints.expert_system.orientationQuestions, { test: testId })
  if (!qres.success) return
  questions.value = qres.data
  testName.value = qres.data?.[0]?.test_name || 'Профориентационный тест'

  const ares = await apiClient.get(endpoints.expert_system.orientationAnswers)
  if (ares.success) answers.value = ares.data
  else answers.value = []

  for (const q of questions.value) {
    selectedAnswers[q.id] = []
  }

  const rres = await apiClient.get(endpoints.expert_system.roles)
  if (rres.success) roles.value = rres.data

  loaded.value = true
}

function getRoleName(roleId) {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : 'Неизвестно'
}

function startTest() {

  if (studentProfile.role) return
  started.value = true
  step.value = 0
  for (const key in selectedAnswers) selectedAnswers[key] = []
  bestRoleId.value = null
  bestRoleScore.value = 0
  scoresByRole.value = {}
  totalScore.value = 0
  roleSaved.value = false
  recommendedCourses.value = []
}

function nextStep() {
  if (step.value < questions.value.length - 1) {
    step.value += 1
  } else {
    calculateResult()
  }
}

async function calculateResult() {
  const scoreByRole = {}
  let total = 0
  for (const q of questions.value) {
    const selected = selectedAnswers[q.id] || []
    for (const answerId of selected) {
      const answer = answers.value.find(a => a.id === answerId)
      if (answer) {
        const rid = typeof answer.role === 'object' ? answer.role.id : answer.role
        scoreByRole[rid] = (scoreByRole[rid] || 0) + (answer.weight || 1)
        total += (answer.weight || 1)
      }
    }
  }
  scoresByRole.value = scoreByRole
  totalScore.value = total


  let maxRoleId = null
  let maxScore = -1
  for (const role of roles.value) {
    const sc = scoreByRole[role.id] || 0
    if (sc > maxScore) {
      maxScore = sc
      maxRoleId = role.id
    }
  }
  bestRoleId.value = maxRoleId
  bestRoleScore.value = maxScore
  step.value = questions.value.length


  await saveTestResult()
}


async function saveTestResult() {
  
  if (roleSaved.value) return

  const payload = {
    test: testId,
    best_role: bestRoleId.value,
    answers: []
  }
  for (const q of questions.value) {
    const selected = selectedAnswers[q.id] || []
    for (const answerId of selected) {
      payload.answers.push({ question: q.id, answer: answerId })
    }
  }
  await apiClient.post(endpoints.expert_system.saveOrientationTestResult, payload)

  roleSaved.value = false
}

function getRolePercent(roleId) {
  const sc = scoresByRole.value[roleId] || 0
  if (!totalScore.value) return 0
  return Math.round(sc * 100 / totalScore.value)
}

function getRoleScore(roleId) {
  return scoresByRole.value[roleId] || 0
}


async function chooseProfession() {
  await apiClient.patch(endpoints.expert_system.saveBestRoleToStudent, {
    role: bestRoleId.value
  })
  roleSaved.value = true
  // Загружаем рекомендованные курсы
  const resp = await apiClient.get(endpoints.expert_system.recommendedCourses, {
    role: bestRoleId.value
  })
  if (resp.success) recommendedCourses.value = resp.data
  else recommendedCourses.value = []
}

function restart() {
  started.value = false
  step.value = 0
  for (const key in selectedAnswers) selectedAnswers[key] = []
  bestRoleId.value = null
  bestRoleScore.value = 0
  scoresByRole.value = {}
  totalScore.value = 0
  roleSaved.value = false
  recommendedCourses.value = []
}


onMounted(async () => {
  await Promise.all([loadStudentProfile(), load()])
})
</script>
