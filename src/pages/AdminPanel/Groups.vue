<script setup>
import GroupTableHeader from './GroupsComponent/GroupsTableHeader.vue'
import GroupTable from './GroupsComponent/GroupsTable.vue'
import { GetGroups } from '@/js/GroupsPolitics'
import { ref, onMounted } from 'vue'

const rows = ref([]) // Initialize with empty array

onMounted(async () => {
 updateGroups()
})



const rowsPerPage = ref(30)
const handleChangeRows = (newRowsPerPage) => (rowsPerPage.value = newRowsPerPage)

// Поиск по названию
const searchQuery = ref('')
const handleSearchQuery = (query) => (searchQuery.value = query)
const updateGroups = async () => {
  try {
    const groups = await GetGroups()
    if (!groups || !Array.isArray(groups)) {
      throw new Error('Invalid data format received from GetGroups')
    }
    rows.value = groups.map(i => ({
      id:i.id,
      name: i.name,
      category: i.category, 
      level: i.level,
      permissions: i.permissions
    }))
  } catch (error) {
    console.error('Error updating groups:', error)
  }
}
</script>

<template>
  <div class="card">
    <div class="mb-3">
      <GroupTableHeader @changeRowsPerPage="handleChangeRows" @searchRowData="handleSearchQuery" @updateGroups="updateGroups" />
    </div>

    <GroupTable
      :rows="rows"
      :headers="['Название группы', 'Категория', 'Уровень','привилегии', 'Действия']"
      :rowsPerPage="rowsPerPage"
      :searchQuery="searchQuery"
      @updateGroups="updateGroups"
    />
  </div>
</template>

<style scoped lang="scss"></style>
