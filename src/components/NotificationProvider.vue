<script setup>
import { useNotifications } from '@/modules/lms/composables/useNotifications'
import ConfirmDialog from './ConfirmDialog.vue'
import ChoiceDialog from './ChoiceDialog.vue'
import NotificationToast from './NotificationToast.vue'

const { 
  notifications, 
  confirmDialog,
  choiceDialog,
  closeConfirmDialog,
  closeChoiceDialog,
  removeNotification,
  clearAllNotifications
} = useNotifications()

// Очищаем все уведомления при монтировании компонента
import { onMounted } from 'vue'
onMounted(() => {
  // Удаляем все существующие уведомления
  clearAllNotifications()
})
</script>

<template>
  <!-- Диалог подтверждения (глобальный) -->
  <ConfirmDialog
    :show="confirmDialog.show"
    :title="confirmDialog.title"
    :message="confirmDialog.message"
    :confirm-text="confirmDialog.confirmText"
    :cancel-text="confirmDialog.cancelText"
    :variant="confirmDialog.variant"
    :loading="confirmDialog.loading"
    @confirm="confirmDialog.onConfirm"
    @cancel="confirmDialog.onCancel"
    @close="closeConfirmDialog"
  />

  <!-- Диалог выбора (глобальный) -->
  <ChoiceDialog
    :show="choiceDialog.show"
    :title="choiceDialog.title"
    :message="choiceDialog.message"
    :choices="choiceDialog.choices"
    :loading="choiceDialog.loading"
    @choice="choiceDialog.onChoice"
    @cancel="choiceDialog.onCancel"
    @close="closeChoiceDialog"
  />

  <!-- Уведомления (глобальные) -->
  <Teleport to="body">
    <div class="notification-container">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :show="notification.show"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        @close="removeNotification(notification.id)"
      />
    </div>
  </Teleport>
</template>

<style>
.notification-container {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  max-width: 400px !important;
}

.notification-container > * {
  pointer-events: auto;
  margin-bottom: 10px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .notification-container {
    right: 10px !important;
    left: 10px !important;
    top: 10px !important;
    max-width: none !important;
  }
}
</style> 