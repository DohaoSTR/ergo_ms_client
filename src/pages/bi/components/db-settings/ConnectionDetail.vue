<template>
  <h2 class="connection-title">Параметры подключения {{ connectionName || '...' }}</h2>
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
          <img src="@/assets/bi/ClickHouse_Logo.svg" alt="ClickHouse" class="logo" />
      </div>

      <form class="main-grid needs-validation" @submit.prevent="checkConnection" ref="form" novalidate>
          <div class="row_input row_input_full">
              <label for="host" class="form-label mb-1">Имя хоста</label>
              <div class="input-wrapper">
                  <input v-model="host" class="form-control form-control-sm" type="text" id="host" required
                      :disabled="loading" />
                  <div class="invalid-feedback">Укажите хост</div>
              </div>
          </div>

          <div class="row_input">
              <label for="port" class="form-label mb-1">Порт</label>
              <div class="input-wrapper">
                  <input v-model="port" class="form-control form-control-port" type="number" id="port" required
                      :disabled="loading" />
                  <div class="invalid-feedback">Укажите порт</div>
              </div>
          </div>

          <div class="row_input">
              <label for="username" class="form-label mb-1">Имя пользователя</label>
              <div class="input-wrapper">
                  <input v-model="username" class="form-control form-control-sm form-control-wide" type="text"
                      id="username" required :disabled="loading" />
                  <div class="invalid-feedback">Укажите имя пользователя</div>
              </div>
          </div>

          <div class="row_input">
              <label for="password" class="form-label mb-1">Пароль</label>
              <div class="input-wrapper">
                  <input v-model="password" class="form-control form-control-pass form-control-wide" type="password"
                      id="password" required :disabled="loading" />
                  <div class="invalid-feedback">Укажите пароль</div>
              </div>
          </div>

          <div class="row_btns">
              <button type="submit" class="btn btn-outline-secondary" :disabled="loading">Проверить подключение</button>
              <button type="button" class="btn btn-outline-success" :disabled="loading || !isChanged" @click="changeConnection">Сохранить изменения</button>
          </div>
      </form>
  </div>
  <ConnectionNameDialog v-model:visible="showDialog" :connectorType="'clickhouse'" :connectionConfig="{
      host: host,
      port: port,
      user: username,
      database: database
  }" @saved="onConnectionSaved" />
</template>

<script setup>
import { CircleCheck, OctagonAlert, ArrowLeft, Trash } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import ConnectionNameDialog from '@/pages/bi/components/ConnectionNameDialog.vue'
import { useRedirectIfFileConnection } from '@/pages/bi/components/js/useRedirectIfFileConnection'

useRedirectIfFileConnection()

const route = useRoute()
const router = useRouter()

const form = ref(null)

const connectionName = ref('')
const host = ref('')
const port = ref(8443)
const username = ref('')
const password = ref('')

const initialHost = ref('')
const initialPort = ref('')
const initialUsername = ref('')
const initialPassword = ref('')

const message = ref('')
const error = ref(false)
const isChecked = ref(false)
const loading = ref(false)
const database = ref('')

const showDialog = ref(false)

const isChanged = computed(() => {
  return host.value !== initialHost.value ||
         port.value !== initialPort.value ||
         username.value !== initialUsername.value ||
         password.value !== initialPassword.value
})

function goToNewConnection() {
  router.push('/bi/connections/new/')
}

async function fetchConnection() {
  loading.value = true
  try {
    const id = route.params.pk 
    const response = await apiClient.get(`${endpoints.bi.ConnectionsList}${id}/`)

    const data = response.data

    connectionName.value = data.name || '{Ошибка получения названия подключения}'

    host.value = data.config.host || ''
    port.value = data.config.port || ''
    username.value = data.config.user || ''
    database.value = data.config.database || ''
    password.value = data.config.password || ''

    initialHost.value = host.value
    initialPort.value = port.value
    initialUsername.value = username.value
    initialPassword.value = password.value

  } catch (err) {
    console.error('Ошибка загрузки подключения:', err)
    message.value = 'Не удалось загрузить подключение'
    error.value = true
    isChecked.value = true
  } finally {
    loading.value = false
  }
}

async function changeConnection() {
  if (!isChanged.value) {
    return
  }

  loading.value = true

  message.value = ''

  const result = await checkConnection()

  if (!result) {
    showAutoDismissMessage('Ошибка подключения к ClickHouse', true)
    loading.value = false
    return
  }

  try {
    const id = route.params.pk
    const payload = {
      config: {
        host: host.value,
        port: port.value,
        user: username.value,
        password: password.value,
      }
    }

    await apiClient.patch(`${endpoints.bi.ConnectionsList}${id}/`, payload)

    showAutoDismissMessage('Изменения успешно сохранены', false)

    initialHost.value = host.value
    initialPort.value = port.value
    initialUsername.value = username.value
    initialPassword.value = password.value

  } catch (err) {
    console.error('Ошибка при сохранении:', err)
    showAutoDismissMessage('Не удалось сохранить изменения', true)
  } finally {
    loading.value = false
  }
}

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
      type: 'clickhouse',
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value,
    })

    const data = response.data || {}

    formEl.classList.add('was-validated')

    if (data.success === true) {
      message.value = data.message || 'Соединение успешно'
      error.value = false
    } else {
      message.value = translateErrorMessage(data.message || 'Ошибка соединения')
      error.value = true
    }

  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Неизвестная ошибка'
    message.value = translateErrorMessage(errorMsg)
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
      return 'Подключение отклонено. Убедитесь, что сервер работает и принимает подключения на указанный порт.'
  }

  if (text.includes('authentication failed') || text.includes('access denied')) {
      return 'Ошибка авторизации. Проверьте имя пользователя и пароль.'
  }

  if (text.includes('database') && text.includes('does not exist')) {
      return 'Указанная база данных не найдена.'
  }

  return raw
}

function onConnectionSaved(data) {
  message.value = `Подключение "${data.name}" успешно сохранено`
  error.value = false
  isChecked.value = true

  setTimeout(() => {
    router.push({ name: 'connection-detail', params: { pk: data.id } })
  }, 3000)
}

function showAutoDismissMessage(msg, isError = false) {
  message.value = msg
  error.value = isError
  isChecked.value = true

  setTimeout(() => {
      message.value = ''
      isChecked.value = false
      error.value = false
  }, 3000)
}

onMounted(fetchConnection)
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

.btn{
  display: flex;
  gap: 0.35rem;
}
</style>
