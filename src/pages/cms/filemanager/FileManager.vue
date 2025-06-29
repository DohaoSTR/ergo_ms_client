<template>
  <div class="card rounded-3 p-4 shadow-sm">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
      <h3 class="mb-0 text-primary">
        <Folder :size="24" class="me-2"/>Управление файлами
      </h3>
      <div class="badge bg-light text-dark">
        Всего файлов: {{ files.length }}
      </div>
    </div>

    <!-- Область загрузки файлов -->
    <div class="card mb-4 border-2 border-dashed" style="border-color: #dee2e6;">
      <div
        class="card-body text-center bg-light"
        @drop.prevent="upload"
        @dragover.prevent
        @dragenter.prevent="highlightDropArea"
        @dragleave.prevent="unhighlightDropArea"
        :class="{ 'bg-primary-subtle border-primary': isDragOver }"
      >
        <div class="mb-3">
          <Upload :size="48" class="text-primary"/>
        </div>
        <h5 class="text-primary mb-2">Загрузка файлов</h5>
        <p class="text-muted mb-3">Перетащите файл сюда или воспользуйтесь кнопкой выбора</p>

        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-8">
            <label for="altName" class="form-label small text-muted">Альтернативное название (необязательно)</label>
            <input
              id="altName"
              v-model="altName"
              class="form-control"
              placeholder="Введите альтернативное название файла"
              maxlength="255"
            />
          </div>
          <div class="col-12 col-md-4">
            <button
              class="btn btn-primary w-100"
              @click="fileInput.click()"
              :disabled="uploading"
            >
              <Plus :size="16" class="me-2"/>
              {{ uploading ? 'Загрузка...' : 'Выбрать файл' }}
            </button>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          class="d-none"
          @change="upload"
        />
      </div>
    </div>

    <!-- Статус загрузки -->
    <div v-if="uploading" class="alert alert-info d-flex align-items-center mb-4">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      Загрузка файла...
    </div>
    
    <div v-if="uploadError" class="alert alert-danger d-flex align-items-center mb-4">
      <AlertTriangle :size="16" class="me-2"/>
      {{ uploadError }}
      <button type="button" class="btn-close ms-auto" @click="uploadError = null"></button>
    </div>

    <!-- Таблица файлов -->
    <div class="card">
      <div class="card-header bg-white border-bottom">
        <h5 class="mb-0 text-danger d-flex align-items-center">
          <List :size="20" class="me-2"/>Список файлов
        </h5>
      </div>
      
      <!-- Мобильная версия (карточки) -->
      <div class="d-block d-lg-none">
        <div v-for="f in files" :key="f.id" class="border-bottom p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="flex-grow-1 me-3">
              <div class="d-flex align-items-center mb-1">
                <FileText :size="16" class="me-2 text-muted"/>
                <strong class="text-truncate">{{ f.name }}</strong>
              </div>
              <div class="text-muted small mb-2">
                {{ f.alt_name || 'Без альтернативного названия' }}
              </div>
              <div class="d-flex gap-3 text-muted small">
                <span class="d-flex align-items-center">
                  <HardDrive :size="14" class="me-1"/>
                  {{ formatSize(f.size) }}
                </span>
                <span class="d-flex align-items-center">
                  <Calendar :size="14" class="me-1"/>
                  {{ new Date(f.uploaded_at).toLocaleDateString('ru-RU') }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Кнопки действий для мобильной версии -->
          <div class="d-flex flex-wrap gap-2">
            <template v-if="editingId === f.id">
              <div class="w-100 mb-2">
                <input
                  v-model="editingAltName"
                  class="form-control form-control-sm"
                  @keyup.enter="saveEdit(f)"
                  @keyup.esc="cancelEdit"
                  placeholder="Введите название"
                />
              </div>
              <button
                class="btn btn-success btn-sm"
                @click="saveEdit(f)"
              >
                <Check :size="16" class="me-1"/>
                Сохранить
              </button>
              <button 
                class="btn btn-secondary btn-sm" 
                @click="cancelEdit"
              >
                <X :size="16" class="me-1"/>
                Отмена
              </button>
            </template>
            <template v-else>
              <a
                :href="link(f)"
                class="btn btn-primary btn-sm"
                target="_blank"
              >
                <ExternalLink :size="16" class="me-1"/>
                Открыть
              </a>
              <button
                class="btn btn-outline-primary btn-sm"
                @click="startEdit(f)"
              >
                <Edit :size="16" class="me-1"/>
                Изменить
              </button>
              <button 
                class="btn btn-outline-danger btn-sm" 
                @click="confirmDelete(f)"
              >
                <Trash :size="16" class="me-1"/>
                Удалить
              </button>
            </template>
          </div>
        </div>
        
        <div v-if="!files.length" class="text-center text-muted py-5">
          <Inbox :size="48" class="text-muted mb-3"/>
          <h5 class="text-muted">Нет загруженных файлов</h5>
          <p class="text-muted mb-0">Загрузите первый файл, используя область выше</p>
        </div>
      </div>

      <!-- Десктопная версия (таблица) -->
      <div class="table-responsive d-none d-lg-block">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:280px">
                <div class="d-flex align-items-center">
                  <Tag :size="16" class="me-1"/>Альт-название
                </div>
              </th>
              <th>
                <div class="d-flex align-items-center">
                  <FileText :size="16" class="me-1"/>Имя файла
                </div>
              </th>
              <th style="width:110px">
                <div class="d-flex align-items-center">
                  <HardDrive :size="16" class="me-1"/>Размер
                </div>
              </th>
              <th style="width:170px">
                <div class="d-flex align-items-center">
                  <Calendar :size="16" class="me-1"/>Дата
                </div>
              </th>
              <th style="width:280px">
                <div class="d-flex align-items-center">
                  <Settings :size="16" class="me-1"/>Действия
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in files" :key="f.id" class="align-middle">
              <td>
                <template v-if="editingId === f.id">
                  <div class="d-flex gap-2">
                    <input
                      v-model="editingAltName"
                      class="form-control form-control-sm"
                      @keyup.enter="saveEdit(f)"
                      @keyup.esc="cancelEdit"
                      placeholder="Введите название"
                    />
                    <button
                      class="btn btn-success btn-sm"
                      @click="saveEdit(f)"
                      title="Сохранить"
                    >
                      <Check :size="16"/>
                    </button>
                    <button 
                      class="btn btn-secondary btn-sm" 
                      @click="cancelEdit"
                      title="Отмена"
                    >
                      <X :size="16"/>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="text-truncate me-2">{{ f.alt_name || '—' }}</span>
                    <button
                      class="btn btn-outline-primary btn-sm"
                      @click="startEdit(f)"
                      title="Редактировать название"
                    >
                      <Edit :size="16" class="me-1"/>
                      Изменить
                    </button>
                  </div>
                </template>
              </td>

              <td>
                <div class="d-flex align-items-center">
                  <FileText :size="16" class="me-2 text-muted"/>
                  <span class="text-truncate">{{ f.name }}</span>
                </div>
              </td>
              
              <td>
                <span class="badge bg-light text-dark">{{ formatSize(f.size) }}</span>
              </td>
              
              <td class="text-muted small">
                {{ new Date(f.uploaded_at).toLocaleString('ru-RU') }}
              </td>

              <td>
                <div class="btn-group">
                  <a
                    :href="link(f)"
                    class="btn btn-primary btn-sm"
                    target="_blank"
                    title="Открыть/Создать файл"
                  >
                    <ExternalLink :size="16" class="me-1"/>
                    Открыть/Создать
                  </a>
                  <button 
                    class="btn btn-outline-danger btn-sm" 
                    @click="confirmDelete(f)"
                    title="Удалить файл"
                  >
                    <Trash :size="16" class="me-1"/>
                    Удалить
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!files.length">
              <td colspan="5" class="text-center text-muted py-5">
                <div>
                  <Inbox :size="48" class="text-muted mb-3"/>
                  <h5 class="text-muted">Нет загруженных файлов</h5>
                  <p class="text-muted mb-0">Загрузите первый файл, используя область выше</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Удаление файла"
      :message="`Вы уверены, что хотите удалить файл:\n${fileToDelete?.name || ''}?`"
      confirmText="Удалить"
      cancelText="Отмена"
      variant="danger"
      :loading="deletingFile"
      @confirm="handleDeleteConfirm"
      @cancel="cancelDelete"
      @close="cancelDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { 
  Folder, 
  Upload, 
  Plus, 
  AlertTriangle, 
  List, 
  Tag, 
  FileText, 
  HardDrive, 
  Calendar, 
  Settings, 
  Check, 
  X, 
  Edit, 
  ExternalLink, 
  Trash, 
  Inbox 
} from 'lucide-vue-next'

const files = ref([])
const uploading = ref(false)
const uploadError = ref(null)
const fileInput = ref(null)
const altName = ref('')
const isDragOver = ref(false)

const editingId = ref(null)
const editingAltName = ref('')

// Состояние для модального окна удаления
const showDeleteConfirm = ref(false)
const fileToDelete = ref(null)
const deletingFile = ref(false)

function highlightDropArea() {
  isDragOver.value = true
}

function unhighlightDropArea() {
  isDragOver.value = false
}

function formatSize(bytes) {
  if (bytes == null) return '—'
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024

  if (bytes < kb) {
    return `${bytes} B`
  } else if (bytes < mb) {
    return `${(bytes / kb).toFixed(1)} KB`
  } else if (bytes < gb) {
    return `${(bytes / mb).toFixed(1)} MB`
  } else {
    return `${(bytes / gb).toFixed(1)} GB`
  }
}

const fetchFiles = async () => {
  const { success, data } = await apiClient.get(endpoints.file, {}, false)
  files.value = success ? data : []
}

const upload = async (e) => {
  isDragOver.value = false
  const f = e.dataTransfer?.files?.[0] || e.target.files?.[0]
  if (!f) return

  const fd = new FormData()
  fd.append('file', f)
  if (altName.value.trim()) {
    fd.append('alt_name', altName.value.trim())
  }

  uploading.value = true
  uploadError.value = null

  const { success } = await apiClient.post(endpoints.file, fd, false)
  uploading.value = false

  if (!success) {
    uploadError.value = 'Ошибка загрузки файла'
    return
  }
  altName.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  fetchFiles()
}

const confirmDelete = (file) => {
  fileToDelete.value = file
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  fileToDelete.value = null
  deletingFile.value = false
}

const handleDeleteConfirm = async () => {
  if (!fileToDelete.value) return
  
  deletingFile.value = true
  await apiClient.delete(`${endpoints.file}${fileToDelete.value.id}/`, {}, true)
  deletingFile.value = false
  
  cancelDelete()
  fetchFiles()
}

const startEdit = (f) => {
  editingId.value = f.id
  editingAltName.value = f.alt_name || ''
}

const cancelEdit = () => {
  editingId.value = null
  editingAltName.value = ''
}

const saveEdit = async (f) => {
  await apiClient.patch(
    `${endpoints.file}${f.id}/`,
    { alt_name: editingAltName.value.trim() },
    true
  )
  cancelEdit()
  fetchFiles()
}

const link = (f) =>
  f.dl_url ||
  `${apiClient.baseUrl}${apiClient.apiPath}settings/files/${encodeURIComponent(
    f.alt_name || f.name
  )}`

fetchFiles()
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.border-dashed {
  border-style: dashed !important;
}

.text-truncate {
  max-width: 200px;
}

.drag-over {
  background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
  border-color: var(--bs-primary) !important;
}

/* Адаптивные стили */
@media (max-width: 991.98px) {
  .card-body .row {
    margin: 0;
  }
  
  .card-body .col-12 {
    padding-left: 0;
    padding-right: 0;
  }
  
  .btn-group {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}

@media (max-width: 575.98px) {
  .card {
    padding: 1rem !important;
  }
  
  .badge {
    font-size: 0.75rem;
  }
}
</style>
