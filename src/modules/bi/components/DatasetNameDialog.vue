<template>
  <div v-show="visible" class="modal-overlay">
    <div class="modal-window">
      <div class="modal-header">
        <h5 class="modal-title">Название датасета</h5>
        <button class="close-btn" @click="$emit('update:visible', false)">×</button>
      </div>

      <input v-model="localName" class="form-control my-3"
             placeholder="Введите название"
             @keyup.enter="submit" />

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('update:visible', false)">Отмена</button>
        <button class="btn btn-primary" @click="submit" :disabled="!localName">
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  modelValue: String
})

const emit = defineEmits(['update:visible', 'saved'])

const localName = ref(props.modelValue || '')
watch(() => props.modelValue, v => (localName.value = v || ''))

function submit () {
  if (!localName.value) return
  emit('saved', localName.value.trim())
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:center;z-index:9999}
.modal-window{background:var(--color-primary-background);color:var(--color-primary-text);padding:24px;border-radius:12px;width:480px;max-width:90%}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
.close-btn{background:none;border:none;font-size:1.5rem;color:var(--color-secondary-text);cursor:pointer}
.modal-footer{display:flex;justify-content:flex-end;gap:1rem;margin-top:1rem}
</style>