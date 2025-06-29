<template>
  <div class="project-view">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="h3 mb-2">{{ project.name }}</h1>
              <div class="text-muted">
                <strong>Код проекта:</strong> {{ project.code }}
              </div>
            </div>
            <div>
              <span :class="getStatusBadgeClass(project.status)" class="badge badge-lg">
                {{ getStatusLabel(project.status) }}
              </span>
            </div>
          </div>
          <nav aria-label="breadcrumb" class="mt-3">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
              <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
              <li class="breadcrumb-item">
                <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
              </li>
              <li class="breadcrumb-item active">Просмотр проекта</li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="btn-toolbar">
            <router-link
              v-if="canEdit"
              :to="`/crm/strategic-projects/${projectId}/edit`"
              class="btn btn-primary mr-2"
            >
              <i class="fas fa-edit mr-2"></i>
              Редактировать
            </router-link>
            
            <button
              v-if="project.status === 'on_approval' && isExpertGroup"
              @click="approveProject"
              class="btn btn-success mr-2"
            >
              <i class="fas fa-check mr-2"></i>
              Утвердить
            </button>
            
            <button
              v-if="project.status === 'on_approval' && isExpertGroup"
              @click="rejectProject"
              class="btn btn-danger mr-2"
            >
              <i class="fas fa-times mr-2"></i>
              Отклонить
            </button>
            
            <button
              v-if="project.status === 'approved'"
              @click="startProject"
              class="btn btn-info mr-2"
            >
              <i class="fas fa-play mr-2"></i>
              Запустить проект
            </button>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="row">
        <div class="col-lg-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Основная информация</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Цель проекта:</strong><br />
                <p class="text-pre-wrap">{{ project.goal }}</p>
              </div>
              
              <div class="mb-3">
                <strong>Задачи проекта:</strong><br />
                <p class="text-pre-wrap">{{ project.tasks }}</p>
              </div>
              
              <div v-if="project.planned_results?.length > 0" class="mb-3">
                <strong>Планируемые результаты:</strong>
                <ul>
                  <li v-for="(result, index) in project.planned_results" :key="index">
                    {{ result }}
                  </li>
                </ul>
              </div>
              
              <div v-if="project.rejection_comment" class="alert alert-danger">
                <strong>Причина отклонения:</strong><br />
                {{ project.rejection_comment }}
              </div>
            </div>
          </div>
          
          <!-- Этапы проекта -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                План-график проекта
                <span class="badge badge-primary ml-2">{{ project.stages?.length || 0 }} этапов</span>
              </h5>
            </div>
            <div class="card-body">
              <div v-if="!project.stages || project.stages.length === 0" class="text-muted">
                Этапы не определены
              </div>
              <div v-else class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Наименование</th>
                      <th>Сроки</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stage in project.stages" :key="stage.id">
                      <td>{{ stage.order_number }}</td>
                      <td>{{ stage.name }}</td>
                      <td>
                        {{ formatDate(stage.planned_start_date) }} - 
                        {{ formatDate(stage.planned_end_date) }}
                      </td>
                      <td>
                        <span :class="getStageBadgeClass(stage.status)">
                          {{ getStageStatusLabel(stage.status) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Участники проекта</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Руководитель:</strong><br />
                {{ project.leader_info?.full_name }}
              </div>
              <div class="mb-3">
                <strong>Куратор:</strong><br />
                {{ project.curator_info?.full_name || 'Не назначен' }}
              </div>
              <div class="mb-3">
                <strong>Заказчик:</strong><br />
                {{ project.customer_info?.full_name || 'Не назначен' }}
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Сроки и бюджет</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Плановые сроки:</strong><br />
                {{ formatDate(project.planned_start_date) }} - 
                {{ formatDate(project.planned_end_date) }}
              </div>
              <div v-if="project.actual_start_date" class="mb-3">
                <strong>Фактические сроки:</strong><br />
                {{ formatDate(project.actual_start_date) }} - 
                {{ formatDate(project.actual_end_date) || 'в процессе' }}
              </div>
              <div v-if="project.requires_budget" class="mb-3">
                <strong>Общий бюджет:</strong><br />
                {{ formatCurrency(project.total_budget) }}
              </div>
              <div class="mb-3">
                <strong>Прогресс выполнения:</strong>
                <div class="progress mt-2">
                  <div
                    class="progress-bar"
                    :style="{ width: project.completion_percentage + '%' }"
                  >
                    {{ project.completion_percentage }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ProjectView',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const projectId = route.params.id
    
    const project = ref({})
    const loading = ref(false)
    
    // Проверка прав пользователя
    const currentUser = computed(() => userStore.user)
    
    const isProjectLeader = computed(() => {
      return project.value.leader === currentUser.value?.id
    })
    
    const isExpertGroup = computed(() => {
      // Временно даем права всем авторизованным пользователям
      // TODO: Реализовать систему ролей
      return userStore.isAuthenticated
    })
    
    const canEdit = computed(() => {
      return isProjectLeader.value && 
             ['draft', 'rejected'].includes(project.value.status)
    })
    
    // Загрузка проекта
    const loadProject = async () => {
      loading.value = true
      try {
        const response = await apiClient.get(`/crm/strategic-projects/strategic-projects/${projectId}/`)
        project.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        alert('Ошибка при загрузке проекта')
        router.push('/crm/strategic-projects')
      } finally {
        loading.value = false
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    }
    
    // Форматирование валюты
    const formatCurrency = (amount) => {
      if (!amount) return '-'
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(amount)
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
    
    // Получение класса для статуса этапа
    const getStageBadgeClass = (status) => {
      const classes = {
        planned: 'badge badge-secondary',
        in_progress: 'badge badge-primary',
        completed: 'badge badge-success',
        delayed: 'badge badge-danger'
      }
      return classes[status] || 'badge badge-secondary'
    }
    
    // Получение метки статуса этапа
    const getStageStatusLabel = (status) => {
      const labels = {
        planned: 'Запланирован',
        in_progress: 'В работе',
        completed: 'Завершен',
        delayed: 'Просрочен'
      }
      return labels[status] || status
    }
    
    // Утвердить проект
    const approveProject = async () => {
      if (!confirm('Утвердить проект?')) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/approve/`)
        alert('Проект успешно утвержден')
        loadProject()
      } catch (error) {
        console.error('Ошибка утверждения проекта:', error)
        alert('Ошибка при утверждении проекта')
      }
    }
    
    // Отклонить проект
    const rejectProject = async () => {
      const comment = prompt('Укажите причину отклонения:')
      if (!comment) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/reject/`, {
          comment
        })
        alert('Проект отклонен')
        loadProject()
      } catch (error) {
        console.error('Ошибка отклонения проекта:', error)
        alert('Ошибка при отклонении проекта')
      }
    }
    
    // Запуск проекта
    const startProject = async () => {
      if (!confirm('Запустить проект в работу?')) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/start_project/`)
        alert('Проект успешно запущен')
        loadProject()
      } catch (error) {
        console.error('Ошибка запуска проекта:', error)
        alert('Ошибка при запуске проекта')
      }
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadProject()
    })
    
    return {
      project,
      projectId,
      loading,
      currentUser,
      isProjectLeader,
      isExpertGroup,
      canEdit,
      loadProject,
      formatDate,
      formatCurrency,
      getStatusBadgeClass,
      getStatusLabel,
      getStageBadgeClass,
      getStageStatusLabel,
      approveProject,
      rejectProject,
      startProject
    }
  }
}
</script>

<style scoped>
.project-view {
  padding: 20px 0;
}

.badge-lg {
  font-size: 1rem;
  padding: 0.5rem 1rem;
}

.text-pre-wrap {
  white-space: pre-wrap;
}

.progress {
  height: 20px;
}

.progress-bar {
  font-size: 12px;
  line-height: 20px;
}
</style>
