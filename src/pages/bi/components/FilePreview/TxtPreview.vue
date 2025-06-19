<template>
    <div class="txt-preview">
      <div class="toolbar">
        <div class="code">
          <label>Кодировка</label>
          <select class="form-select form-select-sm" v-model="encoding">
            <option value="utf-8">utf-8</option>
            <option value="utf-8-sig">utf-8-sig</option>
            <option value="utf16">utf16</option>
            <option value="windows-1251">windows-1251</option>
          </select>
        </div>
        <div class="separate">
          <label>Разделитель</label>
          <select class="form-select form-select-sm" v-model="delimiter">
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
          <input class="form-control" type="text" placeholder="Поиск по столбцу" v-model="searchQuery" />
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
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({ file: Object })

const encoding = ref('utf-8')
const delimiter = ref(',')
const hasHeader = ref(true)
const searchQuery = ref('')
const rawData = ref([])
const isLoading = ref(false)
const errorState = ref(null)

const columnTypes = ref([])
const activeMenuIndex = ref(null)

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

const columns = computed(() => {
  if (!rawData.value.length) return []
  return hasHeader.value ? rawData.value[0] : rawData.value[0].map((_, i) => `Колонка ${i + 1}`)
})

const rows = computed(() => (hasHeader.value ? rawData.value.slice(1) : rawData.value))

const filteredRows = computed(() => {
  if (!searchQuery.value) return rows.value
  return rows.value.filter(row =>
    row.some(cell => String(cell).toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const isLocal = computed(() => props.file?.originalFile instanceof File)

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

async function fetchTxtPreview() {
  if (!props.file?.id) return
  isLoading.value = true
  errorState.value = null

  try {
    const res = await apiClient.get(`${endpoints.bi.Upload}${props.file.id}/`, {
      encoding: encoding.value,
      delimiter: delimiter.value,
      has_header: hasHeader.value
    })

    if (!res.success || !res.data?.parsed) throw new Error('Ошибка загрузки TXT')
    rawData.value = res.data.parsed
  } catch (e) {
    errorState.value = e.message
    rawData.value = []
  } finally {
    isLoading.value = false
  }
}

async function previewTxtLocally(file) {
  isLoading.value = true
  errorState.value = null

  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    const sep = delimiter.value === '\\t' ? '\t' : delimiter.value
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
    errorState.value = 'Ошибка чтения файла: ' + err.message
    rawData.value = []
  } finally {
    isLoading.value = false
  }
}

function detectColumnTypes() {
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

// автоопределение типов при изменении данных
watchEffect(() => {
  detectColumnTypes()
})

watch([encoding, delimiter], async () => {
  if (isLocal.value) {
    await previewTxtLocally(props.file.originalFile)
  } else if (props.file?.id) {
    await fetchTxtPreview()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (isLocal.value) {
    previewTxtLocally(props.file.originalFile)
  } else if (props.file?.id) {
    fetchTxtPreview()
  }
})

onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped lang="scss">
.txt-preview {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 1rem;
  color: #fff;
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
  border: 5px solid #4e5058;
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
  border: 1px solid #ef4444;
  background: rgba(255, 0, 0, 0.05);
  color: #f87171;
  border-radius: 12px;
  margin-top: 1rem;
}

.csv-table th span {
  font-weight: bold;
  color: #ffffff;
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
border: 1px solid #4e5058;
border-radius: 6px;
overflow: hidden;
}

.toggle-group button {
padding: 4px 10px;
background: #2e2f35;
color: #fff;
border: none;
cursor: pointer;
transition: background 0.2s;
font-weight: 500;
}

.toggle-group button:not(:last-child) {
border-right: 1px solid #4e5058;
}

.toggle-group button.active {
background: #4e5058;
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
  border: 1px solid #4e5058;
  background-color: #2e2f35;
}

.csv-table th {
  background-color: #3b3d44;
  font-weight: bold;
  text-align: left;
  position: relative;
}

.csv-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.05);
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
  background: #2e2f35;
  border: 1px solid #4e5058;
  border-radius: 4px;
  padding: 2px 5px;
  color: #b5bac1;
  transition: background 0.2s ease;
}

.type-button-wrapper:hover {
  background-color: #3b3d44;
}

.type-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #2e2f35;
  border: 1px solid #4e5058;
  border-radius: 6px;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  min-width: 130px;
  padding: 4px 0;
}

.type-option {
  padding: 6px 10px;
  font-size: 0.85rem;
  color: #e4e4e7;
  cursor: pointer;
  transition: background 0.15s ease;
}

.type-option:hover {
  background-color: rgba(255, 255, 255, 0.07);
}

.type-option.active {
  background-color: #4e5058;
  color: #fff;
}

.code{
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
