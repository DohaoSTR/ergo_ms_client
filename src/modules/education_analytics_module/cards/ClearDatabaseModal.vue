<template>
  <div class="modal fade" id="confirmClearModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center text-danger">
            <AlertTriangle class="me-2"/>
            Подтверждение очистки базы данных
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"/>
        </div>
        <div class="modal-body py-4">
          <div class="warning-icon-container mb-3">
            <AlertTriangle size="48" class="text-danger" />
          </div>

          <p class="fs-5 fw-medium mb-3">Вы собираетесь полностью очистить базу данных аналитики. Это действие:</p>

          <ul class="warning-list mb-4">
            <li>Удалит <strong>абсолютно все данные</strong> из аналитического модуля</li>
            <li><strong>Не может быть отменено</strong> и вам придется загружать данные заново</li>
            <li>Может <strong>занять некоторое время</strong> для выполнения</li>
          </ul>

          <div class="alert alert-warning mb-0">
            <AlertTriangle size="18" class="me-2" />
            <strong>Вы уверены, что хотите продолжить?</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <X class="me-2"/>Отмена
          </button>
          <button type="button" class="btn btn-danger confirm-btn" @click="confirm" data-bs-dismiss="modal">
            <Trash2 class="me-2"/>Да, очистить базу данных
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Modal } from 'bootstrap'
import { AlertTriangle, X, Trash2 } from 'lucide-vue-next'

const emit = defineEmits(['confirm'])

defineExpose({
  show: () => {
    const modal = new Modal(document.getElementById('confirmClearModal'))
    modal.show()
  }
})

const confirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.modal-content {
  border: none;
  box-shadow: 0 10px 40px rgba(var(--bs-dark-rgb), 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  border-bottom-color: var(--bs-border-color);
  padding: 1.25rem 1.5rem;
}

.modal-title {
  font-weight: 600;
}

.modal-body {
  color: var(--bs-body-color);
}

.warning-icon-container {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.warning-list {
  color: var(--bs-body-color);
  padding-left: 1.25rem;
}

.warning-list li {
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}

.warning-list li strong {
  color: var(--bs-danger);
}

.alert-warning {
  background-color: var(--bs-warning-bg-subtle);
  border: 1px solid var(--bs-warning-border-subtle);
  color: var(--bs-warning-text);
  display: flex;
  align-items: center;
}

.modal-footer {
  border-top-color: var(--bs-border-color);
  padding: 1.25rem 1.5rem;
}

.confirm-btn {
  min-width: 220px;
  background-color: var(--bs-danger);
  border-color: var(--bs-danger);
  font-weight: 600;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background-color: var(--bs-danger);
  border-color: var(--bs-danger);
  filter: brightness(108%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(var(--bs-danger-rgb), 0.3);
}
</style>
