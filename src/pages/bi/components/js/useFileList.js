import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'
import { useRoute } from 'vue-router'

export function useFileList(tempUploadedFiles, selectedFile, uploadedFiles, currentUploadFile, availableSheets, sheetBeingEdited, isSheetPickerVisible) {

  const route = useRoute()
  const connectionId = ref(null)

  if (route.params.connectionId) {
    connectionId.value = Number(route.params.connectionId)
  }

  function removeTempFile(file) {

    const index = tempUploadedFiles.value.findIndex(f => f.temp_path === file.temp_path)
    if (index !== -1) {
      tempUploadedFiles.value.splice(index, 1)

      if (selectedFile.value?.temp_path === file.temp_path) {
        selectedFile.value = null
      }

    } else {
      console.warn('[removeTempFile] файл не найден среди временных')
    }
  }

  function openSheetPicker(file) {

    currentUploadFile.value = file
    availableSheets.value = file.pendingSheets
    sheetBeingEdited.value = getSheetNameFromFile(file.name)
    isSheetPickerVisible.value = true
  }

  function selectFile(file) {
    if (file.pendingSheets && !file.processedSheets) {
      openSheetPicker(file)
      return
    }
    selectedFile.value = file
  }

  async function loadUserFiles(connectionIdArg) {
    const id = connectionIdArg ?? connectionId.value
  
    if (!id) {
      console.warn('[loadUserFiles] Нет connectionId, пропускаю загрузку файлов')
      return
    }
  
    const res = await apiClient.getUploadedFiles(`bi_analysis/bi_datasets/connection/${id}/files/`)
    if (res.success) {
      uploadedFiles.value = res.data
    }
  }

  function getSheetNameFromFile(name) {
    const match = name.match(/–\s*(.+)\.xlsx$/)
    return match ? match[1] : null
  }

  return {
    connectionId,
    removeTempFile,
    openSheetPicker,
    selectFile,
    loadUserFiles,
    getSheetNameFromFile
  }
}
