<script setup>
import { ref } from 'vue'
import { AddGroupCategory } from '@/modules/cms/adp/admin/js/GroupsPolitics'
const emit = defineEmits(['addCategory'])
const name = ref('')
const showError = ref(false)
const createGroup = ref(false)
const submitForm = async () => {
  if (!name.value.trim()) {
    showError.value = true
  } 
  else {
    showError.value = false
    const response = await AddGroupCategory(name.value, createGroup.value)
    emit('addCategory')
    name.value = ''
    createGroup.value = false
  }
}
const close=()=>{
  name.value =''
}
defineExpose({close})

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
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckChecked" checked v-model="createGroup" />
        <label class="form-check-label" for="flexCheckChecked"> Создать группу администратора для категории </label>
      </div>

    <div class="mt-3 text-end">
      <button  type="submit" class="btn btn-primary" :data-bs-dismiss="name !== '' ? 'modal' : ''">
        Добавить
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss"></style>