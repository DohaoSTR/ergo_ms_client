<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Shield, Eye, CheckCircle
} from 'lucide-vue-next'
import { useProfile } from '@/modules/cms/js/profileService.js'

const toast = useToast()
const { getSecuritySettings, updateSecuritySettings } = useProfile()

// Состояние компонента
const loading = ref(true)
const saving = ref(false)
const settings = ref({
  // Настройки приватности
  profile_visibility: 'public'
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
      <h5 class="card-title mb-0 d-flex align-items-center">
        <Shield :size="20" class="me-2" />
        <span>Настройки безопасности и приватности</span>
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
        <!-- Настройки приватности -->
        <div class="mb-4">
          <h6 class="text-muted mb-3 d-flex align-items-center">
            <Eye :size="18" class="me-1" />
            <span>Приватность профиля</span>
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
                <li>Настройте приватность профиля в соответствии с вашими предпочтениями</li>
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