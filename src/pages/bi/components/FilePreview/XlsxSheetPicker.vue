<template>
    <div v-show="visible" class="modal-overlay">
      <div class="modal-window">
        <div class="modal-header">
          <h4>Добавить листы</h4>
          <button class="close-btn" @click="cancel">×</button>
        </div>
  
        <div class="modal-body">
          <div class="select-all">
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="select-all" @change="toggleAll" :disabled="!sheets?.length"/>
                <label class="form-check-label" for="select-all">
                    Выбрать все
                </label>
            </div>
          </div>
          <div class="sheet-list">
            <div class="form-check" v-for="sheet in safeSheets" :key="sheet">
                <input class="form-check-input" type="checkbox" :id="'sheet-' + sheet" :value="sheet" v-model="selectedSheets" :checked="sheet === currentSheet"/>
                <label class="form-check-label" :for="'sheet-' + sheet">
                    {{ filename || 'Файл' }} – {{ sheet }}
                </label>
            </div>
            <div v-if="!safeSheets.length">Листы не найдены</div>
          </div>
        </div>
  
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancel">Отмена</button>
          <button class="btn-confirm" :disabled="!selectedSheets.length" @click="confirm">Добавить</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'
  
  const props = defineProps({
    visible: Boolean,
    filename: String,
    sheets: Array,
    currentSheet: String
  })
  
  const emit = defineEmits(['confirm', 'cancel'])
  
  const selectedSheets = ref([])
  const selectAll = ref(false)
  const safeSheets = computed(() => props.sheets || [])
  
  watch(selectAll, (val) => {
    selectedSheets.value = val ? [...safeSheets.value] : []
  })
  
  function toggleAll() {
    const allSelected = selectedSheets.value.length === safeSheets.value.length
    selectedSheets.value = allSelected ? [] : [...safeSheets.value]
  }
  
  function confirm() {
    emit('confirm', selectedSheets.value)
  }
  
  function cancel() {
    emit('cancel')
  }
  
  watch(() => props.visible, (val) => {
    if (val) {
      selectedSheets.value = []
      selectAll.value = false
    }
  })
  </script>
  
<style scoped>
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  
    .modal-window {
      background: #1e1f22;
      color: white;
      padding: 24px;
      border-radius: 12px;
      width: 480px;
      max-width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
  
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
  
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #aaa;
      cursor: pointer;
    }
  
    .modal-body {
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  
    .btn-cancel {
      background: transparent;
      color: #ccc;
      border: 1px solid #555;
      padding: 6px 12px;
      border-radius: 6px;
    }
  
    .btn-confirm {
      background: #ef4444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
    }
  
    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
</style>
  
