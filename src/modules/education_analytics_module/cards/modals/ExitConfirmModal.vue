<template>
  <div v-if="show" class="modal-overlay" @click.stop>
    <div class="modal-content exit-confirm-modal" @click.stop>
      <div class="modal-header">
        <h3>
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="warning-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Несохраненные изменения
        </h3>
      </div>
      <div class="modal-body">
        <p>У вас есть несохраненные изменения. Если вы закроете окно, все внесенные изменения будут потеряны.</p>
        <p>Вы уверены, что хотите закрыть окно без сохранения?</p>
      </div>
      <div class="modal-actions">
        <button class="continue-edit-btn" @click="$emit('cancel')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Продолжить редактирование
        </button>
        <button class="exit-without-save-btn" @click="$emit('exit')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти без сохранения
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean
});
defineEmits(['exit', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: var(--color-secondary-background, #fff);
  color: var(--color-primary-text, #222);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  min-width: 320px;
  max-width: 500px;
  width: 90%;
  padding: 0;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.exit-confirm-modal {
  border: 1px solid var(--color-warning, #ffc107);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 20px 24px;
  border-bottom: 2px solid var(--color-warning, #ffc107);
  background: rgba(255, 193, 7, 0.1);
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--color-primary-text, #222);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  color: var(--color-warning, #ffc107);
}

.modal-body {
  padding: 16px 24px 0;
}

.modal-body p {
  margin-bottom: 10px;
  line-height: 1.4;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px 20px;
}

.continue-edit-btn, .exit-without-save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  min-width: 160px;
}

.continue-edit-btn {
  background: var(--color-accent, #5078ff);
  color: white;
  order: 1;
}

.continue-edit-btn:hover {
  background: var(--color-accent-hover, #3156dd);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(80, 120, 255, 0.2);
}

.exit-without-save-btn {
  background: var(--color-danger, #dc3545);
  color: white;
  order: 2;
}

.exit-without-save-btn:hover {
  background: var(--color-danger-hover, #c82333);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.continue-edit-btn svg, .exit-without-save-btn svg {
  width: 14px;
  height: 14px;
}

@media (min-width: 576px) {
  .modal-actions {
    flex-direction: row;
    justify-content: center;
    gap: 10px;
  }

  .continue-edit-btn {
    order: 2;
  }

  .exit-without-save-btn {
    order: 1;
  }
}
</style>
