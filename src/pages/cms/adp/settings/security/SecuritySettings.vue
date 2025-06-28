<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Shield, Bell, Eye, Lock, Smartphone, Mail, 
  MessageSquare, CheckCircle, XCircle
} from 'lucide-vue-next'
import { useProfile } from '@/js/api/services/profileService.js'

const toast = useToast()
const { getSecuritySettings, updateSecuritySettings } = useProfile()

// Состояние компонента
const loading = ref(true)
const saving = ref(false)
const settings = ref({
  // Настройки уведомлений
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  
  // Настройки приватности
  profile_visibility: 'public',
  two_factor_enabled: false
})

// Получение настроек безопасности
const fetchSecuritySettings = async () => {
  try {
    loading.value = true
    const response = await getSecuritySettings()
    settings.value = { ...settings.value, ...response }
  } catch (error) {
    console.error('Ошибка загрузки настроек безопасности:', error)
    toast.error('Ошибка загрузки настроек безопасности')
  } finally {
    loading.value = false
  }
}

// Сохранение настроек
const saveSettings = async () => {
  try {
    saving.value = true
    await updateSecuritySettings(settings.value)
    toast.success('Настройки безопасности сохранены')
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    toast.error('Ошибка сохранения настроек')
  } finally {
    saving.value = false
  }
}

// Обработчики переключения настроек
const toggleSetting = async (settingName) => {
  settings.value[settingName] = !settings.value[settingName]
  await saveSettings()
}

const updatePrivacySetting = async (value) => {
  settings.value.profile_visibility = value
  await saveSettings()
}

// Данные для отображения
const visibilityOptions = [
  { value: 'public', label: 'Публичный', description: 'Профиль виден всем пользователям' },
  { value: 'friends', label: 'Только друзья', description: 'Профиль виден только друзьям' },
  { value: 'private', label: 'Приватный', description: 'Профиль скрыт от других пользователей' }
]

// Инициализация
onMounted(() => {
  fetchSecuritySettings()
})
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <Shield :size="20" class="me-2" />
        Настройки безопасности и приватности
      </h5>
    </div>

    <div class="card-body">
      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="text-muted mt-2 mb-0">Загрузка настроек...</p>
      </div>

      <!-- Настройки -->
      <div v-else>
        <!-- Настройки уведомлений -->
        <div class="mb-5">
          <h6 class="text-muted mb-3">
            <Bell :size="18" class="me-1" />
            Уведомления
          </h6>
          
          <div class="d-flex flex-column gap-3">
            <!-- Email уведомления -->
            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
              <div class="d-flex align-items-start">
                <Mail :size="20" class="text-primary me-3 mt-1" />
                <div>
                  <h6 class="mb-1">Email уведомления</h6>
                  <p class="text-muted small mb-0">
                    Получать уведомления о важных событиях на email
                  </p>
                </div>
              </div>
              <div class="form-check form-switch">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="emailNotifications"
                  v-model="settings.email_notifications"
                  @change="toggleSetting('email_notifications')"
                  :disabled="saving"
                />
                <label class="form-check-label" for="emailNotifications">
                  <span class="visually-hidden">Email уведомления</span>
                </label>
              </div>
            </div>

            <!-- Push уведомления -->
            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
              <div class="d-flex align-items-start">
                <Bell :size="20" class="text-primary me-3 mt-1" />
                <div>
                  <h6 class="mb-1">Push уведомления</h6>
                  <p class="text-muted small mb-0">
                    Получать push-уведомления в браузере
                  </p>
                </div>
              </div>
              <div class="form-check form-switch">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="pushNotifications"
                  v-model="settings.push_notifications"
                  @change="toggleSetting('push_notifications')"
                  :disabled="saving"
                />
                <label class="form-check-label" for="pushNotifications">
                  <span class="visually-hidden">Push уведомления</span>
                </label>
              </div>
            </div>

            <!-- SMS уведомления -->
            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
              <div class="d-flex align-items-start">
                <MessageSquare :size="20" class="text-primary me-3 mt-1" />
                <div>
                  <h6 class="mb-1">SMS уведомления</h6>
                  <p class="text-muted small mb-0">
                    Получать SMS с важными уведомлениями
                  </p>
                </div>
              </div>
              <div class="form-check form-switch">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="smsNotifications"
                  v-model="settings.sms_notifications"
                  @change="toggleSetting('sms_notifications')"
                  :disabled="saving"
                />
                <label class="form-check-label" for="smsNotifications">
                  <span class="visually-hidden">SMS уведомления</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Настройки приватности -->
        <div class="mb-5">
          <h6 class="text-muted mb-3">
            <Eye :size="18" class="me-1" />
            Приватность профиля
          </h6>
          
          <div class="d-flex flex-column gap-3">
            <div 
              v-for="option in visibilityOptions" 
              :key="option.value"
              class="border rounded p-3"
              :class="{ 'border-primary bg-primary bg-opacity-10': settings.profile_visibility === option.value }"
            >
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  :id="`visibility-${option.value}`"
                  :value="option.value"
                  v-model="settings.profile_visibility"
                  @change="updatePrivacySetting(option.value)"
                  :disabled="saving"
                />
                <label class="form-check-label w-100" :for="`visibility-${option.value}`">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-1">{{ option.label }}</h6>
                      <p class="text-muted small mb-0">{{ option.description }}</p>
                    </div>
                    <CheckCircle 
                      v-if="settings.profile_visibility === option.value" 
                      :size="20" 
                      class="text-primary"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Двухфакторная аутентификация -->
        <div class="mb-4">
          <h6 class="text-muted mb-3">
            <Lock :size="18" class="me-1" />
            Двухфакторная аутентификация
          </h6>
          
          <div class="alert alert-info d-flex align-items-start">
            <Smartphone :size="20" class="text-info me-2 flex-shrink-0 mt-1" />
            <div class="flex-grow-1">
              <h6 class="alert-heading mb-2">Повысьте безопасность аккаунта</h6>
              <p class="mb-2 small">
                Двухфакторная аутентификация добавляет дополнительный уровень защиты вашего аккаунта.
                При входе потребуется не только пароль, но и код с вашего мобильного устройства.
              </p>
              
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <span class="small me-2">
                    Статус: 
                    <span :class="settings.two_factor_enabled ? 'text-success' : 'text-danger'">
                      {{ settings.two_factor_enabled ? 'Включена' : 'Отключена' }}
                    </span>
                  </span>
                  <component 
                    :is="settings.two_factor_enabled ? CheckCircle : XCircle" 
                    :size="16" 
                    :class="settings.two_factor_enabled ? 'text-success' : 'text-danger'"
                  />
                </div>
                
                <button 
                  @click="toggleSetting('two_factor_enabled')"
                  class="btn btn-sm"
                  :class="settings.two_factor_enabled ? 'btn-outline-danger' : 'btn-outline-success'"
                  :disabled="saving"
                >
                  {{ settings.two_factor_enabled ? 'Отключить' : 'Включить' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Индикатор сохранения -->
        <div v-if="saving" class="text-center py-2">
          <div class="d-flex align-items-center justify-content-center text-muted">
            <div class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">Сохранение...</span>
            </div>
            Сохранение настроек...
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div class="mt-4 p-3 bg-light rounded">
          <div class="d-flex align-items-start">
            <Shield :size="20" class="text-info me-2 flex-shrink-0" />
            <div>
              <h6 class="mb-1 small">Рекомендации по безопасности</h6>
              <ul class="text-muted small mb-0 ps-3">
                <li>Включите двухфакторную аутентификацию для максимальной защиты</li>
                <li>Настройте уведомления для контроля активности аккаунта</li>
                <li>Регулярно проверяйте настройки приватности</li>
                <li>Используйте надежные пароли и регулярно их меняйте</li>
              </ul>
            </div>
          </div>
        </div>
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

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.form-check-input:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-check-label {
  cursor: pointer;
}

.border {
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #dee2e6 !important;
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.alert {
  border-left: 4px solid #0dcaf0;
}

.bg-light {
  background-color: #f8f9fa !important;
}

h6 {
  font-weight: 600;
  color: #495057;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style> 