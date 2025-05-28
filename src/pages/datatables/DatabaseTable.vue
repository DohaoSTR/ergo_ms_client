<script setup>
import DataTable from '@bhplugin/vue3-datatable'
import { ref, onMounted, computed } from 'vue'
import { Modal } from 'bootstrap'

const emit = defineEmits(['recordUpdated', 'recordDeleted', 'recordCreated'])

const props = defineProps({
  cols: {
    type: Array,
    required: true,
    validator: (value) => value.every(col => 'field' in col && 'title' in col)
  },
  data: {
    type: Array,
    required: true
  },
  tableName: {
    type: String,
    required: true,
    validator: (value) => value.length > 0
  }
})

// Состояние
const editModal = ref(null)
const deleteModal = ref(null)
const createModal = ref(null)
const currentRecord = ref({})
const newRecord = ref({})
const formErrors = ref({})

// Вычисляемые свойства
const isFormValid = computed(() => {
  return props.cols.every(col => {
    const value = newRecord.value[col.field]
    return col.required ? Boolean(value) : true
  })
})

const tableColumns = computed(() => [
  ...props.cols,
  {
    field: 'rows_count',
    title: 'Количество записей',
    cellClass: 'text-center',
    headerClass: 'text-center'
  },
  {
    field: 'actions',
    title: 'Действия',
    cellClass: 'text-center',
    headerClass: 'text-center',
    template: (row) => ({
      components: {
        div: {
          class: 'd-flex gap-2 justify-content-center',
          children: [
            {
              component: 'button',
              class: 'btn btn-sm btn-primary',
              onClick: () => showEditModal(row),
              children: [{ component: 'i', class: 'bi bi-pencil' }]
            },
            {
              component: 'button',
              class: 'btn btn-sm btn-danger',
              onClick: () => showDeleteModal(row),
              children: [{ component: 'i', class: 'bi bi-trash' }]
            }
          ]
        }
      }
    })
  }
])

// Методы
const initModal = (modalRef, modalId) => {
  try {
    const element = document.getElementById(modalId)
    if (element) {
      modalRef.value = new Modal(element)
    }
  } catch (error) {
    console.error(`Ошибка инициализации модального окна ${modalId}:`, error)
  }
}

onMounted(() => {
  initModal(editModal, 'editRecordModal')
  initModal(deleteModal, 'deleteRecordModal')
  initModal(createModal, 'createRecordModal')
})

const resetForm = () => {
  formErrors.value = {}
  newRecord.value = props.cols.reduce((acc, col) => {
    acc[col.field] = col.type === 'number' ? 0 : ''
    return acc
  }, {})
}

const showEditModal = (record) => {
  if (!editModal.value) return
  currentRecord.value = { ...record }
  editModal.value.show()
}

const showDeleteModal = (record) => {
  if (!deleteModal.value) return
  currentRecord.value = { ...record }
  deleteModal.value.show()
}

const showCreateModal = () => {
  if (!createModal.value) return
  resetForm()
  createModal.value.show()
}

const validateForm = (data) => {
  const errors = {}
  props.cols.forEach(col => {
    if (col.required && !data[col.field]) {
      errors[col.field] = 'Это поле обязательно'
    }
    if (col.type === 'number' && isNaN(data[col.field])) {
      errors[col.field] = 'Должно быть числом'
    }
  })
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleCreate = () => {
  if (!validateForm(newRecord.value)) return
  emit('recordCreated', { 
    tableName: props.tableName, 
    data: newRecord.value 
  })
  createModal.value?.hide()
}

const handleUpdate = () => {
  if (!validateForm(currentRecord.value)) return
  emit('recordUpdated', { 
    tableName: props.tableName, 
    data: currentRecord.value 
  })
  editModal.value?.hide()
}

const handleDelete = () => {
  emit('recordDeleted', { 
    tableName: props.tableName, 
    id: currentRecord.value.id 
  })
  deleteModal.value?.hide()
}
</script>

<template>
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="card-title mb-0">Просмотр данных таблицы</h5>
      <button @click="showCreateModal" class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>Добавить запись
      </button>
    </div>
    
    <DataTable
      :rows="data"
      :columns="tableColumns"
      :search="true"
      :sort="true"
      :pagination="true"
      :length-menu="true"
      :wrap="true"
    />

    <!-- Модальное окно создания -->
    <div class="modal fade" id="createRecordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать новую запись</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleCreate">
              <div v-for="col in cols" :key="col.field" class="mb-3">
                <label :for="col.field" class="form-label">
                  {{ col.title }} {{ col.required ? '*' : '' }}
                </label>
                <input 
                  :type="col.type === 'number' ? 'number' : 'text'"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors[col.field] }"
                  :id="col.field"
                  v-model="newRecord[col.field]"
                />
                <div class="invalid-feedback">
                  {{ formErrors[col.field] }}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="handleCreate"
              :disabled="!isFormValid">
              Создать
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <div class="modal fade" id="editRecordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать запись</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form>
              <div v-for="col in cols" :key="col.field" class="mb-3">
                <label :for="col.field" class="form-label">{{ col.title }}</label>
                <input 
                  :type="col.type === 'number' ? 'number' : 'text'"
                  class="form-control"
                  :id="col.field"
                  v-model="currentRecord[col.field]"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="handleUpdate">Сохранить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно удаления -->
    <div class="modal fade" id="deleteRecordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Подтверждение удаления</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Вы уверены, что хотите удалить эту запись?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-danger" @click="handleDelete">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-body {
  position: relative;
}

.invalid-feedback {
  display: block;
}
</style>
