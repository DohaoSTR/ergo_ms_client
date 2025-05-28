<template>
  <div>
    <input v-model="filter" placeholder="Поиск..." class="form-control form-control-sm mb-2" />
    <div class="row g-2" style="max-height: 200px; overflow: auto">
      <div
        v-for="name in filtered"
        :key="name"
        class="col-3 text-center icon-tile"
        @click="select(name)"
      >
        <component v-if="Icons[name]" :is="Icons[name]" class="icon-svg" />
        <div class="small text-truncate">{{ name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as Icons from 'lucide-vue-next'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const filter = ref('')

const EXCLUDE = new Set(['Icon', 'default', 'createLucideIcon', 'icons'])
const iconNames = Object.keys(Icons)
  .filter((name) => !EXCLUDE.has(name))
  .sort()

const filtered = computed(() =>
  iconNames.filter((n) => n.toLowerCase().includes(filter.value.toLowerCase())),
)

function select(name) {
  emit('update:modelValue', name)
}
</script>
