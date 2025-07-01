<template>
  <div class="modal show d-block lesson-modal" @click.self="$emit('close')">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center">
            <component :is="getLessonIcon(lesson.lessontype)" :size="20" class="me-2" />
            {{ lesson.name }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="$emit('close')"
          ></button>
        </div>
        
        <div class="modal-body">
          <!-- Описание урока -->
          <div v-if="lesson.description" class="lesson-description mb-4">
            <div class="alert alert-info">
              <Info :size="16" class="me-2" />
              {{ lesson.description }}
            </div>
          </div>
          
          <!-- Контент урока -->
          <div class="lesson-content mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">
                  <FileText :size="16" class="me-2" />
                  Материалы урока
                </h6>
              </div>
              <div class="card-body">
                <div v-if="lesson.content && lesson.content !== 'CAg='" class="lesson-text">
                  <!-- Декодируем base64 контент -->
                  <div v-html="decodedContent"></div>
                </div>
                <div v-else class="text-muted text-center py-4">
                  <FileText :size="48" class="mb-3 text-secondary" />
                  <h6 class="text-muted">Материалы урока пока не добавлены</h6>
                  <p class="small mb-0">Преподаватель ещё не добавил текстовые материалы к этому уроку</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Элементы урока -->
          <div v-if="lesson.items && lesson.items.length > 0" class="lesson-items">
            <h6 class="mb-3">
              <List :size="16" class="me-2" />
              Задания и материалы
            </h6>
            
            <div class="row">
              <div 
                v-for="item in lesson.items" 
                :key="item.id"
                class="col-lg-6 mb-3"
              >
                <div class="card lesson-item-card h-100">
                  <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-2">
                      <div class="d-flex align-items-center">
                        <component 
                          :is="getItemIcon(item.item_type)" 
                          :size="18" 
                          :class="`text-${getItemTypeColor(item.item_type)} me-2`"
                        />
                        <span :class="`badge bg-${getItemTypeColor(item.item_type)}-subtle text-${getItemTypeColor(item.item_type)}`">
                          {{ getItemTypeName(item.item_type) }}
                        </span>
                      </div>
                      
                      <CheckCircle 
                        v-if="isItemCompleted(item)"
                        :size="16" 
                        class="text-success"
                      />
                    </div>
                    
                    <h6 class="card-title">{{ getItemDisplayName(item) }}</h6>
                    <p v-if="getItemDescription(item)" class="card-text text-muted small">
                      {{ getItemDescription(item) }}
                    </p>
                    
                    <div class="mt-auto">
                      <button 
                        @click="openItem(item)" 
                        class="btn btn-outline-primary btn-sm w-100"
                        :disabled="loading"
                      >
                        <template v-if="item.item_type === 'test'">
                          <HelpCircle :size="14" class="me-1" />
                          Пройти тест
                        </template>
                        <template v-else-if="item.item_type === 'assignment'">
                          <FileCheck :size="14" class="me-1" />
                          Сдать задание
                        </template>
                        <template v-else>
                          <Download :size="14" class="me-1" />
                          Скачать
                        </template>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Если нет элементов -->
          <div v-else class="text-center py-5">
            <BookOpen :size="48" class="text-secondary mb-3" />
            <h6 class="text-muted">В этом уроке пока нет дополнительных материалов</h6>
            <p class="text-muted small mb-0">
              Преподаватель ещё не добавил тесты, задания или дополнительные ресурсы
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="$emit('close')"
          >
            Закрыть
          </button>
          
          <button 
            v-if="!isLessonCompleted"
            type="button" 
            class="btn btn-success" 
            @click="markAsCompleted"
            :disabled="loading"
          >
            <CheckCircle :size="16" class="me-1" />
            Отметить как завершенный
          </button>
          
          <span v-else class="btn btn-success disabled">
            <CheckCircle :size="16" class="me-1" />
            Урок завершен
          </span>
        </div>
      </div>
    </div>
    
    <!-- Компонент для прохождения теста -->
    <TestTaking
      v-if="selectedTest"
      :test="selectedTest"
      :course="course"
      @close="closeTest"
      @completed="onTestCompleted"
    />
    
    <!-- Компонент для сдачи задания -->
    <AssignmentSubmission
      v-if="selectedAssignment"
      :assignment="selectedAssignment"
      :course="course"
      @close="closeAssignment"
      @submitted="onAssignmentSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  FileText, Info, List, CheckCircle, HelpCircle, FileCheck, 
  Download, BookOpen, Video, MessageCircle, File, Link as LinkIcon
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import TestTaking from './TestTaking.vue'
import AssignmentSubmission from './AssignmentSubmission.vue'

const props = defineProps({
  lesson: {
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
const selectedTest = ref(null)
const selectedAssignment = ref(null)
const completedItems = ref(new Set())
const isLessonCompleted = ref(false)

// Декодированный контент урока
const decodedContent = computed(() => {
  if (!props.lesson.content || props.lesson.content === 'CAg=') {
    return '<p class="text-muted">Содержимое урока пока не добавлено</p>'
  }
  
  try {
    // Декодируем base64
    const decoded = atob(props.lesson.content)
    return decoded || '<p class="text-muted">Содержимое урока пока не добавлено</p>'
  } catch (error) {
    console.error('Ошибка декодирования контента:', error)
    return '<p class="text-muted">Ошибка загрузки содержимого урока</p>'
  }
})

// Функции для работы с элементами
function getLessonIcon(lessonType) {
  switch (lessonType) {
    case 'V': return Video
    case 'C': return MessageCircle
    case 'L': return FileText
    case 'A': return FileCheck
    case 'Q': return HelpCircle
    case 'F': return MessageCircle
    case 'FILE': return File
    case 'URL': return LinkIcon
    default: return BookOpen
  }
}

function getItemIcon(itemType) {
  switch (itemType) {
    case 'test': return HelpCircle
    case 'assignment': return FileCheck
    case 'resource': return File
    default: return BookOpen
  }
}

function getItemTypeColor(itemType) {
  switch (itemType) {
    case 'test': return 'info'
    case 'assignment': return 'warning'
    case 'resource': return 'secondary'
    default: return 'primary'
  }
}

function getItemTypeName(itemType) {
  switch (itemType) {
    case 'test': return 'Тест'
    case 'assignment': return 'Задание'
    case 'resource': return 'Ресурс'
    default: return 'Элемент'
  }
}

function getItemDisplayName(item) {
  if (item.test) return item.test.name || item.test.title || 'Тест'
  if (item.assignment) return item.assignment.title || 'Задание'
  if (item.resource) return item.resource.name || 'Ресурс'
  return 'Элемент урока'
}

function getItemDescription(item) {
  if (item.test) return item.test.description
  if (item.assignment) return item.assignment.description
  if (item.resource) return item.resource.description
  return null
}

function isItemCompleted(item) {
  return completedItems.value.has(item.id)
}

// Открытие элементов
async function openItem(item) {
  try {
    loading.value = true
    
    if (item.item_type === 'test') {
      await openTest(item)
    } else if (item.item_type === 'assignment') {
      await openAssignment(item)
    } else if (item.item_type === 'resource') {
      await downloadResource(item)
    }
  } catch (error) {
    console.error('Ошибка открытия элемента:', error)
  } finally {
    loading.value = false
  }
}

async function openTest(item) {
  try {
    // Загружаем полную информацию о тесте
    let testData = item.test
    
    if (!testData || !testData.questions) {
      const testResponse = await apiClient.get(`${endpoints.lms.tests}${item.test.id || item.test}/`)
      if (testResponse.success) {
        testData = testResponse.data
      }
    }
    
    selectedTest.value = testData
  } catch (error) {
    console.error('Ошибка загрузки теста:', error)
  }
}

async function openAssignment(item) {
  try {
    // Загружаем полную информацию о задании
    let assignmentData = item.assignment
    
    if (!assignmentData || !assignmentData.description) {
      const assignmentResponse = await apiClient.get(`${endpoints.lms.assignments}${item.assignment.id || item.assignment}/`)
      if (assignmentResponse.success) {
        assignmentData = assignmentResponse.data
      }
    }
    
    selectedAssignment.value = assignmentData
  } catch (error) {
    console.error('Ошибка загрузки задания:', error)
  }
}

async function downloadResource(item) {
  try {
    const resourceId = item.resource.id || item.resource
    const downloadUrl = endpoints.lms.downloadResource(resourceId)
    
    // Открываем ссылку для скачивания
    const link = document.createElement('a')
    link.href = downloadUrl
    link.target = '_blank'
    link.download = item.resource.name || 'resource'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Отмечаем как просмотренный
    completedItems.value.add(item.id)
  } catch (error) {
    console.error('Ошибка скачивания ресурса:', error)
  }
}

// Закрытие модальных окон
function closeTest() {
  selectedTest.value = null
}

function closeAssignment() {
  selectedAssignment.value = null
}

// Обработка завершения
function onTestCompleted(testId) {
  // Находим элемент теста и отмечаем как завершенный
  const testItem = props.lesson.items.find(item => 
    item.item_type === 'test' && (item.test.id === testId || item.test === testId)
  )
  if (testItem) {
    completedItems.value.add(testItem.id)
  }
  closeTest()
}

function onAssignmentSubmitted(assignmentId) {
  // Находим элемент задания и отмечаем как завершенный
  const assignmentItem = props.lesson.items.find(item => 
    item.item_type === 'assignment' && (item.assignment.id === assignmentId || item.assignment === assignmentId)
  )
  if (assignmentItem) {
    completedItems.value.add(assignmentItem.id)
  }
  closeAssignment()
}

async function markAsCompleted() {
  try {
    loading.value = true
    
    console.log('✅ Отмечаем урок как завершенный:', props.lesson.id)
    
    // Пытаемся сохранить завершение урока через API
    try {
      // Можно использовать API для сохранения прогресса
      const progressData = {
        lesson: props.lesson.id,
        course: props.course.id,
        completed: true,
        completion_date: new Date().toISOString()
      }
      
      console.log('📊 Сохраняем прогресс:', progressData)
      
      // Пока сохраняем в localStorage как fallback
      const storageKey = `lesson_progress_${props.course.id}_${props.lesson.id}`
      localStorage.setItem(storageKey, JSON.stringify(progressData))
      
      console.log('💾 Прогресс сохранен в localStorage')
      
    } catch (apiError) {
      console.warn('⚠️ Не удалось сохранить через API, используем локальное хранение:', apiError)
    }
    
    // Отмечаем как завершенный локально
    isLessonCompleted.value = true
    
    // Уведомляем родительский компонент
    emit('completed', props.lesson.id)
    
    console.log('✅ Урок успешно отмечен как завершенный')
    
  } catch (error) {
    console.error('❌ Ошибка отметки урока как завершенного:', error)
    alert('❌ Ошибка при сохранении прогресса урока')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Загружаем сохраненный прогресс урока
  const storageKey = `lesson_progress_${props.course.id}_${props.lesson.id}`
  const savedProgress = localStorage.getItem(storageKey)
  
  if (savedProgress) {
    try {
      const progressData = JSON.parse(savedProgress)
      if (progressData.completed) {
        isLessonCompleted.value = true
        console.log('📚 Найден сохраненный прогресс урока:', props.lesson.id)
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки сохраненного прогресса:', error)
    }
  }
  
  // Можно также загрузить прогресс выполнения элементов урока из API
  console.log('🔍 Инициализация урока:', props.lesson.name)
})
</script>

<style lang="scss" scoped>
.lesson-modal {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1055;
  
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
  
  .lesson-description {
    .alert {
      border-left: 4px solid var(--bs-info);
    }
  }
  
  .lesson-content {
    .card {
      border: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  }
  
  .lesson-item-card {
    border: none;
    border-left: 4px solid var(--bs-primary);
    transition: transform 0.2s, box-shadow 0.2s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }
  
  .lesson-text {
    max-height: 300px;
    overflow-y: auto;
    
    :deep(p) {
      margin-bottom: 1rem;
    }
    
    :deep(img) {
      max-width: 100%;
      height: auto;
    }
    
    :deep(pre) {
      background: var(--bs-light);
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
    }
  }
}
</style> 