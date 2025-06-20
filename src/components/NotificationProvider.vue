<script setup>
import { useNotifications } from '@/pages/lms/composables/useNotifications'
import ConfirmDialog from './ConfirmDialog.vue'
import ChoiceDialog from './ChoiceDialog.vue'
import NotificationToast from './NotificationToast.vue'

const { 
  notifications, 
  confirmDialog,
  choiceDialog,
  closeConfirmDialog,
  closeChoiceDialog,
  removeNotification
} = useNotifications()
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
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1056;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
  margin-bottom: 10px;
}
</style> 