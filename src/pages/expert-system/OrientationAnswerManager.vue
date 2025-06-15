<template>
  <div class="container py-4">
    <h2 class="mb-4">
      Ответы для вопроса "{{ questionText }}"
      <button class="btn btn-link" @click="$router.back()">← Назад</button>
    </h2>

    <div class="card card-body mb-4">
      <div class="row g-2 align-items-end">
        <div class="col-md-6">
          <input v-model="newText" class="form-control" placeholder="Текст ответа" />
        </div>
        <div class="col-md-2">
          <input v-model.number="newWeight" type="number" class="form-control" placeholder="Вес" />
        </div>
        <div class="col-md-4">
          <select v-model="newRole" class="form-select">
            <option disabled value="">Выберите роль</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <div class="col-12 text-end">
          <button
            class="btn btn-success text-light me-2"
            @click="addAnswer"
            :disabled="!newText || !newRole"
          >Добавить ответ</button>
        </div>
      </div>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Текст</th>
          <th>Вес</th>
          <th>Роль</th>
          <th style="width:200px">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in filteredAnswers" :key="a.id">
          <td v-if="editId!==a.id">{{ a.text }}</td>
          <td v-else>
            <input v-model="editText" class="form-control form-control-sm" />
          </td>
          <td v-if="editId!==a.id">{{ a.weight }}</td>
          <td v-else>
            <input v-model.number="editWeight" type="number" class="form-control form-control-sm" />
          </td>
          <td v-if="editId!==a.id">{{ getRoleName(a.role) }}</td>
          <td v-else>
            <select v-model="editRole" class="form-select form-select-sm">
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </td>
          <td>
            <button
              v-if="editId!==a.id"
              class="btn btn-sm btn-primary me-2"
              @click="startEdit(a)"
            >Изменить</button>
            <button
              v-else
              class="btn btn-success text-light me-2"
              @click="saveEdit"
              :disabled="!editText || !editRole"
            >Сохранить</button>
            <button
              class="btn btn-sm btn-danger"
              @click="deleteAnswer(a.id)"
            >Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const route = useRoute()
const questionId = route.params.questionId

const answers = ref([])
const roles = ref([])
const questionText = ref('')

const newText   = ref('')
const newWeight = ref(0)
const newRole   = ref('')

const editId     = ref(null)
const editText   = ref('')
const editWeight = ref(0)
const editRole   = ref('')

const error = ref('')

const filteredAnswers = computed(() =>
  answers.value.filter(a => String(a.question) === String(questionId))
)

function getRoleName(roleId) {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : `Роль #${roleId}`
}

async function load() {
  error.value = ''
  const rres = await apiClient.get(endpoints.expert_system.roles)
  if (rres.success) roles.value = rres.data

  const qres = await apiClient.get(`${endpoints.expert_system.orientationQuestions}${questionId}/`)
  if (qres.success) questionText.value = qres.data.text

  const ares = await apiClient.get(endpoints.expert_system.orientationAnswers)
  if (ares.success) answers.value = ares.data
  else error.value = 'Не удалось загрузить ответы'
}

async function addAnswer() {
  error.value = ''
  const payload = {
    question: Number(questionId),
    text: newText.value.trim(),
    weight: newWeight.value,
    role: newRole.value
  }
  const res = await apiClient.post(endpoints.expert_system.orientationAnswers, payload)
  if (res.success) {
    newText.value = ''
    newWeight.value = 0
    newRole.value = ''
    await load()
  } else {
    error.value = 'Ошибка добавления: ' + JSON.stringify(res.errors)
  }
}

function startEdit(a) {
  editId.value     = a.id
  editText.value   = a.text
  editWeight.value = a.weight
  editRole.value   = typeof a.role === 'object' && a.role !== null ? a.role.id : a.role
}

async function saveEdit() {
  const url = `${endpoints.expert_system.orientationAnswers}${editId.value}/`
  const res = await apiClient.patch(url, {
    text: editText.value.trim(),
    weight: editWeight.value,
    role: editRole.value
  })
  if (res.success) {
    editId.value = null
    editText.value = ''
    editWeight.value = 0
    editRole.value = ''
    await load()
  } else {
    error.value = 'Ошибка сохранения: ' + JSON.stringify(res.errors)
  }
}

async function deleteAnswer(id) {
  if (!confirm('Удалить ответ?')) return
  const url = `${endpoints.expert_system.orientationAnswers}${id}/`
  const res = await apiClient.delete(url)
  if (res.success) await load()
  else error.value = 'Ошибка удаления'
}

onMounted(load)
</script>
