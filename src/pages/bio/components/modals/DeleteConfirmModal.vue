<script setup>
import { CircleAlert } from 'lucide-vue-next'

const props = defineProps({
  modalId: { type: String, required: true },
  title: { type: String, default: 'Подтверждение удаления' },
  message: { type: String, default: 'Вы уверены, что хотите удалить выбранные элементы?' },
  warningText: { type: String, default: 'Это действие нельзя будет отменить.' },
  count: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  confirmButtonText: { type: String, default: 'Удалить' },
  cancelButtonText: { type: String, default: 'Отмена' },
})

const emit = defineEmits(['confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="modal fade" :id="modalId" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            @click="handleCancel"
          ></button>
        </div>
        <div class="modal-body">
          <div class="d-flex flex-column align-items-center gap-3">
            <CircleAlert :size="96" color="var(--bs-danger)" :stroke-width="1.5" />
            <h5 class="text-center">
              {{ message }}
              <span v-if="count > 0" class="fw-bold">({{ count }})</span>
            </h5>
            <p v-if="warningText" class="text-center text-danger">
              {{ warningText }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
            @click="handleCancel"
          >
            {{ cancelButtonText }}
          </button>
          <button type="button" class="btn btn-danger" @click="handleConfirm" :disabled="loading">
            <div v-if="loading" class="spinner-border spinner-border-sm me-1" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            {{ confirmButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--bs-border-color);
}
</style>
