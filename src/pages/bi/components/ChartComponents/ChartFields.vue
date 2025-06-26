<template>
  <div class="chart-fields-modal">
    <div class="search-box">
      <input v-model="search" type="text" class="form-control form-control-sm" placeholder="Поиск..." />
    </div>
    <ul class="fields-list">
      <b>Показатели:</b>
      <li v-for="f in availableFields" :key="f.id" class="field-item" :class="{ selected: isSelected(f) }" @click="!isSelected(f) && selectField(f)">
        <span class="field-icon">
          <component :is="typeIcon[f.type] || Type" size="16" />
        </span>
        <span class="field-name">{{ f.name }}</span>
      </li>
      <li v-if="!availableFields.length" class="field-empty">
        <i>Ничего не найдено</i>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Type, Hash, Calendar, CheckCircle, Globe, MapPin } from 'lucide-vue-next'

// !!! Типы данных берем только из props.fields !!!
const props = defineProps({
  fields: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  allowedTypes: { type: Array, default: () => null }
})
const emit = defineEmits(['select'])
const search = ref('')

const typeIcon = {
  string: Type,
  integer: Hash,
  float: Hash,
  number: Hash,
  date: Calendar,
  'date&time': Calendar,
  bool: CheckCircle,
  boolean: CheckCircle,
  geopoint: MapPin,
  geopolygon: Globe,
}

const availableFields = computed(() =>
  (props.fields || [])
    .filter(f => !props.allowedTypes || props.allowedTypes.includes(f.type))
    .filter(f => f.name.toLowerCase().includes(search.value.trim().toLowerCase()))
)

function isSelected(field) {
  return props.selected.some(f => f.name === field.name)
}

function selectField(field) {
  emit('select', field)
}
</script>

<style scoped>
.chart-fields-modal {
  padding-right: 8px;
  overflow-y: auto;
  height: 100%;
}
.search-box {
  margin-bottom: 12px;
}
.fields-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-primary-text);
  transition: background .2s;
  cursor: pointer;
}
.field-item:hover {
  background: var(--color-hover-background);
}
.field-icon {
  color: var(--color-accent);
}
.field-name {
  font-weight: 500;
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: var(--color-secondary-text);
  padding: 24px 0;
}
.selected {
  background: var(--color-hover-background) !important;
  border: 1.5px solid #198754;
  cursor: not-allowed;
}
</style>
