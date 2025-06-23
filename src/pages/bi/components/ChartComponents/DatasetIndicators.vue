<template>
  <div v-if="!props.dataset" class="fields-placeholder">
    <div class="alert alert-info info-box">
      <CircleAlert :size="40" class="me-1" />
      Прежде чем увидеть содержимое, добавьте датасет
    </div>
  </div>
  <div v-else style="overflow-y: auto; height: 100%;">
    <ul class="fields-list">
      <li v-for="f in props.fields" :key="f.id" class="field-item">
        <span class="field-icon">
          <component :is="typeIcon[f.type] || Type" size="16" />
        </span>
        <span class="field-name">{{ f.name }}</span>
        <span class="field-type">({{ f.type }})</span>
      </li>
      <li v-if="!props.fields.length" class="field-empty">
        <i>Показатели не найдены</i>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { Type, CircleAlert, Calendar, Hash, CheckCircle, MapPin, Globe } from 'lucide-vue-next'

const props = defineProps({
  dataset: Object,
  fields: { type: Array, default: () => [] }
})

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
</script>

<style scoped lang="scss">
.fields-placeholder {
  height: 100%;
}

.info-box {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  gap: 10px;
}

.fields-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
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

.field-type {
  color: #bbb;
  font-size: 13px;
}

.field-empty {
  display: flex;
  justify-content: center;
  color: var(--color-secondary-text);
  padding: 24px 0;
}

.loading {
  pointer-events: none;
  background: transparent !important;
}

.skeleton-icon,
.skeleton-text {
  background: var(--color-secondary-text);
  border-radius: 4px;
  animation: shimmer 1.3s ease-in-out infinite;
}

.skeleton-icon {
  width: 16px;
  height: 16px;
}

.skeleton-text {
  width: 120px;
  height: 14px;
  margin-left: 10px;
}

@keyframes shimmer {

  0%,
  100% {
    opacity: .4
  }

  50% {
    opacity: 1
  }
}
</style>
