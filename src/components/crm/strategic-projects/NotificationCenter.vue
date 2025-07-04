<template>
  <div class="notification-center">
    <!-- Кнопка уведомлений -->
    <div class="notification-dropdown" ref="notificationDropdown">
      <button
        @click="toggleNotifications"
        class="notification-button"
        :class="{ 'has-unread': unreadCount > 0 }"
      >
        <i class="fas fa-bell"></i>
        <span v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Выпадающий список уведомлений -->
      <transition name="dropdown">
        <div v-if="showNotifications" class="notification-panel">
          <div class="panel-header">
            <h5 class="panel-title">
              <i class="fas fa-bell mr-2"></i>
              Уведомления
            </h5>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="btn-mark-all"
            >
              <i class="fas fa-check-double mr-1"></i>
              Прочитать все
            </button>
          </div>

          <div class="panel-body">
            <div v-if="loading" class="loading-state">
              <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="sr-only">Загрузка...</span>
              </div>
            </div>

            <div v-else-if="notifications.length === 0" class="empty-state">
              <i class="fas fa-bell-slash"></i>
              <p>Нет новых уведомлений</p>
            </div>

            <div v-else class="notifications-list">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ 'unread': !notification.is_read }"
                @click="handleNotificationClick(notification)"
              >
                <div class="notification-icon">
                  <i :class="getNotificationIcon(notification.notification_type)"></i>
                </div>
                <div class="notification-content">
                  <h6 class="notification-title">{{ notification.title }}</h6>
                  <p class="notification-message">{{ notification.message }}</p>
                  <div class="notification-meta">
                    <span class="project-code">{{ notification.project_code }}</span>
                    <span class="notification-time">
                      <i class="fas fa-clock mr-1"></i>
                      {{ formatRelativeTime(notification.created_at) }}
                    </span>
                  </div>
                </div>
                <div v-if="!notification.is_read" class="unread-indicator"></div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <router-link
              to="/crm/strategic-projects/notifications"
              class="view-all-link"
              @click="showNotifications = false"
            >
              <i class="fas fa-list mr-2"></i>
              Все уведомления
            </router-link>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default {
  name: 'NotificationCenter',
  
  setup() {
    const notifications = ref([])
    const unreadCount = ref(0)
    const showNotifications = ref(false)
    const loading = ref(false)
    const notificationDropdown = ref(null)
    
    // Загрузка уведомлений
    const loadNotifications = async () => {
      loading.value = true
      try {
        const response = await apiClient.get('/crm/strategic-projects/project-notifications/recent/', {
          params: { limit: 10 }
        })
        notifications.value = response.data
        
        // Загружаем количество непрочитанных
        const countResponse = await apiClient.get('/crm/strategic-projects/project-notifications/unread_count/')
        unreadCount.value = countResponse.data.unread_count
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Переключение видимости уведомлений
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      if (showNotifications.value) {
        loadNotifications()
      }
    }
    
    // Обработка клика по уведомлению
    const handleNotificationClick = async (notification) => {
      if (!notification.is_read) {
        try {
          await apiClient.post(`/crm/strategic-projects/project-notifications/${notification.id}/mark_as_read/`)
          notification.is_read = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        } catch (error) {
          console.error('Ошибка отметки уведомления:', error)
        }
      }
      
      // Переход к проекту
      window.location.href = `/crm/strategic-projects/project/${notification.project}`
    }
    
    // Отметить все как прочитанные
    const markAllAsRead = async () => {
      try {
        await apiClient.post('/crm/strategic-projects/project-notifications/mark_all_as_read/')
        notifications.value.forEach(n => n.is_read = true)
        unreadCount.value = 0
      } catch (error) {
        console.error('Ошибка отметки всех уведомлений:', error)
      }
    }
    
    // Форматирование относительного времени
    const formatRelativeTime = (dateString) => {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ru
      })
    }
    
    // Получение иконки для типа уведомления
    const getNotificationIcon = (type) => {
      const icons = {
        status_change: 'fas fa-exchange-alt',
        approval_required: 'fas fa-gavel',
        project_approved: 'fas fa-check-circle text-success',
        project_rejected: 'fas fa-times-circle text-danger',
        deadline_approaching: 'fas fa-clock text-warning',
        task_assigned: 'fas fa-tasks',
        stage_completed: 'fas fa-flag-checkered',
        comment_added: 'fas fa-comment',
        project_started: 'fas fa-play-circle text-info',
        project_completed: 'fas fa-trophy text-success'
      }
      return icons[type] || 'fas fa-bell'
    }
    
    // Обработка клика вне компонента
    const handleClickOutside = (event) => {
      if (notificationDropdown.value && !notificationDropdown.value.contains(event.target)) {
        showNotifications.value = false
      }
    }
    
    // Автообновление счетчика каждые 30 секунд
    let updateInterval = null
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      loadNotifications()
      
      updateInterval = setInterval(() => {
        loadNotifications()
      }, 30000)
    })
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    })
    
    return {
      notifications,
      unreadCount,
      showNotifications,
      loading,
      notificationDropdown,
      toggleNotifications,
      handleNotificationClick,
      markAllAsRead,
      formatRelativeTime,
      getNotificationIcon
    }
  }
}
</script>

<style scoped>
.notification-center {
  position: relative;
}

.notification-dropdown {
  position: relative;
}

/* Кнопка уведомлений */
.notification-button {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 1.125rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-button:hover {
  border-color: #667eea;
  color: #667eea;
}

.notification-button.has-unread {
  color: #667eea;
  border-color: #667eea;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 20px;
  text-align: center;
}

/* Панель уведомлений */
.notification-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 400px;
  max-width: 90vw;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.btn-mark-all {
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-mark-all:hover {
  background: rgba(255,255,255,0.3);
}

.panel-body {
  max-height: 400px;
  overflow-y: auto;
}

/* Состояния загрузки и пустое состояние */
.loading-state,
.empty-state {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-state {
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* Список уведомлений */
.notifications-list {
  padding: 0.5rem 0;
}

.notification-item {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #f0f9ff;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-item.unread .notification-icon {
  background: rgba(102,126,234,0.1);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem;
  line-height: 1.3;
}

.notification-message {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.project-code {
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.7rem;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
}

/* Футер панели */
.panel-footer {
  padding: 0.75rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.view-all-link:hover {
  background: rgba(102,126,234,0.1);
  text-decoration: none;
}

/* Анимация выпадающего списка */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Адаптивность */
@media (max-width: 576px) {
  .notification-panel {
    width: calc(100vw - 2rem);
    right: -0.5rem;
  }
}
</style> 