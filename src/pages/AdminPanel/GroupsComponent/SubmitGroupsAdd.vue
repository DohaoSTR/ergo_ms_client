<script setup>
import { ref, onMounted, computed } from 'vue'
import { AddGroup, GetGroupCategories } from '@/js/GroupsPolitics'
import ChangingPermissionsList from './ChangingPermissionsListAdd.vue'
const emit = defineEmits(['addGroup'])
const name = ref('')
const showErrorName = ref(false)
const showErrorLevel = ref(false)
const showErrorCategory =ref(false)
const categories = ref([])
const category = ref('')
const level = ref('')
const PermissionsChangingListsRef = ref(null)

const submitForm = async () => {
  showErrorName.value = !name.value.trim()
  showErrorCategory.value = !category.value.trim()
  showErrorLevel.value = !level.value.trim() || !Number.isInteger(Number(level.value))

  if (showErrorName.value || showErrorCategory.value || showErrorLevel.value) {
    return // Остановить выполнение, если есть ошибки
  }

  try {
    const response = await AddGroup(name.value, category.value, level.value)
    await PermissionsChangingListsRef.value.changePermissions(name.value)

    emit('addGroup',{})
    name.value = ''
    level.value = ''
    category.value = ''
  } catch (error) {
    console.error('Ошибка при добавлении группы:', error)
  }
}

const loadCategories = async () => {
  try {
    const response = await GetGroupCategories()
    categories.value = response
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}
const close = ()=>{
  name.value =''
  level.value = ''
  category.value = ''
}
defineExpose({close})
onMounted(() => {
  loadCategories()
})


const canDismiss = computed(() => {
  const nameValid = String(name.value).trim() !== ''
  const categoryValid = String(category.value).trim() !== ''
  const levelStr = String(level.value).trim()
  const levelValid = levelStr !== '' && Number.isInteger(Number(levelStr))


  return nameValid && categoryValid && levelValid
})

</script>

<template>
  <form @submit.prevent="submitForm" novalidate>

    <div class="form-floating mb-3" v-auto-animate>
      <input
        type="text"
        id="nameInput"
        class="form-control"
        v-model="name"
        :class="{ 'is-invalid': showErrorName }"
        placeholder="Введите название группы"
      />
      <label for="nameInput">Введите название группы</label>
      <div v-if="showErrorName" class="invalid-feedback">Название обязательно для заполнения.</div>
    </div>

  <select 
    class="form-select"
    :class="{ 'is-invalid': showErrorCategory }"
    id="categorySelect" 
    v-model="category"
  >
    <option v-for="category in categories" :key="category.id" :value="category.name">
      {{ category.name }}
    </option>
  </select>
  <label for="categorySelect">Выбор категории</label>
  <div v-if="showErrorCategory" class="invalid-feedback">
    Необходимо выбрать категорию.
  </div>
    <br/>
    
<div class="form-floating mb-3" v-auto-animate>
      <input
        type="text"
        id="levelInput"
        class="form-control"
        v-model="level"
        :class="{ 'is-invalid': showErrorLevel }"
        placeholder="Введите уровень группы"
      />
      <label for="levelInput">Введите уровень группы</label>
      <div v-if="showErrorLevel" class="invalid-feedback">В поле уровня должно быть записано целое число.</div>
    </div>
    <ChangingPermissionsList  :category="category" ref="PermissionsChangingListsRef" />
    

    <div class="mt-3 text-end">
      <button type="submit" class="btn btn-primary" :data-bs-dismiss="canDismiss? 'modal':''">
        Добавить
      </button>
    </div>
  </form>
</template>