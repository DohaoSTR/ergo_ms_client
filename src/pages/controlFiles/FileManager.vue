<template>
  <div class="card p-4 shadow-sm">
    <h5 class="card-title fw-semibold mb-3">Файловый менеджер</h5>

    <div
      class="border rounded p-4 text-center bg-light mb-4"
      @drop.prevent="upload"
      @dragover.prevent
    >
      <p class="mb-2">Перетащите файл сюда или</p>

      <input
        v-model="altName"
        class="form-control form-control-sm mb-2"
        placeholder="Альтернативное название (необязательно)"
        maxlength="255"
      />

      <button
        class="btn btn-primary"
        @click="fileInput.click()"
        :disabled="uploading"
      >
        Выбрать файл
      </button>
      <input
        ref="fileInput"
        type="file"
        class="d-none"
        @change="upload"
      />
    </div>

    <div v-if="uploading" class="alert alert-info py-2">Загрузка…</div>
    <div v-if="uploadError" class="alert alert-danger py-2">{{ uploadError }}</div>

    <div class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th style="width:280px">Альт-название</th>
            <th>Имя файла</th>
            <th style="width:110px">Размер</th>
            <th style="width:170px">Дата</th>
            <th style="width:200px">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in files" :key="f.id">
            <td>
              <template v-if="editingId === f.id">
                <div class="d-flex gap-1">
                  <input
                    v-model="editingAltName"
                    class="form-control form-control-sm"
                    @keyup.enter="saveEdit(f)"
                    @keyup.esc="cancelEdit"
                  />
                  <button
                    class="btn btn-danger btn-sm white-text-on-hover"
                    @click="saveEdit(f)"
                  >
                    ✓
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEdit">×</button>
                </div>
              </template>
              <template v-else>
                {{ f.alt_name || '—' }}
                <button
                  class="btn btn-link btn-sm p-0 ms-1"
                  @click="startEdit(f)"
                >
                  Редактировать
                </button>
              </template>
            </td>

            <td>{{ f.name }}</td>
            <td>{{ formatSize(f.size) }}</td>
            <td>{{ new Date(f.uploaded_at).toLocaleString() }}</td>

            <td>
              <a
                :href="link(f)"
                class="btn btn-success btn-sm me-2 text-white"
                target="_blank"
              >
                Открыть
              </a>
              <button class="btn btn-danger btn-sm" @click="remove(f.id)">
                Удалить
              </button>
            </td>
          </tr>

          <tr v-if="!files.length">
            <td colspan="5" class="text-center text-muted py-4">
              Нет загруженных файлов
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const files = ref([])
const uploading = ref(false)
const uploadError = ref(null)
const fileInput = ref(null)
const altName = ref('')

const editingId = ref(null)
const editingAltName = ref('')

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

const remove = async (id) => {
  await apiClient.delete(`${endpoints.file}${id}/`, {}, true)
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
</style>
