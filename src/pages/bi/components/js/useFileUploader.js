import { apiClient } from '@/js/api/manager'

export function useFileUploader(tempUploadedFiles, selectedFile, isSheetPickerVisible, currentUploadFile, availableSheets, loadUserFiles, connectionId) {

  const MAX_FILES = 10
  const MAX_SIZE_MB = 200

async function uploadFile(file, sheet = null) {
  const formData = new FormData()
  formData.append('file', file)

  let name = file.name
  if (sheet) {
    const base = file.name.replace(/\.xlsx$/, '')
    name = `${base} – ${sheet}.xlsx`
    formData.append('sheet', sheet)
  }

  const res = await apiClient.upload('bi_analysis/bi_datasets/upload/', formData)

  if (res.success) {
    const temp = {
      name,
      temp_path: res.data.temp_path,
      original_filename: res.data.original_filename,
      file_type: res.data.file_type,
      originalFile: file,
      isReady: true,
      sheet: sheet
    }
    tempUploadedFiles.value.push(temp)
    selectedFile.value = temp
  }
}

  async function uploadFileRaw(formData, newName, originalFile) {
  try {
    const res = await apiClient.post('/bi_analysis/bi_datasets/upload/finalize/', formData)
    return res
  } catch (err) {
    return { success: false, error: err }
  }
}

async function finalizeUploads(connectionId) {
  const finalizePromises = tempUploadedFiles.value.map(async file => {
    if (!file.temp_path) {
      return null
    }
    const formData = new FormData()
    formData.append('temp_path', file.temp_path)
    formData.append('name', file.name)
    formData.append('original_filename', file.original_filename)
    formData.append('file_type', file.file_type)
    formData.append('connection', connectionId)
    if (file.sheet) formData.append('sheet', file.sheet)

    const res = await uploadFileRaw(formData, file.name, file.originalFile)
    if (res && res.success && res.data && res.data.id) {
      return res.data
    }
    return null
  })

  const uploaded = await Promise.all(finalizePromises)
  tempUploadedFiles.value = []
  return uploaded.filter(Boolean)
}

async function handleSheetSelection(sheets) {
  isSheetPickerVisible.value = false
  const file = currentUploadFile.value
  if (!file || !sheets.length) return

  for (const sheet of sheets) {
    // Вызываем uploadFile для каждого листа, чтобы получить temp_path и т.д.
    await uploadFile(file.originalFile, sheet)
  }

  currentUploadFile.value = null
}

  async function handleFileUpload(event) {
    const files = Array.from(event.target.files)
    if (files.length > MAX_FILES) {
      alert(`Можно выбрать не более ${MAX_FILES} файлов.`)
      event.target.value = ''
      return
    }

    const oversized = files.filter(file => file.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversized.length > 0) {
      alert(`Файлы превышают ${MAX_SIZE_MB} МБ:\n${oversized.map(f => f.name).join(', ')}`)
      event.target.value = ''
      return
    }

    const empty = files.filter(file => file.size === 0)
    if (empty.length > 0) {
      alert(`Файлы пустые:\n${empty.map(f => f.name).join(', ')}`)
      event.target.value = ''
      return
    }

    for (const file of files) {
      if (file.name.endsWith('.xlsx')) {
        const formData = new FormData()
        formData.append('file', file)
        const sheetRes = await apiClient.upload('bi_analysis/bi_datasets/xlsx/sheets/', formData)

        if (sheetRes.success && sheetRes.data.sheets.length > 1) {
          const tempFile = {
            name: file.name,
            originalFile: file,
            pendingSheets: sheetRes.data.sheets,
          }
          currentUploadFile.value = tempFile
          availableSheets.value = sheetRes.data.sheets
          isSheetPickerVisible.value = true
          event.target.value = ''
          return
        }
      }

      await uploadFile(file)
    }

    event.target.value = ''
    await loadUserFiles(connectionId)
  }

  return {
    uploadFile,
    uploadFileRaw,
    finalizeUploads,
    handleSheetSelection,
    handleFileUpload
  }
}
