<template>
  <div class="preview-main">
    <div class="main-title">
      <div class="title-label" style="font-weight: bold; margin-right:2rem">Предпросмотр</div>
      <div class="title-input">
        <div class="input-label-left">Количество строк:</div>
        <input type="text" v-model="limitInput" class="form-control form-control-sm"/>
        <div class="input-label-right">не больше 1000</div>
      </div>
    </div>
    <div v-if="loading" class="preview-loading">
      <div class="spinner">Загружаем данные…</div>
    </div>
    <div v-else class="main-grid">
      <Vue3Datatable :columns="datatableColumns" :rows="tableRows" :loading="props.loading" :page-size="props.limit" skin="table table-hover" noDataContent="Нет данных"/>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import Vue3Datatable from '@bhplugin/vue3-datatable'

const props = defineProps({
  cols: Array,
  rows: Array,
  loading: Boolean,
  limit: Number,
  fields: Array
})

const loading = ref(false)

const nameMap = computed(() =>
  Object.fromEntries((props.fields || []).map(f => [f.source_column, f.name]))
)

function toField(str) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l',
    'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh',
    'щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  }
  return str.toLowerCase()
    .replace(/[а-яё]/g, x => map[x] ?? '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// 2. computed
const datatableColumns = computed(() =>
  props.cols.map((col) => ({
    title: nameMap.value[col] || col,
    field: toField(nameMap.value[col] || col),
    sortable: true,
  }))
)

const tableRows = computed(() => {
  const fields = props.cols.map(toField)
  return props.rows.map(rowArr =>
    fields.reduce((obj, field, idx) => {
      obj[field] = rowArr[idx]
      return obj
    }, {})
  )
})

const limitInput = ref(String(props.limit))
const limit      = ref(props.limit)

watch(() => props.limit, v => {
  limit.value = v
  limitInput.value = String(v)
})

watch(limitInput, val => {
  const num = parseInt(val.replace(/\D/g,'')) || props.limit
  limit.value      = Math.min(1000, Math.max(1, num))
  limitInput.value = String(limit.value)
})
</script>

<style scoped lang="scss">
.preview-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1.1rem;
  font-style: italic;
}

.loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 10;
}

/* сам спиннер */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* подправим контейнер чтобы позиционировался относительно */
.preview-main {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
  gap: 10px;
}

.main-title {
    display: flex;
    justify-content: start;
    align-items: center;
    flex: 0 0 auto;
    width: auto;
}

.title-input {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.input-label-left,
.input-label-right {
    min-width: 100px;
    text-align: right;
}

input {
    max-width: 70px;
}

.main-grid {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
}

:deep(.vue3-datatable__table-wrapper) {
  overflow-y: inherit !important;
  padding-bottom: inherit !important;
}

:deep(.vue3-datatable__table-wrapper)::-webkit-scrollbar-corner {
  background: transparent;
}

:deep(.bh-pagination-wrapper) {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1e1e1e;
  border-top: 1px solid #444;
  font-size: 14px;
  color: #ccc;
}

:deep(.bh-pagination) {
  display: flex;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
}

:deep(.bh-page-item) {
  padding: 4px 10px;
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.bh-page-item:hover) {
  background: #444;
}

:deep(.bh-page-active) {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

:deep(.bh-pagination-info),
:deep(.bh-pagination-wrapper > div:first-child),
:deep(.bh-pagination-wrapper > span) {
  display: none !important;
}

:deep(th .bh-flex) {
  font-weight: bold !important;
}
</style>
