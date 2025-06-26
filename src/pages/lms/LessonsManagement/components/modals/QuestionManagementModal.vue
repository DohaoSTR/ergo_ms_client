<template>
  <BaseModal
    :show="show"
    title="Управление вопросами теста"
    :loading="loading"
    size="xl"
    confirm-text="Сохранить изменения"
    cancel-text="Закрыть"
    @close="handleClose"
    @confirm="handleSave"
  >
    <template #icon>
      <HelpCircle :size="20" class="text-primary" />
    </template>

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="mb-1">{{ testData?.title || 'Тест' }}</h5>
        <small class="text-muted">Вопросов: {{ questions.length }}</small>
      </div>
      <button 
        type="button" 
        class="btn btn-primary"
        @click="openQuestionModal()"
      >
        <Plus :size="16" class="me-1" />
        Добавить вопрос
      </button>
    </div>

    <!-- Список вопросов -->
    <div v-if="questions.length === 0" class="text-center py-5">
      <HelpCircle :size="48" class="text-muted mb-3" />
      <h6 class="text-muted">Вопросы отсутствуют</h6>
      <p class="text-muted">Добавьте первый вопрос для теста</p>
    </div>

    <div v-else>
      <div 
        v-for="(question, index) in questions" 
        :key="question.id || `new-${index}`"
        class="card mb-3"
      >
        <div class="card-header d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-2">
              <span class="badge bg-primary me-2">{{ index + 1 }}</span>
              <span class="badge" :class="getQuestionTypeBadgeClass(question.type)">
                {{ getQuestionTypeLabel(question.type) }}
              </span>
              <span class="badge bg-secondary ms-2">{{ question.points || 1 }} {{ getPointsLabel(question.points || 1) }}</span>
            </div>
            <div class="question-text" v-html="question.text"></div>
          </div>
          <div class="d-flex gap-2">
            <button 
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="openQuestionModal(question)"
            >
              <Edit2 :size="14" />
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="deleteQuestion(question, index)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <!-- Показываем варианты ответов для закрытых вопросов -->
        <div v-if="['S', 'M', 'TF'].includes(question.type) && question.answers?.length" class="card-body">
          <div class="row">
            <div 
              v-for="(answer, answerIndex) in question.answers" 
              :key="answer.id || `answer-${answerIndex}`"
              class="col-md-6 mb-2"
            >
              <div class="d-flex align-items-center">
                <div 
                  class="form-check-input me-2"
                  :class="{
                    'bg-success border-success': answer.is_correct,
                    'bg-danger border-danger': !answer.is_correct && question.type !== 'M'
                  }"
                  style="pointer-events: none;"
                ></div>
                <span class="text-sm">{{ answer.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Показываем правильный ответ для открытых вопросов -->
        <div v-else-if="question.type === 'O' && question.correctanswer" class="card-body">
          <div class="alert alert-success py-2 mb-0">
            <strong>Правильный ответ:</strong> {{ question.correctanswer }}
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования вопроса -->
    <QuestionModal
      :show="showQuestionModal"
      :editing="editingQuestion !== null"
      :question-data="editingQuestion"
      :loading="questionLoading"
      @close="closeQuestionModal"
      @save="saveQuestion"
    />
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { HelpCircle, Plus, Edit2, Trash2 } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'
import QuestionModal from './QuestionModal.vue'
import { showSuccess, showError } from '@/js/utils/notifications'
import { questionsApi } from '@/js/questionsApi'

const props = defineProps({
  show: Boolean,
  testData: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const questions = ref([])
const showQuestionModal = ref(false)
const editingQuestion = ref(null)
const questionLoading = ref(false)

// Методы для работы с типами вопросов
function getQuestionTypeLabel(type) {
  const types = {
    'S': 'Одиночный выбор',
    'M': 'Множественный выбор', 
    'O': 'Открытый ответ',
    'TF': 'Верно/Неверно',
    'MATCH': 'На соответствие'
  }
  return types[type] || 'Неизвестный тип'
}

function getQuestionTypeBadgeClass(type) {
  const classes = {
    'S': 'bg-info',
    'M': 'bg-warning',
    'O': 'bg-success',
    'TF': 'bg-secondary',
    'MATCH': 'bg-dark'
  }
  return classes[type] || 'bg-light'
}

function getPointsLabel(points) {
  if (points === 1) return 'балл'
  if (points >= 2 && points <= 4) return 'балла'
  return 'баллов'
}

// Методы для работы с модальным окном вопроса
function openQuestionModal(question = null) {
  editingQuestion.value = question
  showQuestionModal.value = true
}

function closeQuestionModal() {
  showQuestionModal.value = false
  editingQuestion.value = null
}

async function saveQuestion(questionData) {
  try {
    questionLoading.value = true
    
    // Подготавливаем данные для API
    const apiData = {
      test: props.testData.id,
      text: questionData.text,
      type: questionData.type,
      points: questionData.points || 1,
      explanation: questionData.explanation || '',
      difficulty: questionData.difficulty || 'medium'
    }

    // Добавляем correctanswer только для открытых вопросов
    if (questionData.type === 'O') {
      apiData.correctanswer = questionData.correctanswer || ''
    }

    // Добавляем ответы только для закрытых вопросов
    if (['S', 'M', 'TF'].includes(questionData.type)) {
      apiData.answers = questionData.answers || []
    }
    
    if (editingQuestion.value) {
      // Редактирование существующего вопроса
      const updatedQuestion = await questionsApi.updateQuestion(editingQuestion.value.id, apiData)
      const index = questions.value.findIndex(q => q.id === editingQuestion.value.id)
      if (index !== -1) {
        questions.value[index] = updatedQuestion
      }
      showSuccess('Вопрос обновлен')
    } else {
      // Добавление нового вопроса
      const createdQuestion = await questionsApi.createQuestion(apiData)
      questions.value.push(createdQuestion)
      showSuccess('Вопрос добавлен')
    }
    
    closeQuestionModal()
  } catch (error) {
    console.error('Ошибка сохранения вопроса:', error)
    if (error.response?.data) {
      const errorMessages = Object.values(error.response.data).flat()
      showError(errorMessages.join(', '))
    } else {
      showError('Ошибка при сохранении вопроса')
    }
  } finally {
    questionLoading.value = false
  }
}

async function deleteQuestion(question, index) {
  if (confirm('Вы действительно хотите удалить этот вопрос?')) {
    try {
      await questionsApi.deleteQuestion(question.id)
      questions.value.splice(index, 1)
      showSuccess('Вопрос удален')
    } catch (error) {
      console.error('Ошибка удаления вопроса:', error)
      showError('Ошибка при удалении вопроса')
    }
  }
}

// Наблюдаем за изменениями testData для загрузки вопросов
watch(() => props.testData, async (newTestData) => {
  if (newTestData && newTestData.id) {
    await loadQuestions(newTestData.id)
  } else {
    questions.value = []
  }
}, { immediate: true })

async function loadQuestions(testId) {
  try {
    const questionsData = await questionsApi.getQuestionsByTest(testId)
    questions.value = questionsData || []
    console.log('Загружены вопросы:', questions.value)
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error)
    showError('Ошибка при загрузке вопросов')
    questions.value = []
  }
}

// Сохранение всех вопросов
function handleSave() {
  showSuccess(`Тест обновлен. Всего вопросов: ${questions.value.length}`)
  emit('save', {
    testData: props.testData,
    questions: questions.value
  })
}

// Закрытие без сохранения
function handleClose() {
  emit('close')
}

// Экспорт методов для внешнего использования
defineExpose({
  questions,
  saveQuestions: handleSave
})
</script>

<style scoped>
.question-text {
  font-weight: 500;
  line-height: 1.4;
}

.form-check-input {
  margin-top: 0;
}

.text-sm {
  font-size: 0.875rem;
}

.card {
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}
</style> 