<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center">
      <ListTree class="me-2" />
      <h5 class="mb-0">Рабочая область</h5>
    </div>
    <div class="card-body p-0 position-relative">
      <Draggable
        v-model="internalTree"
        :external-data-handler="externalDataHandler"
        :on-external-drag-over="() => true"
        :eachDroppable="eachDroppable"
        tree-line
        value-key="uid"
        class="drop-area overflow-auto p-3"
      >
        <template #default="{ node, stat }">
          <div>
            <OpenIcon
              v-if="stat.children.length"
              :open="stat.open"
              class="me-2 text-primary"
              @click="stat.open = !stat.open"
            />
            <div
              class="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded shadow-sm"
            >
              <div>
                <b>{{ node.name }}</b
                ><br />
                <small class="text-muted">{{ node.component_type }}</small>
              </div>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="$emit('open-settings', node)"
                title="Настроить компонент"
              >
                ⚙️
              </button>
            </div>
          </div>
        </template>
      </Draggable>
      <div
        v-if="internalTree.length === 0"
        class="placeholder-text position-absolute top-50 start-50 translate-middle text-secondary"
      >
        Перетащите сюда компоненты
      </div>
    </div>
  </div>
</template>

<script setup>
import { ListTree } from 'lucide-vue-next'
import { computed } from 'vue'
import { Draggable, OpenIcon } from '@he-tree/vue'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue', 'open-settings'])

const internalTree = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const eachDroppable = (targetStat) => {
  return targetStat.data.allow_children === true
}

const externalDataHandler = (event) => {
  const tpl = JSON.parse(event.dataTransfer.getData('application/json'))
  return { ...tpl, uid: uuidv4(), children: [] }
}
</script>

<style scoped>
.drop-area {
  min-height: 150px;
  border: 2px dashed var(--bs-primary);
  border-radius: 0.375rem;
  background-color: var(--bs-light);
  transition: background-color 0.2s ease;
}

.drop-area:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.placeholder-text {
  font-style: italic;
  user-select: none;
  font-weight: bold;
}
</style>
