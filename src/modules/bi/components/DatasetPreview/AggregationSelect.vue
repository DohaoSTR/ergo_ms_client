<template>
  <div class="agg-select">
    <button class="agg-chip" :class="aggregationColorMap[modelValue]" @click="show = !show" type="button">
      {{ labelByValue(modelValue) }}
    </button>
    <div v-if="show" class="agg-dropdown" @mouseleave="show = false">
      <div v-for="opt in options" :key="opt.value" class="agg-dropdown-item" :class="aggregationColorMap[opt.value]" @click="select(opt.value)">
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps({
  modelValue: String,
  options: Array,
  aggregationColorMap: Object
})
const emit = defineEmits(['update:modelValue'])

const show = ref(false)

function select(value) {
  emit('update:modelValue', value)
  show.value = false
}

function labelByValue(val) {
  const opt = props.options.find(o => o.value === val)
  return opt ? opt.label : ''
}

// Закрытие по клику вне
function handleClickOutside(event) {
  if (!event.target.closest('.agg-select')) show.value = false
}
watch(show, v => {
  if (v) window.addEventListener('mousedown', handleClickOutside)
  else window.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped lang="scss">

.agg-select {
  display: inline-block;
  position: relative;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0.7rem;
  font-size: 1rem;
  font-weight: 500;
  width: 100%;
  text-align: center;
  line-height: 1.25;
  margin: 0;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  transition: background 0.15s, color 0.15s;
}
.agg-chip:hover {
  filter: brightness(1.12);
}

.agg-primary   { background: #26404a; color: var(--color-hover-background);}
.agg-info      { background: #1e4050; color: var(--color-hover-background);}
.agg-success   { background: #18382c; color: var(--color-hover-background);}
.agg-warning   { background: #544514; color: var(--color-hover-background);}
.agg-secondary { background: #23233a; color: var(--color-hover-background);}
.agg-danger    { background: #3b1c1c; color: var(--color-hover-background);}
.agg-dark      { background: #1a1c20; color: var(--color-hover-background);}

.agg-chip {
  padding: 0.4em;
  font-size: 1em;
  border: none;
  border-radius: 9px;
  font-weight: 500;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
}
.agg-dropdown {
  position: absolute;
  z-index: 20;
  min-width: 100%;
  background: var(--color-primary-background);
  box-shadow: 0 2px 14px #0007;
  border-radius: 10px;
  padding: 0.4em 0;
  margin-top: 4px;
}
.agg-dropdown-item {
  padding: 0.35em 1.2em;
  font-size: 1em;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.13s;
  margin-bottom: 2px;
}
.agg-dropdown-item:last-child {
  margin-bottom: 0;
}
.agg-dropdown-item:hover {
  filter: brightness(1.18);
}

</style>