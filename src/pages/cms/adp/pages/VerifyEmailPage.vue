<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { verifyConfirmationCode, sendConfirmationCode } from '@/js/api/services/auth-index'
import { validateFieldValue } from '@/js/validation'

const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const isResending = ref(false)
const isSuccess = ref(false)

const form = reactive({
  email: '',
  code: '',
})

const errors = reactive({
  code: null,
  general: null,
})

onMounted(() => {
  if (route.query.email) {
    form.email = route.query.email
  }
})

const validateForm = () => {
  errors.code = validateFieldValue(form.code, 'Код подтверждения')
  errors.general = null
  return !errors.code
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = null
  
  try {
    const result = await verifyConfirmationCode(form.email, form.code)

    if (result.success) {
      isSuccess.value = true
      setTimeout(() => {
        router.push({ name: 'Login' })
      }, 2000)
    } else {
      if (result.errors && result.errors.code) {
        errors.code = Array.isArray(result.errors.code) 
          ? result.errors.code[0] 
          : result.errors.code
      } else if (result.message) {
        errors.general = result.message
      } else {
        errors.general = 'Неверный код подтверждения'
      }
    }
  } catch (error) {
    console.error('Verify email error:', error)
    
    if (error.response) {
      if (error.response.status === 400) {
        const errorData = error.response.data
        if (errorData && errorData.code) {
          errors.code = Array.isArray(errorData.code) 
            ? errorData.code[0] 
            : errorData.code
        } else {
          errors.general = 'Неверный код подтверждения'
        }
      } else if (error.response.status >= 500) {
        errors.general = 'Ошибка сервера. Попробуйте позже'
      } else {
        errors.general = 'Ошибка подтверждения'
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

const resendCode = async () => {
  if (!form.email) {
    errors.general = 'Email не указан'
    return
  }

  isResending.value = true
  errors.general = null
  
  try {
    const result = await sendConfirmationCode(form.email)

    if (result.success) {
      errors.general = null
      // Показываем уведомление об успешной отправке
      setTimeout(() => {
        errors.general = null
      }, 5000)
    } else {
      errors.general = 'Не удалось отправить код повторно'
    }
  } catch (error) {
    console.error('Resend code error:', error)
    errors.general = 'Ошибка отправки кода'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-sm border-0" style="width: 500px">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <div class="mb-3">
            <i :class="isSuccess ? 'bi bi-check-circle-fill text-success' : 'bi bi-envelope-check text-primary'" 
               style="font-size: 3rem;"></i>
          </div>
          <h2 class="fw-bold text-primary mb-2">
            {{ isSuccess ? 'Email подтвержден!' : 'Подтверждение email' }}
          </h2>
          <p class="text-muted">
            {{ isSuccess 
              ? 'Ваш email успешно подтвержден. Перенаправляем на страницу входа...' 
              : `Введите код подтверждения, отправленный на ${form.email}` 
            }}
          </p>
        </div>

        <div v-if="isSuccess" class="text-center">
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            Регистрация завершена успешно!
          </div>
          
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <p class="text-muted mt-2">Перенаправление...</p>
        </div>

        <form v-else @submit.prevent="submitForm" novalidate>
          <!-- Общая ошибка -->
          <div v-if="errors.general" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ errors.general }}
          </div>

          <!-- Email (только для отображения) -->
          <div class="form-floating mb-3">
            <input
              type="email"
              id="email"
              class="form-control"
              v-model="form.email"
              placeholder="email@example.com"
              readonly
            />
            <label for="email">
              <i class="bi bi-envelope me-2"></i>Email
            </label>
          </div>

          <!-- Поле кода -->
          <div class="form-floating mb-4" v-auto-animate>
            <input
              type="text"
              id="code"
              class="form-control text-center"
              :class="{ 'is-invalid': errors.code }"
              v-model="form.code"
              placeholder="123456"
              :disabled="isLoading"
              maxlength="6"
              style="letter-spacing: 0.5rem; font-size: 1.2rem;"
            />
            <label for="code">
              <i class="bi bi-shield-check me-2"></i>Код подтверждения
            </label>
            <div v-if="errors.code" class="invalid-feedback">
              {{ errors.code }}
            </div>
          </div>

          <!-- Кнопка подтверждения -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" :disabled="isLoading">
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-check-circle me-2"></i>
            {{ isLoading ? 'Проверка кода...' : 'Подтвердить email' }}
          </button>

          <!-- Повторная отправка кода -->
          <div class="text-center mb-3">
            <button 
              type="button" 
              class="btn btn-link text-decoration-none p-0" 
              @click="resendCode"
              :disabled="isResending"
            >
              <span
                v-if="isResending"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isResending ? 'Отправка...' : 'Отправить код повторно' }}
            </button>
          </div>

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