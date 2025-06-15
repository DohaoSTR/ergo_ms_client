<template>
  <div class="container py-4">
    <h2 class="mb-4">Управление тестом профориентации</h2>

    <div class="mb-3 d-flex" v-if="tests.length === 0">
      <input v-model="newName" class="form-control me-2" placeholder="Название нового теста" />
      <button class="btn btn-success text-light me-2" @click="addTest" :disabled="!newName">Создать тест</button>
    </div>
    <div v-else class="alert alert-info">
      Тест уже создан. Можно добавить вопросы, пройти тест и работать с ним.
    </div>

    <table class="table table-hover" v-if="tests.length">
      <thead>
        <tr>
          <th>Название</th>
          <th style="width: 300px">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tests" :key="t.id">
          <td v-if="editId !== t.id">{{ t.name }}</td>
          <td v-else>
            <input v-model="editName" class="form-control form-control-sm" @keyup.enter="saveEdit" />
          </td>
          <td>
            <button
              v-if="editId !== t.id"
              class="btn btn-sm btn-primary me-2"
              @click="startEdit(t)"
            >Переименовать</button>
            <button
              v-else
              class="btn btn-success text-light me-2"
              @click="saveEdit"
              :disabled="!editName"
            >Сохранить</button>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="$router.push({ name: 'OrientationQuestionManager', params: { testId: t.id } })"
            >Вопросы</button>
            <button
              class="btn btn-sm btn-danger"
              @click="deleteTest(t.id)"
            >Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const tests = ref([])
const newName = ref('')
const editId = ref(null)
const editName = ref('')
const error = ref('')

async function fetchTests() {
  error.value = ''
  const res = await apiClient.get(endpoints.expert_system.orientationTests)
  if (res.success) tests.value = res.data
  else error.value = 'Не удалось загрузить тест'
}

async function addTest() {
  if (tests.value.length > 0) {
    error.value = 'Можно создать только один тест'
    return
  }
  const res = await apiClient.post(endpoints.expert_system.orientationTests, { name: newName.value.trim() })
  if (res.success) {
    newName.value = ''
    await fetchTests()
  } else {
    error.value = 'Ошибка создания: ' + JSON.stringify(res.errors)
  }
}

function startEdit(t) {
  editId.value = t.id
  editName.value = t.name
}

async function saveEdit() {
  const id = editId.value
  if (!editName.value.trim()) return
  const url = `${endpoints.expert_system.orientationTests}${id}/`
  const res = await apiClient.patch(url, { name: editName.value.trim() })
  if (res.success) {
    editId.value = null
    editName.value = ''
    await fetchTests()
  } else {
    error.value = 'Ошибка сохранения: ' + JSON.stringify(res.errors)
  }
}

async function deleteTest(id) {
  if (!confirm('Удалить тест?')) return
  const url = `${endpoints.expert_system.orientationTests}${id}/`
  const res = await apiClient.delete(url)
  if (res.success) await fetchTests()
  else error.value = 'Ошибка удаления'
}

onMounted(fetchTests)
</script>
