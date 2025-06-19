<script setup>
import { computed, ref } from 'vue'
import ModalCenter from '@/components/ModalCenter.vue'
import ChangeUserGroupsAndPermsForm from '@/pages/AdminPanel/UsersComponent/SubmitUserChanges.vue'
import { watch } from 'vue'

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowsPerPage: { type: Number, default: 5 },
  searchQuery: { type: String, default: '' },
})
const emit = defineEmits(['updateUserGroupsAndPermissions'])
const data = ref(props.rows)

const rowselected = ref({
  user_id:0,
  user: '',
  groups:[],
  permissions:[]
})
watch(() => props.rows, (newRows) => {
  data.value = [...newRows]
})
// Параметры пагинации
const filterStatus = ref('')
const currentPage = ref(1)

// Фильтрация и поиск
const filteredRows =  computed(() => {
  return data.value.filter((row) => {
    const matchesSearch = row.user.toLowerCase().includes(props.searchQuery.toLowerCase())
    const matchesFilter = filterStatus.value ? row.status === filterStatus.value : true
    return matchesSearch && matchesFilter
  })
})
const ChangingRow = (row) => {
  rowselected.value = row
}
// Пагинация
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.rowsPerPage
  const end = start + props.rowsPerPage
  return filteredRows.value.slice(start, end)
})
const changeUserGroupsAndPermissions = async () => {
  emit('updateUserGroupsAndPermissions')
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover">
      <thead>
        <tr>
          <th v-for="(header, index) in headers" :key="index" scope="col" class="fw-bold">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody class="table-group-divider">
        <tr v-for="row in paginatedRows" :key="row.id">
          <td>{{ row.user }}</td>
          <td><div class="d-flex flex-wrap gap-2">
              <small
                v-for="(group, index) in row.groups"
                :key="index"
                :class="'bg-primary-subtle text-primary rounded px-2 py-1'"
                style="cursor: pointer"
              >
                {{ group }}
              </small>
            </div></td>
          <td><div class="d-flex flex-wrap gap-2">
              <small
                v-for="(permission, index) in row.permissions"
                :key="index"
                :class="'bg-primary-subtle text-primary rounded px-2 py-1'"
                style="cursor: pointer"
              >
                {{ permission }}
              </small>
            </div></td>
          <td>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <button
                class="btn btn-sm btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#roleEdit"
                @click="ChangingRow(row)"
              >
                Изменить
              </button>
              <ModalCenter title="Изменить группы и права пользователя" modalId="roleEdit" >
                <ChangeUserGroupsAndPermsForm @changeUserGroupsAndPermissions="changeUserGroupsAndPermissions" :row="rowselected" />
              </ModalCenter>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss"></style>
