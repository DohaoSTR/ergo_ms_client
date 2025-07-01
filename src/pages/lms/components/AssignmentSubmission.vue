<template>
  <div class="modal show d-block assignment-modal" @click.self="$emit('close')">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center">
            <FileCheck :size="20" class="me-2 text-warning" />
            {{ assignment.title }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="$emit('close')"
            :disabled="isSubmitting"
          ></button>
        </div>
        
        <div class="modal-body">
          <!-- Информация о задании -->
          <div class="assignment-info mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">
                  <Info :size="16" class="me-2" />
                  Описание задания
                </h6>
              </div>
              <div class="card-body">
                <p>{{ assignment.description || 'Описание не указано' }}</p>
                
                <div class="row">
                  <div class="col-md-4">
                    <small class="text-muted">Дедлайн:</small>
                    <div class="fw-bold" :class="isOverdue ? 'text-danger' : 'text-dark'">
                      {{ formatDeadline() }}
                    </div>
                  </div>
                  <div class="col-md-4">
                    <small class="text-muted">Максимальная оценка:</small>
                    <div class="fw-bold">{{ assignment.max_grade || 100 }} баллов</div>
                  </div>
                  <div class="col-md-4">
                    <small class="text-muted">Тип сдачи:</small>
                    <div class="fw-bold">{{ getSubmissionTypeName() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Форма сдачи -->
          <div class="submission-form">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">
                  <Upload :size="16" class="me-2" />
                  Сдать задание
                </h6>
              </div>
              <div class="card-body">
                <!-- Предупреждение о дедлайне -->
                <div v-if="isOverdue" class="alert alert-warning">
                  <AlertTriangle :size="16" class="me-2" />
                  <strong>Внимание!</strong> Дедлайн выполнения задания истек.
                </div>
                
                <!-- Текстовый ответ -->
                <div v-if="needsTextSubmission" class="text-submission mb-4">
                  <label class="form-label">
                    <FileText :size="16" class="me-1" />
                    Текстовый ответ
                    <span class="text-danger">*</span>
                  </label>
                  <textarea 
                    v-model="submissionForm.text" 
                    class="form-control" 
                    rows="6"
                    placeholder="Введите ваш ответ..."
                  ></textarea>
                </div>
                
                <!-- Загрузка файла -->
                <div v-if="needsFileSubmission" class="file-submission mb-4">
                  <label class="form-label">
                    <Paperclip :size="16" class="me-1" />
                    Прикрепить файл
                    <span v-if="assignment.submission_type === 'file'" class="text-danger">*</span>
                  </label>
                  
                  <div class="file-upload-area">
                    <input 
                      ref="fileInput"
                      type="file" 
                      class="form-control"
                      @change="handleFileSelect"
                    />
                    
                    <div v-if="submissionForm.file" class="selected-file mt-2">
                      <div class="d-flex align-items-center">
                        <File :size="20" class="text-primary me-2" />
                        <span>{{ submissionForm.file.name }}</span>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline-danger ms-auto"
                          @click="removeFile"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Комментарий -->
                <div class="comment-section">
                  <label class="form-label">
                    <MessageSquare :size="16" class="me-1" />
                    Комментарий (необязательно)
                  </label>
                  <textarea 
                    v-model="submissionForm.comment" 
                    class="form-control" 
                    rows="3"
                    placeholder="Дополнительные комментарии..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="$emit('close')"
            :disabled="isSubmitting"
          >
            Отмена
          </button>
          
          <button 
            type="button" 
            class="btn btn-warning" 
            @click="submitAssignment"
            :disabled="!canSubmit || isSubmitting"
          >
            <template v-if="isSubmitting">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Отправка...
            </template>
            <template v-else>
              <FileCheck :size="16" class="me-1" />
              Сдать задание
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  FileCheck, Info, Upload, FileText, Paperclip, 
  MessageSquare, AlertTriangle, File
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

// Создаем простые функции уведомлений
function showSuccess(message) {
  alert(`✅ ${message}`)
}

function showError(message) {
  alert(`❌ ${message}`)
}

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  },
  course: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submitted'])

const isSubmitting = ref(false)
const fileInput = ref(null)

const submissionForm = ref({
  text: '',
  file: null,
  comment: ''
})

// Вычисляемые свойства
const isOverdue = computed(() => {
  if (!props.assignment.deadline) return false
  return new Date() > new Date(props.assignment.deadline)
})

const needsTextSubmission = computed(() => {
  return props.assignment.submission_type === 'text' || props.assignment.submission_type === 'both'
})

const needsFileSubmission = computed(() => {
  return props.assignment.submission_type === 'file' || props.assignment.submission_type === 'both'
})

const canSubmit = computed(() => {
  if (props.assignment.submission_type === 'file') {
    return submissionForm.value.file !== null
  } else if (props.assignment.submission_type === 'text') {
    return submissionForm.value.text.trim() !== ''
  } else if (props.assignment.submission_type === 'both') {
    return submissionForm.value.text.trim() !== '' || submissionForm.value.file !== null
  }
  return false
})

// Обработка файлов
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    submissionForm.value.file = file
  }
}

function removeFile() {
  submissionForm.value.file = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Сдача задания
async function submitAssignment() {
  try {
    isSubmitting.value = true
    
    console.log('📝 Сдача задания:', props.assignment.id)
    console.log('📋 Данные формы:', {
      text: submissionForm.value.text,
      file: submissionForm.value.file?.name,
      comment: submissionForm.value.comment
    })
    
    const formData = new FormData()
    formData.append('assignment', props.assignment.id)
    formData.append('submission_text', submissionForm.value.text)
    formData.append('comment', submissionForm.value.comment)
    
    if (submissionForm.value.file) {
      formData.append('file', submissionForm.value.file)
      console.log('📎 Прикреплен файл:', submissionForm.value.file.name, submissionForm.value.file.size, 'bytes')
    }
    
    console.log('🔗 Отправка на URL:', endpoints.lms.submittedAssignments)
    
    const response = await apiClient.post(endpoints.lms.submittedAssignments, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('✅ Ответ сервера:', response)
    
    if (response.success || response.status === 201) {
      showSuccess('Задание успешно сдано!')
      emit('submitted', props.assignment.id)
    } else {
      console.error('❌ Неуспешный ответ:', response)
      showError('Ошибка при сдаче задания: неуспешный ответ сервера')
    }
    
  } catch (error) {
    console.error('❌ Ошибка сдачи задания:', error)
    console.error('❌ Детали ошибки:', error.response?.data)
    
    let errorMessage = 'Ошибка при сдаче задания'
    if (error.response?.data?.detail) {
      errorMessage += ': ' + error.response.data.detail
    } else if (error.response?.data?.error) {
      errorMessage += ': ' + error.response.data.error
    } else if (error.message) {
      errorMessage += ': ' + error.message
    }
    
    showError(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

// Вспомогательные функции
function formatDeadline() {
  if (!props.assignment.deadline) return 'Не указан'
  
  const deadline = new Date(props.assignment.deadline)
  return deadline.toLocaleDateString('ru', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSubmissionTypeName() {
  switch (props.assignment.submission_type) {
    case 'file': return 'Только файл'
    case 'text': return 'Только текст'
    case 'both': return 'Файл и текст'
    default: return 'Не указан'
  }
}
</script>

<style lang="scss" scoped>
.assignment-modal {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
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
}
</style> 