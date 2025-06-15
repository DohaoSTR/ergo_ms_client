<template>
  <div class="container py-4">
    <h2 class="mb-4">Управление навыками</h2>

    <div class="mb-3">
      <input
        v-model="filterTerm"
        type="text"
        class="form-control"
        placeholder="Поиск навыка..."
      />
    </div>

    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Название навыка</th>
          <th style="width: 20%">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="skill in filteredSkills" :key="skill.id">
          <template v-if="editSkillId === skill.id">
            <td>
              <input
                v-model="editSkillName"
                class="form-control form-control-sm"
                @keyup.enter="updateSkill()"
              />
            </td>
            <td>
              <button
                class="btn btn-sm btn-success me-2"
                @click="updateSkill()"
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
            <td>{{ skill.name }}</td>
            <td>
              <button
                class="btn btn-sm btn-success text-light me-2"
                @click="startEdit(skill)"
              >
                Редактировать
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteSkill(skill.id)"
              >
                Удалить
              </button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <div class="input-group mt-4">
      <input
        v-model="newSkillName"
        type="text"
        class="form-control"
        placeholder="Название нового навыка"
        @keyup.enter="addSkill()"
      />
      <button
        class="btn btn-success text-light"
        @click="addSkill"
        :disabled="!newSkillName"
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

const SKILLS_EP = endpoints.expert_system.skills

const skills = ref([])
const filterTerm = ref('')
const newSkillName = ref('')
const editSkillId = ref(null)
const editSkillName = ref('')
const error = ref('')

const sortedSkills = computed(() =>
  [...skills.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
)

const filteredSkills = computed(() => {
  const term = filterTerm.value.trim().toLowerCase()
  if (!term) return sortedSkills.value
  return sortedSkills.value.filter(s =>
    s.name.toLowerCase().includes(term)
  )
})

async function fetchSkills() {
  error.value = ''
  const resp = await apiClient.get(SKILLS_EP)
  if (resp.success) {
    skills.value = resp.data
  } else {
    error.value = 'Не удалось загрузить навыки'
  }
}

async function addSkill() {
  if (!newSkillName.value.trim()) return
  error.value = ''
  const resp = await apiClient.post(SKILLS_EP, { name: newSkillName.value.trim() })
  if (resp.success) {
    newSkillName.value = ''
    await fetchSkills()
  } else {
    error.value = 'Ошибка при добавлении: ' + JSON.stringify(resp.errors)
  }
}

function startEdit(skill) {
  editSkillId.value = skill.id
  editSkillName.value = skill.name
  error.value = ''
}

function cancelEdit() {
  editSkillId.value = null
  editSkillName.value = ''
}

async function updateSkill() {
  if (!editSkillName.value.trim()) return
  error.value = ''
  const url = `${SKILLS_EP}${editSkillId.value}/`
  const resp = await apiClient.put(url, { name: editSkillName.value.trim() })
  if (resp.success) {
    cancelEdit()
    await fetchSkills()
  } else {
    error.value = 'Ошибка при обновлении: ' + JSON.stringify(resp.errors)
  }
}


async function deleteSkill(id) {
  if (!confirm('Удалить этот навык?')) return
  error.value = ''
  const url = `${SKILLS_EP}${id}/`
  const resp = await apiClient.delete(url)
  if (resp.success) {
    await fetchSkills()
  } else {
    error.value = 'Ошибка при удалении'
  }
}

onMounted(fetchSkills)
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
