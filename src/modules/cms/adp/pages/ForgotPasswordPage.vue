<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendConfirmationCode } from '@/modules/cms/adp/js/auth-index'
import { validateFieldValue, validateFieldWithRegex, emailRegex } from '@/js/validation'

const router = useRouter()
const isLoading = ref(false)
const isSuccess = ref(false)

const form = reactive({
  email: '',
})

const errors = reactive({
  email: null,
  general: null,
})

const validateForm = () => {
  errors.email = validateFieldValue(form.email, 'Email')
  
  if (!errors.email) {
    errors.email = validateFieldWithRegex(form.email, emailRegex, 'Введите корректный email')
  }
  
  errors.general = null
  return !errors.email
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = null
  
  try {
    const result = await sendConfirmationCode(form.email)

    if (result.success) {
      isSuccess.value = true
    } else {
      if (result.errors && result.errors.email) {
        errors.email = Array.isArray(result.errors.email) 
          ? result.errors.email[0] 
          : result.errors.email
      } else if (result.message) {
        errors.general = result.message
      } else {
        errors.general = 'Не удалось отправить код восстановления'
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error.response) {
      if (error.response.status === 404) {
        errors.email = 'Пользователь с таким email не найден'
      } else if (error.response.status === 400) {
        const errorData = error.response.data
        if (errorData && errorData.email) {
          errors.email = Array.isArray(errorData.email) 
            ? errorData.email[0] 
            : errorData.email
        } else {
          errors.general = 'Проверьте правильность введенного email'
        }
      } else if (error.response.status >= 500) {
        errors.general = 'Ошибка сервера. Попробуйте позже'
      } else {
        errors.general = 'Ошибка отправки кода восстановления'
      }
    } else if (error.request) {
      errors.general = 'Нет соединения с сервером'
    } else {
      errors.general = 'Произошла неизвестная ошибка'
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-sm border-0" style="width: 500px">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <div class="mb-3">
            <i class="bi bi-key-fill text-primary" style="font-size: 3rem;"></i>
          </div>
          <h2 class="fw-bold text-primary mb-2">Восстановление пароля</h2>
          <p class="text-muted">
            {{ isSuccess 
              ? 'Код восстановления отправлен на ваш email' 
              : 'Введите email для получения кода восстановления' 
            }}
          </p>
        </div>

        <div v-if="isSuccess" class="text-center">
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            Код восстановления отправлен на <strong>{{ form.email }}</strong>
          </div>
          
          <p class="text-muted mb-4">
            Проверьте свою почту и следуйте инструкциям для восстановления пароля.
            Если письмо не пришло, проверьте папку "Спам".
          </p>

          <button @click="goToLogin" class="btn btn-outline-primary">
            <i class="bi bi-arrow-left me-2"></i>
            Вернуться к входу
          </button>
        </div>

        <form v-else @submit.prevent="submitForm" novalidate>
          <!-- Общая ошибка -->
          <div v-if="errors.general" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ errors.general }}
          </div>

          <!-- Поле email -->
          <div class="form-floating mb-4" v-auto-animate>
            <input
              type="email"
              id="email"
              class="form-control"
              :class="{ 'is-invalid': errors.email }"
              v-model="form.email"
              placeholder="email@example.com"
              :disabled="isLoading"
              autocomplete="email"
            />
            <label for="email">
              <i class="bi bi-envelope me-2"></i>Email
            </label>
            <div v-if="errors.email" class="invalid-feedback">
              {{ errors.email }}
            </div>
          </div>

          <!-- Кнопка отправки -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" :disabled="isLoading">
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-envelope-arrow-up me-2"></i>
            {{ isLoading ? 'Отправка...' : 'Отправить код восстановления' }}
          </button>

          <!-- Ссылка на вход -->
          <div class="text-center">
            <RouterLink :to="{ name: 'Login' }" class="text-decoration-none text-primary">
              <i class="bi bi-arrow-left me-2"></i>
              Вернуться к входу
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  border-radius: 1rem;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  border-radius: 0.5rem;
  font-weight: 600;
}

.alert {
  border-radius: 0.5rem;
  border: none;
}

.min-vh-100 {
  min-height: 100vh;
}

@media (max-width: 576px) {
  .card {
    width: 95% !important;
    margin: 1rem;
  }
  
  .card-body {
    padding: 2rem 1.5rem !important;
  }
}
</style> 