<template>
    <div class="container mt-5">
      <h2 class="mb-4">Создание нового теста</h2>
  
      <div v-if="(errors.length>0) & submitted" class="alert alert-danger">
        <strong>Исправьте ошибки:</strong>
        <ul>
          <li v-for="(error, i) in errors" :key="i">{{ error }}</li>
        </ul>
      </div>

        <!-- Общие параметры теста -->
        <div class="card mb-4 shadow-sm">
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label"><strong>Название теста</strong></label>
              <input v-model="test.title" type="text" class="form-control" placeholder="Введите название теста" />
            </div>
            <div class="mb-3">
        <label class="form-label"><strong>Умение</strong></label>
        <select v-model="test.skill" class="form-select" required>
          <option disabled value="">Выберите умение</option>
          <option v-for="skill in skills" :key="skill.id" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>
      </div>
            <div class="mb-3">
              <label class="form-label"><strong>Описание</strong></label>
              <textarea v-model="test.description" class="form-control" rows="3" placeholder="Краткое описание теста"></textarea>
            </div>
          </div>
        </div>
  
        <!-- Секция вопросов -->
        <h4 class="mb-3">Вопросы теста</h4>
  
        <div v-for="(question, qIndex) in test.questions" :key="qIndex" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6>Вопрос {{ qIndex + 1 }}</h6>
              <button @click="removeQuestion(qIndex)" class="btn btn-outline-danger btn-sm">×</button>
            </div>
            <div class="mb-3">
              <input v-model="question.text" type="text" class="form-control" placeholder="Текст вопроса" />
            </div>
  
            <h6 class="mt-3">Ответы:</h6>
            <div v-for="(answer, aIndex) in question.answers" :key="aIndex" class="input-group mb-2">
              <div class="input-group-text">
                <input
                  :checked="answer.isCorrect"
                  @change="setCorrectAnswer(qIndex, aIndex)"
                  class="form-check-input mt-0"
                  type="radio"
                  :name="'correct-' + qIndex"
                />
              </div>
              <input v-model="answer.text" type="text" class="form-control" placeholder="Текст ответа" />
              <button @click="removeAnswer(qIndex, aIndex)" class="btn btn-outline-danger btn-sm">−</button>
            </div>
  
            <button @click="addAnswer(qIndex)" class="btn btn-outline-secondary btn-sm mb-3">+ Добавить ответ</button>
          </div>
        </div>
  
        <div class="mt-auto d-grid gap-2 d-md-flex justify-content-md-between">
        <button @click="addQuestion" class="btn btn-primary mb-4">Добавить вопрос</button>
        <button @click="saveTest" class="btn btn-primary mb-4"> Сохранить тест</button>
        </div>
  
    </div>
  </template>
  
  <script setup>
  import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'
import { ref, computed, onMounted } from 'vue'
import router from '@/js/routers'
  // Данные
  const mode = ref('create')
  const test = ref({
    title: '',
    skill: '',
    description: '',
    questions: []
  })
  const errors = ref([])
  const skills = ref([])
const submitted = ref(false)
  
  // Методы
  function addQuestion() {
    test.value.questions.push({
      text: '',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    })
  }
  
  function removeQuestion(index) {
    test.value.questions.splice(index, 1)
  }
  
  function addAnswer(questionIndex) {
    test.value.questions[questionIndex].answers.push({ text: '', isCorrect: false })
  }
  
  function removeAnswer(questionIndex, answerIndex) {
    test.value.questions[questionIndex].answers.splice(answerIndex, 1)
  }
  
  function setCorrectAnswer(questionIndex, answerIndex) {
    const answers = test.value.questions[questionIndex].answers
    answers.forEach((ans, idx) => {
      ans.isCorrect = idx === answerIndex
    })
  }
  
  function validate() {
    errors.value = []
    if (!test.value.title.trim()) errors.value.push('Название теста не может быть пустым')
    if (!test.value.skill.trim()) errors.value.push('Поле "умение" обязательно для заполнения')
    if (!test.value.description.trim()) errors.value.push('Добавьте описание теста')
  
    if (test.value.questions.length === 0) {
      errors.value.push('Добавьте хотя бы один вопрос')
    } else {
      test.value.questions.forEach((q, i) => {
        if (!q.text.trim()) errors.value.push(`Вопрос ${i + 1} не должен быть пустым`)
        if (q.answers.length < 2)
          errors.value.push(`Вопрос ${i + 1} должен содержать минимум 2 ответа`)
  
        const correctCount = q.answers.filter(a => a.isCorrect).length
        if (correctCount === 0)
          errors.value.push(`Вопрос ${i + 1} должен иметь хотя бы один правильный ответ`)
      })
    }
    return errors.value.length === 0
  }
  
 async  function saveTest() {
    if (!validate()) {
      submitted.value = true
      return
    }
    submitted.value = true
    await apiClient.post(endpoints.expert_system.createTest, test.value)
    router.push({name:'AllTests'})
    submitted.value = false
  }

  onMounted(async()=>{
    const response = await apiClient.get(endpoints.expert_system.getSkillsForCreate);
    skills.value = response.data;
    validate()
  })
  </script>
  
  <style scoped>
  .card {
    transition: transform 0.2s;
  }
  .card:hover {
    transform: scale(1.01);
  }
  .input-group .btn {
    padding: 0.375rem 0.75rem;
  }
  .form-check-input {
    margin-top: 0.25rem;
  }
  .alert ul {
    margin-bottom: 0;
    padding-left: 20px;
  }
  .list-group-item {
    font-size: 0.95rem;
  }
  .badge {
    font-size: 0.85rem;
  }
  </style>