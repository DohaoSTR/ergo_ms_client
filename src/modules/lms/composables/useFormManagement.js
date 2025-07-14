import { ref, reactive } from 'vue'
import { showError, showSuccess } from '@/js/utils/notifications'

export function useFormManagement() {
  const isSubmitting = ref(false)
  const showModal = ref(false)
  const editingItem = ref(null)
  const formData = ref({})
  
  function createFormState(initialState) {
    return reactive({ ...initialState })
  }
  
  function createValidationErrors() {
    return ref({})
  }
  
  function resetForm(form, initialState) {
    Object.keys(initialState).forEach(key => {
      form[key] = initialState[key]
    })
  }
  
  function openModal() {
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
    editingItem.value = null
    formData.value = {}
  }
  
  function setEditingItem(item) {
    editingItem.value = item
  }
  
  async function handleSave(saveFunction, successMessage) {
    try {
      isSubmitting.value = true
      await saveFunction()
      showSuccess(successMessage)
      closeModal()
      return true
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      return false
    } finally {
      isSubmitting.value = false
    }
  }
  
  function validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} обязательно для заполнения`
    }
    return null
  }
  
  function validateMinLength(value, minLength, fieldName) {
    if (value && value.length < minLength) {
      return `${fieldName} должно содержать минимум ${minLength} символов`
    }
    return null
  }
  
  function validateMaxLength(value, maxLength, fieldName) {
    if (value && value.length > maxLength) {
      return `${fieldName} не должно превышать ${maxLength} символов`
    }
    return null
  }
  
  function validateDateRange(startDate, endDate) {
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return 'Дата начала должна быть раньше даты окончания'
    }
    return null
  }
  
  function applyValidationErrors(errors, errorObject) {
    if (typeof errorObject === 'object') {
      Object.keys(errorObject).forEach(field => {
        if (Array.isArray(errorObject[field])) {
          errors.value[field] = errorObject[field].join(', ')
        } else {
          errors.value[field] = errorObject[field]
        }
      })
      
      const errorMessages = Object.entries(errors.value).map(([field, message]) => `${field}: ${message}`)
      if (errorMessages.length > 0) {
        showError(`Ошибки валидации:\n${errorMessages.join('\n')}`)
      }
    } else {
      showError(`Ошибка API: ${errorObject}`)
    }
  }
  
  return {
    isSubmitting,
    showModal,
    editingItem,
    formData,
    createFormState,
    createValidationErrors,
    resetForm,
    openModal,
    closeModal,
    setEditingItem,
    handleSave,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateDateRange,
    applyValidationErrors
  }
} 