<template>
  <div class="container d-flex justify-content-center align-items-center" style="min-height: 10vh">
    <div class="w-100" style="max-width: 700px">
      <div class="card shadow p-5">
        <h2 class="mb-4 text-center">Общие настройки</h2>
        <form @submit.prevent="saveSite">
          <div class="mb-4">
            <label class="form-label">Название сайта</label>
            <input v-model="edit.site_name" type="text" class="form-control form-control-lg" />
          </div>
          <div class="mb-4">
            <label class="form-label">Описание</label>
            <input v-model="edit.site_tagline" type="text" class="form-control" />
          </div>
          <div class="mb-4">
            <label class="form-label">URL сайта</label>
            <input v-model="edit.site_url" type="text" class="form-control" />
          </div>
          <div class="mb-4">
            <label class="form-label">Email администратора</label>
            <input v-model="edit.admin_email" type="email" class="form-control" />
          </div>
          <div class="mb-4">
            <label class="form-label">Тип домашней страницы</label>
            <select v-model="edit.homepage_type" class="form-select">
              <option value="static">Статическая страница</option>
              <option value="latest">Последние сообщения</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="form-label">Постов на странице</label>
            <input
              v-model.number="edit.posts_per_page"
              type="number"
              min="1"
              class="form-control"
            />
          </div>
          <div class="mb-4 form-check">
            <input
              v-model="edit.discourage_search_engines"
              type="checkbox"
              class="form-check-input"
              id="discourage"
            />
            <label class="form-check-label" for="discourage">
              Запретить индексацию сайта (Discourage Search Engines)
            </label>
          </div>
          <div class="mt-4 d-flex justify-content-center gap-3 flex-wrap">
            <button type="submit" class="btn btn-primary btn-lg px-4">Сохранить</button>
            <button type="button" class="btn btn-outline-secondary btn-lg px-4" @click="resetEdit">
              Сбросить
            </button>
          </div>
          <div v-if="message" class="alert alert-success mt-4 text-center fs-5">{{ message }}</div>
          <div v-if="error" class="alert alert-danger mt-4 text-center fs-5">{{ error }}</div>
        </form>
      </div>

      <div class="card shadow p-4 mt-4">
        <h4 class="mb-3">Журнал изменений</h4>

        <div v-if="loadingLogs" class="text-center py-3">
          Загрузка логов…
        </div>
        <div v-else-if="logsError" class="alert alert-danger">
          Ошибка: {{ logsError }}
        </div>
        <div v-else-if="!logs.length" class="text-muted">
          Нет записей в логе.
        </div>
        <table v-else class="table table-sm table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Изменения</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in logs" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.user || '—' }}</td>
              <td>{{ item.action }}</td>
              <td>
                <ul class="mb-0 ps-3">
                  <li v-for="(change, field) in item.changes || {}" :key="field">
                    <strong>{{ field }}:</strong> {{ change[0] }} → {{ change[1] }}
                  </li>
                </ul>
              </td>
              <td>{{ new Date(item.timestamp).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const edit = reactive({
  site_name: '',
  site_tagline: '',
  site_url: '',
  admin_email: '',
  homepage_type: '',
  posts_per_page: 1,
  discourage_search_engines: false,
  privacy_policy: '',
})

const message = ref('')
const error = ref('')
const original = ref({})
const settingsId = ref(null)

const logs = ref([])
const loadingLogs = ref(false)
const logsError = ref(null)

async function fetchLogs() {
  if (!settingsId.value) return
  loadingLogs.value = true
  logsError.value = null
  try {
    const res = await apiClient.get(endpoints.audit, {
      content_type__model: 'generalsettings',
      object_id: settingsId.value,
    })
    if (res.success) {
      logs.value = res.data
    } else {
      logsError.value = res.message || 'Не удалось получить логи'
    }
  } catch (e) {
    logsError.value = e.message || 'Ошибка сети'
  } finally {
    loadingLogs.value = false
  }
}

onMounted(async () => {
  try {
    const res = await apiClient.get(endpoints.settings.lastSettings)
    if (res.success && res.data) {
      Object.assign(edit, res.data)
      original.value = { ...res.data }
      settingsId.value = res.data.id
      await fetchLogs()
    } else {
      error.value = res.message || 'Не удалось получить настройки'
    }
  } catch (e) {
    error.value = e?.message || 'Ошибка загрузки настроек'
  }
})

watch(settingsId, (newId) => {
  if (newId) {
    fetchLogs()
  }
})

async function saveSite() {
  if (!edit.site_name.trim() || !edit.site_url.trim() || !edit.admin_email.trim()) {
    error.value = 'Название, URL и Email обязательны'
    return
  }
  if (!settingsId.value) {
    error.value = 'ID настроек не определён'
    return
  }
  try {
    const putUrl = `${endpoints.settings.generalSettings}${settingsId.value}/`
    const res = await apiClient.put(putUrl, { ...edit })
    if (res.success) {
      message.value = 'Изменения сохранены'
      error.value = ''
      original.value = { ...edit }
      await fetchLogs()
      setTimeout(() => {
        message.value = ''
      }, 2000)
    } else {
      error.value = res.message || 'Ошибка сохранения'
      message.value = ''
    }
  } catch (e) {
    error.value = e?.message || 'Ошибка соединения'
    message.value = ''
  }
}

function resetEdit() {
  Object.assign(edit, original.value)
  error.value = ''
  message.value = ''
}
</script>

<style scoped>
body {
  background: #f4f4f4;
}
.card {
  border-radius: 22px;
  border: none;
}
</style>
