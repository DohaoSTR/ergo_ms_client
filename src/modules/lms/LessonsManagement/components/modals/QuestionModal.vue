<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактировать вопрос' : 'Создать вопрос'"
    :loading="loading"
    size="lg"
    :confirm-text="editing ? 'Обновить' : 'Создать'"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <template #icon>
      <HelpCircle :size="20" class="text-info" />
    </template>

    <form @submit.prevent="handleSave">
      <!-- Тип вопроса -->
      <div class="mb-4">
        <label class="form-label">Тип вопроса *</label>
        <div class="row">
          <div class="col-md-6">
            <div class="form-check">
              <input 
                v-model="form.type" 
                class="form-check-input" 
                type="radio" 
                value="S" 
                id="typeSingle"
              />
              <label class="form-check-label" for="typeSingle">
                <strong>Одиночный выбор</strong><br>
                <small class="text-muted">Один правильный ответ из нескольких вариантов</small>
              </label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check">
              <input 
                v-model="form.type" 
                class="form-check-input" 
                type="radio" 
                value="M" 
                id="typeMultiple"
              />
              <label class="form-check-label" for="typeMultiple">
                <strong>Множественный выбор</strong><br>
                <small class="text-muted">Несколько правильных ответов</small>
              </label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check">
              <input 
                v-model="form.type" 
                class="form-check-input" 
                type="radio" 
                value="TF" 
                id="typeTrueFalse"
              />
              <label class="form-check-label" for="typeTrueFalse">
                <strong>Верно/Неверно</strong><br>
                <small class="text-muted">Утверждение верно или неверно</small>
              </label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check">
              <input 
                v-model="form.type" 
                class="form-check-input" 
                type="radio" 
                value="O" 
                id="typeOpen"
              />
              <label class="form-check-label" for="typeOpen">
                <strong>Открытый ответ</strong><br>
                <small class="text-muted">Текстовый ответ студента</small>
              </label>
            </div>
          </div>
        </div>
        <div v-if="validationErrors.type" class="text-danger mt-1">
          {{ validationErrors.type }}
        </div>
      </div>

      <!-- Текст вопроса -->
      <div class="mb-3">
        <label class="form-label">Текст вопроса *</label>
        <textarea 
          v-model="form.text" 
          class="form-control" 
          :class="{ 'is-invalid': validationErrors.text }"
          rows="4"
          placeholder="Введите текст вопроса"
          required
        ></textarea>
        <div v-if="validationErrors.text" class="invalid-feedback">
          {{ validationErrors.text }}
        </div>
      </div>

      <!-- Баллы за вопрос -->
      <div class="row mb-4">
        <div class="col-md-6">
          <label class="form-label">Баллы за вопрос *</label>
          <input 
            v-model="form.points" 
            type="number" 
            class="form-control"
            :class="{ 'is-invalid': validationErrors.points }"
            min="0.1"
            step="0.1"
            required
            placeholder="1"
          />
          <div v-if="validationErrors.points" class="invalid-feedback">
            {{ validationErrors.points }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Сложность</label>
          <select v-model="form.difficulty" class="form-select">
            <option value="easy">Легкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>
        </div>
      </div>

      <!-- Варианты ответов для закрытых вопросов -->
      <div v-if="['S', 'M', 'TF'].includes(form.type)" class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <label class="form-label mb-0">Варианты ответов *</label>
          <button 
            v-if="form.type !== 'TF'"
            type="button" 
            class="btn btn-sm btn-outline-primary"
            @click="addAnswer"
          >
            <Plus :size="14" class="me-1" />
            Добавить вариант
          </button>
        </div>

        <!-- Варианты для Верно/Неверно -->
        <div v-if="form.type === 'TF'">
          <div class="row">
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  v-model="trueFalseAnswer" 
                  class="form-check-input" 
                  type="radio" 
                  value="true" 
                  id="answerTrue"
                />
                <label class="form-check-label" for="answerTrue">
                  Верно
                </label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  v-model="trueFalseAnswer" 
                  class="form-check-input" 
                  type="radio" 
                  value="false" 
                  id="answerFalse"
                />
                <label class="form-check-label" for="answerFalse">
                  Неверно
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Варианты для одиночного и множественного выбора -->
        <div v-else>
          <div 
            v-for="(answer, index) in form.answers" 
            :key="`answer-${index}`"
            class="d-flex align-items-center mb-3"
          >
            <div class="me-3">
              <input 
                v-if="form.type === 'S'"
                v-model="selectedSingleAnswer"
                :value="index"
                class="form-check-input" 
                type="radio" 
                :id="`answer-radio-${index}`"
              />
              <input 
                v-else
                v-model="answer.is_correct"
                class="form-check-input" 
                type="checkbox" 
                :id="`answer-check-${index}`"
              />
            </div>
            <div class="flex-grow-1 me-3">
              <input 
                v-model="answer.text" 
                type="text" 
                class="form-control"
                :class="{ 'is-invalid': validationErrors[`answer_${index}`] }"
                :placeholder="`Вариант ответа ${index + 1}`"
                required
              />
              <div v-if="validationErrors[`answer_${index}`]" class="invalid-feedback">
                {{ validationErrors[`answer_${index}`] }}
              </div>
            </div>
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="removeAnswer(index)"
              :disabled="form.answers.length <= 2"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <div v-if="form.answers.length < 2" class="alert alert-warning py-2">
            <small>Добавьте минимум 2 варианта ответа</small>
          </div>
        </div>
      </div>

      <!-- Правильный ответ для открытых вопросов -->
      <div v-if="form.type === 'O'" class="mb-4">
        <label class="form-label">Правильный ответ *</label>
        <textarea 
          v-model="form.correctanswer" 
          class="form-control"
          :class="{ 'is-invalid': validationErrors.correctanswer }"
          rows="3"
          placeholder="Введите правильный ответ"
          required
        ></textarea>
        <div class="form-text">Ответ студента будет сравниваться с этим текстом</div>
        <div v-if="validationErrors.correctanswer" class="invalid-feedback">
          {{ validationErrors.correctanswer }}
        </div>
      </div>

      <!-- Объяснение -->
      <div class="mb-3">
        <label class="form-label">Объяснение ответа</label>
        <textarea 
          v-model="form.explanation" 
          class="form-control" 
          rows="3"
          placeholder="Объяснение правильного ответа (необязательно)"
        ></textarea>
        <div class="form-text">Будет показано студенту после ответа на вопрос</div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { HelpCircle, Plus, Trash2 } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  questionData: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  type: 'S',
  text: '',
  points: 1,
  difficulty: 'medium',
  correctanswer: '',
  explanation: '',
  answers: []
})

const validationErrors = ref({})
const selectedSingleAnswer = ref(null)
const trueFalseAnswer = ref('true')

// Инициализация вариантов ответов
function initializeAnswers() {
  if (form.value.type === 'TF') {
    form.value.answers = [
      { text: 'Верно', is_correct: trueFalseAnswer.value === 'true' },
      { text: 'Неверно', is_correct: trueFalseAnswer.value === 'false' }
    ]
  } else if (['S', 'M'].includes(form.value.type) && form.value.answers.length === 0) {
    form.value.answers = [
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  }
}

// Добавление варианта ответа
function addAnswer() {
  form.value.answers.push({ text: '', is_correct: false })
}

// Удаление варианта ответа
function removeAnswer(index) {
  if (form.value.answers.length > 2) {
    form.value.answers.splice(index, 1)
    // Обновляем выбранный ответ для одиночного выбора
    if (form.value.type === 'S' && selectedSingleAnswer.value === index) {
      selectedSingleAnswer.value = null
    } else if (form.value.type === 'S' && selectedSingleAnswer.value > index) {
      selectedSingleAnswer.value--
    }
  }
}

// Сброс формы
function resetForm() {
  form.value = {
    type: 'S',
    text: '',
    points: 1,
    difficulty: 'medium',
    correctanswer: '',
    explanation: '',
    answers: []
  }
  validationErrors.value = {}
  selectedSingleAnswer.value = null
  trueFalseAnswer.value = 'true'
  initializeAnswers()
}

// Сохранение вопроса
function handleSave() {
  validationErrors.value = {}
  
  const errors = {}
  
  if (!form.value.type) {
    errors.type = 'Выберите тип вопроса'
  }
  
  if (!form.value.text?.trim()) {
    errors.text = 'Введите текст вопроса'
  }
  
  if (!form.value.points || form.value.points <= 0) {
    errors.points = 'Укажите количество баллов больше 0'
  }

  // Валидация в зависимости от типа вопроса
  if (form.value.type === 'O') {
    if (!form.value.correctanswer?.trim()) {
      errors.correctanswer = 'Введите правильный ответ'
    }
  } else if (['S', 'M', 'TF'].includes(form.value.type)) {
    // Проверяем варианты ответов
    if (form.value.answers.length < 2) {
      errors.answers = 'Добавьте минимум 2 варианта ответа'
    }
    
    form.value.answers.forEach((answer, index) => {
      if (!answer.text?.trim()) {
        errors[`answer_${index}`] = 'Введите текст варианта ответа'
      }
    })

    // Обновляем правильные ответы для одиночного выбора
    if (form.value.type === 'S' && selectedSingleAnswer.value !== null) {
      form.value.answers.forEach((answer, index) => {
        answer.is_correct = index === selectedSingleAnswer.value
      })
    }

    // Обновляем правильные ответы для Верно/Неверно
    if (form.value.type === 'TF') {
      form.value.answers[0].is_correct = trueFalseAnswer.value === 'true'
      form.value.answers[1].is_correct = trueFalseAnswer.value === 'false'
    }

    // Проверяем, что есть хотя бы один правильный ответ
    const hasCorrectAnswer = form.value.answers.some(answer => answer.is_correct)
    if (!hasCorrectAnswer) {
      errors.answers = 'Выберите правильный ответ'
    }
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  emit('save', { ...form.value })
}

// Наблюдаем за изменением типа вопроса
watch(() => form.value.type, (newType) => {
  initializeAnswers()
}, { immediate: true })

// Наблюдаем за изменением trueFalseAnswer для типа TF
watch(trueFalseAnswer, (newValue) => {
  if (form.value.type === 'TF') {
    form.value.answers = [
      { text: 'Верно', is_correct: newValue === 'true' },
      { text: 'Неверно', is_correct: newValue === 'false' }
    ]
  }
})

// Загрузка данных при редактировании
watch(() => props.questionData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    form.value = {
      type: newData.type || 'S',
      text: newData.text || '',
      points: newData.points || 1,
      difficulty: newData.difficulty || 'medium',
      correctanswer: newData.correctanswer || '',
      explanation: newData.explanation || '',
      answers: newData.answers ? [...newData.answers] : []
    }

    // Устанавливаем выбранный ответ для одиночного выбора
    if (form.value.type === 'S') {
      selectedSingleAnswer.value = form.value.answers.findIndex(answer => answer.is_correct)
    }

    // Устанавливаем значение для Верно/Неверно
    if (form.value.type === 'TF' && form.value.answers.length > 0) {
      trueFalseAnswer.value = form.value.answers[0].is_correct ? 'true' : 'false'
    }

    if (form.value.answers.length === 0) {
      initializeAnswers()
    }
  } else if (!props.editing) {
    resetForm()
  }
}, { immediate: true })

// Сброс при закрытии
watch(() => props.show, (newShow) => {
  if (!newShow) {
    validationErrors.value = {}
  }
})

onMounted(() => {
  initializeAnswers()
})
</script>

<style scoped>
.form-check-label strong {
  display: block;
}

.form-check {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.form-check:hover {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.form-check-input:checked + .form-check-label {
  color: #0d6efd;
}

.form-check-input:checked + .form-check-label strong {
  font-weight: 600;
}
</style> 