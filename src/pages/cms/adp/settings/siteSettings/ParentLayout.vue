<template>
  <div class="container-fluid px-3">
    <div class="row justify-content-center">
      <div class="col-12">
        <!-- Основные настройки -->
        <div class="card rounded-3 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex align-items-center">
              <Settings :size="24" class="text-primary me-2"/>
              <h3 class="mb-0 text-primary">Общие настройки</h3>
            </div>
          </div>
          
          <div class="card-body p-4">
            <form @submit.prevent="saveSite">
              <!-- Основная информация -->
              <div class="mb-4">
                <h5 class="text-danger mb-3 d-flex align-items-center">
                  <Globe :size="20" class="me-2"/>
                  Основная информация
                </h5>
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label d-flex align-items-center">
                      <Type :size="16" class="me-1"/>
                      Название сайта *
                    </label>
                    <input 
                      v-model="edit.site_name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Введите название сайта"
                      required
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label d-flex align-items-center">
                      <Link :size="16" class="me-1"/>
                      URL сайта *
                    </label>
                    <input 
                      v-model="edit.site_url" 
                      type="url" 
                      class="form-control" 
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label d-flex align-items-center">
                      <FileText :size="16" class="me-1"/>
                      Описание
                    </label>
                    <input 
                      v-model="edit.site_tagline" 
                      type="text" 
                      class="form-control" 
                      placeholder="Краткое описание сайта"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label d-flex align-items-center">
                      <Mail :size="16" class="me-1"/>
                      Email администратора *
                    </label>
                    <input 
                      v-model="edit.admin_email" 
                      type="email" 
                      class="form-control" 
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Настройки контента -->
              <div class="mb-4">
                <h5 class="text-danger mb-3 d-flex align-items-center">
                  <Layout :size="20" class="me-2"/>
                  Настройки контента
                </h5>
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label d-flex align-items-center">
                      <Home :size="16" class="me-1"/>
                      Тип домашней страницы
                    </label>
                    <select v-model="edit.homepage_type" class="form-select">
                      <option value="static">📄 Статическая страница</option>
                      <option value="latest">📰 Последние сообщения</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label d-flex align-items-center">
                      <Hash :size="16" class="me-1"/>
                      Постов на странице
                    </label>
                    <input
                      v-model.number="edit.posts_per_page"
                      type="number"
                      min="1"
                      max="100"
                      class="form-control"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <!-- Настройки безопасности -->
              <div class="mb-4">
                <h5 class="text-danger mb-3 d-flex align-items-center">
                  <Shield :size="20" class="me-2"/>
                  Настройки безопасности
                </h5>
                <div class="card bg-light border-0">
                  <div class="card-body">
                    <div class="form-check">
                      <input
                        v-model="edit.discourage_search_engines"
                        type="checkbox"
                        class="form-check-input"
                        id="discourage"
                      />
                      <label class="form-check-label d-flex align-items-center" for="discourage">
                        <Search :size="16" class="me-1"/>
                        Запретить индексацию сайта поисковыми системами
                      </label>
                      <div class="form-text">
                        Рекомендуется для сайтов в разработке или закрытых ресурсов
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Кнопки действий -->
              <div class="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <button type="submit" class="btn btn-primary btn-lg px-4" :disabled="saving">
                  <div v-if="saving" class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Сохранение...</span>
                  </div>
                  <Save v-else :size="20" class="me-2"/>
                  {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
                </button>
                <button type="button" class="btn btn-warning btn-lg px-4" @click="resetEdit">
                  <RotateCcw :size="20" class="me-2"/>
                  Сбросить
                </button>
              </div>

              <!-- Сообщения -->
              <div v-if="message" class="alert alert-success mt-4 d-flex align-items-center alert-animated">
                <CheckCircle :size="20" class="me-2"/>
                {{ message }}
              </div>
              <div v-if="error" class="alert alert-danger mt-4 d-flex align-items-center">
                <AlertCircle :size="20" class="me-2"/>
                {{ error }}
              </div>
            </form>
          </div>
        </div>

        <!-- Журнал изменений -->
        <div class="card rounded-3 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex align-items-center justify-content-between">
              <h4 class="mb-0 text-danger d-flex align-items-center">
                <History :size="20" class="me-2"/>
                Журнал изменений
              </h4>
              <span class="badge bg-light text-dark" v-if="logs.length">
                {{ logs.length }} записей
              </span>
            </div>
          </div>
          
          <div class="card-body p-0">
            <!-- Состояние загрузки -->
            <div v-if="loadingLogs" class="text-center py-5">
              <div class="spinner-border text-primary me-2" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              Загрузка журнала изменений...
            </div>
            
            <!-- Ошибка -->
            <div v-else-if="logsError" class="alert alert-danger m-3 d-flex align-items-center">
              <AlertTriangle :size="20" class="me-2"/>
              Ошибка загрузки: {{ logsError }}
            </div>
            
            <!-- Пустое состояние -->
            <div v-else-if="!logs.length" class="text-center py-5 text-muted">
              <FileX :size="48" class="mb-3"/>
              <h5 class="text-muted">Журнал пуст</h5>
              <p class="mb-0">Записи о изменениях появятся после первого сохранения</p>
            </div>
            
            <!-- Мобильная версия (карточки) -->
            <div v-else class="d-block d-xl-none">
              <div v-for="item in logs" :key="item.id" class="border-bottom p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-1">
                      <User :size="16" class="me-2 text-muted"/>
                      <strong>{{ item.user || 'Система' }}</strong>
                      <span class="badge bg-primary ms-2">#{{ item.id }}</span>
                    </div>
                    <div class="text-muted small mb-2">
                      <Calendar :size="14" class="me-1"/>
                      {{ new Date(item.timestamp).toLocaleString('ru-RU') }}
                    </div>
                    <div class="mb-2">
                      <span class="badge bg-light text-dark">{{ item.action }}</span>
                    </div>
                  </div>
                </div>
                
                <div v-if="item.changes && Object.keys(item.changes).length" class="mt-2">
                  <small class="text-muted">Изменения:</small>
                  <div class="mt-1">
                    <div v-for="(change, field) in item.changes" :key="field" class="small text-muted mb-1">
                      <span class="text-danger">{{ change[0] || 'пусто' }}</span>
                      <span class="mx-1">→</span>
                      <span class="text-success">{{ change[1] || 'пусто' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Десктопная версия (таблица) -->
            <div v-else class="table-responsive d-none d-xl-block">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width:60px" class="text-center">
                      <Hash :size="16"/>
                      ID
                    </th>
                    <th style="width:120px">
                      <User :size="16" class="me-1"/>
                      Пользователь
                    </th>
                    <th style="width:100px">
                      <Activity :size="16" class="me-1"/>
                      Действие
                    </th>
                    <th>
                      <Edit :size="16" class="me-1"/>
                      Изменения
                    </th>
                    <th style="width:160px">
                      <Clock :size="16" class="me-1"/>
                      Время
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in logs" :key="item.id">
                    <td class="text-center">
                      <span class="badge bg-primary">#{{ item.id }}</span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <User :size="16" class="me-2 text-muted"/>
                        <span class="text-truncate" style="max-width: 100px">{{ item.user || 'Система' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-light text-dark">{{ item.action }}</span>
                    </td>
                    <td>
                      <div v-if="item.changes && Object.keys(item.changes).length" class="small">
                        <div v-for="(change, field) in item.changes" :key="field" class="mb-1">
                          <span class="text-danger">{{ change[0] || 'пусто' }}</span>
                          <span class="mx-1">→</span>
                          <span class="text-success">{{ change[1] || 'пусто' }}</span>
                        </div>
                      </div>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td class="text-muted small">
                      <Clock :size="14" class="me-1"/>
                      <div>{{ new Date(item.timestamp).toLocaleDateString('ru-RU') }}</div>
                      <div>{{ new Date(item.timestamp).toLocaleTimeString('ru-RU') }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { 
  Settings, 
  Globe, 
  Type, 
  Link, 
  FileText, 
  Mail, 
  Layout, 
  Home, 
  Hash, 
  Shield, 
  Search, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  History, 
  AlertTriangle, 
  FileX, 
  User, 
  Calendar, 
  Activity, 
  Edit, 
  Clock
} from 'lucide-vue-next'

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
const saving = ref(false)

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
  
  saving.value = true
  error.value = ''
  
  try {
    const putUrl = `${endpoints.settings.generalSettings}${settingsId.value}/`
    const res = await apiClient.put(putUrl, { ...edit })
    if (res.success) {
      message.value = 'Изменения успешно сохранены и применены к сайту'
      error.value = ''
      original.value = { ...edit }
      
      await fetchLogs()
      
      setTimeout(() => {
        message.value = ''
      }, 3000)
    } else {
      error.value = res.message || 'Ошибка сохранения'
      message.value = ''
    }
  } catch (e) {
    error.value = e?.message || 'Ошибка соединения'
    message.value = ''
  } finally {
    saving.value = false
  }
}

function resetEdit() {
  // Очищаем сообщения
  error.value = ''
  message.value = ''
  
  // Восстанавливаем оригинальные значения
  if (original.value && Object.keys(original.value).length > 0) {
    Object.assign(edit, { ...original.value })
  } else {
    // Если оригинальных данных нет, устанавливаем значения по умолчанию
    Object.assign(edit, {
      site_name: '',
      site_tagline: '',
      site_url: '',
      admin_email: '',
      homepage_type: 'latest',
      posts_per_page: 10,
      discourage_search_engines: false,
      privacy_policy: '',
    })
  }
}
</script>

<style scoped>
.card {
  border: none;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.badge {
  font-size: 0.75rem;
}

/* Анимация для успешного сохранения */
.alert-animated {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Улучшенная адаптивность для таблицы */
.table-responsive {
  font-size: 0.875rem;
}

.table th {
  padding: 0.5rem 0.25rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.table td {
  padding: 0.5rem 0.25rem;
  word-break: break-word;
}

/* Адаптивные стили */
@media (max-width: 1199.98px) {
  .table th, .table td {
    padding: 0.25rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 991.98px) {
  .card-body {
    padding: 1.5rem !important;
  }
  
  .btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 575.98px) {
  .container-fluid {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .card-body {
    padding: 1rem !important;
  }
  
  .btn-lg {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  h3 {
    font-size: 1.25rem;
  }
  
  h4 {
    font-size: 1.1rem;
  }
  
  h5 {
    font-size: 1rem;
  }
}

.text-truncate-mobile {
  max-width: 200px;
}

@media (max-width: 576px) {
  .text-truncate-mobile {
    max-width: 150px;
  }
}
</style>
