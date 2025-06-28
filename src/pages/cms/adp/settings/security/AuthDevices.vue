<script setup>
import { LaptopMinimal, Monitor, Smartphone } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager.js'
import { endpoints } from '@/js/api/endpoints.js'

const sessions = ref([])
const isLoading = ref(false)

// Мапинг типов устройств на иконки
const deviceIcons = {
  desktop: Monitor,
  laptop: LaptopMinimal,
  mobile: Smartphone,
  tablet: Smartphone, // Используем иконку смартфона для планшета
}

// Мапинг типов устройств на читаемые названия
const deviceNames = {
  desktop: 'Desktop',
  laptop: 'Laptop', 
  mobile: 'Mobile',
  tablet: 'Tablet',
}

// Загрузка списка устройств
const loadDevices = async () => {
  isLoading.value = true
  try {
    const response = await apiClient.get(endpoints.auth.devices)
    
    if (response.success) {
      sessions.value = response.data.map(device => ({
        id: device.id,
        icon: deviceIcons[device.device_type] || Monitor,
        name: deviceNames[device.device_type] || device.device_name || 'Unknown Device',
        geo: {
          city: device.city || 'Неизвестно',
          active: device.is_active,
          date: device.last_activity ? new Date(device.last_activity) : new Date(device.created_at),
        },
      }))
    } else {
      console.error('Ошибка загрузки устройств:', response.message)
      if (window.showErrorToast) {
        window.showErrorToast('Ошибка загрузки устройств')
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки устройств:', error)
    if (window.showErrorToast) {
      window.showErrorToast('Ошибка загрузки устройств')
    }
  } finally {
    isLoading.value = false
  }
}

// Удаление сессии по ID
const removeSession = async (deviceId) => {
  if (!confirm('Вы уверены, что хотите завершить эту сессию?')) {
    return
  }

  try {
    const response = await apiClient.delete(endpoints.auth.deleteDevice(deviceId))
    
    if (response.success) {
      // Удаляем устройство из локального списка
      sessions.value = sessions.value.filter(session => session.id !== deviceId)
      
      if (window.showSuccessToast) {
        window.showSuccessToast('Сессия успешно завершена')
      } else {
        alert('Сессия успешно завершена')
      }
    } else {
      if (window.showErrorToast) {
        window.showErrorToast(response.message || 'Ошибка при завершении сессии')
      } else {
        alert(response.message || 'Ошибка при завершении сессии')
      }
    }
  } catch (error) {
    console.error('Ошибка удаления устройства:', error)
    if (window.showErrorToast) {
      window.showErrorToast('Ошибка при завершении сессии')
    } else {
      alert('Ошибка при завершении сессии')
    }
  }
}

// Загружаем устройства при монтировании компонента
onMounted(() => {
  loadDevices()
})
</script>

<template>
  <div class="card h-100">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="card-title mb-0">Мои устройства</h5>
      <button 
        @click="loadDevices" 
        class="btn btn-outline-secondary btn-sm"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
        {{ isLoading ? 'Загрузка...' : 'Обновить' }}
      </button>
    </div>
    
    <!-- Состояние загрузки -->
    <div v-if="isLoading && sessions.length === 0" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <div class="mt-2 text-muted">Загрузка устройств...</div>
    </div>
    
    <!-- Список устройств -->
    <div v-else-if="sessions.length > 0" class="d-flex flex-column gap-2" v-auto-animate>
      <div v-for="session in sessions" :key="session.id" class="d-flex justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <component
            :is="session.icon"
            :color="session.geo.active ? 'var(--color-accent)' : 'var(--color-secondary-text)'"
            :size="24"
          />
          <div class="d-flex flex-column lh-sm">
            <div class="fw-bold">{{ session.name }}</div>
            <div class="d-flex gap-1">
              <div class="settings__session-city">{{ session.geo.city }}</div>
              <div :class="session.geo.active ? 'text-success' : ''">
                {{ session.geo.active ? 'Активно' : session.geo.date.toLocaleString('ru-RU') }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="!session.geo.active">
          <button
            class="btn-close"
            title="Завершить сессию"
            aria-label="Завершить сессию"
            @click="removeSession(session.id)"
          ></button>
        </div>
      </div>
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="text-center py-4 text-muted">
      <Monitor :size="48" class="mb-2 opacity-50" />
      <div class="mb-2">Устройства не найдены</div>
      <small class="text-muted">
        Устройства автоматически добавляются при входе в систему.<br>
        Попробуйте войти с другого устройства или обновить страницу.
      </small>
      <div class="mt-3">
        <button @click="loadDevices" class="btn btn-outline-primary btn-sm">
          Обновить список
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
