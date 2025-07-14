<template>
  <div class="modal show d-block test-taking-modal" @click.self="$emit('close')">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center">
            <HelpCircle :size="20" class="me-2 text-info" />
            {{ test.name || test.title }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="confirmClose"
            :disabled="isSubmitting"
          ></button>
        </div>
        
        <!-- Информация о тесте (до начала) -->
        <div v-if="!testStarted && !testCompleted" class="modal-body">
          <div class="test-info">
            <div class="alert alert-info">
              <Info :size="16" class="me-2" />
              Внимательно прочитайте информацию о тесте перед началом
            </div>
            
            <div class="row">
              <div class="col-lg-8">
                <h6>Описание теста</h6>
                <p>{{ test.description || 'Описание не указано' }}</p>
                
                <div class="test-rules mb-4">
                  <h6>Правила прохождения:</h6>
                  <ul>
                    <li>У вас есть {{ test.max_attempts || 1 }} попытка(ок) для прохождения теста</li>
                    <li v-if="test.duration_minutes">Время на прохождение: {{ test.duration_minutes }} минут</li>
                    <li>Минимальный проходной балл: {{ test.passing_score || 70 }}%</li>
                    <li v-if="test.randomize_questions">Вопросы будут показаны в случайном порядке</li>
                    <li v-if="!test.show_correct_answers">Правильные ответы будут показаны после завершения</li>
                  </ul>
                </div>
              </div>
              
              <div class="col-lg-4">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">Статистика теста</h6>
                  </div>
                  <div class="card-body">
                    <div class="stat-item d-flex justify-content-between mb-2">
                      <span>Вопросов:</span>
                      <span class="fw-bold">{{ questions.length }}</span>
                    </div>
                    <div class="stat-item d-flex justify-content-between mb-2">
                      <span>Время:</span>
                      <span class="fw-bold">
                        {{ test.duration_minutes ? `${test.duration_minutes} мин` : 'Без ограничений' }}
                      </span>
                    </div>
                    <div class="stat-item d-flex justify-content-between mb-2">
                      <span>Попыток:</span>
                      <span class="fw-bold">{{ usedAttempts }}/{{ test.max_attempts || 1 }}</span>
                    </div>
                    <div class="stat-item d-flex justify-content-between">
                      <span>Проходной балл:</span>
                      <span class="fw-bold">{{ test.passing_score || 70 }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Прохождение теста -->
        <div v-else-if="testStarted && !testCompleted" class="modal-body">
          <!-- Таймер и прогресс -->
          <div class="test-header mb-4">
            <div class="row align-items-center">
              <div class="col-lg-6">
                <div class="d-flex align-items-center">
                  <span class="text-muted me-3">
                    Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}
                  </span>
                  <div class="progress flex-grow-1" style="height: 6px;">
                    <div 
                      class="progress-bar bg-info" 
                      :style="`width: ${((currentQuestionIndex + 1) / questions.length) * 100}%`"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6 text-end">
                <div v-if="timeRemaining !== null" class="timer d-flex align-items-center justify-content-end">
                  <Clock :size="16" class="me-2 text-warning" />
                  <span :class="timeRemaining < 300 ? 'text-danger fw-bold' : 'text-muted'">
                    {{ formatTime(timeRemaining) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Текущий вопрос -->
          <div v-if="currentQuestion" class="current-question">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">
                  Вопрос {{ currentQuestionIndex + 1 }}
                  <span v-if="currentQuestion.points" class="badge bg-light text-dark ms-2">
                    {{ currentQuestion.points }} {{ getPointsText(currentQuestion.points) }}
                  </span>
                </h6>
              </div>
              <div class="card-body">
                <div class="question-text mb-4">
                  <p class="lead">{{ currentQuestion.text }}</p>
                </div>
                
                <!-- Варианты ответов -->
                <div class="answer-options">
                  <!-- Одиночный выбор -->
                  <template v-if="currentQuestion.type === 'S'">
                    <div 
                      v-for="answer in currentQuestion.answers" 
                      :key="answer.id"
                      class="form-check mb-3"
                    >
                      <input 
                        class="form-check-input" 
                        type="radio" 
                        :id="`answer-${answer.id}`"
                        :value="answer.id"
                        v-model="currentAnswers[currentQuestion.id]"
                      >
                      <label class="form-check-label" :for="`answer-${answer.id}`">
                        {{ answer.text }}
                      </label>
                    </div>
                  </template>
                  
                  <!-- Множественный выбор -->
                  <template v-else-if="currentQuestion.type === 'M'">
                    <div 
                      v-for="answer in currentQuestion.answers" 
                      :key="answer.id"
                      class="form-check mb-3"
                    >
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="`answer-${answer.id}`"
                        :value="answer.id"
                        v-model="currentAnswers[currentQuestion.id]"
                      >
                      <label class="form-check-label" :for="`answer-${answer.id}`">
                        {{ answer.text }}
                      </label>
                    </div>
                  </template>
                  
                  <!-- Верно/Неверно -->
                  <template v-else-if="currentQuestion.type === 'TF'">
                    <div class="form-check mb-3">
                      <input 
                        class="form-check-input" 
                        type="radio" 
                        id="answer-true"
                        value="true"
                        v-model="currentAnswers[currentQuestion.id]"
                      >
                      <label class="form-check-label" for="answer-true">
                        Верно
                      </label>
                    </div>
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="radio" 
                        id="answer-false"
                        value="false"
                        v-model="currentAnswers[currentQuestion.id]"
                      >
                      <label class="form-check-label" for="answer-false">
                        Неверно
                      </label>
                    </div>
                  </template>
                  
                  <!-- Открытый ответ -->
                  <template v-else-if="currentQuestion.type === 'O'">
                    <div class="mb-3">
                      <label class="form-label">Ваш ответ:</label>
                      <textarea 
                        class="form-control" 
                        rows="4"
                        v-model="currentAnswers[currentQuestion.id]"
                        placeholder="Введите ваш ответ..."
                      ></textarea>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Результаты теста -->
        <div v-else-if="testCompleted" class="modal-body">
          <div class="test-results text-center">
            <div class="result-icon mb-3">
              <CheckCircle 
                v-if="testResult.is_passed" 
                :size="64" 
                class="text-success"
              />
              <XCircle 
                v-else 
                :size="64" 
                class="text-danger"
              />
            </div>
            
            <h4 class="mb-3">
              {{ testResult.is_passed ? 'Тест пройден!' : 'Тест не пройден' }}
            </h4>
            
            <div class="result-stats mb-4">
              <div class="row">
                <div class="col-md-3">
                  <div class="stat-card">
                    <h5 class="text-primary">{{ testResult.score }}%</h5>
                    <small class="text-muted">Ваш результат</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h5 class="text-info">{{ test.passing_score }}%</h5>
                    <small class="text-muted">Проходной балл</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h5 class="text-success">{{ correctAnswers }}</h5>
                    <small class="text-muted">Правильных</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="stat-card">
                    <h5 class="text-warning">{{ questions.length }}</h5>
                    <small class="text-muted">Всего вопросов</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="!testResult.is_passed && canRetake" class="alert alert-warning">
              <AlertTriangle :size="16" class="me-2" />
              У вас есть ещё {{ remainingAttempts }} попытка(ок) пройти тест
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <!-- До начала теста -->
          <template v-if="!testStarted && !testCompleted">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="$emit('close')"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-info" 
              @click="startTest"
              :disabled="loading || (usedAttempts >= (test.max_attempts || 1))"
            >
              <Play :size="16" class="me-1" />
              Начать тест
            </button>
          </template>
          
          <!-- Во время прохождения -->
          <template v-else-if="testStarted && !testCompleted">
            <button 
              type="button" 
              class="btn btn-outline-secondary" 
              @click="previousQuestion"
              :disabled="currentQuestionIndex === 0"
            >
              <ChevronLeft :size="16" class="me-1" />
              Предыдущий
            </button>
            
            <div class="flex-grow-1 text-center">
              <small class="text-muted">
                {{ answeredQuestions.size }} из {{ questions.length }} отвечено
              </small>
            </div>
            
            <button 
              v-if="currentQuestionIndex < questions.length - 1"
              type="button" 
              class="btn btn-primary" 
              @click="nextQuestion"
            >
              Следующий
              <ChevronRight :size="16" class="ms-1" />
            </button>
            
            <button 
              v-else
              type="button" 
              class="btn btn-success" 
              @click="finishTest"
              :disabled="isSubmitting"
            >
              <template v-if="isSubmitting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Завершение...
              </template>
              <template v-else>
                <CheckCircle :size="16" class="me-1" />
                Завершить тест
              </template>
            </button>
          </template>
          
          <!-- После завершения -->
          <template v-else-if="testCompleted">
            <button 
              v-if="canRetake"
              type="button" 
              class="btn btn-warning" 
              @click="retakeTest"
            >
              <RotateCcw :size="16" class="me-1" />
              Пройти заново
            </button>
            
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="closeTest"
            >
              Закрыть
            </button>
          </template>
        </div>
      </div>
    </div>
    
    <!-- Диалог подтверждения выхода -->
    <div v-if="showExitConfirm" class="modal show d-block" style="z-index: 1060;">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">Подтверждение</h6>
          </div>
          <div class="modal-body">
            <p>Вы уверены, что хотите выйти? Прогресс будет потерян.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showExitConfirm = false">
              Отмена
            </button>
            <button class="btn btn-danger btn-sm" @click="forceClose">
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  HelpCircle, Info, Clock, Play, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, AlertTriangle, RotateCcw
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { showSuccess, showError } from '@/js/utils/notifications'

const props = defineProps({
  test: {
    type: Object,
    required: true
  },
  course: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'completed'])

const loading = ref(false)
const isSubmitting = ref(false)
const testStarted = ref(false)
const testCompleted = ref(false)
const currentQuestionIndex = ref(0)
const currentAnswers = ref({})
const questions = ref([])
const testAttempt = ref(null)
const testResult = ref(null)
const timeRemaining = ref(null)
const timer = ref(null)
const usedAttempts = ref(0)
const showExitConfirm = ref(false)

// Вычисляемые свойства
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

const answeredQuestions = computed(() => {
  const answered = new Set()
  questions.value.forEach(q => {
    if (currentAnswers.value[q.id] !== undefined && currentAnswers.value[q.id] !== '') {
      answered.add(q.id)
    }
  })
  return answered
})

const correctAnswers = computed(() => {
  if (!testResult.value) return 0
  // Подсчитываем правильные ответы из результата
  return Math.round((testResult.value.score / 100) * questions.value.length)
})

const canRetake = computed(() => {
  return usedAttempts.value < (props.test.max_attempts || 1)
})

const remainingAttempts = computed(() => {
  return (props.test.max_attempts || 1) - usedAttempts.value
})

// Загрузка данных теста
async function loadTestData() {
  try {
    loading.value = true
    
    // Загружаем вопросы теста
    const questionsResponse = await apiClient.get(endpoints.lms.questions, {
      params: { test: props.test.id }
    })
    
    if (questionsResponse.success) {
      questions.value = questionsResponse.data.results || questionsResponse.data || []
      
      // Загружаем ответы для каждого вопроса
      for (const question of questions.value) {
        try {
          const answersResponse = await apiClient.get(endpoints.lms.answers, {
            params: { question: question.id }
          })
          if (answersResponse.success) {
            question.answers = answersResponse.data.results || answersResponse.data || []
          }
        } catch (error) {
          console.warn(`Не удалось загрузить ответы для вопроса ${question.id}:`, error)
          question.answers = []
        }
      }
      
      // Перемешиваем вопросы если нужно
      if (props.test.randomize_questions) {
        questions.value = shuffleArray([...questions.value])
      }
    }
    
    // Загружаем информацию о попытках
    await loadAttemptInfo()
    
  } catch (error) {
    console.error('Ошибка загрузки данных теста:', error)
    showError('Не удалось загрузить данные теста')
  } finally {
    loading.value = false
  }
}

async function loadAttemptInfo() {
  try {
    const attemptsResponse = await apiClient.get(endpoints.lms.testAttempts, {
      params: { test: props.test.id }
    })
    
    if (attemptsResponse.success) {
      const attempts = attemptsResponse.data.results || attemptsResponse.data || []
      usedAttempts.value = attempts.length
    }
  } catch (error) {
    console.warn('Не удалось загрузить информацию о попытках:', error)
  }
}

// Управление тестом
async function startTest() {
  try {
    loading.value = true
    
    // Создаем новую попытку
    const attemptResponse = await apiClient.post(endpoints.lms.startTest(props.test.id))
    
    if (attemptResponse.success) {
      testAttempt.value = attemptResponse.data
      testStarted.value = true
      
      // Инициализируем ответы
      questions.value.forEach(q => {
        if (q.type === 'M') {
          currentAnswers.value[q.id] = []
        } else {
          currentAnswers.value[q.id] = null
        }
      })
      
      // Запускаем таймер если есть ограничение по времени
      if (props.test.duration_minutes) {
        startTimer()
      }
      
      showSuccess('Тест начат. Удачи!')
    }
  } catch (error) {
    console.error('Ошибка начала теста:', error)
    showError('Не удалось начать тест')
  } finally {
    loading.value = false
  }
}

function startTimer() {
  timeRemaining.value = props.test.duration_minutes * 60 // в секундах
  
  timer.value = setInterval(() => {
    timeRemaining.value--
    
    if (timeRemaining.value <= 0) {
      clearInterval(timer.value)
      finishTest(true) // Автоматическое завершение по времени
    }
  }, 1000)
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

async function finishTest(autoFinish = false) {
  try {
    isSubmitting.value = true
    
    if (!autoFinish) {
      // Проверяем что все вопросы отвечены
      if (answeredQuestions.value.size < questions.value.length) {
        const confirmed = confirm(
          `Вы ответили только на ${answeredQuestions.value.size} из ${questions.value.length} вопросов. ` +
          'Продолжить завершение теста?'
        )
        if (!confirmed) {
          isSubmitting.value = false
          return
        }
      }
    }
    
    // Останавливаем таймер
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    
    // Отправляем ответы
    const submissionData = {
      attempt_id: testAttempt.value.id,
      answers: currentAnswers.value
    }
    
    const resultResponse = await apiClient.post(
      `${endpoints.lms.testAttempts}${testAttempt.value.id}/submit/`,
      submissionData
    )
    
    if (resultResponse.success) {
      testResult.value = resultResponse.data
      testStarted.value = false
      testCompleted.value = true
      usedAttempts.value++
      
      if (testResult.value.is_passed) {
        showSuccess('Поздравляем! Тест пройден успешно!')
      } else {
        showError('Тест не пройден. Попробуйте ещё раз.')
      }
    }
  } catch (error) {
    console.error('Ошибка завершения теста:', error)
    showError('Ошибка при завершении теста')
  } finally {
    isSubmitting.value = false
  }
}

function retakeTest() {
  // Сбрасываем состояние
  testStarted.value = false
  testCompleted.value = false
  testResult.value = null
  currentQuestionIndex.value = 0
  currentAnswers.value = {}
  timeRemaining.value = null
  
  // Перемешиваем вопросы заново если нужно
  if (props.test.randomize_questions) {
    questions.value = shuffleArray([...questions.value])
  }
}

function confirmClose() {
  if (testStarted.value && !testCompleted.value) {
    showExitConfirm.value = true
  } else {
    emit('close')
  }
}

function forceClose() {
  if (timer.value) {
    clearInterval(timer.value)
  }
  emit('close')
}

function closeTest() {
  if (testResult.value?.is_passed) {
    emit('completed', props.test.id)
  } else {
    emit('close')
  }
}

// Вспомогательные функции
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getPointsText(points) {
  if (points === 1) return 'балл'
  if (points >= 2 && points <= 4) return 'балла'
  return 'баллов'
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

onMounted(() => {
  loadTestData()
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style lang="scss" scoped>
.test-taking-modal {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  z-index: 1056;
  
  .modal-dialog {
    margin: 1rem auto;
    max-height: calc(100vh - 2rem);
    
    .modal-content {
      height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
    }
    
    .modal-body {
      flex: 1;
      overflow-y: auto;
    }
  }
  
  .timer {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
  }
  
  .stat-card {
    text-align: center;
    padding: 1rem;
    
    h5 {
      margin-bottom: 0.25rem;
      font-size: 1.5rem;
    }
  }
  
  .answer-options {
    .form-check {
      padding: 0.75rem;
      border-radius: 0.375rem;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: var(--bs-light);
      }
      
      .form-check-input:checked + .form-check-label {
        font-weight: 500;
      }
    }
  }
  
  .result-icon {
    animation: scaleIn 0.5s ease-out;
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
}
</style> 