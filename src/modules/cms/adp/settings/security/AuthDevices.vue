<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Monitor, Laptop, Smartphone, Tablet, Wifi, WifiOff, 
  Trash2, Shield, MapPin, Clock, MoreVertical, Power, 
  RefreshCw, AlertTriangle
} from 'lucide-vue-next'
import { useProfile } from '@/js/api/services/profileService.js'

const toast = useToast()
const { getDevices, deleteDevice, formatDeviceData } = useProfile()

// Состояние компонента
const loading = ref(true)
const devices = ref([])
const deletingDeviceId = ref(null)
const refreshing = ref(false)

// Получение списка устройств
const fetchDevices = async (showLoader = true) => {
  try {
    if (showLoader) loading.value = true
    refreshing.value = !showLoader
    
    // Добавляем небольшую задержку для визуального эффекта
    if (!showLoader) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const response = await getDevices()
    devices.value = response.map(device => formatDeviceData(device))
  } catch (error) {
    console.error('Ошибка загрузки устройств:', error)
    toast.error('Ошибка загрузки списка устройств')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// Удаление устройства
const handleDeleteDevice = async (deviceId, deviceName) => {
  if (!confirm(`Вы уверены, что хотите завершить сессию на устройстве "${deviceName}"?\n\nЭто действие приведет к выходу из аккаунта на данном устройстве.`)) {
    return
  }

  try {
    deletingDeviceId.value = deviceId
    await deleteDevice(deviceId)
    
    // Удаляем устройство из списка
    devices.value = devices.value.filter(device => device.id !== deviceId)
    toast.success('Сессия успешно завершена')
  } catch (error) {
    console.error('Ошибка удаления устройства:', error)
    toast.error('Ошибка завершения сессии')
  } finally {
    deletingDeviceId.value = null
  }
}

// Завершение всех сессий кроме текущей
const terminateAllOtherSessions = async () => {
  const otherDevices = devices.value.filter(device => !device.isCurrentDevice)
  
  if (otherDevices.length === 0) {
    toast.info('Нет других активных сессий')
    return
  }

  if (!confirm(`Вы уверены, что хотите завершить все другие сессии (${otherDevices.length} устройств)?`)) {
    return
  }

  try {
    const promises = otherDevices.map(device => deleteDevice(device.id))
    await Promise.all(promises)
    
    // Оставляем только текущее устройство
    devices.value = devices.value.filter(device => device.isCurrentDevice)
    toast.success(`Завершено ${otherDevices.length} сессий`)
  } catch (error) {
    console.error('Ошибка завершения сессий:', error)
    toast.error('Ошибка завершения сессий')
    // Обновляем список на всякий случай
    fetchDevices(false)
  }
}

// Получение компонента иконки устройства
const getDeviceIconComponent = (iconName) => {
  const iconMap = {
    'Monitor': Monitor,
    'Laptop': Laptop,
    'Smartphone': Smartphone,
    'Tablet': Tablet
  }
  return iconMap[iconName] || Monitor
}

// Вычисляемые свойства
const activeDevices = computed(() => 
  devices.value.filter(device => device.isActive)
)

const inactiveDevices = computed(() => 
  devices.value.filter(device => !device.isActive)
)

const totalDevices = computed(() => devices.value.length)
const currentDevice = computed(() => 
  devices.value.find(device => device.isCurrentDevice)
)

const otherActiveDevices = computed(() => 
  activeDevices.value.filter(device => !device.isCurrentDevice)
)

// Инициализация
onMounted(() => {
  fetchDevices()
})
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0 d-flex align-items-center">
          <Shield :size="20" class="me-2" />
          <span>Управление сессиями</span>
        </h5>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary">
            {{ totalDevices }} устройств
          </span>
      <button 
            @click="fetchDevices(false)" 
        class="btn btn-light btn-sm"
            :disabled="loading || refreshing"
            title="Обновить список"
      >
            <RefreshCw :size="16" :class="{ 'spin': refreshing }" />
      </button>
        </div>
      </div>
    </div>
    
    <div class="card-body">
      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
        <p class="text-muted mt-2 mb-0">Загрузка устройств...</p>
    </div>
    
    <!-- Список устройств -->
      <div v-else-if="devices.length > 0">
        <!-- Кнопка завершения всех сессий -->
        <div v-if="otherActiveDevices.length > 0" class="mb-4">
          <div class="alert alert-warning d-flex align-items-start">
            <AlertTriangle :size="20" class="text-warning me-2 flex-shrink-0 mt-1" />
            <div class="flex-grow-1">
              <h6 class="alert-heading mb-2">Безопасность аккаунта</h6>
              <p class="mb-2 small">
                У вас есть {{ otherActiveDevices.length }} других активных сессий. 
                Для повышения безопасности рекомендуется завершить неиспользуемые сессии.
              </p>
              <button 
                @click="terminateAllOtherSessions"
                class="btn btn-sm btn-outline-danger"
                :disabled="deletingDeviceId !== null"
              >
                <Power :size="14" class="me-1" />
                Завершить все другие сессии
              </button>
            </div>
          </div>
        </div>

        <!-- Текущее устройство -->
        <div v-if="currentDevice" class="mb-4">
          <h6 class="text-primary mb-3 d-flex align-items-center">
            <Wifi :size="16" class="me-1" />
            <span>Текущая сессия</span>
          </h6>
          
          <div class="device-item current-device">
            <div class="d-flex align-items-center">
              <!-- Иконка устройства -->
              <div class="device-icon text-primary">
                <component :is="getDeviceIconComponent(currentDevice.deviceIcon)" :size="28" />
              </div>

              <!-- Информация об устройстве -->
              <div class="flex-grow-1 ms-3">
                <h6 class="mb-1 fw-semibold">
                  {{ currentDevice.deviceName }}
                  <span class="badge bg-primary ms-2">Текущее устройство</span>
                </h6>
                <div class="text-muted small mb-1">
                  <MapPin :size="14" class="me-1" />
                  {{ currentDevice.city }}, {{ currentDevice.country }}
                </div>
                <div class="text-muted small">
                  <Clock :size="14" class="me-1" />
                  {{ currentDevice.formattedLastActivity }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Другие активные устройства -->
        <div v-if="otherActiveDevices.length > 0" class="mb-4">
          <h6 class="text-success mb-3 d-flex align-items-center">
            <Wifi :size="16" class="me-1" />
            <span>Другие активные сессии ({{ otherActiveDevices.length }})</span>
          </h6>
          
          <div class="d-flex flex-column gap-3">
            <div
              v-for="device in otherActiveDevices"
              :key="device.id"
              class="device-item active"
            >
              <div class="d-flex align-items-center">
                <!-- Иконка устройства -->
                <div class="device-icon text-success">
                  <component :is="getDeviceIconComponent(device.deviceIcon)" :size="24" />
                </div>

                <!-- Информация об устройстве -->
                <div class="flex-grow-1 ms-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1 fw-semibold">{{ device.deviceName }}</h6>
                      <div class="text-muted small mb-1">
                        <MapPin :size="14" class="me-1" />
                        {{ device.city }}, {{ device.country }}
                      </div>
                      <div class="text-muted small">
                        <Clock :size="14" class="me-1" />
                        {{ device.formattedLastActivity }}
                      </div>
                    </div>

                    <!-- Действия -->
                    <div class="dropdown">
                      <button 
                        class="btn btn-sm btn-outline-secondary dropdown-toggle"
                        type="button"
                        :id="`dropdown-${device.id}`"
                        data-bs-toggle="dropdown"
                        :disabled="deletingDeviceId === device.id"
                      >
                        <MoreVertical :size="16" />
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li>
          <button
                            @click="handleDeleteDevice(device.id, device.deviceName)"
                            class="dropdown-item text-danger"
                            :disabled="deletingDeviceId === device.id"
                          >
                            <Power :size="16" class="me-2" />
                            <span v-if="deletingDeviceId === device.id">Завершение...</span>
                            <span v-else>Завершить сессию</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
    
        <!-- Неактивные устройства -->
        <div v-if="inactiveDevices.length > 0">
          <h6 class="text-muted mb-3 d-flex align-items-center">
            <WifiOff :size="16" class="me-1" />
            <span>Неактивные устройства ({{ inactiveDevices.length }})</span>
          </h6>
          
          <div class="d-flex flex-column gap-2">
            <div
              v-for="device in inactiveDevices"
              :key="device.id"
              class="device-item inactive"
            >
              <div class="d-flex align-items-center">
                <!-- Иконка устройства -->
                <div class="device-icon text-muted">
                  <component :is="getDeviceIconComponent(device.deviceIcon)" :size="20" />
                </div>

                <!-- Информация об устройстве -->
                <div class="flex-grow-1 ms-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1 text-muted small fw-semibold">{{ device.deviceName }}</h6>
                      <div class="text-muted extra-small mb-1">
                        <MapPin :size="12" class="me-1" />
                        {{ device.city }}, {{ device.country }}
                      </div>
                      <div class="text-muted extra-small">
                        <Clock :size="12" class="me-1" />
                        {{ device.formattedLastActivity }}
                      </div>
                    </div>

                    <!-- Кнопка удаления -->
                    <button 
                      @click="handleDeleteDevice(device.id, device.deviceName)"
                      class="btn btn-sm btn-outline-danger"
                      :disabled="deletingDeviceId === device.id"
                      title="Удалить устройство"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Информация о безопасности -->
        <div class="mt-4 p-3 bg-light rounded">
          <div class="d-flex align-items-start">
            <Shield :size="20" class="text-info me-2 flex-shrink-0" />
            <div>
              <h6 class="mb-1 small">Рекомендации по безопасности</h6>
              <ul class="text-muted small mb-2 ps-3">
                <li>Регулярно проверяйте список активных устройств</li>
                <li>Завершайте сессии на неиспользуемых устройствах</li>
                <li>Используйте надежные пароли и двухфакторную аутентификацию</li>
                <li>Не входите в аккаунт на общественных компьютерах</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустой список -->
    <div v-else class="text-center py-4 text-muted">
        <Shield :size="48" class="mb-3 opacity-50" />
        <h6>Нет данных об устройствах</h6>
        <p class="small">Информация об устройствах появится после входа в систему</p>
        <button @click="fetchDevices()" class="btn btn-outline-primary btn-sm">
          <RefreshCw :size="16" class="me-1" />
          Обновить список
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  border: 1px solid rgba(0, 0, 0, 0.125);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.15s ease-in-out;

  &:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.device-item {
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;

  &.current-device {
    background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
    border: 2px solid rgba(13, 110, 253, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(13, 110, 253, 0.15) 0%, rgba(13, 110, 253, 0.08) 100%);
    }
  }

  &.active {
    background-color: rgba(25, 135, 84, 0.05);
    border: 1px solid rgba(25, 135, 84, 0.2);

    &:hover {
      background-color: rgba(25, 135, 84, 0.1);
    }
  }

  &.inactive {
    background-color: rgba(108, 117, 125, 0.05);
    border: 1px solid rgba(108, 117, 125, 0.1);

    &:hover {
      background-color: rgba(108, 117, 125, 0.1);
    }
  }
}

.device-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(var(--bs-primary-rgb), 0.1);
  
  .device-item.current-device & {
    background-color: rgba(13, 110, 253, 0.15);
  }
  
  .device-item.active & {
    background-color: rgba(25, 135, 84, 0.15);
  }
  
  .device-item.inactive & {
    background-color: rgba(108, 117, 125, 0.1);
    width: 40px;
    height: 40px;
  }
}

.fw-semibold {
  font-weight: 600;
}

.extra-small {
  font-size: 0.75rem;
}

.badge {
  font-size: 0.7rem;
}

.dropdown-toggle::after {
  display: none;
}

.btn-sm {
  --bs-btn-padding-y: 0.25rem;
  --bs-btn-padding-x: 0.5rem;
  --bs-btn-font-size: 0.875rem;
}

h6 {
  font-weight: 600;
  color: #495057;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.alert {
  border-left: 4px solid #ffc107;
}
</style>
