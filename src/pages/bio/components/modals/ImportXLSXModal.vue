<script setup>
import { ref, computed, onMounted } from 'vue'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  modalId: { type: String, required: true, default: 'importXlsxModal' },
})

const emits = defineEmits(['import', 'generate-template'])

// Настройки импорта
const selectedFile = ref(null)
const fileName = ref('')
const hasErrors = ref(false)
const isImporting = ref(false)
const fileInputRef = ref(null)

// Toast уведомления
const toast = useToast()

// Вычисляемые свойства
const isFileSelected = computed(() => selectedFile.value !== null)
const buttonDisabled = computed(() => !isFileSelected.value || isImporting.value)

// Методы
const handleFileChange = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) {
    selectedFile.value = null
    fileName.value = ''
    return
  }

  const file = files[0]
  // Проверяем тип файла (Excel)
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]

  if (!validTypes.includes(file.type)) {
    toast.error('Пожалуйста, выберите файл Excel (.xlsx или .xls)')
    event.target.value = null
    selectedFile.value = null
    fileName.value = ''
    return
  }

  selectedFile.value = file
  fileName.value = file.name
}

// Обработка импорта файла
const handleImport = () => {
  if (!selectedFile.value) return

  isImporting.value = true

  // Создаем объект FormData для передачи файла и настроек
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  // Вызываем событие импорта
  emits('import', {
    file: selectedFile.value,
    setImportingComplete: () => {
      isImporting.value = false
    }
  })
}

// Скачать шаблон
const downloadTemplate = (withHeaders) => {
  emits('generate-template', { withHeaders })
}

// Сброс формы при скрытии модального окна
const resetForm = () => {
  selectedFile.value = null
  fileName.value = ''
  hasErrors.value = false
  isImporting.value = false
  
  // Сбрасываем значение HTML элемента input file
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Устанавливаем слушатели событий для модального окна
onMounted(() => {
  const modalEl = document.getElementById(props.modalId)
  if (modalEl) {
    // Сброс формы при скрытии модального окна
    modalEl.addEventListener('hidden.bs.modal', resetForm)
  }
})
</script>

<template>
  <ModalCenter :modalId="modalId" title="Импорт данных из XLSX" :showFooter="true" size="lg">
    <div class="import-settings">
      <!-- Выбор файла -->
      <div class="setting-group mb-3">
        <label class="form-label fw-bold mb-2">Выберите файл Excel для импорта</label>
        <div class="file-upload-container">
          <div class="custom-file-upload">
            <div class="input-group">
              <input
                type="file"
                class="form-control"
                id="importFile"
                accept=".xlsx,.xls"
                @change="handleFileChange"
                ref="fileInputRef"
              />
              <label class="input-group-text" for="importFile">Выбрать файл</label>
            </div>
          </div>
          <div v-if="fileName" class="selected-file mb-2">
            <span class="me-2">Выбранный файл:</span>
            <span class="text-primary">{{ fileName }}</span>
          </div>
        </div>
      </div>

      <!-- Секция скачивания шаблонов -->
      <div class="setting-group mb-3">
        <label class="form-label fw-bold mb-2">Скачать шаблон для заполнения</label>
        <div class="template-options d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="downloadTemplate(true)"
          >
            Шаблон с шапкой
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            @click="downloadTemplate(false)"
          >
            Шаблон без шапки
          </button>
        </div>
        <div class="form-text text-muted mt-2">
          Скачайте шаблон для корректного заполнения данных о видах и площадках
        </div>
      </div>

      <!-- Инструкции по заполнению файла -->
      <div class="setting-group">
        <label class="form-label fw-bold mb-2">Как заполнить файл правильно</label>
        <div class="instructions">
          <p class="mb-2">Для корректного импорта, пожалуйста, следуйте этим правилам:</p>
          <ul class="instruction-list">
            <li>Название вида укажите в формате: <strong>Название вида Автор (например, Abelia coreana Nakai)</strong></li>
            <li>Ярус должен быть одним из: A, B, C, D, E (может быть пустым)</li>
            <li>Для каждой площадки укажите балл обилия для вида: r, +, 1, 2, 3, 4, 5</li>
            <li>Пустые ячейки (либо точки) означают отсутствие вида на площадке</li>
            <li>Не меняйте структуру шаблона и порядок столбцов</li>
            <li>Можно добавлять столбцы для новых площадок и строки для новых видов</li>
            <li>Проверьте правильность названий видов перед импортом</li>
            <li>Для выделения таксонов объедините ячейки как минимум на 2 столбца</li>
            <li>В таблице не должно быть пустых строк</li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
      <button
        type="button"
        class="btn btn-primary"
        @click="handleImport"
        :disabled="buttonDisabled"
      >
        <span v-if="isImporting" class="spinner-border spinner-border-sm me-1" role="status"></span>
        {{ isImporting ? 'Импорт...' : 'Импортировать данные' }}
      </button>
    </template>
  </ModalCenter>
</template>

<style scoped lang="scss">
.import-settings {
  overflow-y: auto;
}

.setting-group {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--bs-border-color);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
}

.instructions {
  font-size: 0.9rem;

  .instruction-list {
    padding-left: 1.5rem;
    margin-bottom: 0;

    li {
      margin-bottom: 0.5rem;
    }
  }
}

.custom-file-upload {
  .form-control:focus {
    box-shadow: none;
    border-color: var(--bs-primary);
  }
}

.selected-file {
  font-size: 0.9rem;
}
</style> 