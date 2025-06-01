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
    name = `${base} - ${sheet}.xlsx`
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
      isReady: true
    }
    tempUploadedFiles.value.push(temp)
    selectedFile.value = temp
  }
}

  async function uploadFileRaw(formData, displayName, originalFile = null) {
    const res = await apiClient.upload('bi_analysis/bi_datasets/upload/', formData)

    if (res.success) {
      const temp = {
        name: displayName,
        temp_path: res.data.temp_path,
        original_filename: res.data.original_filename,
        file_type: res.data.file_type,
        originalFile,
        isReady: true,
        id: res.data.id ?? null
      }
      tempUploadedFiles.value.push(temp)
      selectedFile.value = temp
    }
  }

  async function finalizeUploads(connectionId) {
  const finalizePromises = tempUploadedFiles.value.map(async file => {
    if (!file.temp_path) return null
    const formData = new FormData()
    formData.append('temp_path', file.temp_path)
    formData.append('name', file.name)
    formData.append('original_filename', file.original_filename)
    formData.append('file_type', file.file_type)
    formData.append('connection', connectionId)
    const res = await apiClient.post('/bi_analysis/bi_datasets/upload/finalize/', formData)
    if (res.success) return file
    console.error('Ошибка при финализации файла:', file.name, res.errors || res)
    alert(`Ошибка при сохранении файла: ${file.name}`)
    return null
  })

  const successfullyFinalized = (await Promise.all(finalizePromises)).filter(Boolean)
  if (successfullyFinalized.length) {
    tempUploadedFiles.value = tempUploadedFiles.value.filter(
      f => !successfullyFinalized.includes(f)
    )
    await loadUserFiles(connectionId)
    selectedFile.value = null
  }
}

  function handleSheetSelection(sheets) {
    isSheetPickerVisible.value = false
    const file = currentUploadFile.value
    if (!file || !sheets.length) return

    sheets.forEach(sheet => {
      const formData = new FormData()
      formData.append('file', file.originalFile)
      formData.append('sheet', sheet)
      const newName = `${file.name.replace(/\.xlsx$/, '')} – ${sheet}.xlsx`
      formData.append('name', newName)
      if (connectionId) {
        formData.append('connection', connectionId)
      }

      uploadFileRaw(formData, newName, file.originalFile)
    })

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
