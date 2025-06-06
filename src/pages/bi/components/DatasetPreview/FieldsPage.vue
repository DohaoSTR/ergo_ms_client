<template>
  <div class="fields-page">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>#</th>
          <th>Имя</th>
          <th>Источник поля</th>
          <th>Тип</th>
          <th>Агрегация</th>
          <th>Описание</th>
          <th class="text-end">…</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(f, idx) in props.fields" :key="f.id" class="hover:cursor-pointer">
          <td>{{ idx + 1 }}</td>
          <td>
            <input v-model="f.name" @input="updateField(idx, 'name', f.name)"
              class="form-control form-control-sm text-white" placeholder="Имя…" />
          </td>
          <td>
            <span v-if="f.expression">
              <button class="source-btn" @click="onSourceClick(f)">
                <SquareFunction />
              </button>
            </span>
            <span v-else>
              <button class="source-btn" @click="onSourceClick(f)">
                <template v-if="f.source">
                  {{ tableLabel(f.source?.table) }}.{{ f.source?.column }}
                </template>
                <template v-else>
                  Нет источника
                </template>
              </button>
            </span>
          </td>
          <td>{{ f.type }}</td>
          <td>
            <AggSelect v-model="f.aggregation" :options="getAggregationOptions(f.type)" :aggregationColorMap="aggregationColorMap" />
          </td>
          <td>
            <input v-model="f.description" class="form-control form-control-sm text-white" placeholder="Описание…" />
          </td>
          <td>
            <button class="btn btn-sm btn-outline-danger rounded" @click="removeField(idx)">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import AggSelect from '@/pages/bi/components/DatasetPreview/AggregationSelect.vue'
import datasetService from '@/js/api/services/bi/datasetService'
import { SquareFunction } from 'lucide-vue-next';

import {
  typeOptions,
  getAggregationOptions,
  aggregationColorMap,
  aggregationOptionsMap
} from '@/pages/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'

const showModal = ref(false)
const selectedField = ref(null)

const props = defineProps({
  fields: { type: Array, default: () => [] },
  tables: { type: Array, default: () => [] },
  cols: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  datasetId: { type: [Number, String], default: null },
})

const emit = defineEmits(['edit-field', 'add-field', 'update:fields', 'removeTable'])

const tableLabel = (tableKey) => {
  if (!tableKey) return 'Нет источника';
  const tbl = props.tables.find(t => String(t.id) === String(tableKey));
  if (tbl) return tbl.name || tbl.table || tbl.id;
  const byName = props.tables.find(t => t.name === tableKey || t.table === tableKey);
  if (byName) return byName.name || byName.table;
  if (typeof tableKey === 'string' && tableKey.startsWith('expr')) return 'Вычисляемое поле';
  return tableKey;
};

function updateField(idx, key, value) {
  const newFields = props.fields.map((f, i) => i === idx ? { ...f, [key]: value } : f);
  emit('update:fields', newFields);
}

function removeField(idx) {
  const newFields = props.fields.slice();
  newFields.splice(idx, 1);
  emit('update:fields', newFields);
}

function onSourceClick(field) {
  emit('edit-field', field)
}

function onSourceSave(newSource) {
  if (!selectedField.value) return
  const idx = props.fields.findIndex(f => f.id === selectedField.value.id)
  if (idx !== -1) {
    const updatedFields = props.fields.map((f, i) => i === idx
      ? { ...f, source: newSource, source_column: newSource.column }
      : f)
    emit('update:fields', updatedFields)
  }
  showModal.value = false
}
</script>

<style scoped lang="scss">
.table td,
.table th {
  vertical-align: middle;
}

:deep(.table tbody td) {
  border-bottom: none !important;
}

:deep(.table thead th) {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.2);
}

:deep(.table-hover tbody tr:hover) {
  background-color: rgba(255, 255, 255, 0.05);
}

:deep(input.form-control),
:deep(select.form-select) {
  background: transparent !important;
  border: none !important;
  border-radius: 5px !important;
  padding: .25rem .5rem;
  color: inherit;
  transition: background-color .2s ease, border-radius .2s ease;
}

:deep(input.form-control:hover),
:deep(select.form-select:hover),
:deep(input.form-control:focus),
:deep(select.form-select:focus) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-radius: 12px !important;
  outline: none !important;
  box-shadow: none !important;
}

:deep(select.form-select) {
  appearance: none;
  background-image: none !important;
  padding-right: 1.5rem;
}

:deep(select.form-select::-ms-expand) {
  display: none;
}

.source-btn {
  width: 100%;
  text-align: left;
  background: transparent !important;
  border: none !important;
  padding: .25rem .5rem;
  border-radius: 5px !important;
  color: inherit;
  display: flex;
  align-items: center;
  transition: background-color .2s ease, border-radius .2s ease;
}

.source-btn:hover,
.source-btn:focus {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-radius: 12px !important;
  outline: none !important;
}

/* ========== Fade (оверлей) ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== Scale (окно) ========== */
.scale-enter-active,
.scale-leave-active {
  transition: transform .3s ease, opacity .3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>