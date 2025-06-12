<template>
    <div class="xlsx-preview">
      <div class="toolbar">
        <div class="header-wrapper">
          <label>Заголовок столбцов</label>
          <div class="toggle-group">
            <button :class="{ active: hasHeader }" @click="hasHeader = true">Да</button>
            <button :class="{ active: !hasHeader }" @click="hasHeader = false">Нет</button>
          </div>
        </div>
        <div class="search-wrapper">
          <input class="form-control" list="datalistOptions" id="dataListInput" type="text" placeholder="Поиск по таблице" v-model="searchQuery"/>
        </div>
      </div>
  
      <div v-if="isLoading" class="spinner-wrapper">
        <div class="spinner"></div>
      </div>
  
      <div v-else-if="errorState" class="error-message">
        <h2>Ошибка</h2>
        <p>{{ errorState }}</p>
      </div>
  
      <div class="table-scroll-wrapper" v-else-if="columns.length">
        <div class="table-scroll-inner">
          <table class="xlsx-table">
            <thead>
              <tr>
                <th v-for="(col, index) in columns" :key="index">
                  <div class="col-header">
                    <span class="type-icon">{{ typeIcons[columnTypes[index]] }}</span>
                    <span>{{ col }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in filteredRows" :key="rowIndex" :class="{ selected: selectedRow === rowIndex }" @click="selectRow(rowIndex)">
                <td v-for="(cell, colIndex) in row" :key="colIndex">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { apiClient } from '@/js/api/manager'
  import { endpoints } from '@/js/api/endpoints'
  import ExcelJS from 'exceljs'
  
  const props = defineProps({ file: Object })
  
  const hasHeader = ref(true)
  const rawData = ref([])
  const searchQuery = ref('')
  const isLoading = ref(false)
  const errorState = ref(null)
  const selectedRow = ref(null)
  
  const selectRow = index => {
    selectedRow.value = index
  }
  
  const typeIcons = {
    string: '☰',
    integer: '#',
    float: '#.#'
  }
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  function formatDate(val) {
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val)) {
    return val.toLocaleDateString('ru-RU')
  }
  return val
}

  
  const columns = computed(() => {
    if (!rawData.value.length) return []
    if (hasHeader.value) return rawData.value[0]
    return rawData.value[0].map((_, i) => alphabet[i] || `Col ${i + 1}`)
  })
  
  const rows = computed(() =>
    hasHeader.value ? rawData.value.slice(1) : rawData.value
  )
  
  const filteredRows = computed(() => {
    if (!searchQuery.value) return rows.value
    return rows.value.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  })

  async function previewXlsxLocally(file) {
  if (!(file instanceof Blob)) {
    throw new Error('Невалидный файл. Для предпросмотра требуется Blob или File.');
  }

  const workbook = new ExcelJS.Workbook()
  const reader = new FileReader()

  const formatDate = (val) => {
    if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val)) {
      return val.toLocaleDateString('ru-RU')
    }
    return val
  }

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]

        const parsed = []
        worksheet.eachRow({ includeEmpty: true }, (row) => {
          const rowValues = row.values.slice(1)
          parsed.push(rowValues.map(cell => {
            if (cell == null) return ''
            return String(formatDate(cell))
          }))
        })

        resolve(parsed)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
  
  const columnTypes = ref([])
  
  function detectTypes() {
    const types = []
    const dataRows = rows.value
    if (!dataRows.length) return
  
    for (let i = 0; i < dataRows[0].length; i++) {
      const values = dataRows.map(row => row[i])
      let isInt = true
      let isFloat = true
  
      for (const val of values) {
        if (val === '') continue
        if (!/^[-+]?\d+$/.test(val)) isInt = false
        if (!/^[-+]?\d*(\.\d+)?$/.test(val)) isFloat = false
      }
  
      if (isInt) types.push('integer')
      else if (isFloat) types.push('float')
      else types.push('string')
    }
  
    columnTypes.value = types
  }
  
  async function fetchData() {
  if (!props.file) return

  isLoading.value = true
  errorState.value = null

  try {
    let parsed = null

    const isLocalFile = props.file.originalFile instanceof File || props.file.originalFile instanceof Blob

    if (isLocalFile) {
      parsed = await previewXlsxLocally(props.file.originalFile)
    } else if (props.file.id || (props.file.temp_path && !props.file.temp_path.includes(':\\'))) {
      let res

      if (props.file.id) {
        res = await apiClient.get(`${endpoints.bi.Upload}${props.file.id}/?has_header=${hasHeader.value}`)
      } else {
        res = await apiClient.post('/bi_analysis/bi_datasets/xlsx/preview/', {
          temp_path: props.file.temp_path,
          has_header: hasHeader.value
        })
      }

      if (!res.success || !res.data?.parsed?.length) {
        throw new Error('Ошибка загрузки файла')
      }

      parsed = res.data.parsed.map(row =>
        row.map(cell => (cell == null ? '' : String(formatDate(cell))))
      )
    } else {
      throw new Error('Файл не поддерживается или не загружен')
    }

    rawData.value = parsed
    detectTypes()
  } catch (e) {
    console.error('Ошибка предпросмотра:', e)
    errorState.value = e.message
    rawData.value = []
  } finally {
    isLoading.value = false
  }
}
  
  watch(hasHeader, fetchData)
  onMounted(fetchData)
  </script>
  
  <style scoped lang="scss">
  .xlsx-preview {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    color: var(--color-primary-text);
  }

  .header-wrapper{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
  
  .toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .toggle-group button {
    padding: 4px 10px;
    background: var(--color-primary-background);
    border: 1px solid var(--color-border);
    color: var(--color-primary-text);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .toggle-group button.active {
    background: var(--color-accent);
  }
  
  .spinner-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }
  .spinner {
    width: 48px;
    height: 48px;
    border: 5px solid var(--color-border);
    border-top: 5px solid #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-message {
    text-align: center;
    color: var(--color-accent);
    padding: 2rem;
    border: 1px solid var(--color-accent);
    background: var(--color-primary-background);
    border-radius: 12px;
  }
  
.xlsx-table {
  min-width: max-content;
  width: 100%;
  border-collapse: collapse;
}
  
  .xlsx-table th,
  .xlsx-table td {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    background-color: var(--color-primary-background);
  }
  
  .xlsx-table th {
    background-color: var(--color-primary-background);
    text-align: left;
  }
  
  .xlsx-table tr:hover td {
    background-color: var(--color-hover-background);
  }
  
  .xlsx-table tr.selected td {
    background-color: var(--color-hover-background);
  }
  
  .xlsx-table tr {
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  
  .col-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .type-icon {
    font-size: 0.9rem;
    color: var(--color-secondary-text);
  }
  </style>
  