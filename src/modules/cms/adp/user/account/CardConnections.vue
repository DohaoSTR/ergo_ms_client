<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Monitor, Laptop, Smartphone, Tablet, Wifi, WifiOff, 
  Trash2, Shield, MapPin, Clock, MoreVertical, Power
} from 'lucide-vue-next'
import { useProfile } from '@/js/api/services/profileService.js'

const toast = useToast()
const { getDevices, deleteDevice, formatDeviceData } = useProfile()

// Состояние компонента
const loading = ref(true)
const devices = ref([])
const deletingDeviceId = ref(null)

// Получение списка устройств
const fetchDevices = async () => {
  try {
    loading.value = true
    const response = await getDevices()
    devices.value = response.map(device => formatDeviceData(device))
  } catch (error) {
    console.error('Ошибка загрузки устройств:', error)
    toast.error('Ошибка загрузки списка устройств')
  } finally {
    loading.value = false
  }
}

// Удаление устройства
const handleDeleteDevice = async (deviceId, deviceName) => {
  if (!confirm(`Вы уверены, что хотите завершить сессию на устройстве "${deviceName}"?`)) {
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

// Инициализация
onMounted(() => {
  fetchDevices()
})
</script>

<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">
        <Shield :size="20" class="me-2" />
        Активные сессии
      </h5>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-primary">
          {{ totalDevices }} устройств
        </span>
        <button 
          @click="fetchDevices" 
          class="btn btn-outline-secondary btn-sm"
          :disabled="loading"
        >
          <Clock :size="16" />
        </button>
      </div>
    </div>

    <div class="card-body">
      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary spinner-border-sm" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="text-muted mt-2 mb-0">Загрузка устройств...</p>
      </div>

      <!-- Список устройств -->
      <div v-else-if="devices.length > 0">
        <!-- Активные устройства -->
        <div v-if="activeDevices.length > 0" class="mb-4">
          <h6 class="text-success mb-3">
            <Wifi :size="16" class="me-1" />
            Активные сессии ({{ activeDevices.length }})
          </h6>
          
          <div class="d-flex flex-column gap-3">
            <div
              v-for="device in activeDevices"
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
                      <h6 class="mb-1 fw-semibold">
                        {{ device.deviceName }}
                        <span v-if="device.isCurrentDevice" class="badge bg-success ms-2 small">
                          Текущее устройство
                        </span>
                      </h6>
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
                    <div class="dropdown" v-if="!device.isCurrentDevice">
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
          <h6 class="text-muted mb-3">
            <WifiOff :size="16" class="me-1" />
            Неактивные устройства ({{ inactiveDevices.length }})
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
                      <h6 class="mb-1 text-muted small">{{ device.deviceName }}</h6>
                      <div class="text-muted extra-small">
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
            <Shield :size="20" class="text-primary me-2 flex-shrink-0" />
            <div>
              <h6 class="mb-1 small">Безопасность аккаунта</h6>
              <p class="text-muted small mb-2">
                Следите за активностью своего аккаунта. Если вы видите подозрительную активность, 
                немедленно завершите сессии на неизвестных устройствах.
              </p>
              <RouterLink 
                :to="{ name: 'SecuritySettings' }" 
                class="btn btn-sm btn-outline-primary"
              >
                Настройки безопасности
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустой список -->
      <div v-else class="text-center py-4 text-muted">
        <Shield :size="48" class="mb-3 opacity-50" />
        <h6>Нет активных устройств</h6>
        <p class="small">Войдите в аккаунт с других устройств, чтобы увидеть их здесь</p>
        <button @click="fetchDevices" class="btn btn-outline-primary btn-sm">
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
  border-radius: 0.5rem;
  transition: all 0.2s ease;

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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(var(--bs-primary-rgb), 0.1);
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
</style>
