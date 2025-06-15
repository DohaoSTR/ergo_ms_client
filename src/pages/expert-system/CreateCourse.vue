<template>
  <div class="modal-backdrop">
    <div class="modal-dialog">
      <div class="modal-content p-4 bg-white">
        <button type="button" class="btn-close float-end" @click="$emit('close')" />
        <h5 class="mb-3">Новый курс</h5>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <form @submit.prevent="onSubmit">
          <div class="mb-2">
            <label class="form-label">Название</label>
            <input v-model="form.title" class="form-control" required />
          </div>
          <div class="mb-2">
            <label class="form-label">Профессия</label>
            <select v-model="form.role" class="form-control" required>
              <option disabled value="">Выберите профессию</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label">Описание</label>
            <textarea v-model="form.description" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Сохраняем...' : 'Создать' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({
  roles: { type: Array, required: true },
  employerId: { type: [String, Number], required: true }
})
const emit = defineEmits(['created', 'close'])

const form = ref({ title: '', description: '', role: '' })
const loading = ref(false)
const error = ref(null)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const payload = {
      ...form.value,
      role: form.value.role,
      employer: props.employerId
    }
    const res = await apiClient.post(endpoints.expert_system.courses, payload)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    emit('created')
    form.value = { title: '', description: '', role: '' }
  } catch (err) {
    error.value = err.message || 'Ошибка'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-white {
  background: #fff !important;
}
</style>
