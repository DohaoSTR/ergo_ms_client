import { apiClient } from '@/js/api/manager'

export function useFileActions(uploadedFiles, selectedFile, fileToReplace, loadUserFiles) {
  
  async function deleteFile(file) {
    const confirmed = confirm(`Вы уверены, что хотите удалить файл "${file.name}"?`)
    if (!confirmed) return

    try {
      const res = await apiClient.delete(`bi_analysis/bi_datasets/upload/${file.id}/`)

      if (res.status === 204 || res.success) {
        const index = uploadedFiles.value.findIndex(f => f.id === file.id)
        if (index !== -1) {
          uploadedFiles.value.splice(index, 1)
        }

        if (selectedFile.value?.id === file.id) {
          selectedFile.value = null
        }

      } else {
        console.warn('[deleteFile] ошибка удаления:', res)
        alert('Не удалось удалить файл')
      }
    } catch (error) {
      console.error('[deleteFile] ошибка при запросе:', error)
      alert('Ошибка при удалении файла')
    }
  }

  async function handleFileReplace(event, MAX_SIZE_MB = 200) {
    const file = event.target.files[0]
    if (!file || !fileToReplace.value) return

    if (file.size === 0) {
      alert('Файл пустой. Пожалуйста, выберите непустой файл.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Файл превышает ${MAX_SIZE_MB} МБ`)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    const res = await apiClient.put(
      `bi_analysis/bi_datasets/upload/${fileToReplace.value.id}/`,
      formData
    )

    if (res.success) {
      await loadUserFiles()
    } else {
      console.error('[handleFileReplace] Ошибка замены файла:', res.errors)
      alert('Не удалось заменить файл')
    }

    event.target.value = ''
    fileToReplace.value = null
  }

  async function renameFile(file) {
    const originalExt = file.name.split('.').pop()
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')

    const newNameInput = prompt('Новое имя файла:', nameWithoutExt)
    if (!newNameInput || newNameInput.trim() === '') return

    const newName = `${newNameInput.trim()}.${originalExt}`

    const res = await apiClient.patch(`bi_analysis/bi_datasets/upload/${file.id}/`, {
      name: newName
    })

    if (res.success) {
      await loadUserFiles()
    } else {
      alert('Ошибка переименования')
      console.error('[renameFile] Ошибка:', res.errors)
    }
  }

  return {
    deleteFile,
    handleFileReplace,
    renameFile
  }
}
