<script setup>
import CategoryTableHeader from './CategoriesComponents/CategoryTableHeader.vue'
import CategoryTable from './CategoriesComponents/CategoryTable.vue'
import { GetGroupCategories } from '@/js/GroupsPolitics'
import { ref, onMounted } from 'vue' 

const rows = ref([]) // Initialize with empty array

onMounted(async () => {
  try {
    const categories = await GetGroupCategories()
    for(let i of categories) {
      rows.value.push({
        name: i.name,
      })
    }
  } catch (error) {
    console.error('Error fetching group categories:', error)
  }
})

const rowsPerPage = ref(30)
const handleChangeRows = (newRowsPerPage) => (rowsPerPage.value = newRowsPerPage)

// Поиск по названию
const searchQuery = ref('')
const handleSearchQuery = (query) => (searchQuery.value = query)
const updateCategories = async () => {
  let value = []
  const categories = await GetGroupCategories()
    for(let i of categories) {
      value.push({
        name: i.name,
      })
    }
    rows.value = value
}
</script>

<template>
  <div class="card">
    <div class="mb-3">
      <CategoryTableHeader @changeRowsPerPage="handleChangeRows" @searchRowData="handleSearchQuery" @updateCategories="updateCategories" />
    </div>

    <CategoryTable 
      :rows="rows"
      :headers="['Название категории', 'Действия' ]"
      :rowsPerPage="rowsPerPage"
      :searchQuery="searchQuery"
      @updateCategories="updateCategories"
    />
  </div>
</template>


<style scoped lang="scss"></style>