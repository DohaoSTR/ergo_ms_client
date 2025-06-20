<template>
  <div class="lesson-viewer">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="lesson" class="lesson-content">
      <!-- Заголовок урока -->
      <div class="lesson-header mb-4">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h2>{{ lesson.title }}</h2>
            <p class="text-muted mb-0">{{ lesson.description }}</p>
          </div>
          <div class="d-flex gap-2">
            <span class="badge bg-primary">Урок {{ lesson.order }}</span>
            <span v-if="lesson.duration" class="badge bg-secondary">
              <Clock :size="14" class="me-1" />
              {{ lesson.duration }} мин
            </span>
          </div>
        </div>
      </div>

      <!-- Видео (если есть) -->
      <div v-if="lesson.video_url" class="lesson-video mb-4">
        <div class="ratio ratio-16x9">
          <iframe
            :src="getEmbedUrl(lesson.video_url)"
            allowfullscreen
            frameborder="0"
            class="rounded"
          ></iframe>
        </div>
      </div>

      <!-- Содержание урока -->
      <div class="lesson-text mb-4">
        <div class="card">
          <div class="card-body">
            <div v-if="lesson.content" v-html="formatContent(lesson.content)" class="lesson-content-html"></div>
            <div v-else class="text-muted text-center py-4">
              <BookOpen :size="48" class="mb-3" />
              <p>Содержание урока пока не добавлено</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Материалы для скачивания -->
      <div v-if="lesson.files && lesson.files.length > 0" class="lesson-materials mb-4">
        <h5 class="d-flex align-items-center gap-2 mb-3">
          <Download :size="20" />
          Материалы урока
        </h5>
        <div class="row">
          <div v-for="file in lesson.files" :key="file.id" class="col-md-6 mb-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center gap-3">
                  <div class="file-icon">
                    <FileText :size="24" class="text-primary" />
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="card-title mb-1">{{ file.name }}</h6>
                    <small class="text-muted">{{ formatFileSize(file.size) }}</small>
                  </div>
                  <a :href="file.url" class="btn btn-sm btn-outline-primary" download>
                    <Download :size="16" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Навигация между уроками -->
      <div class="lesson-navigation mt-5">
        <div class="d-flex justify-content-between align-items-center">
          <button 
            v-if="previousLesson" 
            @click="$emit('navigate', previousLesson.id)"
            class="btn btn-outline-secondary"
          >
            <ChevronLeft :size="16" class="me-1" />
            {{ previousLesson.title }}
          </button>
          <div v-else></div>

          <div class="text-center">
            <div class="progress mb-2" style="width: 200px;">
              <div 
                class="progress-bar" 
                :style="`width: ${lessonProgress}%`"
                role="progressbar"
              ></div>
            </div>
            <small class="text-muted">{{ currentLessonIndex + 1 }} из {{ totalLessons }}</small>
          </div>

          <button 
            v-if="nextLesson" 
            @click="$emit('navigate', nextLesson.id)"
            class="btn btn-primary"
          >
            {{ nextLesson.title }}
            <ChevronRight :size="16" class="ms-1" />
          </button>
          <button 
            v-else-if="!isCompleted"
            @click="completeLesson"
            class="btn btn-success"
          >
            <CheckCircle :size="16" class="me-1" />
            Завершить урок
          </button>
          <div v-else class="d-flex align-items-center gap-2 text-success">
            <CheckCircle :size="16" />
            Урок завершен
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  BookOpen, 
  Clock, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle 
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { showSuccess, showError } from '@/js/utils/notifications'

const props = defineProps({
  lessonId: {
    type: Number,
    required: true
  },
  courseId: {
    type: Number,
    required: true
  },
  courseLessons: {
    type: Array,
    default: () => []
  }
})

const emits = defineEmits(['navigate', 'completed'])

const lesson = ref(null)
const loading = ref(true)
const error = ref('')
const isCompleted = ref(false)

const currentLessonIndex = computed(() => {
  return props.courseLessons.findIndex(l => l.id === props.lessonId)
})

const totalLessons = computed(() => props.courseLessons.length)

const lessonProgress = computed(() => {
  return totalLessons.value > 0 ? ((currentLessonIndex.value + 1) / totalLessons.value) * 100 : 0
})

const previousLesson = computed(() => {
  const index = currentLessonIndex.value
  return index > 0 ? props.courseLessons[index - 1] : null
})

const nextLesson = computed(() => {
  const index = currentLessonIndex.value
  return index < props.courseLessons.length - 1 ? props.courseLessons[index + 1] : null
})

async function fetchLesson() {
  try {
    loading.value = true
    error.value = ''
    
    const response = await apiClient.get(`${endpoints.lms.lessons}${props.lessonId}/`)
    lesson.value = response.data
    
    // Проверяем, завершен ли урок
    await checkLessonCompletion()
  } catch (err) {
    error.value = 'Ошибка загрузки урока'
    console.error('Ошибка загрузки урока:', err)
  } finally {
    loading.value = false
  }
}

async function checkLessonCompletion() {
  try {
    // TODO: Проверка завершения урока через API
    // const response = await apiClient.get(`${endpoints.lms.lessons}${props.lessonId}/completion/`)
    // isCompleted.value = response.data.completed
    
    // Пока используем localStorage для демо
    const completedKey = `lesson_${props.courseId}_${props.lessonId}_completed`
    isCompleted.value = localStorage.getItem(completedKey) === 'true'
  } catch (err) {
    console.error('Ошибка проверки завершения:', err)
  }
}

async function completeLesson() {
  try {
    // TODO: Отправка данных о завершении урока на сервер
    // await apiClient.post(`${endpoints.lms.lessons}${props.lessonId}/complete/`)
    
    // Пока используем localStorage для демо
    const completedKey = `lesson_${props.courseId}_${props.lessonId}_completed`
    localStorage.setItem(completedKey, 'true')
    
    isCompleted.value = true
    showSuccess('Урок завершен!')
    emits('completed', props.lessonId)
  } catch (err) {
    showError('Ошибка при завершении урока')
    console.error('Ошибка завершения урока:', err)
  }
}

function getEmbedUrl(url) {
  // Конвертируем YouTube URL в embed формат
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
}

function formatContent(content) {
  // Простое форматирование Markdown
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(fetchLesson)
</script>

<style scoped>
.lesson-content-html {
  line-height: 1.6;
}

.lesson-content-html h1,
.lesson-content-html h2,
.lesson-content-html h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.lesson-content-html p {
  margin-bottom: 1rem;
}

.lesson-content-html ul,
.lesson-content-html ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--bs-light);
  border-radius: 8px;
}

.lesson-navigation .progress {
  height: 6px;
}

@media (max-width: 768px) {
  .lesson-navigation {
    .d-flex {
      flex-direction: column;
      gap: 1rem;
    }
    
    .progress {
      width: 100% !important;
    }
  }
}
</style> 