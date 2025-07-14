<template>
  <div class="container py-4">
    <h2 class="mb-4">Управление профессиями</h2>

    <div class="mb-3">
      <input
        v-model="filterTerm"
        type="text"
        class="form-control"
        placeholder="Поиск профессии..."
      />
    </div>

    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Название</th>
          <th>Описание</th>
          <th style="width: 20%">Действия</th>
        </tr>
      </thead>
      <tbody>
  <tr v-for="role in filteredRoles" :key="role.id">
    <template v-if="editRoleId === role.id">
      <td>
        <input
          v-model="editRoleName"
          class="form-control form-control-sm"
          @keyup.enter="updateRole()"
        />
      </td>
      <td>
        <input
          v-model="editRoleDesc"
          class="form-control form-control-sm"
          @keyup.enter="updateRole()"
        />
      </td>
      <td>
        <button
          class="btn btn-success text-light me-2"
          @click="updateRole()"
        >
          Сохранить
        </button>
        <button
          class="btn btn-sm btn-secondary"
          @click="cancelEdit()"
        >
          Отмена
        </button>
      </td>
    </template>
    <template v-else>
      <td>{{ role.name }}</td>
      <td>{{ role.description }}</td>
      <td>
        <button
          class="btn btn-sm btn-success text-light me-2"
          @click="startEdit(role)"
        >
          Редактировать
        </button>
        <button
          class="btn btn-sm btn-danger"
          @click="deleteRole(role.id)"
        >
          Удалить
        </button>
      </td>
    </template>
  </tr>
</tbody>
    </table>

    <div class="card card-body mt-4">
      <h5>Добавить новую профессию</h5>
      <div class="mb-2">
        <input
          v-model="newRoleName"
          type="text"
          class="form-control"
          placeholder="Название"
        />
      </div>
      <div class="mb-2">
        <input
          v-model="newRoleDesc"
          type="text"
          class="form-control"
          placeholder="Описание"
        />
      </div>
      <button
        class="btn btn-success text-light me-2"
        @click="addRole"
        :disabled="!newRoleName || !newRoleDesc"
      >
        Добавить
      </button>
    </div>

    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const ROLES_EP = endpoints.expert_system.roles

const roles = ref([])
const filterTerm = ref('')
const newRoleName = ref('')
const newRoleDesc = ref('')
const editRoleId = ref(null)
const editRoleName = ref('')
const editRoleDesc = ref('')
const error = ref('')

const sortedRoles = computed(() =>
  [...roles.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
)

const filteredRoles = computed(() => {
  const term = filterTerm.value.trim().toLowerCase()
  if (!term) return sortedRoles.value
  return sortedRoles.value.filter(r =>
    r.name.toLowerCase().includes(term) ||
    (r.description || '').toLowerCase().includes(term)
  )
})

async function fetchRoles() {
  error.value = ''
  const resp = await apiClient.get(ROLES_EP)
  if (resp.success) {
    roles.value = resp.data
  } else {
    error.value = 'Не удалось загрузить профессии'
  }
}

async function addRole() {
  const name = newRoleName.value.trim()
  const description = newRoleDesc.value.trim()
  if (!name || !description) return
  error.value = ''
  const resp = await apiClient.post(ROLES_EP, { name, description })
  if (resp.success) {
    newRoleName.value = ''
    newRoleDesc.value = ''
    await fetchRoles()
  } else {
    error.value = 'Ошибка при добавлении: ' + JSON.stringify(resp.errors)
  }
}

function startEdit(role) {
  editRoleId.value = role.id
  editRoleName.value = role.name
  editRoleDesc.value = role.description
  error.value = ''
}

function cancelEdit() {
  editRoleId.value = null
  editRoleName.value = ''
  editRoleDesc.value = ''
}

async function updateRole() {
  const id = editRoleId.value
  const name = editRoleName.value.trim()
  const description = editRoleDesc.value.trim()
  if (!name || !description) return
  error.value = ''
  const url = `${ROLES_EP}${id}/`
  const resp = await apiClient.put(url, { name, description })
  if (resp.success) {
    cancelEdit()
    await fetchRoles()
  } else {
    error.value = 'Ошибка при обновлении: ' + JSON.stringify(resp.errors)
  }
}

async function deleteRole(id) {
  if (!confirm('Удалить эту профессию?')) return
  error.value = ''
  const url = `${ROLES_EP}${id}/`
  const resp = await apiClient.delete(url)
  if (resp.success) {
    await fetchRoles()
  } else {
    error.value = 'Ошибка при удалении'
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
