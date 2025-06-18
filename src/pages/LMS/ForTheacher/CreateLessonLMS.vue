<template>
  <div class="layout">
    <!-- Карточка урока -->
    <div class="card lesson-card" :class="{ slideLeft: showTestPanel }">
      <h2>Создание урока</h2>

      <!-- Название -->
      <div class="form-group">
        <label>Название урока</label>
        <input v-model="lessonTitle" type="text" placeholder="Введите название" />
      </div>

      <!-- Хештеги -->
      <div class="form-group">
        <label>Хештеги (предметы)</label>
        <div class="tag-list">
          <span v-for="(tag, index) in tags" :key="index" class="tag">
            {{ tag }}
            <button @click="removeTag(index)">×</button>
          </span>
        </div>
        <input
          v-model="newTag"
          @keydown.enter.prevent="addTag"
          type="text"
          placeholder="Введите хештег и нажмите Enter"
        />
      </div>

      <!-- Теория -->
      <div class="form-group">
        <label>Теоретический материал</label>
        <textarea v-model="lessonText" rows="6" placeholder="Введите текст"></textarea>
      </div>

      <!-- Файлы -->
      <div class="form-group">
        <label>Прикрепить файлы (текст, изображение, видео)</label>
        <input type="file" multiple @change="handleFileUpload" />
        <p v-if="!fileList.length" class="file-empty">Файл не выбран</p>
        <ul v-else class="file-info">
          <li v-for="(file, index) in fileList" :key="index">
            {{ file.name }}
            <button class="remove-file" @click="removeFile(index)">Удалить</button>
          </li>
        </ul>
      </div>

      <!-- Кнопки -->
      <div class="text-center">
        <button class="btn btn-primary"@click="submitLesson">Создать урок</button>
        <button class="btn btn-primary"v-if="!showTestPanel" @click="showTestPanel = true" style="margin-left: 12px;">
          Добавить тестирование
        </button>
      </div>
    </div>

    <!-- Карточка тестирования -->
    <div class="card test-card" v-if="showTestPanel">
      <div class="test-header">
        <h2>Тестирование</h2>
        <button class="btn btn-primary" @click="hideTestPanel">Убрать тестирование</button>
      </div>

      <div v-for="(question, qIndex) in questions" :key="qIndex" class="question-block">
        <label>Вопрос {{ qIndex + 1 }}</label>
        <input v-model="question.text" type="text" placeholder="Введите вопрос" />

        <div v-for="(option, oIndex) in question.options" :key="oIndex" class="option">
          <input type="checkbox" v-model="option.correct" />
          <input v-model="option.text" type="text" placeholder="Введите вариант ответа" />
        </div>

        <button @click="addOption(qIndex)" class="btn btn-primary">Добавить вариант</button>
      </div>

      <button @click="addQuestion" class="btn btn-primary">Добавить вопрос</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const lessonTitle = ref('')
const tags = ref([])
const newTag = ref('')
const lessonText = ref('')
const fileList = ref([])

const showTestPanel = ref(false)
const questions = ref([])

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
  }
  newTag.value = ''
}

function removeTag(index) {
  tags.value.splice(index, 1)
}

function handleFileUpload(event) {
  const newFiles = Array.from(event.target.files)
  fileList.value = [...fileList.value, ...newFiles]
  event.target.value = null
}

function removeFile(index) {
  fileList.value.splice(index, 1)
}

function submitLesson() {
  const lessonData = {
    title: lessonTitle.value,
    tags: tags.value,
    text: lessonText.value,
    files: fileList.value,
    questions: questions.value
  }
  console.log('Данные отправлены:', lessonData)
  alert('Урок с тестированием создан')
}

function addQuestion() {
  questions.value.push({
    text: '',
    options: [{ text: '', correct: false }]
  })
}

function addOption(qIndex) {
  questions.value[qIndex].options.push({ text: '', correct: false })
}

function hideTestPanel() {
  showTestPanel.value = false
}
</script>

<style scoped>
.layout {
  display: flex;
  gap: 24px;
  padding: 32px;
  max-width: 1300px;
  margin: auto;
}

.card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  flex: 1;
  transition: transform 0.4s ease;
  min-width: 0;
}

.lesson-card.slideLeft {
  transform: translateX(-20px);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  font-size: 15px;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
  color: #333;
}

input[type="text"],
textarea,
input[type="file"] {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 12px;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  background: #e0f0ff;
  color: #007acc;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag button {
  background: transparent;
  border: none;
  color: #007acc;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
}

.file-empty {
  font-size: 13px;
  color: #888;
  margin-top: 6px;
  font-style: italic;
}

.file-info {
  font-size: 13px;
  color: #555;
  margin-top: 6px;
  list-style: disc;
  padding-left: 20px;
}

.remove-file {
  margin-left: 12px;
  background: none;
  border: none;
  color: #d00;
  cursor: pointer;
  font-size: 13px;
}

.remove-file:hover {
  text-decoration: underline;
}

.text-center {
  text-align: center;
}

.mt-3 {
  margin-top: 24px;
}

.question-block {
  margin-bottom: 24px;
}

.question-block input[type="text"] {
  margin-top: 6px;
  margin-bottom: 12px;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}



.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
