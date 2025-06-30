<template>
  <div class="status-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">
        <i class="fas fa-flag me-2"></i>Управление статусами проектов
        <span class="badge bg-secondary ms-2">{{ statuses.length }} записей</span>
      </h5>
      <button class="btn btn-primary" @click="showCreateModal">
        <i class="fas fa-plus me-2"></i>Добавить статус
      </button>
    </div>

    <!-- Таблица статусов -->
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Цвет</th>
            <th>Порядок</th>
            <th>По умолчанию</th>
            <th>Финальный</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="status in statuses" :key="status.id">
            <td>{{ status.name }}</td>
            <td><code>{{ status.code }}</code></td>
            <td>
              <span class="badge" :style="{ backgroundColor: status.color, color: getContrastColor(status.color) }">
                {{ status.color }}
              </span>
            </td>
            <td>{{ status.order }}</td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="getBoolValue(status.is_default)" disabled>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="getBoolValue(status.is_final)" disabled>
            </td>
            <td class="text-center">
              <input type="checkbox" class="form-check-input" :checked="getBoolValue(status.is_active)" disabled>
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button class="btn btn-edit-icon" @click="editStatus(status)" title="Редактировать">
                  <Edit />
                </button>
                <button class="btn btn-delete-icon" @click="deleteStatus(status)" title="Удалить">
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно создания/редактирования -->
    <div class="modal fade" id="statusModal" tabindex="-1" ref="statusModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditMode ? 'Редактировать статус' : 'Создать статус' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveStatus">
              <div class="mb-3">
                <label class="form-label">Название статуса *</label>
                <input type="text" class="form-control" v-model="formData.name" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Код статуса *</label>
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
                <label class="form-label">Порядок сортировки</label>
                <input type="number" class="form-control" v-model.number="formData.order" min="0">
              </div>
              
              <div class="row">
                <div class="col-md-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="formData.is_active" id="isActive">
                    <label class="form-check-label" for="isActive">Активен</label>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="formData.is_default" id="isDefault">
                    <label class="form-check-label" for="isDefault">По умолчанию</label>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="formData.is_final" id="isFinal">
                    <label class="form-check-label" for="isFinal">Финальный</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-primary" @click="saveStatus" :disabled="isSaving">
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
  name: 'ProjectStatusManagement',
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
      statuses: [],
      isLoading: false,
      isSaving: false,
      isEditMode: false,
      currentStatus: null,
      formData: {
        name: '',
        code: '',
        description: '',
        color: '#007bff',
        order: 0,
        is_active: true,
        is_default: false,
        is_final: false
      },
      modal: null
    }
  },
  mounted() {
    this.loadStatuses()
    this.modal = new Modal(this.$refs.statusModal)
  },
  methods: {
    async loadStatuses() {
      try {
        this.isLoading = true
        const response = await projectManagementApi.getProjectStatuses()
        this.statuses = response.data.results || response.data
        

      } catch (error) {
        console.error('Ошибка загрузки статусов:', error)
        this.showError('Ошибка загрузки статусов')
      } finally {
        this.isLoading = false
      }
    },

    showCreateModal() {
      this.isEditMode = false
      this.currentStatus = null
      this.resetForm()
      this.modal.show()
    },

    editStatus(status) {
      this.isEditMode = true
      this.currentStatus = status
      this.formData = { ...status }
      this.modal.show()
    },

    async deleteStatus(status) {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление статуса',
        message: `Вы уверены, что хотите удалить статус "${status.name}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (!confirmed) {
        this.closeConfirmDialog()
        return
      }

      try {
        await projectManagementApi.deleteProjectStatus(status.id)
        this.closeConfirmDialog()
        this.showSuccess('Статус удален')
        this.loadStatuses()
        this.$emit('statusChanged')
      } catch (error) {
        console.error('Ошибка удаления статуса:', error)
        this.closeConfirmDialog()
        this.showError('Ошибка удаления статуса')
      }
    },

    async saveStatus() {
      try {
        this.isSaving = true
        
        if (this.isEditMode) {
          await projectManagementApi.updateProjectStatus(this.currentStatus.id, this.formData)
          this.showSuccess('Статус обновлен')
        } else {
          await projectManagementApi.createProjectStatus(this.formData)
          this.showSuccess('Статус создан')
        }
        
        this.modal.hide()
        this.loadStatuses()
        this.$emit('statusChanged')
      } catch (error) {
        console.error('Ошибка сохранения статуса:', error)
        console.log('Полная ошибка:', error.response?.data || error.message)
        console.log('Status код:', error.response?.status)
        console.log('URL запроса:', error.config?.url)
        
        let errorMessage = 'Ошибка сохранения статуса'
        if (error.response?.data) {
          if (typeof error.response.data === 'object') {
            errorMessage += ': ' + JSON.stringify(error.response.data)
          } else {
            errorMessage += ': ' + error.response.data
          }
        } else {
          errorMessage += ': ' + error.message
        }
        this.showError(errorMessage)
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
        order: 0,
        is_active: true,
        is_default: false,
        is_final: false
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

.status-management {
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