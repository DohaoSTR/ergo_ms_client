<template>
  <form @submit.prevent="submitForm" novalidate>

    <div class="form-floating mb-3" v-auto-animate>
      <input
        type="text"
        id="nameInput"
        class="form-control"
        v-model="name"
        :class="{ 'is-invalid': showErrorName }"
        placeholder="Введите название разрешения"
      />
      <label for="nameInput">Введите название разрешения</label>
      <div v-if="showErrorName" class="invalid-feedback">Название обязательно для заполнения.</div>
    </div>

    <div>
    <label for="categorySelect">выбор категории</label>
    <select class="form-select" id="categorySelect" v-model="category"     :class="{ 'is-invalid': showErrorCategory }">
      <option v-for="category in categories" :key="category.id" :value="category.name">
        {{ category.name }}
      </option>
    </select>
    <div v-if="showErrorCategory" class="invalid-feedback">
    Необходимо выбрать категорию.
  </div>
  </div>
    <br/>

    <div>
    <label for="accessionTypeSelect">выбор типа доступа</label>
    <select class="form-select" id="accessionTypeSelect" v-model="accession_type" :class="{ 'is-invalid': showErrorAccessionsType }" @change="changeAccessionType">
      <option value="ComponentAccessionToRead">Доступ к компоненту на чтение</option>
      <option value="ComponentAccessionToReadAndWrite">Доступ к компоненту на чтение и запись</option>
      <option value="PageAccession">Доступ к странице</option>
    </select>
    <div v-if="showErrorAccessionsType" class="invalid-feedback">Необходимо выбрать тип доступа.</div>
  </div>
<br/>

<div class="form-floating mb-3" v-auto-animate>
      <input
        type="text"
        id="pathInput"
        class="form-control"
        v-model="path"
        :class="{ 'is-invalid': showErrorPath }"
        placeholder="Введите путь"
      />
      <label for="pathInput">Введите путь</label>
      <div v-if="showErrorPath" class="invalid-feedback">Путь обязательно для заполнения.</div>
    </div>

<div class="form-floating mb-3" v-auto-animate>
      <input :disabled="accession_type == 'ComponentAccessionToReadAndWrite' | accession_type == 'ComponentAccessionToRead' ? false : true"
        type="text"
        id="componentIdInput"
        class="form-control"
        v-model="component_id"
        :class="{ 'is-invalid': showErrorComponentId }"
        placeholder="Введите id компонента"
      />
      <label for="componentIdInput">Введите id компонента</label>
      <div v-if="showErrorComponentId" class="invalid-feedback">id компонента обязательно для заполнения.</div>
    </div>

    <div class="mt-3 text-end">
      <button type="submit" class="btn btn-primary" :data-bs-dismiss="canDismiss? 'modal':''">
        Добавить
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { AddPermission, GetGroupCategories } from '@/js/GroupsPolitics'

const emit = defineEmits(['addPermission'])

const showErrorName = ref(false)
const showErrorCategory = ref(false)
const showErrorAccessionsType = ref(false)
const showErrorPath = ref(false)
const showErrorComponentId = ref(false)

const name = ref('')
const categories = ref([])
const category = ref('')
const accession_type = ref('')
const path = ref('')
const component_id = ref('')




const submitForm = async () => {
  showErrorName.value = !name.value.trim()
  showErrorAccessionsType.value = !accession_type.value.trim()
  showErrorCategory.value = !category.value.trim()
  showErrorPath.value = !path.value.trim()
  showErrorComponentId.value = !component_id.value.trim() && (accession_type.value !== 'PageAccession')
  if(showErrorName.value | showErrorAccessionsType.value| showErrorCategory.value|showErrorPath.value| showErrorComponentId.value){
    return
  }
  try
  {
    const response = await AddPermission(name.value, category.value, accession_type.value, path.value, component_id.value)
    emit('addPermission')
    name.value = ''
    category.value = ''
    accession_type.value=''
    path.value =''
    component_id.value =''
  }
  catch (error) {
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

onMounted(() => {
  loadCategories()
})

const changeAccessionType = () => {
  component_id.value = ''
}


const canDismiss = computed(() => {
  const ErrorName = name.value.trim() !==''
  const ErrorAccessionsType = accession_type.value.trim() !==''
  const ErrorCategory = category.value.trim()!==''
  const ErrorPath = path.value.trim()!==''
  const ErrorComponentId = component_id.value.trim() !== '' || (accession_type.value === 'PageAccession')
  return ErrorName && ErrorAccessionsType && ErrorCategory && ErrorPath && ErrorComponentId 
})

const close= ()=>{
  name.value = ''
  category.value = ''
  accession_type.value=''
  path.value =''
  component_id.value =''
}
defineExpose({close})
</script>