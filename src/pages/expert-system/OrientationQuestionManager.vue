<template>
  <div class="container py-4">
    <h2 class="mb-4">
      Вопросы теста: "{{ testName }}"
      <button class="btn btn-link" @click="$router.back()">← Назад</button>
    </h2>
    <div class="mb-3">
      <input v-model="filterTerm" class="form-control" placeholder="Поиск по вопросам..." />
    </div>
    <div class="card card-body mb-4">
      <h5>Добавить новый вопрос</h5>
      <div class="mb-2">
        <input
          v-model="newText"
          class="form-control"
          placeholder="Текст нового вопроса"
        />
      </div>
      <button
        class="btn btn-success text-light me-2"
        @click="addQuestion"
        :disabled="!newText"
      >
        Добавить вопрос
      </button>
    </div>

    <ul class="list-group">
      <li
        v-for="q in filteredQuestions"
        :key="q.id"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <div v-if="editId !== q.id" class="flex-grow-1">
          {{ q.text }}
        </div>
        <div v-else class="flex-grow-1 me-2">
          <input
            v-model="editText"
            class="form-control form-control-sm"
            @keyup.enter="saveEdit"
            placeholder="Текст вопроса"
          />
        </div>

        <div>
          <button
            v-if="editId !== q.id"
            class="btn btn-sm btn-primary me-2"
            @click="startEdit(q)"
          >Редактировать</button>
          <button
            v-else
            class="btn btn-success btn-sm text-light fw-semibold"
            @click="saveEdit"
            :disabled="!editText"
          >Сохранить</button>
          <button
            class="btn btn-sm btn-secondary me-2"
            @click="$router.push({ name: 'OrientationAnswerManager', params: { questionId: q.id } })"
          >Ответы</button>
          <button
            class="btn btn-sm btn-danger"
            @click="deleteQuestion(q.id)"
          >Удалить</button>
        </div>
      </li>
    </ul>

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const route = useRoute()
const testId = route.params.testId

const questions = ref([])
const testName = ref('')
const newText = ref('')
const filterTerm = ref('')
const editId = ref(null)
const editText = ref('')
const error = ref('')

async function fetchQuestions() {
  error.value = ''
  const tres = await apiClient.get(`${endpoints.expert_system.orientationTests}${testId}/`)
  testName.value = tres.success ? tres.data.name : ''
  const qres = await apiClient.get(endpoints.expert_system.orientationQuestions, { test: testId })
  if (qres.success) questions.value = qres.data
  else error.value = 'Не удалось загрузить вопросы'
}

async function addQuestion() {
  const text = newText.value.trim()
  if (!text) return
  const res = await apiClient.post(endpoints.expert_system.orientationQuestions, {
    test: testId,
    text
  })
  if (res.success) {
    newText.value = ''
    await fetchQuestions()
  } else {
    error.value = 'Ошибка: ' + JSON.stringify(res.errors)
  }
}

function startEdit(q) {
  editId.value = q.id
  editText.value = q.text
}

async function saveEdit() {
  const id = editId.value
  if (!editText.value.trim()) return
  const url = `${endpoints.expert_system.orientationQuestions}${id}/`
  const res = await apiClient.patch(url, { text: editText.value.trim() })
  if (res.success) {
    editId.value = null
    editText.value = ''
    await fetchQuestions()
  } else {
    error.value = 'Ошибка: ' + JSON.stringify(res.errors)
  }
}

async function deleteQuestion(id) {
  if (!confirm('Удалить вопрос?')) return
  const url = `${endpoints.expert_system.orientationQuestions}${id}/`
  const res = await apiClient.delete(url)
  if (res.success) await fetchQuestions()
  else error.value = 'Ошибка удаления'
}

const filteredQuestions = computed(() => {
  const term = filterTerm.value.trim().toLowerCase()
  if (!term) return questions.value
  return questions.value.filter(q =>
    q.text.toLowerCase().includes(term)
  )
})

onMounted(fetchQuestions)
</script>
