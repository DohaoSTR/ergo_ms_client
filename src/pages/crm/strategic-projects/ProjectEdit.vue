<template>
  <div class="project-edit">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h3 mb-3">
            {{ isEditMode ? 'Редактирование проекта' : 'Создание проекта' }}
          </h1>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
              <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
              <li class="breadcrumb-item">
                <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
              </li>
              <li class="breadcrumb-item active">
                {{ isEditMode ? 'Редактирование' : 'Создание' }}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Статус проекта -->
      <div v-if="project.status" class="row mb-4">
        <div class="col-12">
          <div class="alert alert-info">
            <strong>Статус проекта:</strong>
            <span :class="getStatusBadgeClass(project.status)" class="ml-2">
              {{ getStatusLabel(project.status) }}
            </span>
            <span v-if="project.rejection_comment" class="ml-3">
              <strong>Причина отклонения:</strong> {{ project.rejection_comment }}
            </span>
          </div>
        </div>
      </div>

      <!-- Форма редактирования -->
      <form @submit.prevent="saveProject">
        <!-- Основная информация -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Основная информация</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>Код проекта</label>
                      <input
                        type="text"
                        class="form-control"
                        :value="project.code"
                        readonly
                        disabled
                      />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>Название проекта <span class="text-danger">*</span></label>
                      <input
                        v-model="project.name"
                        type="text"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-12">
                    <div class="form-group">
                      <label>Цель проекта <span class="text-danger">*</span></label>
                      <textarea
                        v-model="project.goal"
                        class="form-control"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-12">
                    <div class="form-group">
                      <label>Задачи проекта <span class="text-danger">*</span></label>
                      <textarea
                        v-model="project.tasks"
                        class="form-control"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>Куратор проекта <span class="text-danger">*</span></label>
                      <select v-model="project.curator" class="form-control" required>
                        <option value="">Выберите куратора</option>
                        <option v-for="user in users" :key="user.id" :value="user.id">
                          {{ user.full_name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>Заказчик проекта <span class="text-danger">*</span></label>
                      <select v-model="project.customer" class="form-control" required>
                        <option value="">Выберите заказчика</option>
                        <option v-for="user in users" :key="user.id" :value="user.id">
                          {{ user.full_name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label>
                        <input
                          v-model="project.requires_budget"
                          type="checkbox"
                        />
                        Требуется бюджет
                      </label>
                      <input
                        v-if="project.requires_budget"
                        v-model="project.total_budget"
                        type="number"
                        step="0.01"
                        class="form-control mt-2"
                        placeholder="Сумма бюджета"
                      />
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>Плановая дата начала <span class="text-danger">*</span></label>
                      <input
                        v-model="project.planned_start_date"
                        type="date"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label>Плановая дата окончания <span class="text-danger">*</span></label>
                      <input
                        v-model="project.planned_end_date"
                        type="date"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-12">
                    <div class="form-group">
                      <label>Планируемые результаты</label>
                      <div v-for="(result, index) in project.planned_results" :key="index" class="input-group mb-2">
                        <input
                          v-model="project.planned_results[index]"
                          type="text"
                          class="form-control"
                          placeholder="Введите планируемый результат"
                        />
                        <div class="input-group-append">
                          <button
                            @click="removeResult(index)"
                            type="button"
                            class="btn btn-outline-danger"
                          >
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <button
                        @click="addResult"
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="fas fa-plus mr-2"></i>
                        Добавить результат
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- План-график проекта -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  План-график проекта
                  <span class="badge badge-primary ml-2">{{ project.stages.length }} этапов</span>
                </h5>
              </div>
              <div class="card-body">
                <div v-if="project.stages.length === 0" class="alert alert-warning">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Необходимо добавить хотя бы один этап проекта
                </div>

                <div v-for="(stage, index) in project.stages" :key="index" class="card mb-3">
                  <div class="card-header">
                    <h6 class="mb-0">
                      Этап {{ index + 1 }}
                      <button
                        @click="removeStage(index)"
                        type="button"
                        class="btn btn-sm btn-outline-danger float-right"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-12">
                        <div class="form-group">
                          <label>Наименование этапа <span class="text-danger">*</span></label>
                          <input
                            v-model="stage.name"
                            type="text"
                            class="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-md-6">
                        <div class="form-group">
                          <label>Дата начала <span class="text-danger">*</span></label>
                          <input
                            v-model="stage.planned_start_date"
                            type="date"
                            class="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="form-group">
                          <label>Дата окончания <span class="text-danger">*</span></label>
                          <input
                            v-model="stage.planned_end_date"
                            type="date"
                            class="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-md-12">
                        <div class="form-group">
                          <label>Описание</label>
                          <textarea
                            v-model="stage.description"
                            class="form-control"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    <div v-if="project.requires_budget" class="row">
                      <div class="col-md-6">
                        <div class="form-group">
                          <label>Бюджет этапа</label>
                          <input
                            v-model="stage.budget"
                            type="number"
                            step="0.01"
                            class="form-control"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  @click="addStage"
                  type="button"
                  class="btn btn-outline-primary"
                >
                  <i class="fas fa-plus mr-2"></i>
                  Добавить этап
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="row mb-5">
          <div class="col-12">
            <div class="d-flex justify-content-between">
              <router-link to="/crm/strategic-projects" class="btn btn-secondary">
                <i class="fas fa-arrow-left mr-2"></i>
                Назад
              </router-link>
              <div>
                <button
                  type="submit"
                  class="btn btn-success mr-2"
                  :disabled="saving"
                >
                  <span v-if="saving" class="spinner-border spinner-border-sm mr-2"></span>
                  <i v-else class="fas fa-save mr-2"></i>
                  Сохранить
                </button>
                <button
                  v-if="canSubmitForApproval"
                  @click="submitForApproval"
                  type="button"
                  class="btn btn-primary"
                  :disabled="submitting"
                >
                  <span v-if="submitting" class="spinner-border spinner-border-sm mr-2"></span>
                  <i v-else class="fas fa-paper-plane mr-2"></i>
                  Отправить на утверждение
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ProjectEdit',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const projectId = route.params.id
    const isEditMode = computed(() => !!projectId)
    
    const project = ref({
      name: '',
      goal: '',
      tasks: '',
      curator: null,
      customer: null,
      planned_start_date: '',
      planned_end_date: '',
      planned_results: [],
      requires_budget: false,
      total_budget: null,
      stages: [],
      status: 'draft'
    })
    
    const users = ref([])
    const saving = ref(false)
    const submitting = ref(false)
    
    // Проверка возможности отправки на утверждение
    const canSubmitForApproval = computed(() => {
      return project.value.status === 'draft' || project.value.status === 'rejected'
    })
    
    // Загрузка пользователей
    const loadUsers = async () => {
      try {
        const response = await apiClient.get('/users/')
        users.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
      }
    }
    
    // Загрузка проекта
    const loadProject = async () => {
      if (!isEditMode.value) return
      
      try {
        const response = await apiClient.get(`/crm/strategic-projects/strategic-projects/${projectId}/`)
        project.value = response.data
        
        // Убеждаемся, что массивы инициализированы
        if (!project.value.planned_results) {
          project.value.planned_results = []
        }
        if (!project.value.stages) {
          project.value.stages = []
        }
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        alert('Ошибка при загрузке проекта')
        router.push('/crm/strategic-projects')
      }
    }
    
    // Добавление результата
    const addResult = () => {
      project.value.planned_results.push('')
    }
    
    // Удаление результата
    const removeResult = (index) => {
      project.value.planned_results.splice(index, 1)
    }
    
    // Добавление этапа
    const addStage = () => {
      const newStage = {
        name: '',
        description: '',
        planned_start_date: project.value.planned_start_date,
        planned_end_date: project.value.planned_end_date,
        expected_results: [],
        target_indicators: [],
        budget: null,
        order_number: project.value.stages.length + 1
      }
      project.value.stages.push(newStage)
    }
    
    // Удаление этапа
    const removeStage = (index) => {
      project.value.stages.splice(index, 1)
      // Пересчитываем порядковые номера
      project.value.stages.forEach((stage, idx) => {
        stage.order_number = idx + 1
      })
    }
    
    // Сохранение проекта
    const saveProject = async () => {
      saving.value = true
      try {
        let response
        if (isEditMode.value) {
          response = await apiClient.patch(
            `/crm/strategic-projects/strategic-projects/${projectId}/`,
            project.value
          )
        } else {
          response = await apiClient.post(
            '/crm/strategic-projects/strategic-projects/',
            project.value
          )
        }
        
        alert('Проект успешно сохранен')
        
        if (!isEditMode.value) {
          // Если создаем новый проект, перенаправляем на страницу редактирования
          router.push(`/crm/strategic-projects/${response.data.id}/edit`)
        }
      } catch (error) {
        console.error('Ошибка сохранения проекта:', error)
        alert('Ошибка при сохранении проекта')
      } finally {
        saving.value = false
      }
    }
    
    // Отправка на утверждение
    const submitForApproval = async () => {
      // Проверяем обязательные поля
      if (!project.value.goal || !project.value.tasks || !project.value.curator || !project.value.customer) {
        alert('Заполните все обязательные поля')
        return
      }
      
      if (project.value.stages.length === 0) {
        alert('Добавьте хотя бы один этап проекта')
        return
      }
      
      if (!confirm('Отправить проект на утверждение?')) {
        return
      }
      
      submitting.value = true
      try {
        await apiClient.post(
          `/crm/strategic-projects/strategic-projects/${projectId}/submit_for_approval/`
        )
        alert('Проект отправлен на утверждение')
        router.push('/crm/strategic-projects')
      } catch (error) {
        console.error('Ошибка отправки на утверждение:', error)
        alert(error.response?.data?.error || 'Ошибка при отправке на утверждение')
      } finally {
        submitting.value = false
      }
    }
    
    // Получение класса для статуса
    const getStatusBadgeClass = (status) => {
      const classes = {
        draft: 'badge badge-secondary',
        on_approval: 'badge badge-warning',
        rejected: 'badge badge-danger',
        approved: 'badge badge-info',
        in_progress: 'badge badge-primary',
        completed: 'badge badge-success',
        archived: 'badge badge-dark'
      }
      return classes[status] || 'badge badge-secondary'
    }
    
    // Получение метки статуса
    const getStatusLabel = (status) => {
      const labels = {
        draft: 'Черновик',
        on_approval: 'На утверждении',
        rejected: 'Отклонен',
        approved: 'Утвержден',
        in_progress: 'В работе',
        completed: 'Завершен',
        archived: 'Архив'
      }
      return labels[status] || status
    }
    
    // Загрузка данных при монтировании
    onMounted(async () => {
      await loadUsers()
      await loadProject()
    })
    
    return {
      project,
      users,
      isEditMode,
      saving,
      submitting,
      canSubmitForApproval,
      addResult,
      removeResult,
      addStage,
      removeStage,
      saveProject,
      submitForApproval,
      getStatusBadgeClass,
      getStatusLabel
    }
  }
}
</script>

<style scoped>
.project-edit {
  padding: 20px 0;
}

.form-group label {
  font-weight: 500;
}

.text-danger {
  color: #dc3545;
}
</style>
