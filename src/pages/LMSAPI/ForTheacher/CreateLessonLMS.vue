<template>
  <div class="create-lesson-container">
    <h2>Создание нового урока</h2>
    
    <form @submit.prevent="handleSubmit" class="lesson-form">
      <div class="form-group">
        <label for="title">Название урока</label>
        <input
          id="title"
          v-model="lessonData.title"
          type="text"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="description">Описание</label>
        <textarea
          id="description"
          v-model="lessonData.description"
          required
          class="form-textarea"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="subject">Предмет</label>
        <select
          id="subject"
          v-model="lessonData.subject"
          required
          class="form-select"
        >
          <option value="">Выберите предмет</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="duration">Длительность (минуты)</label>
        <input
          id="duration"
          v-model.number="lessonData.duration"
          type="number"
          min="15"
          max="180"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="difficulty">Сложность</label>
        <select
          id="difficulty"
          v-model="lessonData.difficulty"
          required
          class="form-select"
        >
          <option value="easy">Легкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>
      </div>

      <div class="materials-section">
        <h3>Материалы</h3>
        <button type="button" @click="addMaterial" class="btn-add">
          Добавить материал
        </button>
        
        <div v-for="(material, index) in lessonData.materials" :key="index" class="material-item">
          <input
            v-model="material.title"
            type="text"
            placeholder="Название материала"
            required
            class="form-input"
          />
          <select
            v-model="material.type"
            required
            class="form-select"
          >
            <option value="document">Документ</option>
            <option value="video">Видео</option>
            <option value="link">Ссылка</option>
          </select>
          <input
            v-model="material.url"
            type="url"
            placeholder="URL материала"
            required
            class="form-input"
          />
          <button
            type="button"
            @click="removeMaterial(index)"
            class="btn-remove"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="tasks-section">
        <h3>Задания</h3>
        <button type="button" @click="addTask" class="btn-add">
          Добавить задание
        </button>
        
        <div v-for="(task, index) in lessonData.tasks" :key="index" class="task-item">
          <input
            v-model="task.title"
            type="text"
            placeholder="Название задания"
            required
            class="form-input"
          />
          <textarea
            v-model="task.description"
            placeholder="Описание задания"
            required
            class="form-textarea"
          ></textarea>
          <input
            v-model.number="task.points"
            type="number"
            min="1"
            placeholder="Баллы"
            required
            class="form-input"
          />
          <input
            v-model="task.deadline"
            type="datetime-local"
            required
            class="form-input"
          />
          <button
            type="button"
            @click="removeTask(index)"
            class="btn-remove"
          >
            Удалить
          </button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-submit"
      >
        {{ loading ? 'Создание...' : 'Создать урок' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const lessonData = ref({
  title: '',
  description: '',
  subject: '',
  duration: 45,
  difficulty: 'medium',
  materials: [],
  tasks: []
})

const subjects = ref([])
const loading = ref(false)
const error = ref(null)

const fetchSubjects = async () => {
  try {
    const response = await axios.get('/api/lms/subjects/')
    subjects.value = response.data
  } catch (err) {
    error.value = 'Ошибка при загрузке предметов'
    console.error(err)
  }
}

const addMaterial = () => {
  lessonData.value.materials.push({
    title: '',
    type: 'document',
    url: ''
  })
}

const removeMaterial = (index) => {
  lessonData.value.materials.splice(index, 1)
}

const addTask = () => {
  lessonData.value.tasks.push({
    title: '',
    description: '',
    points: 10,
    deadline: ''
  })
}

const removeTask = (index) => {
  lessonData.value.tasks.splice(index, 1)
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null
  
  try {
    await axios.post('/api/lms/lessons/', lessonData.value)
    router.push('/lms/teacher')
  } catch (err) {
    error.value = 'Ошибка при создании урока'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSubjects()
})
</script>

<style scoped>
.create-lesson-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.materials-section,
.tasks-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
}

.material-item,
.task-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr auto;
  gap: 10px;
  margin-bottom: 10px;
  align-items: start;
}

.btn-add,
.btn-remove,
.btn-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add {
  background-color: #4CAF50;
  color: white;
}

.btn-remove {
  background-color: #f44336;
  color: white;
}

.btn-submit {
  background-color: #2196F3;
  color: white;
  font-size: 16px;
  padding: 12px 24px;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}
</style>
