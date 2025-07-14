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
              class="form-control form-control-sm" placeholder="Имя…" />
          </td>
          <td style="max-width: 250px;">
            <span v-if="f.expression">
              <button class="source-btn" @click="onSourceClick(f)">
                <SquareFunction />
              </button>
            </span>
            <span v-else>
              <button class="source-btn" @click="onSourceClick(f)">
                <template v-if="f.source">
                  {{ getFieldSourceLabel(f) }}
                </template>
                <template v-else>
                  Нет источника
                </template>
              </button>
            </span>
          </td>
          <td>
            <select v-model="f.type" class="form-select form-select">
              <option v-for="typeOption in getTypeOptionsForField(f)" :key="typeOption.value" :value="typeOption.value">
                {{ typeOption.label }}
              </option>
            </select>
          </td>
          <td style="max-width: 100px;">
            <AggSelect :modelValue="f.aggregation" @update:modelValue="val => updateField(idx, 'aggregation', val)" :options="getAggregationOptions(f.type)" :aggregationColorMap="aggregationColorMap"/>
          </td>
          <td>
            <input v-model="f.description" class="form-control form-control-sm" placeholder="Описание…" />
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

import AggSelect from '@/modules/bi/components/DatasetPreview/AggregationSelect.vue'
import datasetService from '@/js/api/services/bi/datasetService'
import { SquareFunction } from 'lucide-vue-next';

import {
  getTypeOptionsForField,
  getAggregationOptions,
  aggregationColorMap
} from '@/modules/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'

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

function getFieldSourceLabel(field) {
  const tbl = props.tables.find(
    t => String(t.id) === String(field.source_table)
  )
  if (tbl) return `${tbl.display_name || tbl.name || tbl.table}.${field.name}`;
  if (field.source && field.source.table) {
    return `${field.source.table}.${field.source.column || field.name}`;
  }
  return field.name;
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
  border-bottom: 0.5px solid var(--color-border);
}

:deep(.table-hover tbody tr:hover) {
  background-color: var(--color-hover-background);
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
  background-color: var(--color-hover-background) !important;
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
  background-color: var(--color-hover-background) !important;
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