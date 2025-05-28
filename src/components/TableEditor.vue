<template>
  <div class="table-editor card rounded-3 p-4 mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0 text-primary">
        <i class="bi bi-table me-2"></i>{{ tableName }}
      </h3>
      <div class="btn-group">
        <button 
          @click="addNewRow"
          class="btn btn-primary"
          :disabled="isLoading">
          <Plus :size="20" class="me-2"/>
          Добавить запись
        </button>
        <button 
          @click="saveChanges"
          class="btn btn-success ms-2"
          :disabled="!hasChanges || isLoading">
          <Save :size="20" class="me-2"/>
          Сохранить изменения
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.name">
              {{ column.name }}
            </th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td v-for="column in columns" :key="`${index}-${column.name}`">
              <input
                v-if="editingRow === index"
                v-model="row[column.name]"
                :type="getInputType(column.type)"
                class="form-control"
              />
              <span v-else>{{ row[column.name] }}</span>
            </td>
            <td>
              <div class="btn-group">
                <button 
                  v-if="editingRow !== index"
                  @click="startEditing(index)"
                  class="btn btn-sm btn-outline-primary">
                  <Edit :size="16"/>
                </button>
                <button 
                  v-else
                  @click="stopEditing()"
                  class="btn btn-sm btn-outline-secondary">
                  <X :size="16"/>
                </button>
                <button 
                  @click="deleteRow(index)"
                  class="btn btn-sm btn-outline-danger ms-2">
                  <Trash :size="16"/>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Save, Edit, Trash, X } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps({
  tableName: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  }
})

const tableData = ref([])
const originalData = ref([])
const editingRow = ref(null)
const isLoading = ref(false)

// Загрузка данных таблицы
const loadTableData = async () => {
  try {
    isLoading.value = true
    const response = await axios.get(`http://localhost:8000/api/learning_analytics/tables/?table=${props.tableName}`)
    tableData.value = response.data.rows
    originalData.value = JSON.parse(JSON.stringify(response.data.rows))
  } catch (error) {
    console.error('Error loading table data:', error)
  } finally {
    isLoading.value = false
  }
}

// Определение типа input в зависимости от типа данных колонки
const getInputType = (columnType) => {
  switch (columnType.toLowerCase()) {
    case 'integer':
    case 'numeric':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'date':
      return 'date'
    default:
      return 'text'
  }
}

const hasChanges = computed(() => {
  return JSON.stringify(tableData.value) !== JSON.stringify(originalData.value)
})

const addNewRow = () => {
  const newRow = {}
  props.columns.forEach(column => {
    newRow[column.name] = null
  })
  tableData.value.push(newRow)
  startEditing(tableData.value.length - 1)
}

const startEditing = (index) => {
  editingRow.value = index
}

const stopEditing = () => {
  editingRow.value = null
}

const deleteRow = async (index) => {
  if (confirm('Вы уверены, что хотите удалить эту запись?')) {
    try {
      const row = tableData.value[index]
      await axios.delete(`http://localhost:8000/api/learning_analytics/${props.tableName}/${row.id}`)
      tableData.value.splice(index, 1)
      originalData.value = JSON.parse(JSON.stringify(tableData.value))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }
}

const saveChanges = async () => {
  try {
    isLoading.value = true
    const changedRows = tableData.value.filter((row, index) => {
      return JSON.stringify(row) !== JSON.stringify(originalData.value[index])
    })

    for (const row of changedRows) {
      if (row.id) {
        // Обновление существующей записи
        await axios.put(`http://localhost:8000/api/learning_analytics/${props.tableName}/${row.id}`, row)
      } else {
        // Создание новой записи
        await axios.post(`http://localhost:8000/api/learning_analytics/${props.tableName}`, row)
      }
    }

    await loadTableData() // Перезагружаем данные
  } catch (error) {
    console.error('Error saving changes:', error)
  } finally {
    isLoading.value = false
    editingRow.value = null
  }
}

// Загружаем данные при монтировании компонента
loadTableData()
</script>

<style scoped>
.table-editor {
  max-height: 600px;
  overflow-y: auto;
}

.form-control {
  min-width: 100px;
}

/* Дополнительные стили можно добавить при необходимости */
</style>
