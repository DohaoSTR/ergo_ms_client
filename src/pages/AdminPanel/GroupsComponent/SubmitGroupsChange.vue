<script setup>
import { ref, watch, computed } from 'vue'
import { GetGroupCategories, ChangeGroup} from '@/js/GroupsPolitics'
import ChangingPermissionsList from './ChangingPermissionsList.vue'
const emit = defineEmits(['changeGroup'])
const oldname = ref('')
const stopSubmit = ref(false)
const showErrorName = ref(false)
const showErrorLevel = ref(false)
const showErrorCategory =ref(false)
const categories = ref([])
const category = ref('')
const level = ref('')
const name = ref('')
const permissions = ref([])
const PermissionsChangingListsRef = ref(null)
const rowid = ref(0)
const props = defineProps({
  row: { type: Object, required: true },
})


watch(() => props.row, async (newRow) => {
  await loadCategories()
 await ChangingGroup(newRow)
})

const submitForm = async () => {
  showErrorName.value = !name.value.trim()
  showErrorCategory.value = !category.value.trim()

  const levelStr = level.value?.toString().trim()
  showErrorLevel.value = 
    !levelStr ||
    isNaN(levelStr) ||
    !Number.isInteger(+levelStr)

  if (showErrorName.value || showErrorCategory.value || showErrorLevel.value) {
    return
  }

  try {
    await ChangeGroup(oldname.value, name.value, category.value, level.value)
    await PermissionsChangingListsRef.value.changePermissions()

    showErrorCategory.value = false
    showErrorLevel.value = false
    showErrorName.value = false
    stopSubmit.value = true
    emit('changeGroup')

  } catch (error) {
    console.error('Ошибка при изменении группы:', error)
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

const ChangingGroup = async (prop) => {
  permissions.value = prop.permissions
  oldname.value = prop.name
  name.value = prop.name
  category.value = prop.category
  level.value = prop.level
  rowid.value = prop.id
  
}

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
    <ChangingPermissionsList  :category="category" :list="permissions" :group_name="name"
    :group_id="rowid" ref="PermissionsChangingListsRef" />
    

    <div class="mt-3 text-end">
      <button type="submit" class="btn btn-primary" :data-bs-dismiss="canDismiss? 'modal':''">
        Изменить
      </button>
    </div>
  </form>
</template>
