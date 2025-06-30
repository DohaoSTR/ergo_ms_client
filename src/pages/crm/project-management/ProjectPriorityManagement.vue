<template>
  <div class="priority-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">
        <i class="fas fa-exclamation-triangle me-2"></i>Управление приоритетами проектов
        <span class="badge bg-secondary ms-2">{{ priorities.length }} записей</span>
      </h5>
      <button class="btn btn-primary" @click="showCreateModal">
        <i class="fas fa-plus me-2"></i>Добавить приоритет
      </button>
    </div>

    <!-- Таблица приоритетов -->
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Цвет</th>
            <th>Порядок</th>
            <th>По умолчанию</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="priority in priorities" :key="priority.id">
            <td>{{ priority.name }}</td>
            <td><code>{{ priority.code }}</code></td>
            <td>
              <span class="badge" :style="{ backgroundColor: priority.color, color: getContrastColor(priority.color) }">
                {{ priority.color }}
              </span>
            </td>
            <td>
              <span class="priority-level">
                {{ priority.level }}
              </span>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="getBoolValue(priority.is_default)" disabled>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="getBoolValue(priority.is_active)" disabled>
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button class="btn btn-edit-icon" @click="editPriority(priority)" title="Редактировать">
                  <Edit />
                </button>
                <button class="btn btn-delete-icon" @click="deletePriority(priority)" title="Удалить">
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно создания/редактирования -->
    <div class="modal fade" id="priorityModal" tabindex="-1" ref="priorityModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditMode ? 'Редактировать приоритет' : 'Создать приоритет' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePriority">
              <div class="mb-3">
                <label class="form-label">Название приоритета *</label>
                <input type="text" class="form-control" v-model="formData.name" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Код приоритета *</label>
                <input type="text" class="form-control" v-model="formData.code" required>
                <div class="form-text">Уникальный код для использования в API</div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea class="form-control" v-model="formData.description" rows="3"></textarea>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Цвет</label>
                <input type="color" class="form-control form-control-color" v-model="formData.color">
              </div>
              
              <div class="mb-3">
                <label class="form-label">Порядок (1-4)</label>
                <input type="number" class="form-control" v-model.number="formData.level" min="1" max="4">
                <div class="form-text">1 - самый низкий, 4 - самый высокий</div>
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="formData.is_active" id="isActive">
                    <label class="form-check-label" for="isActive">Активен</label>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="formData.is_default" id="isDefault">
                    <label class="form-check-label" for="isDefault">По умолчанию</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="savePriority" :disabled="isSaving">
              <i v-if="isSaving" class="fas fa-spinner fa-spin me-2"></i>
              {{ isEditMode ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import { Edit, Trash2 } from 'lucide-vue-next'
import projectManagementApi from '../../../js/api/projectManagementApi'
import { useNotifications } from '@/pages/lms/composables/useNotifications'

export default {
  name: 'ProjectPriorityManagement',
  components: {
    Edit,
    Trash2
  },
  setup() {
    const { showSuccess, showError, showConfirmDialog, closeConfirmDialog } = useNotifications()
    return { showSuccess, showError, showConfirmDialog, closeConfirmDialog }
  },
  data() {
    return {
      priorities: [],
      isLoading: false,
      isSaving: false,
      isEditMode: false,
      currentPriority: null,
      formData: {
        name: '',
        code: '',
        description: '',
        color: '#007bff',
        level: 1,
        is_active: true,
        is_default: false
      },
      modal: null
    }
  },
  mounted() {
    this.loadPriorities()
    this.modal = new Modal(this.$refs.priorityModal)
  },
  methods: {
    async loadPriorities() {
      try {
        this.isLoading = true
        const response = await projectManagementApi.getProjectPriorities()
        this.priorities = response.data.results || response.data
        

      } catch (error) {
        console.error('Ошибка загрузки приоритетов:', error)
        this.showError('Ошибка загрузки приоритетов')
      } finally {
        this.isLoading = false
      }
    },

    showCreateModal() {
      this.isEditMode = false
      this.currentPriority = null
      this.resetForm()
      this.modal.show()
    },

    editPriority(priority) {
      this.isEditMode = true
      this.currentPriority = priority
      this.formData = { ...priority }
      this.modal.show()
    },

    async deletePriority(priority) {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление приоритета',
        message: `Вы уверены, что хотите удалить приоритет "${priority.name}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (!confirmed) {
        this.closeConfirmDialog()
        return
      }

      try {
        await projectManagementApi.deleteProjectPriority(priority.id)
        this.closeConfirmDialog()
        this.showSuccess('Приоритет удален')
        this.loadPriorities()
        this.$emit('priorityChanged')
      } catch (error) {
        console.error('Ошибка удаления приоритета:', error)
        this.closeConfirmDialog()
        this.showError('Ошибка удаления приоритета')
      }
    },

    async savePriority() {
      try {
        this.isSaving = true
        
        if (this.isEditMode) {
          await projectManagementApi.updateProjectPriority(this.currentPriority.id, this.formData)
          this.showSuccess('Приоритет обновлен')
        } else {
          await projectManagementApi.createProjectPriority(this.formData)
          this.showSuccess('Приоритет создан')
        }
        
        this.modal.hide()
        this.loadPriorities()
        this.$emit('priorityChanged')
      } catch (error) {
        console.error('Ошибка сохранения приоритета:', error)
        console.log('Полная ошибка:', error.response?.data || error.message)
        this.showError('Ошибка сохранения приоритета: ' + (error.response?.data?.message || error.message))
      } finally {
        this.isSaving = false
      }
    },

    resetForm() {
      this.formData = {
        name: '',
        code: '',
        description: '',
        color: '#007bff',
        level: 1,
        is_active: true,
        is_default: false
      }
    },

    getContrastColor(hexColor) {
      // Простая функция для определения контрастного цвета текста
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5 ? '#000000' : '#ffffff'
    },

    getBoolValue(value) {
      // Функция для корректного преобразования значения в boolean
      if (value === null || value === undefined) return false
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1'
      }
      if (typeof value === 'number') return value === 1
      return Boolean(value)
    }
  }
}
</script>

<style scoped>
@import './project-management.scss';

.btn {
  @include pm-button;
}

.priority-management {
  padding: 20px;
}

.table th {
  background-color: var(--bs-light);
  font-weight: 600;
}

.btn-group-sm .btn {
  font-size: 0.875rem;
}

/* Стили для кнопок действий */
.actions-cell {
  .action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }
}

.form-control-color {
  width: 60px;
  height: 38px;
  padding: 2px;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.priority-level {
  font-size: 0.9rem;
}

code {
  background-color: var(--bs-light);
  color: var(--bs-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Стили для чекбоксов в таблице */
.form-check-input {
  pointer-events: none;
  cursor: default;
}
</style> 