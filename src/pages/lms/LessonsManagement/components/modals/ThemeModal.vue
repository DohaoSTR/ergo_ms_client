<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактирование темы' : 'Создание темы'"
    :icon="FolderOpen"
    icon-class="text-success"
    :confirm-text="editing ? 'Сохранить изменения' : 'Создать тему'"
    confirm-variant="success"
    :loading="loading"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <form @submit.prevent="handleSave">
      <div class="mb-3">
        <label class="form-label">Название темы *</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.name }"
          placeholder="Введите название темы"
        />
        <div v-if="errors.name" class="invalid-feedback">
          {{ errors.name }}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Курс *</label>
        <select 
          v-model="form.subject" 
          class="form-select"
          :class="{ 'is-invalid': errors.subject }"
        >
          <option value="">Выберите курс</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
        <div v-if="errors.subject" class="invalid-feedback">
          {{ errors.subject }}
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          :class="{ 'is-invalid': errors.description }"
          rows="3"
          placeholder="Описание темы"
        ></textarea>
        <div v-if="errors.description" class="invalid-feedback">
          {{ errors.description }}
        </div>
      </div>
      
      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.is_visible" 
            class="form-check-input" 
            type="checkbox" 
            id="themeVisible"
          />
          <label class="form-check-label" for="themeVisible">
            Видимая тема
          </label>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.completion_required" 
            class="form-check-input" 
            type="checkbox" 
            id="themeRequired"
          />
          <label class="form-check-label" for="themeRequired">
            Обязательная для завершения
          </label>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { FolderOpen } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'
import { showError } from '@/js/utils/notifications'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  themeData: Object,
  courses: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  description: '',
  subject: null,
  is_visible: true,
  completion_required: false
})

const errors = ref({})

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
    if (props.editing && props.themeData) {
      fillForm(props.themeData)
    } else if (props.themeData && props.themeData.subject) {
      // Устанавливаем курс для новой темы
      form.value.subject = props.themeData.subject
      console.log('Установлен курс для новой темы:', props.themeData.subject)
    }
  }
})

function resetForm() {
  form.value = {
    name: '',
    description: '',
    subject: null,
    is_visible: true,
    completion_required: false
  }
  errors.value = {}
}

function fillForm(data) {
  // Извлекаем ID курса из темы
  let subjectId = data.subject
  if (typeof subjectId === 'object' && subjectId?.id) {
    subjectId = subjectId.id
  }
  
  form.value = {
    name: data.name || '',
    description: data.description || '',
    subject: subjectId,
    is_visible: data.is_visible !== undefined ? data.is_visible : true,
    completion_required: data.completion_required || false
  }
}

function validate() {
  const newErrors = {}

  if (!form.value.name?.trim()) {
    newErrors.name = 'Название темы обязательно'
  }

  if (!form.value.subject) {
    newErrors.subject = 'Выберите курс'
  }

  console.log('Валидация формы темы:', form.value)
  console.log('Ошибки валидации:', newErrors)

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function handleSave() {
  if (!validate()) {
    showError('Пожалуйста, исправьте ошибки в форме')
    return
  }

  const data = {
    name: form.value.name.trim(),
    description: form.value.description?.trim() || '',
    subject: parseInt(form.value.subject),
    is_visible: Boolean(form.value.is_visible),
    completion_required: Boolean(form.value.completion_required)
  }

  // sort_order будет автоматически назначен на сервере

  emit('save', data, errors)
}
</script> 