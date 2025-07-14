<template>
  <div class="container py-4">
    <h2 class="mb-4">Управление учебными группами</h2>

    <div class="row">
      <div class="col-lg-5 mb-4">
        <div class="card">
          <div class="card-header">Список групп</div>
          <div class="card-body">
            <div class="input-group mb-3">
              <input
                v-model="filterTerm"
                type="text"
                class="form-control"
                placeholder="Поиск по названию группы"
              />
              <button class="btn btn-outline-secondary" @click="filterTerm = ''">
                ✕
              </button>
            </div>
            <ul class="list-group">
              <li
                v-for="group in filteredGroups"
                :key="group.id"
                class="list-group-item d-flex justify-content-between align-items-center"
                :class="{ active: selectedGroup && selectedGroup.id === group.id }"
                @click="selectGroup(group)"
                style="cursor: pointer;"
              >
                {{ group.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card mb-3">
          <div class="card-header">Добавить новую группу</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Название группы</label>
              <input
                v-model="newGroupName"
                type="text"
                class="form-control"
                placeholder="Введите название"
                @keyup.enter="addGroup"
              />
            </div>
            <button
              class="btn btn-success text-light me-2"
              :disabled="!newGroupName.trim()"
              @click="addGroup"
            >
              Добавить
            </button>
          </div>
        </div>

        <div v-if="selectedGroup" class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Редактирование «{{ selectedGroup.name }}»</span>
            <button class="btn-close" @click="clearSelection"></button>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Новое название</label>
              <input
                v-model="editGroupName"
                type="text"
                class="form-control"
                @keyup.enter="updateGroup"
              />
            </div>
            <div class="d-flex">
              <button
                class="btn btn-success text-light me-2"
                :disabled="!editGroupName.trim()"
                @click="updateGroup"
              >
                Сохранить
              </button>
              <button class="btn btn-danger" @click="deleteGroup(selectedGroup.id)">
                Удалить
              </button>
            </div>
            <div v-if="error" class="alert alert-danger mt-3">
              {{ error }}
            </div>
          </div>
        </div>
        <div v-else class="alert alert-info">
          Выберите группу в списке слева, чтобы отредактировать.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const groups = ref([])
const filterTerm = ref('')
const newGroupName = ref('')
const selectedGroup = ref(null)
const editGroupName = ref('')
const error = ref('')

const STUDY_GROUPS_EP = endpoints.expert_system.studyGroups

const filteredGroups = computed(() => {
  const term = filterTerm.value.trim().toLowerCase()
  return term
    ? groups.value.filter(g => g.name.toLowerCase().includes(term))
    : groups.value
})

function selectGroup(group) {
  selectedGroup.value = group
  editGroupName.value = group.name
  error.value = ''
}

function clearSelection() {
  selectedGroup.value = null
  editGroupName.value = ''
  error.value = ''
}

async function fetchGroups() {
  error.value = ''
  const resp = await apiClient.get(STUDY_GROUPS_EP)
  if (resp.success) {
    groups.value = resp.data.slice().sort((a, b) => a.name.localeCompare(b.name))
  } else {
    error.value = 'Не удалось загрузить группы'
  }
}

async function addGroup() {
  const name = newGroupName.value.trim()
  if (!name) return
  error.value = ''
  const resp = await apiClient.post(STUDY_GROUPS_EP, { name })
  if (resp.success) {
    newGroupName.value = ''
    await fetchGroups()
  } else {
    error.value = 'Ошибка при добавлении: ' + JSON.stringify(resp.errors)
  }
}

async function updateGroup() {
  if (!selectedGroup.value) return
  const name = editGroupName.value.trim()
  if (!name) return
  error.value = ''
  const url = `${STUDY_GROUPS_EP}${selectedGroup.value.id}/`
  const resp = await apiClient.put(url, { name })
  if (resp.success) {
    await fetchGroups()
    clearSelection()
  } else {
    error.value = 'Ошибка при обновлении: ' + JSON.stringify(resp.errors)
  }
}

async function deleteGroup(id) {
  if (!confirm('Удалить эту группу?')) return
  error.value = ''
  const url = `${STUDY_GROUPS_EP}${id}/`
  const resp = await apiClient.delete(url)
  if (resp.success) {
    await fetchGroups()
    clearSelection()
  } else {
    error.value = 'Ошибка при удалении'
  }
}

onMounted(fetchGroups)
</script>
