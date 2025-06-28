<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Пароль'
  },
  label: {
    type: String,
    default: 'Пароль'
  },
  error: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'current-password'
  },
  icon: {
    type: String,
    default: 'bi-lock'
  }
})

const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="form-floating position-relative" v-auto-animate>
    <input
      :type="showPassword ? 'text' : 'password'"
      :id="$attrs.id || 'password'"
      class="form-control pe-5"
      :class="{ 'is-invalid': error }"
      :value="modelValue"
      @input="updateValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
    />
    <label :for="$attrs.id || 'password'">
      <i :class="`bi ${icon} me-2`"></i>{{ label }}
    </label>
    <button
      type="button"
      class="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-decoration-none"
      @click="togglePasswordVisibility"
      :disabled="disabled"
      style="z-index: 10;"
      :title="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
    >
      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" class="text-muted"></i>
    </button>
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.btn-link {
  border: none;
  background: none;
  padding: 0.5rem;
  
  &:hover {
    background: none;
  }
  
  &:focus {
    box-shadow: none;
  }
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style> 