<script setup>
import UserTableHeader from '@/modules/cms/adp/admin/UsersComponent/UserTableHeader.vue'
import UserTable from '@/modules/cms/adp/admin/UsersComponent/UserTable.vue'
import { GetUserGroupsAndPermissions } from '@/modules/cms/adp/admin/js/GroupsPolitics'
import { ref, onMounted, watch } from 'vue' 

const rows = ref([]) // Initialize with empty array

onMounted(async () => {
  try {
    const users = await GetUserGroupsAndPermissions()
    for(let i of users) {
      rows.value.push({
        user_id: i.user_id,
        user: i.user,
        groups: i.groups,
        permissions: i.permissions
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

const UpdateUsersGroupsAndPermissions = async () => {
    try {
    const value = []
    const users = await GetUserGroupsAndPermissions()
    for(let i of users) {
      value.push({
        user_id:i.user_id,
        user: i.user,
        groups: i.groups,
        permissions: i.permissions
      })
    }
    rows.value = value
    
  } catch (error) {
    console.error('Error fetching group categories:', error)
  }
}
</script>

<template>
  <div class="card">
    <div class="mb-3">
      <UserTableHeader @changeRowsPerPage="handleChangeRows" @searchRowData="handleSearchQuery"/>
    </div>

    <UserTable 
      :rows="rows"
      :headers="['Пользователь', 'Группы', 'Разрешения', 'Действия']"
      :rowsPerPage="rowsPerPage"
      :searchQuery="searchQuery"  
      @updateUserGroupsAndPermissions="UpdateUsersGroupsAndPermissions"
    />
  </div>
</template>


<style scoped lang="scss"></style>