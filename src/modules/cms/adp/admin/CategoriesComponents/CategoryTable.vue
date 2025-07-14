<script setup>
import { computed, ref } from 'vue'
import ModalCenter from '@/components/ModalCenter.vue'
import ChangeCategoryForm from '@/modules/cms/adp/admin/CategoriesComponents/SubmitCategoryChange.vue'
import { DeleteGroupCategory, ChangeGroupCategory } from '@/js/GroupsPolitics'
import { watch } from 'vue'

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowsPerPage: { type: Number, default: 5 },
  searchQuery: { type: String, default: '' },
})
const emit = defineEmits(['updateCategories'])
const data = ref(props.rows)
watch(() => props.rows, (newRows) => {
  data.value = [...newRows]
})
// Параметры пагинации
const filterStatus = ref('')
const currentPage = ref(1)
const rowselected = ref({
  name: '',
})
const changingrow = (row)=>{
  rowselected.value ={
    name: row.name
  }
}

// Фильтрация и поиск
const filteredRows =  computed(() => {
  return data.value.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(props.searchQuery.toLowerCase())
    const matchesFilter = filterStatus.value ? row.status === filterStatus.value : true
    return matchesSearch && matchesFilter
  })
})
const changeCategory = () => {
  emit('updateCategories')
}

// Пагинация
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.rowsPerPage
  const end = start + props.rowsPerPage
  return filteredRows.value.slice(start, end)
})
// Удаление ролей
const deletePermission = async (permissionname) => {
  const response =  await DeleteGroupCategory(permissionname)
  emit('updateCategories')

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
          <td>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <button
                class="btn btn-sm btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#roleEdit"
                @click="changingrow(row)"
              >
                Изменить
              </button>
              <button @click="deletePermission(row.name)" class="btn btn-sm btn-outline-primary">
                Удалить
              </button>
              <ModalCenter title="Изменить название категории" modalId="roleEdit" >
                <div class="bg-warning-subtle text-warning lh-sm rounded p-3 mb-3">
                  <b>Внимание!</b><br />
                  Изменив название категории, вы можете нарушить функциональность системных разрешений.
                  Пожалуйста, убедитесь, что вы абсолютно уверены, прежде чем продолжить.
                </div>
                <ChangeCategoryForm @changeCategory="changeCategory()" :row="rowselected"/>
              </ModalCenter>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss"></style>