<template>
  <div class="course-layout">
    <div class="sidebar card">
      <div class="card-header green-header">{{ lessons[0]?.course_title || 'Загрузка...' }}</div>
      <div v-if="loading" class="loading">Загрузка уроков...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else class="lesson-list">
        <li v-for="lesson in lessons" :key="lesson.id">
          <button 
            class="lesson-button" 
            @click="loadContent(lesson.id)"
            :class="{ active: current.id === lesson.id }"
          >
            {{ lesson.title }}
          </button>
        </li>
      </ul>
    </div>

    <div class="content card">
      <div class="card-header green-header">{{ current.type === 'test' ? 'Тест' : 'Теория' }}</div>
      <div class="card-body scrollable">
        <div v-if="loading" class="loading">Загрузка содержимого...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <template v-else>
          <h3>{{ current.title }}</h3>
          <div v-html="current.body"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const courseId = route.params.courseId

const current = ref({
  title: 'Добро пожаловать!',
  body: '<p>Выберите урок или тестирование из списка слева, чтобы начать изучение.</p>',
})

const lessons = ref([])
const loading = ref(false)
const error = ref(null)

const fetchLessons = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`/api/lms/courses/${courseId}/lessons/`)
    lessons.value = response.data
  } catch (err) {
    error.value = 'Ошибка при загрузке уроков'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadContent = async (lessonId) => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`/api/lms/lessons/${lessonId}/`)
    current.value = response.data
  } catch (err) {
    error.value = 'Ошибка при загрузке содержимого урока'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLessons()
})
</script>

<style scoped>
    .course-layout {
        display: flex;
        height: 900px;
        box-sizing: border-box;
        background-color: #f3f4f6;
        gap: 10px;
        padding: 0;
        margin: 0;
    }

    .card {
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        background-color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        height: 100%;
        overflow: hidden;
    }

    .sidebar {
        max-width: 30%;
        min-width: 250px;
        padding: 0;
        margin: 0;
        flex: 0 0 30%;
        min-height: 0; /* для прокрутки flex */
        overflow: hidden; /* чтобы не уезжала */
    }

    .content {
        flex: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    .card-header {
        padding: 15px 20px;
        font-weight: bold;
        color: white;
        font-size: 1.1rem;
        margin: 0;
        user-select: none;
    }

    /* Зеленая шапка у обеих частей */
        .green-header {
        background-color: #4caf50;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        width: 100%;
    }

    /* Лист уроков - прокручиваемый */
    .lesson-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex-grow: 1;
    }

    /* Кнопки уроков */
    .lesson-button {
        display: block;
        width: 100%;
        padding: 15px 20px;
        background-color: #f9f9f9;
        border: none;
        border-top: 1px solid #ddd;
        font-weight: 500;
        text-align: left;
        transition: background-color 0.2s ease;
        cursor: pointer;
        border-radius: 0;
    }

    .lesson-button:hover {
        background-color: #ececec;
    }

    /* Контент справа с прокруткой */
    .card-body {
        overflow-y: auto;
        flex: 1;
        padding: 20px;
    }

    .scrollable {
        overflow-y: auto;
    }

    h3 {
        margin-top: 0;
    }

    pre {
        background-color: #eee;
        padding: 10px;
        border-radius: 6px;
        white-space: pre-wrap;
    }

    .question {
        margin-bottom: 20px;
    }

    .options label {
        display: block;
        margin-left: 10px;
    }

    .loading {
        padding: 20px;
        text-align: center;
        color: #666;
    }

    .error {
        padding: 20px;
        text-align: center;
        color: #e74c3c;
        background-color: #fde8e8;
        border-radius: 4px;
        margin: 10px;
    }

    .lesson-button.active {
        background-color: #e8f5e9;
        border-left: 4px solid #4caf50;
    }
</style>
