<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authorization } from '@/modules/cms/adp/js/auth-index'
import { validateLoginForm } from '@/js/validation'

const router = useRouter()
const isLoading = ref(false)

const form = reactive({
  login: '',
  password: '',
  rememberUser: false,
})

const errors = reactive({
  login: null,
  password: null,
  general: null,
})



const validateForm = () => {
  const { loginError, passwordError } = validateLoginForm(
    form.login,
    form.password
  )

  errors.login = loginError
  errors.password = passwordError
  errors.general = null

  return !errors.login && !errors.password
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = null
  
  try {
    const authResult = await authorization(form.login, form.password)

    if (authResult.success === true) {
      router.push({ name: 'Account' })
    } else {
      // Обработка ошибок от сервера
      if (authResult.errors && typeof authResult.errors === 'object') {
        if (authResult.errors.message || authResult.errors.detail) {
          errors.general = authResult.errors.message || authResult.errors.detail
        } else if (authResult.errors.username) {
          errors.login = Array.isArray(authResult.errors.username) 
            ? authResult.errors.username[0] 
            : authResult.errors.username
        } else if (authResult.errors.password) {
          errors.password = Array.isArray(authResult.errors.password)
            ? authResult.errors.password[0]
            : authResult.errors.password
        } else {
          errors.general = 'Неверные учетные данные'
        }
      } else if (authResult.message) {
        errors.general = authResult.message
      } else {
        errors.general = 'Произошла ошибка при авторизации'
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    
    // Обработка сетевых ошибок и ошибок сервера
    if (error.response) {
      if (error.response.status === 400) {
        const errorData = error.response.data
        if (errorData && typeof errorData === 'string') {
          errors.general = errorData
        } else if (errorData && errorData.message) {
          errors.general = errorData.message
        } else if (errorData && errorData.detail) {
          errors.general = errorData.detail
        } else {
          errors.general = 'Неверные учетные данные'
        }
      } else if (error.response.status === 401) {
        errors.general = 'Неверные учетные данные'
      } else if (error.response.status >= 500) {
        errors.general = 'Ошибка сервера. Попробуйте позже'
      } else {
        errors.general = 'Ошибка подключения к серверу'
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
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-sm border-0" style="width: 500px">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <h2 class="fw-bold text-primary mb-2">Вход в систему</h2>
          <p class="text-muted">Введите ваши учетные данные</p>
        </div>

        <!-- Общая ошибка -->
        <div v-if="errors.general" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errors.general }}
        </div>

        <form @submit.prevent="submitForm" novalidate>
          <!-- Поле логина -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="text"
              id="login"
              class="form-control"
              :class="{ 'is-invalid': errors.login }"
              v-model="form.login"
              placeholder="Логин"
              :disabled="isLoading"
              autocomplete="username"
            />
            <label for="login">
              <i class="bi bi-person me-2"></i>Логин
            </label>
            <div v-if="errors.login" class="invalid-feedback">
              {{ errors.login }}
            </div>
          </div>

          <!-- Поле пароля -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="password"
              id="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              v-model="form.password"
              placeholder="Пароль"
              :disabled="isLoading"
              autocomplete="current-password"
            />
            <label for="password">
              <i class="bi bi-lock me-2"></i>Пароль
            </label>
            <div v-if="errors.password" class="invalid-feedback">
              {{ errors.password }}
            </div>
          </div>

          <!-- Дополнительные опции -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input
                type="checkbox"
                id="rememberUser"
                class="form-check-input"
                v-model="form.rememberUser"
                :disabled="isLoading"
              />
              <label class="form-check-label text-muted" for="rememberUser">
                Запомнить меня
              </label>
            </div>

            <RouterLink :to="{ name: 'ForgotPassword' }" class="text-decoration-none text-primary">
              Забыли пароль?
            </RouterLink>
          </div>

          <!-- Кнопка входа -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" :disabled="isLoading">
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-box-arrow-in-right me-2"></i>
            {{ isLoading ? 'Выполняется вход...' : 'Войти' }}
          </button>

          <!-- Ссылка на регистрацию -->
          <div class="text-center">
            <span class="text-muted">Нет аккаунта? </span>
            <RouterLink :to="{ name: 'Register' }" class="text-decoration-none text-primary fw-semibold">
              Зарегистрироваться
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

.password-toggle-btn {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  border: 2px solid #495057;
  background: #495057;
  border-radius: 8px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.password-toggle-btn:hover {
  background: #343a40;
  border-color: #343a40;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.password-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.password-toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background: #6c757d;
  border-color: #6c757d;
}

.password-toggle-btn i {
  font-size: 1.4rem;
  color: #ffffff !important;
  transition: all 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.password-toggle-btn:hover i {
  color: #ffffff !important;
  transform: scale(1.1);
}

.password-toggle-btn:disabled i {
  color: #ffffff !important;
  opacity: 0.7;
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