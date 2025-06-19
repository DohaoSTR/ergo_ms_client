<script setup>
import { ref, watch, onMounted } from 'vue'
import { ChangeGroupCategory } from '@/js/GroupsPolitics'
const emit = defineEmits(['changeCategory'])

const oldname = ref('')
const name = ref('')
const showError = ref(false)

const props = defineProps({
  row: { type: Object, required: true },
})
watch(props, (newProps) => {
  oldname.value = newProps.row.name
  name.value = newProps.row.name
})
onMounted(() => {
  oldname.value = props.name
  name.value = props.name
})
const submitForm = async () => {
  if (!name.value.trim()) {
    showError.value = true
  } 
  else {
    showError.value = false
    await ChangeGroupCategory(oldname.value, name.value)
    emit('changeCategory')
  }
}
</script>

<template>
  <form @submit.prevent="submitForm" novalidate>
    <div class="form-floating mb-3" v-auto-animate>
      <input
        type="text"
        id="nameInput"
        class="form-control"
        v-model="name"
        :class="{ 'is-invalid': showError }"
        placeholder="Введите название категории"
      />
      <label for="nameInput">Введите название категории</label>
      <div v-if="showError" class="invalid-feedback">Название обязательно для заполнения.</div>
    </div>
    <div class="mt-3 text-end">
      <button type="submit" class="btn btn-primary" :data-bs-dismiss="name !== '' ? 'modal' : ''">
        изменить
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss"></style>
