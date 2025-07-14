<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-wrapper">
      <div class="modal-container border border-2 border-danger">
        <div class="modal-header bg-danger text-white rounded-top">
          <slot name="header">
            <h5 class="mb-0">Подтверждение удаления</h5>
          </slot>
        </div>
        <div class="modal-body">
          <slot name="body">
            <p>Вы действительно хотите удалить эту запись? Это действие нельзя отменить.</p>
          </slot>
        </div>
        <div class="modal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-danger" @click="$emit('confirm')">Удалить</button>
          <button class="btn btn-secondary" @click="$emit('cancel')">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  isDark: Boolean
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-mask {
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
  animation: modal-fade-in 0.25s;
}
@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-wrapper {
  width: 100%;
  max-width: 400px;
}
.modal-container {
  border-radius: 14px;
  box-shadow: 0 6px 32px rgba(220,53,69,0.18), 0 1.5px 6px rgba(0,0,0,0.08);
  padding: 0 0 18px 0;
  overflow: hidden;
  transition: background 0.2s, color 0.2s;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
}
.modal-header {
  padding: 18px 24px 12px 24px;
  background: var(--color-header-background);
  color: var(--color-primary-text);
  border-radius: 14px 14px 0 0;
  box-shadow: 0 2px 8px rgba(220,53,69,0.08);
}
.modal-header h5 {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.modal-body {
  padding: 18px 24px 0 24px;
  font-size: 1.08em;
}
.modal-footer {
  margin-top: 18px;
  padding: 0 24px 14px 24px;
}
.btn-danger {
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220,53,69,0.08);
  transition: background 0.2s, box-shadow 0.2s;
  background: var(--color-accent);
  border: none;
  color: #fff;
}
.btn-danger:hover, .btn-danger:focus {
  background: var(--color-accent);
  opacity: 0.85;
  box-shadow: 0 4px 16px rgba(220,53,69,0.18);
}
.btn-secondary {
  border-radius: 0.5rem;
  font-weight: 600;
  background: var(--color-secondary-background);
  color: var(--color-primary-text);
  border: 1px solid var(--color-border);
  transition: background 0.2s, box-shadow 0.2s;
}
.btn-secondary:hover, .btn-secondary:focus {
  background: var(--color-hover-background);
  color: var(--color-primary-text);
}
</style>
