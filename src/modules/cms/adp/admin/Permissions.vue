<script setup>
import PermissionTableHeader from '@/modules/cms/adp/admin/PermissionsComponents/PermissionTableHeader.vue'
import PermissionTable from '@/modules/cms/adp/admin/PermissionsComponents/PermissionTable.vue'
import { GetPermissions } from '@/modules/cms/adp/admin/js/GroupsPolitics'
import { ref, onMounted } from 'vue' 

const rows = ref([]) // Initialize with empty array

onMounted(async () => {
  try {
    const permissions = await GetPermissions()
    for(let i of permissions) {
      let acsst = i.accession_type
      if(acsst == 'PageAccession') {
        acsst = 'Доступ к Странице'
      }
      else if(acsst == 'ComponentAccessionToReadAndWrite'| acsst == 'ComponentAccessionToRead') {
        acsst = 'Доступ к Компоненту на чтение и запись'
      }
      else if(acsst == 'ComponentAccessionToRead') {
        acsst = 'Доступ к Компоненту на чтение'
      }
      else {
        acsst = 'Доступ к панели администратора'
      }
      rows.value.push({
        id: i.id,
        name: i.name,
        category: i.category_name,
        accession_type: acsst,
        path: i.path,
        component_id: i.component_id
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
const updatePermissions = async () => {
  let value = []
  const permissions = await GetPermissions()
    for(let i of permissions) {
      let acsst = i.accession_type
      if(acsst == 'PageAccession') {
        acsst = 'Доступ к Странице'
      }
      else if( acsst == 'ComponentAccessionToRead') {
        acsst = 'Доступ к Компоненту на чтение'
      }
      else if(acsst == 'ComponentAccessionToReadAndWrite') {
        acsst = 'Доступ к компоненту на чтение и запись'
      }
      else {
        acsst = 'Доступ к панели администратора'
      }
      value.push({
        id: i.id,
        name: i.name,
        category: i.category_name,
        accession_type: acsst,
        path: i.path,
        component_id: i.component_id
      })
    }
    rows.value = value
}
</script>

<template>
  <div class="card">
    <div class="mb-3">
      <PermissionTableHeader @changeRowsPerPage="handleChangeRows" @searchRowData="handleSearchQuery" @updatePermissions="updatePermissions" />
    </div>

    <PermissionTable 
      :rows="rows"
      :headers="['Название','Категория', 'Тип доступа', 'Путь', 'Идентификатор компонента', 'Действия']"
      :rowsPerPage="rowsPerPage"
      :searchQuery="searchQuery"  
      @updatePermissions="updatePermissions"
    />
  </div>
</template>


<style scoped lang="scss"></style>