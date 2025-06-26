<template>
    <div class="csv-preview">
      <div class="toolbar">
        <div class="code">
          <label>Кодировка</label>
          <select class="form-select form-select-sm" id="smallSelect" v-model="encoding">
            <option value="utf-8">utf-8</option>
            <option value="utf-8-sig">utf-8-sig</option>
            <option value="utf16">utf16</option>
            <option value="windows-1251">windows-1251</option>
          </select>
        </div>
        <div class="separate">
          <label>Разделитель</label>
          <select class="form-select form-select-sm" id="smallSelect" v-model="delimiter">
            <option value=",">Запятая</option>
            <option value=";">Точка с запятой</option>
            <option value="\t">Табуляция</option>
          </select>
        </div>
        <div class="header_col">
          <label>Заголовок столбцов</label>
          <div class="toggle-group">
            <button :class="{ active: hasHeader }" @click="hasHeader = true">Да</button>
            <button :class="{ active: !hasHeader }" @click="hasHeader = false">Нет</button>
          </div>
        </div>
        <div class="search-wrapper">
          <input class="form-control" list="datalistOptions" id="dataListInput" type="text" placeholder="Поиск по столбцу" v-model="searchQuery" />
        </div>
      </div>
  
      <div v-if="isLoading" class="spinner-wrapper">
        <div class="spinner"></div>
      </div>
  
      <div v-else-if="errorState" class="error-message">
        <h2>Ошибка</h2>
        <p>{{ errorState }}</p>
      </div>
  
      <table class="csv-table" v-else-if="columns.length">
        <thead>
          <tr>
            <th v-for="(col, index) in columns" :key="index">
              <div class="col-header">
                <div class="type-button-wrapper" @click.stop="toggleMenu(index)">
                  <span class="type-icon">{{ typeIcons[columnTypes[index]] }}</span>
                  <div v-if="activeMenuIndex === index" class="type-menu">
                    <div
                      v-for="type in getAllowedTypes(index)"
                      :key="type"
                      :class="['type-option', { active: columnTypes[index] === type }]"
                      @click.stop="setType(index, type)"
                    >
                      {{ typeLabels[type] }}
                    </div>
                  </div>
                </div>
                <span>{{ col }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in filteredRows" :key="rowIndex">
            <td v-for="(cell, colIndex) in row" :key="colIndex">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watchEffect, watch } from 'vue'
  import { apiClient } from '@/js/api/manager'
  import { endpoints } from '@/js/api/endpoints'
  
  const props = defineProps({ file: Object })
  
  const encoding = ref('utf-8')
  const delimiter = ref(',')
  const hasHeader = ref(true)
  const searchQuery = ref('')
  const rawData = ref([])
  const fileUrl = ref(null)
  const isLoading = ref(false)
  const errorState = ref(null)
  
  const typeLabels = {
    string: 'Строка',
    integer: 'Целое число',
    float: 'Дробное число'
  }
  
  const typeIcons = {
    string: '☰',
    integer: '#',
    float: '#.#'
  }
  
  const columns = computed(() =>
    hasHeader.value && rawData.value.length ? rawData.value[0] : rawData.value[0]?.map((_, i) => `Колонка ${i + 1}`) || []
  )
  
  const rows = computed(() =>
    hasHeader.value ? rawData.value.slice(1) : rawData.value
  )
  
  const filteredRows = computed(() => {
    if (!searchQuery.value) return rows.value
    return rows.value.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  })
  
  const columnTypes = ref([])
  const activeMenuIndex = ref(null)
  
  watchEffect(() => {
    const types = []
    const rowData = rows.value
    if (!rowData.length) return
  
    for (let i = 0; i < rowData[0].length; i++) {
      const values = rowData.map(row => row[i])
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
  })
  
  watch([encoding, delimiter], async () => {
  if (fileUrl.value) {
    await fetchFileMetaAndLoad(props.file.id)
  }
})
  
  function getAllowedTypes(colIndex) {
    const values = rows.value.map(row => row[colIndex])
    let isInt = true
    let isFloat = true
  
    for (const val of values) {
      if (val === '') continue
      if (!/^[-+]?\d+$/.test(val)) isInt = false
      if (!/^[-+]?\d*(\.\d+)?$/.test(val)) isFloat = false
    }
  
    if (isInt) return ['string', 'integer', 'float']
    if (isFloat) return ['string', 'float']
    return ['string']
  }
  
  function toggleMenu(index) {
    activeMenuIndex.value = activeMenuIndex.value === index ? null : index
  }
  
  function setType(index, type) {
    columnTypes.value[index] = type
    activeMenuIndex.value = null
  }
  
  function handleClickOutside(event) {
    const menus = document.querySelectorAll('.type-menu')
    if (![...menus].some(menu => menu.contains(event.target))) {
      activeMenuIndex.value = null
    }
  }

  async function previewCsvLocally(file) {
  isLoading.value = true
  errorState.value = null

  try {
    const text = await file.text()
    const sep = delimiter.value === '\\t' ? '\t' : delimiter.value
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    const parsed = lines.map(line => line.split(sep))

    if (parsed.length && !hasHeader.value) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const colCount = parsed[0].length
      const headers = Array.from({ length: colCount }, (_, i) =>
        alphabet[i] || `Col ${i + 1}`
      )
      parsed.unshift(headers)
    }

    rawData.value = parsed
  } catch (err) {
    errorState.value = 'Ошибка чтения CSV: ' + err.message
    rawData.value = []
  } finally {
    isLoading.value = false
  }
}
  
  onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (props.file?.originalFile instanceof File) {
    await previewCsvLocally(props.file.originalFile)
  } else if (props.file?.id) {
    await fetchFileMetaAndLoad(props.file.id)
  }
})

watch([encoding, delimiter], async () => {
  if (props.file?.originalFile instanceof File) {
    await previewCsvLocally(props.file.originalFile)
  } else if (props.file?.id) {
    await fetchFileMetaAndLoad(props.file.id)
  }
})
  
  onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
  
  async function fetchFileMetaAndLoad(id) {
  try {
    isLoading.value = true
    errorState.value = null

    const res = await apiClient.get(`${endpoints.bi.Upload}${id}/`, {
      encoding: encoding.value,
      delimiter: delimiter.value
    })

    if (!res.success || !res.data?.file) {
      throw new Error('Не удалось получить мета-данные файла или отсутствует file')
    }

    fileUrl.value = res.data.file
    if (res.data.parsed) {
      rawData.value = res.data.parsed
    }
  } catch (err) {
    errorState.value = err.message
    rawData.value = []
  } finally {
    isLoading.value = false
  }
}
</script>
  
  <style scoped lang="scss">
  .csv-preview {
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 1rem;
    color: var(--color-primary-text);
    font-size: 0.9rem;
  }
  
  .spinner-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
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
    padding: 2rem;
    border: 1px solid var(--color-accent);
    background: var(--color-primary-background);
    color: var(--color-accent);
    border-radius: 12px;
    margin-top: 1rem;
  }
  
  .csv-table th span {
    font-weight: bold;
    color: var(--color-primary-text);
    letter-spacing: 0.3px;
  }

  .csv-table th {
  min-width: 120px;
}
  
  .toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .toolbar label {
    margin-right: 4px;
    font-weight: 600;
  }

  .separate{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .toggle-group {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.toggle-group button {
  padding: 4px 10px;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}

.toggle-group button:not(:last-child) {
  border-right: 1px solid var(--color-border);
}

.toggle-group button.active {
  background: var(--color-hover-background);
}
  
  .header_col {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .search-wrapper {
    flex: 1;
    min-width: 0;
  }
  
  .csv-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .csv-table th,
  .csv-table td {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    background-color: var(--color-primary-background);
  }
  
  .csv-table th {
    background-color: var(--color-primary-background);
    font-weight: bold;
    text-align: left;
    position: relative;
  }
  
  .csv-table tr:hover td {
    background-color: var(--color-hover-background);
  }
  
  .col-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .type-button-wrapper {
    position: relative;
    cursor: pointer;
    font-size: 0.8rem;
    background: var(--color-primary-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 2px 5px;
    color: var(--color-secondary-text);
    transition: background 0.2s ease;
  }
  
  .type-button-wrapper:hover {
    background-color: var(--color-hover-background);
  }
  
  .type-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: var(--color-primary-background);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    min-width: 130px;
    padding: 4px 0;
  }
  
  .type-option {
    padding: 6px 10px;
    font-size: 0.85rem;
    color: var(--color-primary-text);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .type-option:hover {
    background-color: var(--color-hover-background);
  }
  
  .type-option.active {
    background-color: var(--color-hover-background);
    color: var(--color-primary-text);
  }

  .code{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  </style>
  