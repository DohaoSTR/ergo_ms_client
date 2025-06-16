<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const files = ref([])
const uploading = ref(false)
const uploadError = ref(null)
const fileInput = ref(null)
const altName = ref('')

const editingId = ref(null)
const editingAltName = ref('')

const fetchFiles = async () => {
  try {
    const { data } = await apiClient.get(endpoints.file)
    files.value = data
  } catch (error) {
    console.error('Ошибка загрузки списка файлов', error)
  }
}

const handleFileUpload = async (event) => {
  const selected = event.target.files?.[0] || event.dataTransfer?.files?.[0]
  if (!selected) return

  const formData = new FormData()
  formData.append('file', selected)
  if (altName.value) {
    formData.append('alt_name', altName.value)
  }

  uploading.value = true
  uploadError.value = null

  try {
    await apiClient.post(endpoints.file, formData, false)
    altName.value = ''
    await fetchFiles()
  } catch (error) {
    uploadError.value = 'Ошибка загрузки файла'
    console.error(error)
  } finally {
    uploading.value = false
  }
}

const handleFileDelete = async (id) => {
  try {
    await apiClient.delete(`${endpoints.file}${id}/`, {}, true)
    await fetchFiles()
  } catch (error) {
    console.error('Ошибка удаления файла', error)
  }
}
const startEditing = (file) => {
  editingId.value = file.id
  editingAltName.value = file.alt_name || ''
}

const saveEditing = async (file) => {
  try {
    await apiClient.patch(
      `${endpoints.file}${file.id}/`,
      { alt_name: editingAltName.value },
      true
    )
    editingId.value = null
    editingAltName.value = ''
    await fetchFiles()
  } catch (error) {
    alert('Ошибка при обновлении названия')
    console.error(error)
  }
}

// Отмена редактирования
const cancelEditing = () => {
  editingId.value = null
  editingAltName.value = ''
}

onMounted(fetchFiles)
</script>

<template>
  <div class="card p-3">
    <h5 class="card-title mb-3">Файловый менеджер</h5>

    <div
      class="border p-4 mb-4 text-center bg-light rounded"
      @drop.prevent="handleFileUpload"
      @dragover.prevent
    >
      <p class="mb-2">Перетащите файл сюда или</p>
      <input
        v-model="altName"
        type="text"
        class="form-control mb-2"
        placeholder="Альтернативное название файла (необязательно)"
        maxlength="255"
      />
      <button class="btn btn-primary" @click="fileInput.click()">Выбрать файл</button>
      <input
        ref="fileInput"
        type="file"
        class="d-none"
        @change="handleFileUpload"
      />
    </div>

    <div v-if="uploading" class="alert alert-info">Загрузка...</div>
    <div v-if="uploadError" class="alert alert-danger">{{ uploadError }}</div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr class="table-striped-columns">
            <th>Альтернативное название</th>
            <th>Имя файла</th>
            <th>Размер</th>
            <th>Дата загрузки</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.id">
            
            <td>
              <div v-if="editingId === file.id" class="d-flex align-items-center gap-2">
                <input
                  v-model="editingAltName"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Новое альтернативное название"
                  maxlength="255"
                  style="max-width: 200px;"
                  @keyup.enter="saveEditing(file)"
                  @keyup.esc="cancelEditing"
                />
                <button class="btn btn-success btn-sm text-light" @click="saveEditing(file)">Сохранить</button>
                <button class="btn btn-sm btn-secondary" @click="cancelEditing">Отмена</button>
              </div>
              <div v-else>
                {{ file.alt_name || '—' }}
                <button
                  class="btn btn-link btn-sm p-0 ms-2"
                  style="font-size: 0.95em;"
                  @click="startEditing(file)"
                  title="Редактировать"
                >
                  Редактировать
                </button>
              </div>
            </td>
            <td>{{ file.name }}</td>
            <td>{{ (file.size / 1024).toFixed(2) }} KB</td>
            <td>{{ new Date(file.uploaded_at).toLocaleString() }}</td>
            <td>
              <button class="btn btn-sm btn-danger" @click="handleFileDelete(file.id)">
                Удалить
              </button>
            </td>
          </tr>
          <tr v-if="files.length === 0">
            <td colspan="5" class="text-center">Нет загруженных файлов</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}
</style>
