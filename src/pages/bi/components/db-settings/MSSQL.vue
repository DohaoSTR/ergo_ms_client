<template>
  <div class="main">
    <transition name="shake">
      <div v-if="isChecked && error && message" class="alert alert-danger" role="alert">
        <OctagonAlert :size="20" class="me-1" /> {{ message }}
      </div>
    </transition>
    <transition name="fade-slide">
      <div v-if="isChecked && !error && message" class="alert alert-success d-flex align-items-center mt-4"
        role="alert">
        <CircleCheck :size="20" class="me-2" /> {{ message }}
      </div>
    </transition>
    <div class="row-button-logo">
      <button @click="goToNewConnection" class="icon-button" title="Новое подключение">
        <ArrowLeft class="icon" />
      </button>
      <img src="@/assets/bi/MSSQL_Logo.svg" alt="MSSQL" class="logo" />
    </div>

    <form class="main-grid needs-validation" @submit.prevent="checkConnection" ref="form" novalidate>
      <div class="row_input row_input_full">
        <label for="host" class="form-label mb-1">Имя хоста</label>
        <div class="input-wrapper">
          <input v-model="host" class="form-control form-control-sm" type="text" id="host" required :disabled="loading" />
          <div class="invalid-feedback">Укажите хост</div>
        </div>
      </div>

      <div class="row_input">
        <label for="port" class="form-label mb-1">Порт</label>
        <div class="input-wrapper">
          <input v-model="port" class="form-control form-control-port" type="number" id="port" required :disabled="loading" />
          <div class="invalid-feedback">Укажите порт</div>
        </div>
      </div>

      <div class="row_input row_input_full">
        <label for="database" class="form-label mb-1">Путь к базе данных</label>
        <div class="input-wrapper">
          <input v-model="database" class="form-control form-control-sm" type="text" id="database" required :disabled="loading" />
          <div class="invalid-feedback">Укажите путь</div>
        </div>
      </div>

      <div class="row_input">
        <label for="username" class="form-label mb-1">Имя пользователя</label>
        <div class="input-wrapper">
          <input v-model="username" class="form-control form-control-sm form-control-wide" type="text" id="username" required :disabled="loading" />
          <div class="invalid-feedback">Укажите имя пользователя</div>
        </div>
      </div>

      <div class="row_input">
        <label for="password" class="form-label mb-1">Пароль</label>
        <div class="input-wrapper">
          <input v-model="password" class="form-control form-control-pass form-control-wide" type="password" id="password" required :disabled="loading"/>
          <div class="invalid-feedback">Укажите пароль</div>
        </div>
      </div>

      <div class="row_btns">
        <button type="submit" class="btn btn-outline-secondary" :disabled="loading">Проверить подключение</button>
        <button type="button" class="btn btn-danger" :disabled="loading">Создать подключение</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { CircleCheck, OctagonAlert, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const router = useRouter()
function goToNewConnection() {
  router.push('/bi/connections/new/')
}

const form = ref(null)

const host = ref('')
const port = ref(1433)
const database = ref('')
const username = ref('')
const password = ref('')

const message = ref('')
const error = ref(false)
const isChecked = ref(false)
const loading = ref(false)

async function checkConnection() {
  message.value = ''
  error.value = false
  isChecked.value = false
  loading.value = true

  const formEl = form.value
  if (!formEl.checkValidity()) {
    formEl.classList.add('was-validated')
    loading.value = false
    return
  }

  try {
    const response = await apiClient.post(endpoints.bi.CheckConnection, {
      type: 'mssql',
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value,
      database: database.value,
    })

    const data = response.data || {}

    formEl.classList.add('was-validated')

    if (data.success === true) {
      message.value = data.message || 'Соединение успешно'
      error.value = false
    } else {
      const raw = data.message || 'Ошибка соединения'
      message.value = translateErrorMessage(String(raw).trim())
      error.value = true
    }
  } catch (err) {
    message.value = 'Не удалось выполнить запрос: ' + (err.message || 'Неизвестная ошибка')
    error.value = true
  }

  isChecked.value = true
  loading.value = false
}

function translateErrorMessage(raw) {
  const text = raw.toLowerCase()

  if (text.includes('getaddrinfo failed') || text.includes('name resolution')) {
    return 'Не удалось распознать имя хоста. Проверьте правильность адреса.'
  }

  if (text.includes('timed out')) {
    return 'Превышено время ожидания подключения. Сервер недоступен или указан неправильный порт.'
  }

  if (text.includes('connection refused')) {
    return 'Подключение отклонено. Убедитесь, что сервер работает и принимает подключения.'
  }

  if (text.includes('authentication failed') || text.includes('access denied')) {
    return 'Ошибка авторизации. Проверьте имя пользователя и пароль.'
  }

  if (text.includes('database') && text.includes('does not exist')) {
    return 'Указанная база данных не найдена.'
  }

  if (text.includes('adaptive server is unavailable')) {
    return 'Сервер MSSQL недоступен или указан неверный хост.'
  }

  if (text.includes('db-lib error message')) {
    return 'Не удалось подключиться: проверьте адрес сервера, порт и параметры авторизации.'
  }

  return 'Ошибка соединения'
}
</script>

<style scoped lang="scss">
.main {
  margin-left: 20rem;
  margin-right: 20rem;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeSlideIn 0.4s ease-out forwards;
}

@keyframes fadeSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
}

.row_input {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: start;
  gap: 1rem;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

input.form-control {
  height: 32px;
  width: 100%;
}

.row_input_full input {
  max-width: 100%;
}

.form-control-port {
  max-width: 7.5rem;
}

.form-control-wide {
  max-width: 15rem;
}

.logo {
  max-height: 150px;
  width: auto;
  filter: invert(7%) sepia(69%) saturate(4321%) hue-rotate(347deg) brightness(119%) contrast(91%);
}

.form-label {
  text-align: left;
  font-weight: 500;
}

.row_btns {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
}

.icon {
  width: 25px;
  height: 25px;
  color: var(--color-primary-text);
}

.icon-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
  border-radius: 6px;
  margin-right: 10px;
}

.icon-button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.row-button-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.shake-enter-active {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-5px);
  }

  40% {
    transform: translateX(5px);
  }

  60% {
    transform: translateX(-5px);
  }

  80% {
    transform: translateX(5px);
  }

  100% {
    transform: translateX(0);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
