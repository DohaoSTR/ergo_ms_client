import { ref } from 'vue'

export function useConfirmDialog() {
  const showConfirmDialog = ref(false)
  const confirmDialogData = ref({
    title: '',
    message: '',
    confirmText: 'Удалить',
    onConfirm: null
  })
  const dialogLoading = ref(false)

  function openConfirmDialog(options) {
    confirmDialogData.value = {
      title: options.title || 'Подтверждение',
      message: options.message || '',
      confirmText: options.confirmText || 'Удалить',
      onConfirm: options.onConfirm || null
    }
    showConfirmDialog.value = true
  }

  function closeConfirmDialog() {
    showConfirmDialog.value = false
    dialogLoading.value = false
    confirmDialogData.value = {
      title: '',
      message: '',
      confirmText: 'Удалить',
      onConfirm: null
    }
  }

  function handleConfirmDialog() {
    if (confirmDialogData.value.onConfirm) {
      confirmDialogData.value.onConfirm()
    }
  }

  return {
    showConfirmDialog,
    confirmDialogData,
    dialogLoading,
    openConfirmDialog,
    closeConfirmDialog,
    handleConfirmDialog
  }
} 