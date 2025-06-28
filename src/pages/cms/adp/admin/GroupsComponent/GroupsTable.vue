<script setup>
import { computed, ref } from 'vue'
import ModalCenter from '@/components/ModalCenter.vue'
import ChangeGroupForm from '@/pages/cms/adp/admin/GroupsComponent/SubmitGroupsChange.vue'
import { DeleteGroup } from '@/js/GroupsPolitics'
import { watch } from 'vue'

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowsPerPage: { type: Number, default: 5 },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['updateGroups'])
const data = ref(props.rows)

const rowselected = ref({
  name: '',
  category: '',
  level: '',
  permissions: [],
})

const changingrow = (row)=>{
  try {

    rowselected.value ={
      id:row.id,
      name: row.name,
      category: row.category,
      level: row.level,
      permissions: row.permissions,
  }
  } catch (error) {
    console.log(error)
  }
}
watch(() => props.rows, (newRows) => {
  data.value = [...newRows]
})


const changeGroup = async () => {
  emit('updateGroups')
}

// Параметры пагинации
const filterStatus = ref('')
const currentPage = ref(1)

// Фильтрация и поиск
const filteredRows =  computed(() => {
  return data.value.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(props.searchQuery.toLowerCase())
    const matchesFilter = filterStatus.value ? row.status === filterStatus.value : true
    return matchesSearch && matchesFilter
  })
})

// Пагинация
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.rowsPerPage
  const end = start + props.rowsPerPage
  return filteredRows.value.slice(start, end)
})

// Удаление групп
const deleteGroup = async (groupid) => {
  const response =  await DeleteGroup(groupid)
  emit('updateGroups')

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
          
          <td>{{ row.name }}</td>
          <td>{{ row.category }}</td>
          <td>{{ row.level }}</td>
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
                @click = "changingrow(row)"
              >
                Изменить
              </button>
              <button @click="deleteGroup(row.id)" class="btn btn-sm btn-outline-primary">
                Удалить
              </button>
              <ModalCenter title="Изменить название группы" modalId="roleEdit" >
                <div class="bg-warning-subtle text-warning lh-sm rounded p-3 mb-3">
                  <b>Внимание!</b><br />
                  Изменив настройки группы, вы можете нарушить функциональность системных разрешений.
                  Пожалуйста, убедитесь, что вы абсолютно уверены, прежде чем продолжить.
                </div>
                <ChangeGroupForm @changeGroup="changeGroup()" :row="rowselected" />
              </ModalCenter>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss"></style>