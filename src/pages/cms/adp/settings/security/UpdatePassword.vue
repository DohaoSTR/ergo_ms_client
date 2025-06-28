<script setup>
import { computed, ref } from 'vue'
import { Eye, EyeOff, Shield, CheckCircle } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useProfile } from '@/js/api/services/profileService.js'

const toast = useToast()
const { changePassword } = useProfile()

// Состояния видимости для полей пароля
const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// Поля формы и ошибки
const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Состояние загрузки
const isLoading = ref(false)

// Переключение видимости пароля
const togglePasswordVisibility = (type) => {
  switch (type) {
    case 'currentPassword':
      isCurrentPasswordVisible.value = !isCurrentPasswordVisible.value
      break
    case 'newPassword':
      isNewPasswordVisible.value = !isNewPasswordVisible.value
      break
    case 'confirmPassword':
      isConfirmPasswordVisible.value = !isConfirmPasswordVisible.value
      break
  }
}

// Тип ввода для полей
const currentPasswordFieldType = computed(() =>
  isCurrentPasswordVisible.value ? 'text' : 'password',
)
const newPasswordFieldType = computed(() => (isNewPasswordVisible.value ? 'text' : 'password'))
const confirmPasswordFieldType = computed(() =>
  isConfirmPasswordVisible.value ? 'text' : 'password',
)

// Иконки для кнопок
const currentPasswordIcon = computed(() => (isCurrentPasswordVisible.value ? Eye : EyeOff))
const newPasswordIcon = computed(() => (isNewPasswordVisible.value ? Eye : EyeOff))
const confirmPasswordIcon = computed(() => (isConfirmPasswordVisible.value ? Eye : EyeOff))

// Проверка силы пароля
const passwordStrength = computed(() => {
  const password = form.value.newPassword
  if (!password) return { score: 0, label: '', color: '' }
  
  let score = 0
  
  // Длина
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Символы
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  
  const strengthMap = {
    0: { label: '', color: '' },
    1: { label: 'Очень слабый', color: 'danger' },
    2: { label: 'Слабый', color: 'warning' },
    3: { label: 'Слабый', color: 'warning' },
    4: { label: 'Средний', color: 'info' },
    5: { label: 'Сильный', color: 'success' },
    6: { label: 'Очень сильный', color: 'success' }
  }
  
  return { score, ...strengthMap[score] }
})

// Проверка пароля
const validateForm = () => {
  let isValid = true
  cleanErrors()

  if (!form.value.currentPassword) {
    errors.value.currentPassword = 'Введите текущий пароль'
    isValid = false
  }

  if (form.value.newPassword.length < 8) {
    errors.value.newPassword = 'Пароль должен содержать минимум 8 символов'
    isValid = false
  } else if (!/[a-z]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Пароль должен содержать хотя бы одну букву в нижнем регистре'
    isValid = false
  } else if (!/[0-9]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Пароль должен содержать хотя бы одну цифру'
    isValid = false
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }

  return isValid
}

// Сброс ошибок
const cleanErrors = () => {
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

// Очистка формы
const resetForm = () => {
  form.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  cleanErrors()
}

// Обработка формы
const submitForm = async (event) => {
  event.preventDefault()
  
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  cleanErrors()

  try {
    await changePassword({
      current_password: form.value.currentPassword,
      new_password: form.value.newPassword,
      confirm_password: form.value.confirmPassword,
    })

      // Очищаем форму после успешной смены пароля
    resetForm()
    toast.success('Пароль успешно изменён')

  } catch (error) {
    console.error('Ошибка смены пароля:', error)
    
    // Обработка ошибок валидации от сервера
    if (error.response?.data) {
      const serverErrors = error.response.data
      
      // Мапинг ошибок с сервера на локальные поля
      if (serverErrors.current_password) {
        errors.value.currentPassword = Array.isArray(serverErrors.current_password) 
          ? serverErrors.current_password[0] 
          : serverErrors.current_password
      }
      
      if (serverErrors.new_password) {
        errors.value.newPassword = Array.isArray(serverErrors.new_password) 
          ? serverErrors.new_password[0] 
          : serverErrors.new_password
      }
      
      if (serverErrors.confirm_password) {
        errors.value.confirmPassword = Array.isArray(serverErrors.confirm_password) 
          ? serverErrors.confirm_password[0] 
          : serverErrors.confirm_password
      }
      
      // Общие ошибки
      if (serverErrors.non_field_errors) {
        const generalError = Array.isArray(serverErrors.non_field_errors) 
          ? serverErrors.non_field_errors[0] 
          : serverErrors.non_field_errors
        
        toast.error(generalError)
      }
    } else {
      toast.error('Ошибка при смене пароля')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <Shield :size="20" class="me-2" />
        Изменить пароль
      </h5>
    </div>
    
    <div class="card-body">
    <form @submit="submitForm">
      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label" for="currentPassword">Текущий пароль</label>
          <div class="input-group" v-auto-animate>
            <input
              class="form-control"
              :class="{ 'is-invalid': errors.currentPassword }"
              :type="currentPasswordFieldType"
              id="currentPassword"
              placeholder="············"
              v-model="form.currentPassword"
              :disabled="isLoading"
                autocomplete="current-password"
            />
              <button
                type="button"
              @click="togglePasswordVisibility('currentPassword')"
                class="btn btn-outline-secondary"
                :disabled="isLoading"
            >
                <component :is="currentPasswordIcon" :size="18" />
              </button>
            <div v-if="errors.currentPassword" class="invalid-feedback">
              {{ errors.currentPassword }}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label" for="newPassword">Новый пароль</label>
          <div class="input-group" v-auto-animate>
            <input
              class="form-control"
              :class="{ 'is-invalid': errors.newPassword }"
              :type="newPasswordFieldType"
              id="newPassword"
              placeholder="············"
              v-model="form.newPassword"
              :disabled="isLoading"
                autocomplete="new-password"
            />
              <button
                type="button"
              @click="togglePasswordVisibility('newPassword')"
                class="btn btn-outline-secondary"
                :disabled="isLoading"
            >
                <component :is="newPasswordIcon" :size="18" />
              </button>
              <div v-if="errors.newPassword" class="invalid-feedback">{{ errors.newPassword }}</div>
            </div>
            
            <!-- Индикатор силы пароля -->
            <div v-if="form.newPassword && passwordStrength.score > 0" class="mt-2">
              <div class="d-flex align-items-center justify-content-between">
                <small class="text-muted">Сила пароля:</small>
                <span :class="`text-${passwordStrength.color}`" class="small fw-semibold">
                  {{ passwordStrength.label }}
            </span>
              </div>
              <div class="progress mt-1" style="height: 4px;">
                <div 
                  class="progress-bar"
                  :class="`bg-${passwordStrength.color}`"
                  :style="{ width: `${(passwordStrength.score / 6) * 100}%` }"
                ></div>
              </div>
          </div>
        </div>

        <div class="mb-3 col-md-6">
          <label class="form-label" for="confirmPassword">Подтвердите новый пароль</label>
          <div class="input-group" v-auto-animate>
            <input
              class="form-control"
              :class="{ 'is-invalid': errors.confirmPassword }"
              :type="confirmPasswordFieldType"
              id="confirmPassword"
              placeholder="············"
              v-model="form.confirmPassword"
              :disabled="isLoading"
                autocomplete="new-password"
            />
              <button
                type="button"
              @click="togglePasswordVisibility('confirmPassword')"
                class="btn btn-outline-secondary"
                :disabled="isLoading"
            >
                <component :is="confirmPasswordIcon" :size="18" />
              </button>
            <div v-if="errors.confirmPassword" class="invalid-feedback">
              {{ errors.confirmPassword }}
            </div>
            </div>
            
            <!-- Индикатор совпадения паролей -->
            <div v-if="form.confirmPassword && form.newPassword && form.confirmPassword === form.newPassword" class="mt-2">
              <small class="text-success">
                <CheckCircle :size="14" class="me-1" />
                Пароли совпадают
              </small>
          </div>
        </div>
      </div>

        <div class="alert alert-info">
          <h6 class="alert-heading mb-2">
            <Shield :size="18" class="me-1" />
            Требования к паролю:
          </h6>
          <ul class="mb-0 small">
            <li class="mb-1">Минимум 8 символов — чем больше, тем лучше</li>
            <li class="mb-1">Хотя бы один символ нижнего регистра</li>
            <li class="mb-1">Хотя бы одна цифра</li>
            <li>Рекомендуется использовать заглавные буквы и специальные символы</li>
        </ul>
      </div>

        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isLoading ? 'Сохранение...' : 'Сохранить пароль' }}
        </button>
          <button type="button" class="btn btn-outline-secondary" @click="resetForm" :disabled="isLoading">
            Очистить
        </button>
      </div>
    </form>
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

.input-group .btn {
  border-color: #ced4da;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
}

.progress {
  border-radius: 2px;
}

.alert {
  border-left: 4px solid #0dcaf0;
  background-color: rgba(13, 202, 240, 0.1);
}
</style>
